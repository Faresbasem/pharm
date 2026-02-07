// ========================================
// Global State Management
// ========================================
const AppState = {
  sessionId: localStorage.getItem('sessionId') || null,
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  currentPage: 'login',
  currentPatient: null,
  patients: [],
  measurements: [],
  settings: {},
  language: localStorage.getItem('language') || 'ar'
}

// ========================================
// Translation System
// ========================================
const translations = {
  ar: {
    appTitle: 'نظام إدارة عيادة التخسيس',
    login: 'تسجيل الدخول',
    username: 'اسم المستخدم',
    password: 'كلمة المرور',
    loginButton: 'دخول',
    logout: 'خروج',
    dashboard: 'لوحة التحكم',
    patients: 'المرضى',
    measurements: 'القياسات',
    settings: 'الإعدادات',
    users: 'المستخدمين',
    addPatient: 'إضافة مريض',
    editPatient: 'تعديل مريض',
    deletePatient: 'حذف مريض',
    search: 'بحث',
    name: 'الاسم',
    age: 'السن',
    gender: 'النوع',
    phone: 'الهاتف',
    email: 'البريد الإلكتروني',
    chronicDiseases: 'الأمراض المزمنة',
    medications: 'الأدوية',
    notes: 'ملاحظات',
    save: 'حفظ',
    cancel: 'إلغاء',
    male: 'ذكر',
    female: 'أنثى',
    patientCode: 'كود المريض',
    addMeasurement: 'إضافة قياس',
    weight: 'الوزن (كجم)',
    bodyFat: 'نسبة الدهون (%)',
    muscleMass: 'الكتلة العضلية (كجم)',
    waterPercentage: 'نسبة الماء (%)',
    metabolismRate: 'معدل الحرق',
    bmr: 'معدل الأيض الأساسي',
    bmi: 'مؤشر كتلة الجسم',
    ffm: 'الكتلة الخالية من الدهون',
    date: 'التاريخ',
    actions: 'إجراءات',
    edit: 'تعديل',
    delete: 'حذف',
    confirm: 'تأكيد',
    areYouSure: 'هل أنت متأكد؟',
    yes: 'نعم',
    no: 'لا',
    totalPatients: 'إجمالي المرضى',
    activeMeasurements: 'القياسات النشطة',
    systemSettings: 'إعدادات النظام',
    fieldSettings: 'إعدادات الحقول',
    userManagement: 'إدارة المستخدمين',
    adminPanel: 'لوحة الإدارة',
    welcome: 'مرحباً',
    viewMeasurements: 'عرض القياسات',
    measurementHistory: 'سجل القياسات',
    noData: 'لا توجد بيانات',
    loading: 'جاري التحميل...',
    error: 'خطأ',
    success: 'نجح',
    role: 'الصلاحية',
    admin: 'مدير',
    user: 'مستخدم',
    active: 'نشط',
    inactive: 'غير نشط',
    addUser: 'إضافة مستخدم',
    fullName: 'الاسم الكامل',
    status: 'الحالة',
    created: 'تاريخ الإنشاء',
    lastLogin: 'آخر دخول'
  },
  en: {
    appTitle: 'Weight Loss Clinic Management System',
    login: 'Login',
    username: 'Username',
    password: 'Password',
    loginButton: 'Sign In',
    logout: 'Logout',
    dashboard: 'Dashboard',
    patients: 'Patients',
    measurements: 'Measurements',
    settings: 'Settings',
    users: 'Users',
    addPatient: 'Add Patient',
    editPatient: 'Edit Patient',
    deletePatient: 'Delete Patient',
    search: 'Search',
    name: 'Name',
    age: 'Age',
    gender: 'Gender',
    phone: 'Phone',
    email: 'Email',
    chronicDiseases: 'Chronic Diseases',
    medications: 'Medications',
    notes: 'Notes',
    save: 'Save',
    cancel: 'Cancel',
    male: 'Male',
    female: 'Female',
    patientCode: 'Patient Code',
    addMeasurement: 'Add Measurement',
    weight: 'Weight (kg)',
    bodyFat: 'Body Fat (%)',
    muscleMass: 'Muscle Mass (kg)',
    waterPercentage: 'Water Percentage (%)',
    metabolismRate: 'Metabolism Rate',
    bmr: 'BMR',
    bmi: 'BMI',
    ffm: 'FFM',
    date: 'Date',
    actions: 'Actions',
    edit: 'Edit',
    delete: 'Delete',
    confirm: 'Confirm',
    areYouSure: 'Are you sure?',
    yes: 'Yes',
    no: 'No',
    totalPatients: 'Total Patients',
    activeMeasurements: 'Active Measurements',
    systemSettings: 'System Settings',
    fieldSettings: 'Field Settings',
    userManagement: 'User Management',
    adminPanel: 'Admin Panel',
    welcome: 'Welcome',
    viewMeasurements: 'View Measurements',
    measurementHistory: 'Measurement History',
    noData: 'No data available',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    role: 'Role',
    admin: 'Admin',
    user: 'User',
    active: 'Active',
    inactive: 'Inactive',
    addUser: 'Add User',
    fullName: 'Full Name',
    status: 'Status',
    created: 'Created',
    lastLogin: 'Last Login'
  }
}

const t = (key) => translations[AppState.language][key] || key

// ========================================
// API Helper Functions
// ========================================
const API = {
  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    }

    if (AppState.sessionId) {
      headers['X-Session-ID'] = AppState.sessionId
    }

    const response = await fetch(`/api${endpoint}`, {
      ...options,
      headers
    })

    if (response.status === 401) {
      AppState.sessionId = null
      AppState.user = null
      localStorage.removeItem('sessionId')
      localStorage.removeItem('user')
      render()
      return null
    }

    return response.json()
  },

  async login(username, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    })
    
    if (data && data.success) {
      AppState.sessionId = data.sessionId
      AppState.user = data.user
      localStorage.setItem('sessionId', data.sessionId)
      localStorage.setItem('user', JSON.stringify(data.user))
    }
    
    return data
  },

  async logout() {
    await this.request('/auth/logout', { method: 'POST' })
    AppState.sessionId = null
    AppState.user = null
    localStorage.removeItem('sessionId')
    localStorage.removeItem('user')
  },

  async getPatients(search = '') {
    const data = await this.request(`/patients?search=${encodeURIComponent(search)}`)
    if (data) AppState.patients = data.patients || []
    return data
  },

  async getPatient(id) {
    return await this.request(`/patients/${id}`)
  },

  async createPatient(patientData) {
    return await this.request('/patients', {
      method: 'POST',
      body: JSON.stringify(patientData)
    })
  },

  async updatePatient(id, patientData) {
    return await this.request(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(patientData)
    })
  },

  async deletePatient(id) {
    return await this.request(`/patients/${id}`, {
      method: 'DELETE'
    })
  },

  async getMeasurements(patientId) {
    const data = await this.request(`/patients/${patientId}/measurements`)
    if (data) AppState.measurements = data.measurements || []
    return data
  },

  async addMeasurement(patientId, measurementData) {
    return await this.request(`/patients/${patientId}/measurements`, {
      method: 'POST',
      body: JSON.stringify(measurementData)
    })
  },

  async updateMeasurement(id, measurementData) {
    return await this.request(`/measurements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(measurementData)
    })
  },

  async deleteMeasurement(id) {
    return await this.request(`/measurements/${id}`, {
      method: 'DELETE'
    })
  },

  async getUsers() {
    return await this.request('/users')
  },

  async createUser(userData) {
    return await this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    })
  },

  async updateUser(id, userData) {
    return await this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    })
  },

  async deleteUser(id) {
    return await this.request(`/users/${id}`, {
      method: 'DELETE'
    })
  }
}

// ========================================
// UI Components
// ========================================

// Login Page
function LoginPage() {
  return `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <div class="bg-white p-8 rounded-2xl shadow-2xl w-96 fade-in">
        <div class="text-center mb-8">
          <i class="fas fa-heartbeat text-5xl text-blue-500 mb-4"></i>
          <h1 class="text-2xl font-bold text-gray-800">${t('appTitle')}</h1>
        </div>
        <form id="loginForm" class="space-y-4">
          <div>
            <label class="block text-gray-700 mb-2">${t('username')}</label>
            <input type="text" id="username" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required>
          </div>
          <div>
            <label class="block text-gray-700 mb-2">${t('password')}</label>
            <input type="password" id="password" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required>
          </div>
          <button type="submit" class="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition">
            <i class="fas fa-sign-in-alt mr-2"></i>${t('loginButton')}
          </button>
        </form>
        <div class="mt-4 text-sm text-gray-600 text-center">
          <p>Demo: admin/admin123 أو doctor/doctor123</p>
        </div>
      </div>
    </div>
  `
}

// Navigation Bar
function NavBar() {
  return `
    <nav class="bg-blue-600 text-white shadow-lg">
      <div class="container mx-auto px-4">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center space-x-4 space-x-reverse">
            <i class="fas fa-heartbeat text-2xl"></i>
            <span class="text-xl font-bold">${t('appTitle')}</span>
          </div>
          <div class="flex items-center space-x-6 space-x-reverse">
            <button onclick="navigateTo('dashboard')" class="hover:text-blue-200 transition">
              <i class="fas fa-home ml-2"></i>${t('dashboard')}
            </button>
            <button onclick="navigateTo('patients')" class="hover:text-blue-200 transition">
              <i class="fas fa-users ml-2"></i>${t('patients')}
            </button>
            ${AppState.user.role === 'admin' ? `
              <button onclick="navigateTo('settings')" class="hover:text-blue-200 transition">
                <i class="fas fa-cog ml-2"></i>${t('settings')}
              </button>
              <button onclick="navigateTo('users')" class="hover:text-blue-200 transition">
                <i class="fas fa-user-shield ml-2"></i>${t('users')}
              </button>
            ` : ''}
            <div class="flex items-center space-x-3 space-x-reverse border-r pr-4 border-blue-500">
              <span class="text-sm">${t('welcome')}, ${AppState.user.fullName}</span>
              <button onclick="handleLogout()" class="bg-red-500 px-4 py-1 rounded hover:bg-red-600 transition">
                <i class="fas fa-sign-out-alt ml-2"></i>${t('logout')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  `
}

// Dashboard Page
function DashboardPage() {
  return `
    ${NavBar()}
    <div class="container mx-auto px-4 py-8 fade-in">
      <h2 class="text-3xl font-bold text-gray-800 mb-8">${t('dashboard')}</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white p-6 rounded-lg shadow-lg">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500">${t('totalPatients')}</p>
              <p class="text-3xl font-bold text-blue-600" id="totalPatients">0</p>
            </div>
            <i class="fas fa-users text-5xl text-blue-200"></i>
          </div>
        </div>
        <div class="bg-white p-6 rounded-lg shadow-lg">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500">${t('activeMeasurements')}</p>
              <p class="text-3xl font-bold text-green-600" id="totalMeasurements">0</p>
            </div>
            <i class="fas fa-chart-line text-5xl text-green-200"></i>
          </div>
        </div>
        <div class="bg-white p-6 rounded-lg shadow-lg">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500">${t('systemSettings')}</p>
              <p class="text-xl font-bold text-purple-600">${t('active')}</p>
            </div>
            <i class="fas fa-cog text-5xl text-purple-200"></i>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h3 class="text-xl font-bold mb-4">${t('patients')}</h3>
        <div id="recentPatients"></div>
      </div>
    </div>
  `
}

// Patients Page
function PatientsPage() {
  return `
    ${NavBar()}
    <div class="container mx-auto px-4 py-8 fade-in">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-3xl font-bold text-gray-800">${t('patients')}</h2>
        <button onclick="openPatientModal()" class="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition">
          <i class="fas fa-plus ml-2"></i>${t('addPatient')}
        </button>
      </div>
      <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
        <input type="text" id="searchInput" placeholder="${t('search')}..." 
          class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          oninput="handleSearch(this.value)">
      </div>
      <div class="bg-white rounded-lg shadow-lg overflow-hidden">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">${t('patientCode')}</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">${t('name')}</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">${t('age')}</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">${t('phone')}</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">${t('actions')}</th>
            </tr>
          </thead>
          <tbody id="patientsTable" class="divide-y divide-gray-200">
            <tr><td colspan="5" class="text-center py-4">${t('loading')}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `
}

// Patient Modal
function PatientModal(patient = null) {
  const isEdit = !!patient
  return `
    <div id="patientModal" class="modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 active">
      <div class="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto fade-in">
        <h3 class="text-2xl font-bold mb-6">${isEdit ? t('editPatient') : t('addPatient')}</h3>
        <form id="patientForm" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-gray-700 mb-2">${t('name')} *</label>
              <input type="text" name="name" value="${patient?.name || ''}" 
                class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required>
            </div>
            <div>
              <label class="block text-gray-700 mb-2">${t('age')}</label>
              <input type="number" name="age" value="${patient?.age || ''}" 
                class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-gray-700 mb-2">${t('gender')}</label>
              <select name="gender" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">اختر...</option>
                <option value="male" ${patient?.gender === 'male' ? 'selected' : ''}>${t('male')}</option>
                <option value="female" ${patient?.gender === 'female' ? 'selected' : ''}>${t('female')}</option>
              </select>
            </div>
            <div>
              <label class="block text-gray-700 mb-2">${t('phone')}</label>
              <input type="tel" name="phone" value="${patient?.phone || ''}" 
                class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
            </div>
          </div>
          <div>
            <label class="block text-gray-700 mb-2">${t('email')}</label>
            <input type="email" name="email" value="${patient?.email || ''}" 
              class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
          </div>
          <div>
            <label class="block text-gray-700 mb-2">${t('chronicDiseases')}</label>
            <textarea name="chronic_diseases" rows="2" 
              class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">${patient?.chronic_diseases || ''}</textarea>
          </div>
          <div>
            <label class="block text-gray-700 mb-2">${t('medications')}</label>
            <textarea name="medications" rows="2" 
              class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">${patient?.medications || ''}</textarea>
          </div>
          <div>
            <label class="block text-gray-700 mb-2">${t('notes')}</label>
            <textarea name="notes" rows="3" 
              class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">${patient?.notes || ''}</textarea>
          </div>
          <div class="flex justify-end space-x-4 space-x-reverse pt-4">
            <button type="button" onclick="closeModal()" 
              class="px-6 py-2 border rounded-lg hover:bg-gray-100 transition">${t('cancel')}</button>
            <button type="submit" 
              class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">${t('save')}</button>
          </div>
        </form>
      </div>
    </div>
  `
}

// Measurements Page
function MeasurementsPage(patientId) {
  return `
    ${NavBar()}
    <div class="container mx-auto px-4 py-8 fade-in">
      <div class="flex justify-between items-center mb-6">
        <div>
          <button onclick="navigateTo('patients')" class="text-blue-500 hover:text-blue-600 mb-2">
            <i class="fas fa-arrow-right ml-2"></i>العودة للمرضى
          </button>
          <h2 class="text-3xl font-bold text-gray-800">${t('measurementHistory')}</h2>
          <p class="text-gray-600 mt-2" id="patientInfo">جاري التحميل...</p>
        </div>
        <button onclick="openMeasurementModal(${patientId})" 
          class="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition">
          <i class="fas fa-plus ml-2"></i>${t('addMeasurement')}
        </button>
      </div>
      <div class="bg-white rounded-lg shadow-lg overflow-hidden">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">${t('date')}</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">${t('weight')}</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">${t('bodyFat')}</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">${t('muscleMass')}</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">${t('bmi')}</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">${t('actions')}</th>
            </tr>
          </thead>
          <tbody id="measurementsTable" class="divide-y divide-gray-200">
            <tr><td colspan="6" class="text-center py-4">${t('loading')}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `
}

// Measurement Modal
function MeasurementModal(patientId, measurement = null) {
  const isEdit = !!measurement
  return `
    <div id="measurementModal" class="modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 active">
      <div class="bg-white rounded-lg p-8 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto fade-in">
        <h3 class="text-2xl font-bold mb-6">${isEdit ? t('edit') + ' ' + t('measurements') : t('addMeasurement')}</h3>
        <form id="measurementForm" class="space-y-4">
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="block text-gray-700 mb-2">${t('weight')}</label>
              <input type="number" step="0.1" name="weight" value="${measurement?.weight || ''}" 
                class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
            </div>
            <div>
              <label class="block text-gray-700 mb-2">${t('bodyFat')}</label>
              <input type="number" step="0.1" name="body_fat" value="${measurement?.body_fat || ''}" 
                class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
            </div>
            <div>
              <label class="block text-gray-700 mb-2">${t('muscleMass')}</label>
              <input type="number" step="0.1" name="muscle_mass" value="${measurement?.muscle_mass || ''}" 
                class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
            </div>
          </div>
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="block text-gray-700 mb-2">${t('waterPercentage')}</label>
              <input type="number" step="0.1" name="water_percentage" value="${measurement?.water_percentage || ''}" 
                class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
            </div>
            <div>
              <label class="block text-gray-700 mb-2">${t('bmr')}</label>
              <input type="number" step="0.1" name="bmr" value="${measurement?.bmr || ''}" 
                class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
            </div>
            <div>
              <label class="block text-gray-700 mb-2">${t('bmi')}</label>
              <input type="number" step="0.1" name="bmi" value="${measurement?.bmi || ''}" 
                class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-gray-700 mb-2">${t('ffm')}</label>
              <input type="number" step="0.1" name="ffm" value="${measurement?.ffm || ''}" 
                class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
            </div>
            <div>
              <label class="block text-gray-700 mb-2">${t('metabolismRate')}</label>
              <input type="number" step="0.1" name="metabolism_rate" value="${measurement?.metabolism_rate || ''}" 
                class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
            </div>
          </div>
          <div>
            <label class="block text-gray-700 mb-2">${t('notes')}</label>
            <textarea name="notes" rows="3" 
              class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">${measurement?.notes || ''}</textarea>
          </div>
          <div class="flex justify-end space-x-4 space-x-reverse pt-4">
            <button type="button" onclick="closeModal()" 
              class="px-6 py-2 border rounded-lg hover:bg-gray-100 transition">${t('cancel')}</button>
            <button type="submit" 
              class="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition">${t('save')}</button>
          </div>
        </form>
      </div>
    </div>
  `
}

// Users Management Page (Admin Only)
function UsersPage() {
  return `
    ${NavBar()}
    <div class="container mx-auto px-4 py-8 fade-in">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-3xl font-bold text-gray-800">${t('userManagement')}</h2>
        <button onclick="openUserModal()" class="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition">
          <i class="fas fa-plus ml-2"></i>${t('addUser')}
        </button>
      </div>
      <div class="bg-white rounded-lg shadow-lg overflow-hidden">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">${t('username')}</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">${t('fullName')}</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">${t('role')}</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">${t('status')}</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">${t('actions')}</th>
            </tr>
          </thead>
          <tbody id="usersTable" class="divide-y divide-gray-200">
            <tr><td colspan="5" class="text-center py-4">${t('loading')}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `
}

// Settings Page (Admin Only)
function SettingsPage() {
  return `
    ${NavBar()}
    <div class="container mx-auto px-4 py-8 fade-in">
      <h2 class="text-3xl font-bold text-gray-800 mb-8">${t('adminPanel')}</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-white p-6 rounded-lg shadow-lg">
          <h3 class="text-xl font-bold mb-4"><i class="fas fa-cog ml-2"></i>${t('systemSettings')}</h3>
          <p class="text-gray-600">إدارة الإعدادات العامة للنظام</p>
          <ul class="mt-4 space-y-2">
            <li class="flex items-center"><i class="fas fa-check text-green-500 ml-2"></i>تغيير اللغة</li>
            <li class="flex items-center"><i class="fas fa-check text-green-500 ml-2"></i>تنسيق التاريخ</li>
            <li class="flex items-center"><i class="fas fa-check text-green-500 ml-2"></i>الحسابات التلقائية</li>
          </ul>
        </div>
        <div class="bg-white p-6 rounded-lg shadow-lg">
          <h3 class="text-xl font-bold mb-4"><i class="fas fa-list ml-2"></i>${t('fieldSettings')}</h3>
          <p class="text-gray-600">التحكم في الحقول وتسمياتها</p>
          <ul class="mt-4 space-y-2">
            <li class="flex items-center"><i class="fas fa-check text-green-500 ml-2"></i>إظهار/إخفاء الحقول</li>
            <li class="flex items-center"><i class="fas fa-check text-green-500 ml-2"></i>تعديل أسماء الحقول</li>
            <li class="flex items-center"><i class="fas fa-check text-green-500 ml-2"></i>الحقول المطلوبة</li>
          </ul>
        </div>
      </div>
    </div>
  `
}

// ========================================
// Event Handlers
// ========================================

async function handleLogin(e) {
  e.preventDefault()
  const username = document.getElementById('username').value
  const password = document.getElementById('password').value
  
  const result = await API.login(username, password)
  if (result && result.success) {
    AppState.currentPage = 'dashboard'
    render()
  } else {
    alert('فشل تسجيل الدخول. تحقق من البيانات.')
  }
}

async function handleLogout() {
  if (confirm(t('areYouSure'))) {
    await API.logout()
    AppState.currentPage = 'login'
    render()
  }
}

async function handleSearch(searchTerm) {
  await API.getPatients(searchTerm)
  renderPatientsTable()
}

function navigateTo(page, params = {}) {
  AppState.currentPage = page
  AppState.pageParams = params
  render()
}

async function openPatientModal(patient = null) {
  const modalHTML = PatientModal(patient)
  document.body.insertAdjacentHTML('beforeend', modalHTML)
  
  document.getElementById('patientForm').addEventListener('submit', async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = Object.fromEntries(formData)
    
    let result
    if (patient) {
      result = await API.updatePatient(patient.id, data)
    } else {
      result = await API.createPatient(data)
    }
    
    if (result && (result.success || result.id)) {
      closeModal()
      await API.getPatients()
      renderPatientsTable()
    }
  })
}

async function openMeasurementModal(patientId, measurement = null) {
  const modalHTML = MeasurementModal(patientId, measurement)
  document.body.insertAdjacentHTML('beforeend', modalHTML)
  
  document.getElementById('measurementForm').addEventListener('submit', async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = Object.fromEntries(formData)
    
    let result
    if (measurement) {
      result = await API.updateMeasurement(measurement.id, data)
    } else {
      result = await API.addMeasurement(patientId, data)
    }
    
    if (result && (result.success || result.id)) {
      closeModal()
      await API.getMeasurements(patientId)
      renderMeasurementsTable()
    }
  })
}

async function openUserModal(user = null) {
  // Placeholder for user management modal
  alert('User management modal - تحت التطوير')
}

function closeModal() {
  const modals = document.querySelectorAll('.modal')
  modals.forEach(modal => modal.remove())
}

async function deletePatient(id) {
  if (confirm(t('areYouSure'))) {
    const result = await API.deletePatient(id)
    if (result && result.success) {
      await API.getPatients()
      renderPatientsTable()
    }
  }
}

async function deleteMeasurement(id) {
  if (confirm(t('areYouSure'))) {
    const result = await API.deleteMeasurement(id)
    if (result && result.success) {
      const patientId = AppState.pageParams.patientId
      await API.getMeasurements(patientId)
      renderMeasurementsTable()
    }
  }
}

// ========================================
// Render Functions
// ========================================

async function renderPatientsTable() {
  const tbody = document.getElementById('patientsTable')
  if (!tbody) return
  
  if (AppState.patients.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4">${t('noData')}</td></tr>`
    return
  }
  
  tbody.innerHTML = AppState.patients.map(patient => `
    <tr class="hover:bg-gray-50">
      <td class="px-6 py-4">${patient.patient_code}</td>
      <td class="px-6 py-4 font-medium">${patient.name}</td>
      <td class="px-6 py-4">${patient.age || '-'}</td>
      <td class="px-6 py-4">${patient.phone || '-'}</td>
      <td class="px-6 py-4">
        <button onclick="navigateTo('measurements', {patientId: ${patient.id}})" 
          class="text-blue-500 hover:text-blue-700 ml-3">
          <i class="fas fa-chart-line"></i>
        </button>
        <button onclick="openPatientModal(${JSON.stringify(patient).replace(/"/g, '&quot;')})" 
          class="text-green-500 hover:text-green-700 ml-3">
          <i class="fas fa-edit"></i>
        </button>
        <button onclick="deletePatient(${patient.id})" 
          class="text-red-500 hover:text-red-700">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join('')
}

async function renderMeasurementsTable() {
  const tbody = document.getElementById('measurementsTable')
  if (!tbody) return
  
  if (AppState.measurements.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4">${t('noData')}</td></tr>`
    return
  }
  
  tbody.innerHTML = AppState.measurements.map(m => `
    <tr class="hover:bg-gray-50">
      <td class="px-6 py-4">${new Date(m.measurement_date).toLocaleDateString('ar-EG')}</td>
      <td class="px-6 py-4">${m.weight || '-'}</td>
      <td class="px-6 py-4">${m.body_fat || '-'}</td>
      <td class="px-6 py-4">${m.muscle_mass || '-'}</td>
      <td class="px-6 py-4">${m.bmi || '-'}</td>
      <td class="px-6 py-4">
        <button onclick='openMeasurementModal(${AppState.pageParams.patientId}, ${JSON.stringify(m).replace(/'/g, "\\'")})' 
          class="text-green-500 hover:text-green-700 ml-3">
          <i class="fas fa-edit"></i>
        </button>
        <button onclick="deleteMeasurement(${m.id})" 
          class="text-red-500 hover:text-red-700">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join('')
}

async function renderDashboard() {
  await API.getPatients()
  
  setTimeout(() => {
    const totalPatientsEl = document.getElementById('totalPatients')
    const totalMeasurementsEl = document.getElementById('totalMeasurements')
    const recentPatientsEl = document.getElementById('recentPatients')
    
    if (totalPatientsEl) totalPatientsEl.textContent = AppState.patients.length
    if (totalMeasurementsEl) totalMeasurementsEl.textContent = '-'
    
    if (recentPatientsEl && AppState.patients.length > 0) {
      recentPatientsEl.innerHTML = `
        <table class="w-full">
          <thead>
            <tr class="border-b">
              <th class="text-right pb-2">${t('patientCode')}</th>
              <th class="text-right pb-2">${t('name')}</th>
              <th class="text-right pb-2">${t('phone')}</th>
              <th class="text-right pb-2">${t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            ${AppState.patients.slice(0, 5).map(p => `
              <tr class="border-b">
                <td class="py-2">${p.patient_code}</td>
                <td class="py-2">${p.name}</td>
                <td class="py-2">${p.phone || '-'}</td>
                <td class="py-2">
                  <button onclick="navigateTo('measurements', {patientId: ${p.id}})" 
                    class="text-blue-500 hover:text-blue-700">
                    ${t('viewMeasurements')}
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `
    }
  }, 100)
}

async function render() {
  const app = document.getElementById('app')
  
  if (!AppState.sessionId || !AppState.user) {
    app.innerHTML = LoginPage()
    document.getElementById('loginForm')?.addEventListener('submit', handleLogin)
    return
  }
  
  switch(AppState.currentPage) {
    case 'dashboard':
      app.innerHTML = DashboardPage()
      renderDashboard()
      break
    case 'patients':
      app.innerHTML = PatientsPage()
      await API.getPatients()
      renderPatientsTable()
      break
    case 'measurements':
      app.innerHTML = MeasurementsPage(AppState.pageParams.patientId)
      await API.getMeasurements(AppState.pageParams.patientId)
      const patient = await API.getPatient(AppState.pageParams.patientId)
      if (patient) {
        document.getElementById('patientInfo').textContent = 
          `${t('name')}: ${patient.patient.name} - ${t('patientCode')}: ${patient.patient.patient_code}`
      }
      renderMeasurementsTable()
      break
    case 'settings':
      app.innerHTML = SettingsPage()
      break
    case 'users':
      app.innerHTML = UsersPage()
      break
    default:
      app.innerHTML = DashboardPage()
      renderDashboard()
  }
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  render()
})
