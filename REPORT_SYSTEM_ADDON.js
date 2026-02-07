// ===========================================
// Add this to public/static/app.js
// Patient Reports System - Standalone
// ===========================================

// Add report function to render switch case:
/*
case 'report':
  app.innerHTML = PatientReportPageSimple(AppState.pageParams.patientId)
  loadSimpleReport(AppState.pageParams.patientId)
  break
*/

// Simple Report Page
function PatientReportPageSimple(patientId) {
  return `
    ${NavBar()}
    <div class="container mx-auto px-4 py-8 fade-in">
      <div class="flex justify-between items-center mb-6">
        <button onclick="navigateTo('patients')" class="text-blue-500 hover:text-blue-600">
          <i class="fas fa-arrow-right ml-2"></i>العودة
        </button>
        <button onclick="window.print()" class="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600">
          <i class="fas fa-print ml-2"></i>طباعة
        </button>
      </div>
      <div id="reportContent" class="bg-white rounded-lg shadow-lg p-8">
        <p class="text-center text-gray-500">جاري التحميل...</p>
      </div>
    </div>
    <style>
      @media print {
        body * { visibility: hidden; }
        #reportContent, #reportContent * { visibility: visible; }
        #reportContent { position: absolute; left: 0; top: 0; width: 100%; }
        nav, button, .no-print { display: none !important; }
      }
    </style>
  `
}

// Load and display report
async function loadSimpleReport(patientId) {
  const data = await API.getPatientReport(patientId)
  if (!data) return
  
  const { patient, measurements, statistics } = data
  const clinicName = data.settings?.clinic_name || 'عيادة التخسيس'
  
  document.getElementById('reportContent').innerHTML = `
    <div class="text-center border-b-2 border-blue-500 pb-4 mb-6">
      <h1 class="text-4xl font-bold text-blue-600">${clinicName}</h1>
      <p class="text-gray-600 mt-2">تقرير المريض</p>
      <p class="text-sm text-gray-500 mt-2">${new Date().toLocaleDateString('ar-EG')}</p>
    </div>

    <div class="mb-6">
      <h2 class="text-2xl font-bold mb-4">بيانات المريض</h2>
      <div class="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
        <div><span class="text-gray-600">الاسم:</span> <strong>${patient.name}</strong></div>
        <div><span class="text-gray-600">الكود:</span> <strong>${patient.patient_code}</strong></div>
        <div><span class="text-gray-600">السن:</span> <strong>${patient.age || '-'}</strong></div>
        <div><span class="text-gray-600">الهاتف:</span> <strong>${patient.phone || '-'}</strong></div>
        ${patient.chronic_diseases ? `<div class="col-span-2"><span class="text-gray-600">الأمراض:</span> ${patient.chronic_diseases}</div>` : ''}
      </div>
    </div>

    ${measurements.length > 0 ? `
    <div class="mb-6">
      <h2 class="text-2xl font-bold mb-4">الإحصائيات</h2>
      <div class="grid grid-cols-3 gap-4">
        <div class="bg-blue-50 p-4 rounded text-center">
          <p class="text-blue-600">الزيارات</p>
          <p class="text-3xl font-bold text-blue-600">${statistics.totalMeasurements}</p>
        </div>
        <div class="bg-green-50 p-4 rounded text-center">
          <p class="text-green-600">تغير الوزن</p>
          <p class="text-3xl font-bold text-green-600">${statistics.weightChange > 0 ? '+' : ''}${statistics.weightChange} كجم</p>
        </div>
        <div class="bg-purple-50 p-4 rounded text-center">
          <p class="text-purple-600">تغير الدهون</p>
          <p class="text-3xl font-bold text-purple-600">${statistics.bodyFatChange > 0 ? '+' : ''}${statistics.bodyFatChange}%</p>
        </div>
      </div>
    </div>

    <div>
      <h2 class="text-2xl font-bold mb-4">سجل القياسات</h2>
      <table class="w-full border-collapse border">
        <thead class="bg-gray-100">
          <tr>
            <th class="border p-2 text-right">التاريخ</th>
            <th class="border p-2 text-right">الوزن</th>
            <th class="border p-2 text-right">الدهون</th>
            <th class="border p-2 text-right">العضلات</th>
            <th class="border p-2 text-right">BMI</th>
            <th class="border p-2 text-right">ملاحظات</th>
          </tr>
        </thead>
        <tbody>
          ${measurements.map(m => `
            <tr>
              <td class="border p-2">${new Date(m.measurement_date).toLocaleDateString('ar-EG')}</td>
              <td class="border p-2">${m.weight || '-'}</td>
              <td class="border p-2">${m.body_fat || '-'}</td>
              <td class="border p-2">${m.muscle_mass || '-'}</td>
              <td class="border p-2">${m.bmi || '-'}</td>
              <td class="border p-2">${m.notes || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : '<p class="text-center text-gray-500 py-8">لا توجد قياسات</p>'}

    <div class="border-t-2 mt-6 pt-4 text-center text-gray-600 text-sm">
      <p>تم إعداد التقرير في: ${new Date().toLocaleString('ar-EG')}</p>
    </div>
  `
}
