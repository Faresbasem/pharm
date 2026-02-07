import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

// Types
type Bindings = {
  DB: D1Database
}

type Variables = {
  user: any
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Enable CORS
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './' }))

// ========================================
// Authentication Middleware
// ========================================
const authMiddleware = async (c: any, next: any) => {
  const sessionId = c.req.header('X-Session-ID') || c.req.query('session')
  
  if (!sessionId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  // In production, validate session from DB or KV
  // For now, we'll use a simple check
  try {
    const userId = parseInt(sessionId.split('-')[0]) || 0
    if (userId > 0) {
      const user = await c.env.DB.prepare('SELECT id, username, full_name, role FROM users WHERE id = ? AND is_active = 1')
        .bind(userId)
        .first()
      
      if (user) {
        c.set('user', user)
        return next()
      }
    }
  } catch (e) {
    console.error('Auth error:', e)
  }

  return c.json({ error: 'Unauthorized' }, 401)
}

// Admin-only middleware
const adminMiddleware = async (c: any, next: any) => {
  const user = c.get('user')
  if (!user || user.role !== 'admin') {
    return c.json({ error: 'Forbidden - Admin access required' }, 403)
  }
  return next()
}

// ========================================
// API Routes - Authentication
// ========================================

// Login
app.post('/api/auth/login', async (c) => {
  try {
    const { username, password } = await c.req.json()

    // Simple validation (in production, use bcrypt)
    const user = await c.env.DB.prepare(
      'SELECT id, username, full_name, role, is_active FROM users WHERE username = ? AND is_active = 1'
    ).bind(username).first()

    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }

    // For demo: accept any password for 'admin' and 'doctor'
    // In production: verify password_hash with bcrypt
    if (username === 'admin' || username === 'doctor') {
      // Update last login
      await c.env.DB.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?')
        .bind(user.id)
        .run()

      // Create simple session token
      const sessionId = `${user.id}-${Date.now()}`
      
      return c.json({
        success: true,
        sessionId,
        user: {
          id: user.id,
          username: user.username,
          fullName: user.full_name,
          role: user.role
        }
      })
    }

    return c.json({ error: 'Invalid credentials' }, 401)
  } catch (error) {
    console.error('Login error:', error)
    return c.json({ error: 'Login failed' }, 500)
  }
})

// Logout
app.post('/api/auth/logout', authMiddleware, async (c) => {
  return c.json({ success: true })
})

// Get current user
app.get('/api/auth/me', authMiddleware, async (c) => {
  const user = c.get('user')
  return c.json({ user })
})

// ========================================
// API Routes - Patients
// ========================================

// Get all patients (with search)
app.get('/api/patients', authMiddleware, async (c) => {
  try {
    const search = c.req.query('search') || ''
    
    let query = 'SELECT * FROM patients'
    const params: any[] = []

    if (search) {
      query += ' WHERE name LIKE ? OR patient_code LIKE ? OR phone LIKE ?'
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }

    query += ' ORDER BY created_at DESC'

    const { results } = await c.env.DB.prepare(query).bind(...params).all()

    return c.json({ patients: results })
  } catch (error) {
    console.error('Get patients error:', error)
    return c.json({ error: 'Failed to fetch patients' }, 500)
  }
})

// Get single patient
app.get('/api/patients/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id')
    const patient = await c.env.DB.prepare('SELECT * FROM patients WHERE id = ?')
      .bind(id)
      .first()

    if (!patient) {
      return c.json({ error: 'Patient not found' }, 404)
    }

    return c.json({ patient })
  } catch (error) {
    console.error('Get patient error:', error)
    return c.json({ error: 'Failed to fetch patient' }, 500)
  }
})

// Create patient
app.post('/api/patients', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const data = await c.req.json()

    // Generate patient code
    const lastPatient = await c.env.DB.prepare(
      'SELECT patient_code FROM patients ORDER BY id DESC LIMIT 1'
    ).first()
    
    let nextCode = 'P001'
    if (lastPatient && lastPatient.patient_code) {
      const lastNum = parseInt(lastPatient.patient_code.substring(1))
      nextCode = 'P' + String(lastNum + 1).padStart(3, '0')
    }

    const result = await c.env.DB.prepare(`
      INSERT INTO patients (patient_code, name, age, gender, phone, email, chronic_diseases, medications, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      nextCode,
      data.name,
      data.age || null,
      data.gender || null,
      data.phone || null,
      data.email || null,
      data.chronic_diseases || null,
      data.medications || null,
      data.notes || null,
      user.id
    ).run()

    return c.json({ success: true, id: result.meta.last_row_id, patient_code: nextCode })
  } catch (error) {
    console.error('Create patient error:', error)
    return c.json({ error: 'Failed to create patient' }, 500)
  }
})

// Update patient
app.put('/api/patients/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id')
    const data = await c.req.json()

    await c.env.DB.prepare(`
      UPDATE patients 
      SET name = ?, age = ?, gender = ?, phone = ?, email = ?, 
          chronic_diseases = ?, medications = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      data.name,
      data.age || null,
      data.gender || null,
      data.phone || null,
      data.email || null,
      data.chronic_diseases || null,
      data.medications || null,
      data.notes || null,
      id
    ).run()

    return c.json({ success: true })
  } catch (error) {
    console.error('Update patient error:', error)
    return c.json({ error: 'Failed to update patient' }, 500)
  }
})

// Delete patient
app.delete('/api/patients/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id')
    await c.env.DB.prepare('DELETE FROM patients WHERE id = ?').bind(id).run()
    return c.json({ success: true })
  } catch (error) {
    console.error('Delete patient error:', error)
    return c.json({ error: 'Failed to delete patient' }, 500)
  }
})

// ========================================
// API Routes - Measurements
// ========================================

// Get measurements for a patient
app.get('/api/patients/:id/measurements', authMiddleware, async (c) => {
  try {
    const patientId = c.req.param('id')
    
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM measurements WHERE patient_id = ? ORDER BY measurement_date DESC'
    ).bind(patientId).all()

    return c.json({ measurements: results })
  } catch (error) {
    console.error('Get measurements error:', error)
    return c.json({ error: 'Failed to fetch measurements' }, 500)
  }
})

// Add measurement
app.post('/api/patients/:id/measurements', authMiddleware, async (c) => {
  try {
    const patientId = c.req.param('id')
    const user = c.get('user')
    const data = await c.req.json()

    const result = await c.env.DB.prepare(`
      INSERT INTO measurements (
        patient_id, weight, body_fat, muscle_mass, water_percentage, 
        metabolism_rate, bmr, bmi, ffm, notes, created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      patientId,
      data.weight || null,
      data.body_fat || null,
      data.muscle_mass || null,
      data.water_percentage || null,
      data.metabolism_rate || null,
      data.bmr || null,
      data.bmi || null,
      data.ffm || null,
      data.notes || null,
      user.id
    ).run()

    return c.json({ success: true, id: result.meta.last_row_id })
  } catch (error) {
    console.error('Add measurement error:', error)
    return c.json({ error: 'Failed to add measurement' }, 500)
  }
})

// Update measurement
app.put('/api/measurements/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id')
    const data = await c.req.json()

    await c.env.DB.prepare(`
      UPDATE measurements 
      SET weight = ?, body_fat = ?, muscle_mass = ?, water_percentage = ?,
          metabolism_rate = ?, bmr = ?, bmi = ?, ffm = ?, notes = ?
      WHERE id = ?
    `).bind(
      data.weight || null,
      data.body_fat || null,
      data.muscle_mass || null,
      data.water_percentage || null,
      data.metabolism_rate || null,
      data.bmr || null,
      data.bmi || null,
      data.ffm || null,
      data.notes || null,
      id
    ).run()

    return c.json({ success: true })
  } catch (error) {
    console.error('Update measurement error:', error)
    return c.json({ error: 'Failed to update measurement' }, 500)
  }
})

// Delete measurement
app.delete('/api/measurements/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id')
    await c.env.DB.prepare('DELETE FROM measurements WHERE id = ?').bind(id).run()
    return c.json({ success: true })
  } catch (error) {
    console.error('Delete measurement error:', error)
    return c.json({ error: 'Failed to delete measurement' }, 500)
  }
})

// ========================================
// API Routes - Settings (Admin Only)
// ========================================

// Get all settings
app.get('/api/settings', authMiddleware, adminMiddleware, async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM settings').all()
    return c.json({ settings: results })
  } catch (error) {
    console.error('Get settings error:', error)
    return c.json({ error: 'Failed to fetch settings' }, 500)
  }
})

// Update setting
app.put('/api/settings/:key', authMiddleware, adminMiddleware, async (c) => {
  try {
    const key = c.req.param('key')
    const { value } = await c.req.json()

    await c.env.DB.prepare(`
      UPDATE settings 
      SET setting_value = ?, updated_at = CURRENT_TIMESTAMP
      WHERE setting_key = ?
    `).bind(value, key).run()

    return c.json({ success: true })
  } catch (error) {
    console.error('Update setting error:', error)
    return c.json({ error: 'Failed to update setting' }, 500)
  }
})

// Get field settings
app.get('/api/field-settings', authMiddleware, adminMiddleware, async (c) => {
  try {
    const tableName = c.req.query('table')
    let query = 'SELECT * FROM field_settings'
    const params: any[] = []

    if (tableName) {
      query += ' WHERE table_name = ?'
      params.push(tableName)
    }

    query += ' ORDER BY field_order'

    const { results } = await c.env.DB.prepare(query).bind(...params).all()
    return c.json({ fieldSettings: results })
  } catch (error) {
    console.error('Get field settings error:', error)
    return c.json({ error: 'Failed to fetch field settings' }, 500)
  }
})

// Update field setting
app.put('/api/field-settings/:id', authMiddleware, adminMiddleware, async (c) => {
  try {
    const id = c.req.param('id')
    const data = await c.req.json()

    await c.env.DB.prepare(`
      UPDATE field_settings 
      SET display_name_ar = ?, display_name_en = ?, is_visible = ?, is_required = ?, field_order = ?
      WHERE id = ?
    `).bind(
      data.display_name_ar,
      data.display_name_en,
      data.is_visible ? 1 : 0,
      data.is_required ? 1 : 0,
      data.field_order,
      id
    ).run()

    return c.json({ success: true })
  } catch (error) {
    console.error('Update field setting error:', error)
    return c.json({ error: 'Failed to update field setting' }, 500)
  }
})

// ========================================
// API Routes - Users Management (Admin Only)
// ========================================

// Get all users
app.get('/api/users', authMiddleware, adminMiddleware, async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT id, username, full_name, role, is_active, created_at, last_login FROM users ORDER BY created_at DESC'
    ).all()

    return c.json({ users: results })
  } catch (error) {
    console.error('Get users error:', error)
    return c.json({ error: 'Failed to fetch users' }, 500)
  }
})

// Create user
app.post('/api/users', authMiddleware, adminMiddleware, async (c) => {
  try {
    const data = await c.req.json()

    const result = await c.env.DB.prepare(`
      INSERT INTO users (username, password_hash, full_name, role, is_active)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      data.username,
      '$2a$10$YourHashedPasswordHere', // In production, hash the password
      data.full_name,
      data.role,
      data.is_active ? 1 : 0
    ).run()

    return c.json({ success: true, id: result.meta.last_row_id })
  } catch (error) {
    console.error('Create user error:', error)
    return c.json({ error: 'Failed to create user' }, 500)
  }
})

// Update user
app.put('/api/users/:id', authMiddleware, adminMiddleware, async (c) => {
  try {
    const id = c.req.param('id')
    const data = await c.req.json()

    await c.env.DB.prepare(`
      UPDATE users 
      SET full_name = ?, role = ?, is_active = ?
      WHERE id = ?
    `).bind(
      data.full_name,
      data.role,
      data.is_active ? 1 : 0,
      id
    ).run()

    return c.json({ success: true })
  } catch (error) {
    console.error('Update user error:', error)
    return c.json({ error: 'Failed to update user' }, 500)
  }
})

// Delete user
app.delete('/api/users/:id', authMiddleware, adminMiddleware, async (c) => {
  try {
    const id = c.req.param('id')
    const currentUser = c.get('user')

    // Prevent deleting yourself
    if (parseInt(id) === currentUser.id) {
      return c.json({ error: 'Cannot delete your own account' }, 400)
    }

    await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run()
    return c.json({ success: true })
  } catch (error) {
    console.error('Delete user error:', error)
    return c.json({ error: 'Failed to delete user' }, 500)
  }
})

// ========================================
// Main Page
// ========================================
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>نظام إدارة عيادة التخسيس</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            * { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
            .fade-in { animation: fadeIn 0.3s ease-in; }
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            .modal { display: none; }
            .modal.active { display: flex; }
        </style>
    </head>
    <body class="bg-gray-100">
        <div id="app"></div>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
})

export default app
