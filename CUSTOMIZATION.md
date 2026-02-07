# دليل التخصيص للمطورين | Developer Customization Guide

## 📘 نظرة عامة

هذا الدليل موجه للمطورين الذين يريدون تخصيص وتطوير النظام. سنشرح البنية المعمارية وأماكن التعديل الرئيسية.

## 🏗️ البنية المعمارية (Architecture)

### 1. Backend Architecture (src/index.tsx)

```
┌─────────────────────────────────────────┐
│         Hono Application                │
├─────────────────────────────────────────┤
│  Middleware Layer                       │
│  ├─ CORS                                │
│  ├─ Authentication (authMiddleware)     │
│  └─ Authorization (adminMiddleware)     │
├─────────────────────────────────────────┤
│  API Routes                             │
│  ├─ /api/auth/* (Login, Logout)         │
│  ├─ /api/patients/* (CRUD)              │
│  ├─ /api/measurements/* (CRUD)          │
│  ├─ /api/settings/* (Admin)             │
│  ├─ /api/field-settings/* (Admin)       │
│  └─ /api/users/* (Admin)                │
├─────────────────────────────────────────┤
│  Database Layer (D1)                    │
│  └─ SQLite via Cloudflare D1            │
└─────────────────────────────────────────┘
```

### 2. Frontend Architecture (public/static/app.js)

```
┌─────────────────────────────────────────┐
│         Single Page Application         │
├─────────────────────────────────────────┤
│  State Management                       │
│  └─ AppState (Global State Object)      │
├─────────────────────────────────────────┤
│  Translation System                     │
│  └─ translations object (ar/en)         │
├─────────────────────────────────────────┤
│  API Helper Functions                   │
│  └─ API.* methods                       │
├─────────────────────────────────────────┤
│  UI Components                          │
│  ├─ LoginPage()                         │
│  ├─ DashboardPage()                     │
│  ├─ PatientsPage()                      │
│  ├─ MeasurementsPage()                  │
│  ├─ SettingsPage()                      │
│  └─ UsersPage()                         │
├─────────────────────────────────────────┤
│  Event Handlers                         │
│  └─ handle* functions                   │
└─────────────────────────────────────────┘
```

## 🔧 أماكن التخصيص الرئيسية

### 1. إضافة حقل جديد للمرضى

#### الخطوة 1: تحديث قاعدة البيانات
```sql
-- migrations/0002_add_blood_type.sql
ALTER TABLE patients ADD COLUMN blood_type TEXT;

-- إضافة إعدادات الحقل
INSERT INTO field_settings (table_name, field_name, display_name_ar, display_name_en, is_visible, is_required, field_order)
VALUES ('patients', 'blood_type', 'فصيلة الدم', 'Blood Type', 1, 0, 9);
```

#### الخطوة 2: تحديث API (src/index.tsx)
```typescript
// في Create Patient endpoint
app.post('/api/patients', authMiddleware, async (c) => {
  // أضف blood_type للـ INSERT
  const result = await c.env.DB.prepare(`
    INSERT INTO patients (..., blood_type)
    VALUES (..., ?)
  `).bind(..., data.blood_type || null).run()
})

// في Update Patient endpoint
app.put('/api/patients/:id', authMiddleware, async (c) => {
  // أضف blood_type للـ UPDATE
  await c.env.DB.prepare(`
    UPDATE patients 
    SET ..., blood_type = ?
    WHERE id = ?
  `).bind(..., data.blood_type || null, id).run()
})
```

#### الخطوة 3: تحديث الواجهة (public/static/app.js)
```javascript
// في PatientModal function
function PatientModal(patient = null) {
  return `
    ...
    <div>
      <label class="block text-gray-700 mb-2">\${t('bloodType')}</label>
      <select name="blood_type" class="w-full px-4 py-2 border rounded-lg">
        <option value="">اختر...</option>
        <option value="A+" \${patient?.blood_type === 'A+' ? 'selected' : ''}>A+</option>
        <option value="A-" \${patient?.blood_type === 'A-' ? 'selected' : ''}>A-</option>
        <option value="B+" \${patient?.blood_type === 'B+' ? 'selected' : ''}>B+</option>
        <option value="B-" \${patient?.blood_type === 'B-' ? 'selected' : ''}>B-</option>
        <option value="O+" \${patient?.blood_type === 'O+' ? 'selected' : ''}>O+</option>
        <option value="O-" \${patient?.blood_type === 'O-' ? 'selected' : ''}>O-</option>
        <option value="AB+" \${patient?.blood_type === 'AB+' ? 'selected' : ''}>AB+</option>
        <option value="AB-" \${patient?.blood_type === 'AB-' ? 'selected' : ''}>AB-</option>
      </select>
    </div>
    ...
  `
}

// أضف للترجمة
const translations = {
  ar: {
    ...
    bloodType: 'فصيلة الدم'
  },
  en: {
    ...
    bloodType: 'Blood Type'
  }
}
```

#### الخطوة 4: تطبيق التغييرات
```bash
# تطبيق migration
npm run db:migrate:local

# إعادة بناء التطبيق
npm run build

# إعادة تشغيل
pm2 restart clinic-webapp
```

### 2. إضافة endpoint جديد

#### في src/index.tsx:
```typescript
// مثال: احصائيات المريض
app.get('/api/patients/:id/statistics', authMiddleware, async (c) => {
  try {
    const patientId = c.req.param('id')
    
    // حساب الإحصائيات
    const stats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_measurements,
        MIN(weight) as min_weight,
        MAX(weight) as max_weight,
        AVG(weight) as avg_weight,
        (MAX(weight) - MIN(weight)) as weight_change
      FROM measurements
      WHERE patient_id = ?
    `).bind(patientId).first()
    
    return c.json({ statistics: stats })
  } catch (error) {
    console.error('Statistics error:', error)
    return c.json({ error: 'Failed to fetch statistics' }, 500)
  }
})
```

#### في public/static/app.js:
```javascript
// أضف للـ API object
const API = {
  ...
  async getPatientStatistics(patientId) {
    return await this.request(`/patients/${patientId}/statistics`)
  }
}

// استخدمه في الواجهة
async function showPatientStatistics(patientId) {
  const data = await API.getPatientStatistics(patientId)
  if (data) {
    console.log('Statistics:', data.statistics)
    // عرض الإحصائيات في الواجهة
  }
}
```

### 3. إضافة صفحة جديدة

#### في public/static/app.js:
```javascript
// 1. أضف Component جديد
function ReportsPage() {
  return `
    \${NavBar()}
    <div class="container mx-auto px-4 py-8 fade-in">
      <h2 class="text-3xl font-bold text-gray-800 mb-8">\${t('reports')}</h2>
      <div id="reportsContent">
        <!-- محتوى التقارير -->
      </div>
    </div>
  `
}

// 2. أضف للـ render function
async function render() {
  // ...
  switch(AppState.currentPage) {
    // ...
    case 'reports':
      app.innerHTML = ReportsPage()
      await loadReports()
      break
  }
}

// 3. أضف رابط في NavBar
function NavBar() {
  return `
    ...
    <button onclick="navigateTo('reports')" class="hover:text-blue-200 transition">
      <i class="fas fa-file-alt ml-2"></i>\${t('reports')}
    </button>
    ...
  `
}

// 4. أضف للترجمة
const translations = {
  ar: { reports: 'التقارير' },
  en: { reports: 'Reports' }
}
```

### 4. تخصيص الألوان والتصميم

#### تغيير الألوان الرئيسية:
```javascript
// في أي component، استبدل:
// bg-blue-500 → bg-purple-500 (اللون الأساسي)
// bg-green-500 → bg-teal-500 (اللون الثانوي)
// text-blue-600 → text-purple-600 (نص اللون الأساسي)

// مثال:
function NavBar() {
  return `
    <nav class="bg-purple-600 text-white shadow-lg"> <!-- كان bg-blue-600 -->
      ...
      <button class="bg-teal-500 ..."> <!-- كان bg-green-500 -->
        ...
      </button>
    </nav>
  `
}
```

### 5. إضافة حسابات تلقائية (BMI Calculator)

#### في public/static/app.js:
```javascript
// أضف في MeasurementModal
function MeasurementModal(patientId, measurement = null) {
  return `
    ...
    <div>
      <label class="block text-gray-700 mb-2">\${t('weight')}</label>
      <input type="number" step="0.1" name="weight" id="weightInput"
        value="\${measurement?.weight || ''}" 
        oninput="calculateBMI()"
        class="w-full px-4 py-2 border rounded-lg">
    </div>
    <div>
      <label class="block text-gray-700 mb-2">الطول (سم)</label>
      <input type="number" id="heightInput" 
        class="w-full px-4 py-2 border rounded-lg">
    </div>
    <div>
      <label class="block text-gray-700 mb-2">\${t('bmi')}</label>
      <input type="number" step="0.1" name="bmi" id="bmiOutput"
        value="\${measurement?.bmi || ''}" 
        class="w-full px-4 py-2 border rounded-lg bg-gray-100">
    </div>
    ...
  `
}

// أضف دالة الحساب
function calculateBMI() {
  const weight = parseFloat(document.getElementById('weightInput')?.value)
  const height = parseFloat(document.getElementById('heightInput')?.value)
  
  if (weight && height) {
    const heightInMeters = height / 100
    const bmi = weight / (heightInMeters * heightInMeters)
    document.getElementById('bmiOutput').value = bmi.toFixed(1)
  }
}
```

### 6. إضافة لغة ثالثة

```javascript
const translations = {
  ar: { /* ... */ },
  en: { /* ... */ },
  fr: {  // الفرنسية
    appTitle: 'Système de Gestion de Clinique de Perte de Poids',
    login: 'Connexion',
    username: 'Nom d\'utilisateur',
    password: 'Mot de passe',
    logout: 'Déconnexion',
    dashboard: 'Tableau de bord',
    patients: 'Patients',
    // ... أضف بقية الترجمات
  }
}

// أضف زر تغيير اللغة في NavBar
function NavBar() {
  return `
    ...
    <select onchange="changeLanguage(this.value)" 
      class="bg-blue-500 px-2 py-1 rounded">
      <option value="ar" \${AppState.language === 'ar' ? 'selected' : ''}>العربية</option>
      <option value="en" \${AppState.language === 'en' ? 'selected' : ''}>English</option>
      <option value="fr" \${AppState.language === 'fr' ? 'selected' : ''}>Français</option>
    </select>
    ...
  `
}

function changeLanguage(lang) {
  AppState.language = lang
  localStorage.setItem('language', lang)
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
  document.documentElement.lang = lang
  render()
}
```

### 7. إضافة التحقق من صحة البيانات (Validation)

#### في src/index.tsx:
```typescript
// دالة مساعدة للتحقق
function validatePatientData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!data.name || data.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters')
  }
  
  if (data.age && (data.age < 0 || data.age > 150)) {
    errors.push('Invalid age')
  }
  
  if (data.phone && !/^[0-9]{10}$/.test(data.phone.replace(/[^0-9]/g, ''))) {
    errors.push('Invalid phone number')
  }
  
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Invalid email address')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

// استخدمه في endpoint
app.post('/api/patients', authMiddleware, async (c) => {
  const data = await c.req.json()
  
  const validation = validatePatientData(data)
  if (!validation.valid) {
    return c.json({ error: 'Validation failed', errors: validation.errors }, 400)
  }
  
  // ... بقية الكود
})
```

### 8. إضافة نظام البحث المتقدم

```javascript
// في PatientsPage - أضف فلاتر إضافية
function PatientsPage() {
  return `
    ...
    <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div class="grid grid-cols-3 gap-4">
        <input type="text" id="searchName" placeholder="\${t('name')}..." 
          class="px-4 py-2 border rounded-lg">
        <input type="text" id="searchCode" placeholder="\${t('patientCode')}..." 
          class="px-4 py-2 border rounded-lg">
        <input type="text" id="searchPhone" placeholder="\${t('phone')}..." 
          class="px-4 py-2 border rounded-lg">
      </div>
      <button onclick="advancedSearch()" 
        class="mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg">
        \${t('search')}
      </button>
    </div>
    ...
  `
}

async function advancedSearch() {
  const name = document.getElementById('searchName')?.value
  const code = document.getElementById('searchCode')?.value
  const phone = document.getElementById('searchPhone')?.value
  
  const searchParams = new URLSearchParams()
  if (name) searchParams.append('name', name)
  if (code) searchParams.append('code', code)
  if (phone) searchParams.append('phone', phone)
  
  const data = await API.request(`/patients?${searchParams.toString()}`)
  if (data) {
    AppState.patients = data.patients
    renderPatientsTable()
  }
}
```

## 🎨 التصميم والـ UI/UX

### Tailwind CSS Classes المستخدمة

```css
/* الألوان الأساسية */
bg-blue-500, bg-blue-600      /* اللون الأساسي */
bg-green-500, bg-green-600    /* النجاح */
bg-red-500, bg-red-600        /* الحذف/الخطر */
bg-gray-100, bg-gray-50       /* الخلفية */

/* التباعد */
p-4, p-6, p-8                 /* padding */
m-4, m-6, m-8                 /* margin */
space-x-4, space-y-4          /* spacing بين العناصر */

/* الحواف */
rounded-lg                    /* حواف مستديرة */
shadow-lg                     /* ظل */

/* النصوص */
text-xl, text-2xl, text-3xl   /* حجم النص */
font-bold                     /* نص عريض */

/* Grid & Flex */
grid grid-cols-2              /* شبكة عمودين */
flex justify-between          /* flex مع توزيع */
```

### إضافة أنيميشن مخصص

```javascript
// في الـ HTML الرئيسي (src/index.tsx)
<style>
  @keyframes slideIn {
    from { 
      transform: translateX(-100%);
      opacity: 0;
    }
    to { 
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  .slide-in { 
    animation: slideIn 0.3s ease-out; 
  }
</style>

// ثم استخدمه في Components
function PatientsPage() {
  return `
    <div class="container mx-auto px-4 py-8 slide-in"> <!-- بدلاً من fade-in -->
      ...
    </div>
  `
}
```

## 🔒 الأمان

### 1. تشفير كلمات المرور (Production)

```typescript
// تثبيت bcryptjs
// npm install bcryptjs @types/bcryptjs

import bcrypt from 'bcryptjs'

// عند إنشاء مستخدم
const hashedPassword = await bcrypt.hash(password, 10)
await c.env.DB.prepare(`
  INSERT INTO users (username, password_hash, ...)
  VALUES (?, ?, ...)
`).bind(username, hashedPassword, ...).run()

// عند التحقق من تسجيل الدخول
const user = await c.env.DB.prepare('SELECT * FROM users WHERE username = ?')
  .bind(username).first()
  
if (user && await bcrypt.compare(password, user.password_hash)) {
  // تسجيل دخول ناجح
}
```

### 2. استخدام JWT للجلسات

```typescript
// تثبيت jose (JWT for Edge)
// npm install jose

import { SignJWT, jwtVerify } from 'jose'

// إنشاء token
const secret = new TextEncoder().encode('your-secret-key-here')
const token = await new SignJWT({ userId: user.id, role: user.role })
  .setProtectedHeader({ alg: 'HS256' })
  .setExpirationTime('24h')
  .sign(secret)

// التحقق من token
const { payload } = await jwtVerify(token, secret)
```

### 3. Rate Limiting

```typescript
// استخدام Cloudflare KV لتتبع الطلبات
async function rateLimitMiddleware(c: any, next: any) {
  const ip = c.req.header('cf-connecting-ip') || 'unknown'
  const key = `ratelimit:${ip}`
  
  const requests = await c.env.KV?.get(key)
  const count = requests ? parseInt(requests) : 0
  
  if (count > 100) {  // 100 طلب في الساعة
    return c.json({ error: 'Too many requests' }, 429)
  }
  
  await c.env.KV?.put(key, String(count + 1), { expirationTtl: 3600 })
  return next()
}

app.use('/api/*', rateLimitMiddleware)
```

## 📊 قاعدة البيانات

### إنشاء Indexes للأداء

```sql
-- migrations/0003_add_indexes.sql
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_measurements_date ON measurements(measurement_date);
CREATE INDEX IF NOT EXISTS idx_measurements_patient_date ON measurements(patient_id, measurement_date DESC);
```

### Views للاستعلامات المعقدة

```sql
-- migrations/0004_create_views.sql
CREATE VIEW IF NOT EXISTS patient_summary AS
SELECT 
  p.id,
  p.patient_code,
  p.name,
  p.age,
  COUNT(m.id) as total_measurements,
  MAX(m.measurement_date) as last_measurement,
  (SELECT weight FROM measurements WHERE patient_id = p.id ORDER BY measurement_date DESC LIMIT 1) as current_weight,
  (SELECT weight FROM measurements WHERE patient_id = p.id ORDER BY measurement_date ASC LIMIT 1) as initial_weight
FROM patients p
LEFT JOIN measurements m ON m.patient_id = p.id
GROUP BY p.id;
```

## 🧪 الاختبار (Testing)

### اختبار API endpoints

```bash
# اختبار تسجيل الدخول
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# اختبار قائمة المرضى
curl -H "X-Session-ID: 1-1234567890" \
  http://localhost:3000/api/patients

# اختبار إضافة مريض
curl -X POST http://localhost:3000/api/patients \
  -H "Content-Type: application/json" \
  -H "X-Session-ID: 1-1234567890" \
  -d '{"name":"اسم تجريبي","age":30}'

# اختبار البحث
curl -H "X-Session-ID: 1-1234567890" \
  "http://localhost:3000/api/patients?search=أحمد"
```

## 📝 الخلاصة

هذا الدليل يغطي أهم نقاط التخصيص. للمزيد:
1. راجع كود المصدر في `src/index.tsx` و `public/static/app.js`
2. اطلع على توثيق Hono: https://hono.dev
3. اطلع على توثيق Cloudflare D1: https://developers.cloudflare.com/d1
4. راجع توثيق Tailwind CSS: https://tailwindcss.com

**تذكر دائماً:**
- اختبر التغييرات محلياً أولاً
- احفظ التغييرات في Git بانتظام
- وثق أي تعديلات رئيسية
- اتبع نفس النمط البرمجي الموجود

حظ سعيد في التطوير! 🚀
