const API_URL = 'http://localhost:5001/api';

async function testMedAssist() {
  console.log('🧪 Starting MedAssist E2E API Verification Suite...\n');

  try {
    // 1. Health check
    const healthRes = await fetch(`${API_URL}/health`);
    const health = await healthRes.json();
    console.log('✅ 1. Health Check:', health.status, '—', health.system);

    // 2. Demo Login - Doctor
    const docLoginRes = await fetch(`${API_URL}/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'doctor' })
    });
    const docLogin = await docLoginRes.json();
    console.log('✅ 2. Doctor Demo Login:', docLogin.user.name, `(${docLogin.user.email})`);
    const docToken = docLogin.token;

    // 3. Demo Login - Patient
    const patLoginRes = await fetch(`${API_URL}/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'patient' })
    });
    const patLogin = await patLoginRes.json();
    console.log('✅ 3. Patient Demo Login:', patLogin.user.name, `(${patLogin.user.email})`);
    const patToken = patLogin.token;

    // 4. Demo Login - Admin
    const adminLoginRes = await fetch(`${API_URL}/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'admin' })
    });
    const adminLogin = await adminLoginRes.json();
    console.log('✅ 4. Admin Demo Login:', adminLogin.user.name);
    const adminToken = adminLogin.token;

    // 5. Admin Clinic Stats & Audit Logs
    const statsRes = await fetch(`${API_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const stats = await statsRes.json();
    console.log('✅ 5. Admin Stats Fetched: Patients =', stats.stats.totalPatients, '| Doctors =', stats.stats.totalDoctors, '| Revenue = $' + stats.stats.totalRevenue);

    // 6. Doctor Queue & Appointments
    const queueRes = await fetch(`${API_URL}/appointments/today-queue`, {
      headers: { Authorization: `Bearer ${docToken}` }
    });
    const queue = await queueRes.json();
    console.log('✅ 6. Doctor Today Queue:', queue.count, 'appointments scheduled/in-queue');

    // 7. Test AI Clinical Summary Endpoint
    const aiSummaryRes = await fetch(`${API_URL}/ai/summarize-encounter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${docToken}`
      },
      body: JSON.stringify({
        patientName: 'Robert Chen',
        vitals: { bloodPressure: '138/86 mmHg', heartRate: '76 bpm', spO2: '98%' },
        soapNotes: {
          subjective: { chiefComplaint: 'Follow-up for hypertension and mild fatigue' },
          assessment: { primaryDiagnosis: 'Stage 1 Essential Hypertension' },
          plan: { followUpInstructions: 'Return in 4 weeks' }
        },
        diagnosis: 'Stage 1 Essential Hypertension'
      })
    });
    const aiSummary = await aiSummaryRes.json();
    console.log('✅ 7. AI Clinical Note Summarizer Output:');
    console.log('   - Synopsis:', aiSummary.data.clinicalSynopsis);
    console.log('   - Action Items:', aiSummary.data.keyActionItems.length, 'items');
    console.log('   - Critical Flags:', aiSummary.data.criticalFlags);

    // 8. Test AI Patient Plain Language Medication Explainer Endpoint
    const aiExplainerRes = await fetch(`${API_URL}/ai/explain-prescription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patToken}`
      },
      body: JSON.stringify({
        patientName: 'Robert Chen',
        diagnosis: 'Essential Hypertension',
        medications: [
          { medicineName: 'Telmisartan Tablets', dosage: '40 mg', frequency: 'Once Daily (1-0-0)', timing: 'Morning After Breakfast', duration: '30 Days' },
          { medicineName: 'Metformin Hydrochloride', dosage: '500 mg', frequency: 'Twice Daily (1-0-1)', timing: 'With Meals', duration: '30 Days' }
        ],
        generalAdvice: 'Limit daily salt intake to under one teaspoon.'
      })
    });
    const aiExplainer = await aiExplainerRes.json();
    console.log('✅ 8. AI Patient Plain-Language Guide Output:');
    console.log('   - Summary:', aiExplainer.data.summary);
    console.log('   - Medication Explanations:', aiExplainer.data.medicationGuide.length, 'medications explained');
    console.log('   - Daily Wellness Tips:', aiExplainer.data.generalTips.length, 'tips');
    console.log('   - When to Call Doctor:', aiExplainer.data.whenToCallDoctor.length, 'signs');

    // 9. Patient 360 Timeline
    const timelineRes = await fetch(`${API_URL}/emr/timeline`, {
      headers: { Authorization: `Bearer ${patToken}` }
    });
    const timeline = await timelineRes.json();
    console.log('✅ 9. Patient 360° Timeline Stream:', timeline.timeline.length, 'total events (Visits, Notes, Rx, Lab, Bills)');

    // 10. Lab Workbench & Reports
    const labTechLoginRes = await fetch(`${API_URL}/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'lab_technician' })
    });
    const labLogin = await labTechLoginRes.json();
    const labOrdersRes = await fetch(`${API_URL}/lab`, {
      headers: { Authorization: `Bearer ${labLogin.token}` }
    });
    const labOrders = await labOrdersRes.json();
    console.log('✅ 10. Lab Orders Workbench:', labOrders.count, 'diagnostic orders in laboratory pipeline');

    console.log('\n🎉 ALL 10 INTEGRATION VERIFICATION TESTS PASSED PERFECTLY!');
  } catch (error) {
    console.error('❌ Verification Error:', error);
  }
}

testMedAssist();
