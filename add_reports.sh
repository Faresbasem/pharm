#!/bin/bash

# ===========================
# Script to add report system
# ===========================

cd /home/user/webapp

# Add reports endpoints to backend
cat >> src/index.tsx << 'BACKEND_EOF'

// ========================================
// API Routes - Reports  
// ========================================

// Get patient report data
app.get('/api/reports/patient/:id', authMiddleware, async (c) => {
  try {
    const patientId = c.req.param('id')
    
    const patient = await c.env.DB.prepare('SELECT * FROM patients WHERE id = ?')
      .bind(patientId).first()
    
    if (!patient) return c.json({ error: 'Patient not found' }, 404)
    
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

// Update clinic settings (Admin only)
app.put('/api/reports/settings', authMiddleware, adminMiddleware, async (c) => {
  try {
    const { clinic_name, report_header, report_footer } = await c.req.json()
    
    for (const [key, value] of Object.entries({ clinic_name, report_header, report_footer })) {
      const existing = await c.env.DB.prepare('SELECT id FROM settings WHERE setting_key = ?').bind(key).first()
      
      if (existing) {
        await c.env.DB.prepare('UPDATE settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?')
          .bind(value, key).run()
      } else {
        await c.env.DB.prepare('INSERT INTO settings (setting_key, setting_value, setting_type) VALUES (?, ?, ?)')
          .bind(key, value, 'string').run()
      }
    }
    
    return c.json({ success: true })
  } catch (error) {
    console.error('Update settings error:', error)
    return c.json({ error: 'Failed to update settings' }, 500)
  }
})

BACKEND_EOF

echo "✅ Backend endpoints added!"

# Create complete frontend additions file
cat > /tmp/frontend_additions.js << 'FRONTEND_EOF'

// Add to translations.ar (after lastLogin)
    printReport: 'طباعة التقرير',
    patientReport: 'تقرير المريض',
    editReportSettings: 'تعديل إعدادات التقرير',
    statistics: 'الإحصائيات',
    weightChange: 'التغير في الوزن',
    totalVisits: 'إجمالي الزيارات',
    print: 'طباعة',
    clinicName: 'اسم العيادة',
    reportHeader: 'رأس التقرير',
    reportFooter: 'ذيل التقرير',

// Add to translations.en (after lastLogin)
    printReport: 'Print Report',
    patientReport: 'Patient Report',
    editReportSettings: 'Edit Report Settings',
    statistics: 'Statistics',
    weightChange: 'Weight Change',
    totalVisits: 'Total Visits',
    print: 'Print',
    clinicName: 'Clinic Name',
    reportHeader: 'Report Header',
    reportFooter: 'Report Footer',

// Add to API object (before closing brace)
  async getPatientReport(patientId) {
    return await this.request(`/reports/patient/${patientId}`)
  },

  async updateReportSettings(settings) {
    return await this.request('/reports/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    })
  }

FRONTEND_EOF

echo "✅ Frontend additions prepared!"
echo "Now building and starting the app..."

npm install
npm run db:migrate:local
npm run db:seed
npm run build
fuser -k 3000/tcp 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.cjs

echo "✅ App started!"
