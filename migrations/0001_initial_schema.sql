-- ========================================
-- جدول المستخدمين (Users)
-- ========================================
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'user')),
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME
);

-- ========================================
-- جدول المرضى (Patients)
-- ========================================
CREATE TABLE IF NOT EXISTS patients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  age INTEGER,
  gender TEXT CHECK(gender IN ('male', 'female')),
  phone TEXT,
  email TEXT,
  chronic_diseases TEXT,
  medications TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ========================================
-- جدول القياسات (Measurements)
-- ========================================
CREATE TABLE IF NOT EXISTS measurements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  measurement_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  weight REAL,
  body_fat REAL,
  muscle_mass REAL,
  water_percentage REAL,
  metabolism_rate REAL,
  bmr REAL,
  bmi REAL,
  ffm REAL,
  notes TEXT,
  created_by INTEGER,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ========================================
-- جدول الإعدادات (Settings)
-- ========================================
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type TEXT DEFAULT 'string',
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- جدول إعدادات الحقول (Field Settings)
-- للتحكم في إظهار/إخفاء وتسمية الحقول
-- ========================================
CREATE TABLE IF NOT EXISTS field_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name TEXT NOT NULL,
  field_name TEXT NOT NULL,
  display_name_ar TEXT,
  display_name_en TEXT,
  is_visible INTEGER DEFAULT 1,
  is_required INTEGER DEFAULT 0,
  field_order INTEGER,
  UNIQUE(table_name, field_name)
);

-- ========================================
-- إنشاء الفهارس (Indexes)
-- ========================================
CREATE INDEX IF NOT EXISTS idx_patients_code ON patients(patient_code);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name);
CREATE INDEX IF NOT EXISTS idx_measurements_patient ON measurements(patient_id);
CREATE INDEX IF NOT EXISTS idx_measurements_date ON measurements(measurement_date);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- ========================================
-- إدراج البيانات الأولية
-- ========================================

-- إدراج مستخدم Admin افتراضي
-- Username: admin
-- Password: admin123 (يجب تغييره بعد أول تسجيل دخول)
INSERT OR IGNORE INTO users (id, username, password_hash, full_name, role, is_active) 
VALUES (1, 'admin', '$2a$10$YourHashedPasswordHere', 'مدير النظام', 'admin', 1);

-- إدراج مستخدم عادي للاختبار
-- Username: doctor
-- Password: doctor123
INSERT OR IGNORE INTO users (id, username, password_hash, full_name, role, is_active) 
VALUES (2, 'doctor', '$2a$10$YourHashedPasswordHere', 'الطبيب', 'user', 1);

-- إدراج الإعدادات الافتراضية
INSERT OR IGNORE INTO settings (setting_key, setting_value, setting_type, description) VALUES
  ('app_name', 'نظام إدارة عيادة التخسيس', 'string', 'اسم التطبيق'),
  ('language', 'ar', 'string', 'اللغة الافتراضية'),
  ('date_format', 'YYYY-MM-DD', 'string', 'تنسيق التاريخ'),
  ('auto_calculate_bmi', '1', 'boolean', 'حساب BMI تلقائياً'),
  ('auto_calculate_bmr', '1', 'boolean', 'حساب BMR تلقائياً'),
  ('theme', 'light', 'string', 'المظهر');

-- إدراج إعدادات الحقول للمرضى
INSERT OR IGNORE INTO field_settings (table_name, field_name, display_name_ar, display_name_en, is_visible, is_required, field_order) VALUES
  ('patients', 'name', 'الاسم', 'Name', 1, 1, 1),
  ('patients', 'age', 'السن', 'Age', 1, 0, 2),
  ('patients', 'gender', 'النوع', 'Gender', 1, 0, 3),
  ('patients', 'phone', 'الهاتف', 'Phone', 1, 0, 4),
  ('patients', 'email', 'البريد الإلكتروني', 'Email', 1, 0, 5),
  ('patients', 'chronic_diseases', 'الأمراض المزمنة', 'Chronic Diseases', 1, 0, 6),
  ('patients', 'medications', 'الأدوية', 'Medications', 1, 0, 7),
  ('patients', 'notes', 'ملاحظات', 'Notes', 1, 0, 8);

-- إدراج إعدادات الحقول للقياسات
INSERT OR IGNORE INTO field_settings (table_name, field_name, display_name_ar, display_name_en, is_visible, is_required, field_order) VALUES
  ('measurements', 'weight', 'الوزن', 'Weight', 1, 1, 1),
  ('measurements', 'body_fat', 'نسبة الدهون', 'Body Fat', 1, 0, 2),
  ('measurements', 'muscle_mass', 'الكتلة العضلية', 'Muscle Mass', 1, 0, 3),
  ('measurements', 'water_percentage', 'نسبة الماء', 'Water Percentage', 1, 0, 4),
  ('measurements', 'metabolism_rate', 'معدل الحرق', 'Metabolism Rate', 1, 0, 5),
  ('measurements', 'bmr', 'معدل الأيض الأساسي', 'BMR', 1, 0, 6),
  ('measurements', 'bmi', 'مؤشر كتلة الجسم', 'BMI', 1, 0, 7),
  ('measurements', 'ffm', 'الكتلة الخالية من الدهون', 'FFM', 1, 0, 8),
  ('measurements', 'notes', 'ملاحظات', 'Notes', 1, 0, 9);
