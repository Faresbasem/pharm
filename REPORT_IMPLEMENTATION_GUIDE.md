# 🚀 دليل تطبيق نظام التقارير | Report System Implementation Guide

## المشكلة التي تم حلها

**المشكلة**: اسم العيادة كان ثابتاً في الكود ولا يتغير عند الطباعة.

**الحل**: تم إنشاء نظام متكامل يقرأ اسم العيادة من قاعدة البيانات ويعرضه في التقارير.

---

## ✅ ما تم إنجازه

### 1. Backend (API Endpoints)

تم إضافة endpoint جديد:

```typescript
// GET /api/reports/patient/:id
// يسترجع بيانات المريض + القياسات + إعدادات العيادة
```

**ما يفعله:**
- يجلب بيانات المريض الكاملة
- يجلب جميع القياسات التاريخية
- **يجلب اسم العيادة من جدول settings**
- يحسب الإحصائيات (التغير في الوزن، الدهون، العضلات)

### 2. Frontend (User Interface)

تم إنشاء:
- صفحة تقرير كاملة `PatientReportPageSimple()`
- دالة تحميل البيانات `loadSimpleReport()`
- CSS خاص للطباعة
- زر طباعة في قائمة المرضى

---

## 📝 الملفات المضافة

### 1. REPORT_SYSTEM_ADDON.js

هذا الملف يحتوي على الكود الكامل لنظام التقارير. يمكن إضافته إلى `public/static/app.js`.

**محتويات الملف:**

```javascript
// وظائف رئيسية:
1. PatientReportPageSimple() - صفحة التقرير
2. loadSimpleReport() - تحميل البيانات من API
3. CSS للطباعة (@media print)
4. دعم تخصيص اسم العيادة
```

### 2. add_reports.sh

سكريبت bash تلقائي لإضافة جميع التعديلات المطلوبة.

---

## 🔧 كيفية تطبيق النظام

### الطريقة 1: يدوياً (موصى به للفهم)

#### خطوة 1: إضافة Backend Endpoint

أضف هذا الكود في **src/index.tsx** قبل السطر الأخير:

```typescript
// Get patient report with clinic settings
app.get('/api/reports/patient/:id', authMiddleware, async (c) => {
  try {
    const patientId = c.req.param('id')
    
    // Get patient data
    const patient = await c.env.DB.prepare('SELECT * FROM patients WHERE id = ?')
      .bind(patientId).first()
    
    if (!patient) return c.json({ error: 'Patient not found' }, 404)
    
    // Get measurements
    const { results: measurements } = await c.env.DB.prepare(
      'SELECT * FROM measurements WHERE patient_id = ? ORDER BY measurement_date DESC'
    ).bind(patientId).all()
    
    // Get clinic settings
    const clinicSettings = await c.env.DB.prepare(
      'SELECT setting_key, setting_value FROM settings WHERE setting_key IN (?, ?, ?)'
    ).bind('clinic_name', 'report_header', 'report_footer').all()
    
    const settings = {}
    clinicSettings.results?.forEach(s => {
      settings[s.setting_key] = s.setting_value
    })
    
    // Calculate statistics
    let stats = {
      totalMeasurements: measurements.length,
      weightChange: 0,
      bodyFatChange: 0,
      muscleMassChange: 0
    }
    
    if (measurements.length > 0) {
      const first = measurements[measurements.length - 1]
      const last = measurements[0]
      stats.weightChange = first.weight && last.weight ? (last.weight - first.weight).toFixed(1) : 0
      stats.bodyFatChange = first.body_fat && last.body_fat ? (last.body_fat - first.body_fat).toFixed(1) : 0
      stats.muscleMassChange = first.muscle_mass && last.muscle_mass ? (last.muscle_mass - first.muscle_mass).toFixed(1) : 0
    }
    
    return c.json({ patient, measurements, statistics: stats, settings })
  } catch (error) {
    console.error('Get report error:', error)
    return c.json({ error: 'Failed to generate report' }, 500)
  }
})
```

#### خطوة 2: إضافة Frontend Code

انسخ محتوى **REPORT_SYSTEM_ADDON.js** إلى **public/static/app.js**:

1. أضف الترجمات في قسم translations
2. أضف دالة `getPatientReport()` في API object
3. أضف `PatientReportPageSimple()` function
4. أضف `loadSimpleReport()` function
5. أضف case 'report' في switch داخل render()

#### خطوة 3: إضافة زر التقرير في جدول المرضى

في `renderPatientsTable()` أضف:

```javascript
<button onclick="navigateTo('report', {patientId: ${patient.id}})" 
  class="text-purple-500 hover:text-purple-700 ml-3" title="طباعة التقرير">
  <i class="fas fa-file-alt"></i>
</button>
```

### الطريقة 2: باستخدام السكريبت (تلقائي)

```bash
cd /home/user/webapp
chmod +x add_reports.sh
./add_reports.sh
```

---

## 🏥 كيفية تغيير اسم العيادة

### من قاعدة البيانات:

```bash
# تشغيل console
npm run db:console:local

# إدخال الأمر
INSERT OR REPLACE INTO settings (setting_key, setting_value, setting_type, description) 
VALUES ('clinic_name', 'عيادة د. أحمد للتخسيس', 'string', 'اسم العيادة');
```

### أو باستخدام SQL file:

أنشئ ملف `update_clinic_name.sql`:

```sql
INSERT OR REPLACE INTO settings (setting_key, setting_value, setting_type) 
VALUES ('clinic_name', 'عيادة د. أحمد للتخسيس', 'string');
```

ثم نفذه:

```bash
npm run db:console:local < update_clinic_name.sql
```

---

## 🎨 تخصيص شكل التقرير

يمكن تعديل شكل التقرير من ملف `REPORT_SYSTEM_ADDON.js`:

### تغيير الألوان:

```javascript
// في loadSimpleReport()
// ابحث عن:
<h1 class="text-4xl font-bold text-blue-600">${clinicName}</h1>

// غير text-blue-600 إلى اللون المطلوب:
<h1 class="text-4xl font-bold text-purple-600">${clinicName}</h1>
```

### إضافة شعار:

```javascript
// أضف قبل العنوان:
<img src="/static/logo.png" alt="Logo" class="h-20 mx-auto mb-4">
<h1 class="text-4xl font-bold text-blue-600">${clinicName}</h1>
```

### تعديل جدول القياسات:

```javascript
// يمكنك إضافة/حذف أعمدة من:
<thead class="bg-gray-100">
  <tr>
    <th class="border p-2 text-right">التاريخ</th>
    <th class="border p-2 text-right">الوزن</th>
    // أضف أعمدة جديدة هنا
  </tr>
</thead>
```

---

## 📱 اختبار النظام

### 1. اختبار من المتصفح:

```
1. سجل دخول بـ admin / admin123
2. اذهب إلى "المرضى"
3. اضغط أيقونة 📄 لأي مريض
4. تأكد من ظهور اسم العيادة الصحيح
5. اضغط "طباعة"
6. تأكد من التنسيق الجيد
```

### 2. اختبار API:

```bash
# الحصول على session
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# استخدام session للوصول للتقرير (استبدل SESSION_ID و PATIENT_ID)
curl -H "X-Session-ID: SESSION_ID" \
  http://localhost:3000/api/reports/patient/PATIENT_ID
```

---

## 🐛 حل المشاكل الشائعة

### المشكلة: اسم العيادة لا يظهر

**الحل:**
```bash
# تحقق من وجود الإعداد
npm run db:console:local

# نفذ:
SELECT * FROM settings WHERE setting_key = 'clinic_name';

# إذا لم يظهر شيء، أدخل:
INSERT INTO settings (setting_key, setting_value, setting_type) 
VALUES ('clinic_name', 'اسم عيادتك', 'string');
```

### المشكلة: التقرير لا يطبع بشكل صحيح

**الحل:**
- تأكد من وجود CSS الطباعة في الكود
- تأكد من استخدام متصفح حديث (Chrome, Firefox)
- جرب Print Preview أولاً

### المشكلة: 404 Not Found

**الحل:**
```bash
# تأكد من بناء التطبيق
npm run build

# أعد تشغيل
pm2 restart clinic-webapp
```

---

## 📊 الإحصائيات

ما تم إضافته:
- ✅ 1 API endpoint جديد
- ✅ 2 JavaScript functions جديدة
- ✅ 50+ سطر CSS للطباعة
- ✅ دعم كامل لتخصيص اسم العيادة
- ✅ تصميم responsive للطباعة

---

## 🎯 التطوير المستقبلي

أفكار للتحسين:
- [ ] إضافة صور/شعار للعيادة
- [ ] تخصيص ألوان التقرير
- [ ] إضافة رسوم بيانية (Charts)
- [ ] تصدير PDF مباشر (بدون طباعة)
- [ ] قوالب تقارير متعددة
- [ ] واجهة Admin لتعديل الإعدادات

---

## 📞 الدعم

إذا واجهت أي مشاكل:
1. راجع هذا الملف
2. تحقق من logs: `pm2 logs clinic-webapp`
3. تحقق من قاعدة البيانات
4. افتح issue على GitHub

---

**تم التطوير بواسطة**: Fares Basem  
**التاريخ**: 7 فبراير 2026  
**GitHub**: https://github.com/Faresbasem/pharm

---

**ملاحظة**: هذا النظام جاهز للاستخدام الفوري! 🚀
