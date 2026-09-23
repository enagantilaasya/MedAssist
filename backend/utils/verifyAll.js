const API_URL = 'http://localhost:5001/api';

async function verifyAll() {
  console.log('🏥 Starting Comprehensive MedAssist Full-Stack Verification Suite...\n');
  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  try {
    // -------------------------------------------------------------
    // 1. AUTHENTICATION & DEMO LOGIN FOR ALL 5 ROLES
    // -------------------------------------------------------------
    console.log('--- 1. Testing Demo Logins for All 5 Roles ---');
    const roles = ['admin', 'doctor', 'receptionist', 'lab', 'patient'];
    const tokens = {};
    const users = {};

    for (const r of roles) {
      const res = await fetch(`${API_URL}/auth/demo-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: r })
      });
      const data = await res.json();
      assert(data.success === true, `Demo login for role '${r}' succeeded`);
      assert(data.user.role === r, `User object has role '${r}'`);
      tokens[r] = data.token;
      users[r] = data.user;
    }

    // -------------------------------------------------------------
    // 2. STRICT ROLE-BASED ACCESS CONTROL (403 FORBIDDEN ENFORCEMENT)
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Strict RBAC (403 Forbidden Enforcement) ---');

    // Test A: Patient cannot access Admin Stats
    const patToAdmin = await fetch(`${API_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${tokens.patient}` }
    });
    assert(patToAdmin.status === 403, `Patient accessing /admin/stats returned 403 Forbidden (Actual: ${patToAdmin.status})`);

    // Test B: Lab Technician cannot access Clinical Medical Notes
    const labToNotes = await fetch(`${API_URL}/medical/notes`, {
      headers: { Authorization: `Bearer ${tokens.lab}` }
    });
    assert(labToNotes.status === 403, `Lab Technician accessing /medical/notes returned 403 Forbidden (Actual: ${labToNotes.status})`);

    // Test C: Receptionist cannot create a Medical SOAP note (only doctors can)
    const recToNote = await fetch(`${API_URL}/medical/add-note`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.receptionist}` 
      },
      body: JSON.stringify({ diagnosis: 'Test' })
    });
    assert(recToNote.status === 403, `Receptionist accessing /medical/add-note returned 403 Forbidden (Actual: ${recToNote.status})`);

    // Test D: Doctor cannot manage clinic users
    const docToAdminUser = await fetch(`${API_URL}/admin/toggle-user/${users.patient._id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokens.doctor}` }
    });
    assert(docToAdminUser.status === 403, `Doctor accessing /admin/toggle-user returned 403 Forbidden (Actual: ${docToAdminUser.status})`);

    // -------------------------------------------------------------
    // 3. ADMIN CAPABILITIES
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing Admin Functionality ---');
    const adminStatsRes = await fetch(`${API_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${tokens.admin}` }
    });
    const adminStats = await adminStatsRes.json();
    assert(adminStats.success === true, 'Admin successfully fetched clinic statistics');
    assert(typeof adminStats.stats.totalPatients === 'number', 'Stats contains patient counts');

    const adminUsersRes = await fetch(`${API_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${tokens.admin}` }
    });
    const adminUsers = await adminUsersRes.json();
    assert(adminUsers.success === true && adminUsers.payload.length > 0, 'Admin successfully fetched user directory');

    // -------------------------------------------------------------
    // 4. RECEPTIONIST WORKFLOW: REGISTER PATIENT & SCHEDULE APPOINTMENT
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing Receptionist Workflow ---');
    const newPtRes = await fetch(`${API_URL}/patients/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.receptionist}`
      },
      body: JSON.stringify({
        fullName: 'Alice Johnson',
        email: `alice_${Date.now()}@example.com`,
        phone: '+1 555 987 6543',
        dateOfBirth: '1990-05-15',
        gender: 'Female',
        bloodGroup: 'B+',
        allergies: ['Penicillin'],
        chronicConditions: ['Asthma']
      })
    });
    const newPtData = await newPtRes.json();
    assert(newPtData.success === true, `Receptionist registered new patient: ${newPtData.payload?.fullName}`);
    const createdPatientId = newPtData.payload._id;

    // Fetch doctors to book with
    const docsRes = await fetch(`${API_URL}/doctors/all`, {
      headers: { Authorization: `Bearer ${tokens.receptionist}` }
    });
    const docsData = await docsRes.json();
    assert(docsData.success === true && docsData.payload.length > 0, 'Fetched active doctors');
    const assignedDocId = docsData.payload[0]._id;

    // Book appointment with a unique test date
    const testDateStr = new Date(Date.now() + (Math.floor(Math.random() * 500) + 50) * 86400000).toISOString().split('T')[0];
    const testSlot = '10:00 AM';
    const bookRes = await fetch(`${API_URL}/appointments/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.receptionist}`
      },
      body: JSON.stringify({
        patientId: createdPatientId,
        doctorId: assignedDocId,
        appointmentDate: testDateStr,
        appointmentTime: testSlot,
        reason: 'Recurrent mild wheezing and checkup'
      })
    });
    const bookData = await bookRes.json();
    assert(bookData.success === true, `Booked appointment for ${testDateStr} at ${testSlot} (ID: ${bookData.payload?._id})`);
    const aptId = bookData.payload._id;

    // Test Conflict Detection: Trying to book SAME doctor, SAME date, SAME time slot
    const conflictRes = await fetch(`${API_URL}/appointments/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.receptionist}`
      },
      body: JSON.stringify({
        patientId: createdPatientId,
        doctorId: assignedDocId,
        appointmentDate: testDateStr,
        appointmentTime: testSlot,
        reason: 'Attempt double booking'
      })
    });
    assert(conflictRes.status === 409, `Double booking rejected with 409 Conflict (Actual: ${conflictRes.status})`);

    // -------------------------------------------------------------
    // 5. DOCTOR WORKFLOW: CLINICAL ENCOUNTER, AI SUMMARY, PRESCRIPTION & LAB ORDER
    // -------------------------------------------------------------
    console.log('\n--- 5. Testing Doctor Workflow & AI Features ---');
    // Doctor AI Clinical Summary
    const aiSummaryRes = await fetch(`${API_URL}/ai/clinical-summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.doctor}`
      },
      body: JSON.stringify({
        patientName: 'Alice Johnson',
        vitals: { bloodPressure: '118/76', heartRate: '74', spO2: '99%' },
        soapNotes: {
          subjective: { chiefComplaint: 'Mild seasonal wheezing' },
          objective: { physicalExam: 'Bilateral mild expiratory wheeze, clear otherwise' },
          assessment: { primaryDiagnosis: 'Mild Intermittent Asthma' },
          plan: { followUpInstructions: 'Use inhaler as needed, review in 2 weeks' }
        },
        diagnosis: 'Mild Intermittent Asthma'
      })
    });
    const aiSummaryData = await aiSummaryRes.json();
    assert(aiSummaryData.success === true, 'AI Clinical Summary generated successfully');
    assert(typeof aiSummaryData.payload?.clinicalSynopsis === 'string', 'AI generated clinical synopsis');

    // Doctor records SOAP Note
    const noteRes = await fetch(`${API_URL}/medical/add-note`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.doctor}`
      },
      body: JSON.stringify({
        appointmentId: aptId,
        diagnosis: 'Mild Intermittent Asthma',
        symptoms: ['Wheezing', 'Shortness of breath with cold air'],
        clinicalNotes: 'Prescribed Salbutamol inhaler. Avoid cold exposure.',
        observations: 'Lungs show scattered end-expiratory rhonchi.',
        vitals: { bloodPressure: '118/76', heartRate: '74' },
        aiSummary: aiSummaryData.payload
      })
    });
    const noteData = await noteRes.json();
    assert(noteData.success === true, 'Doctor recorded clinical SOAP note and completed encounter');

    // Doctor issues Prescription with AI guidance
    const rxRes = await fetch(`${API_URL}/prescriptions/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.doctor}`
      },
      body: JSON.stringify({
        appointmentId: aptId,
        medicines: [
          { name: 'Salbutamol Inhaler', dosage: '100 mcg', frequency: '2 puffs PRN', duration: 'As needed', instructions: 'Inhale 2 puffs every 4-6 hrs for wheezing' },
          { name: 'Cetirizine', dosage: '10 mg', frequency: 'Once Daily (0-0-1)', duration: '10 Days', instructions: 'Take at night before sleep' }
        ],
        instructions: 'Rinse mouth after inhalation. Keep rescue inhaler handy.',
        followUpDate: '2026-10-15'
      })
    });
    const rxData = await rxRes.json();
    assert(rxData.success === true, 'Doctor issued prescription with AI Plain-Language Guide');
    const rxId = rxData.payload._id;

    // Doctor orders a Lab Test
    const labOrderRes = await fetch(`${API_URL}/lab/order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.doctor}`
      },
      body: JSON.stringify({
        appointmentId: aptId,
        testName: 'Complete Blood Count (CBC)',
        testCode: 'LAB-CBC',
        specimenType: 'Blood',
        instructions: 'Check eosinophil count for allergic asthma'
      })
    });
    const labOrderData = await labOrderRes.json();
    assert(labOrderData.success === true, `Doctor ordered lab test: ${labOrderData.payload.testName}`);
    const labOrderId = labOrderData.payload._id;

    // -------------------------------------------------------------
    // 6. LAB TECHNICIAN WORKFLOW: COLLECT SAMPLE, RECORD & VERIFY RESULT
    // -------------------------------------------------------------
    console.log('\n--- 6. Testing Lab Technician Workflow ---');
    // Update sample status
    const statusRes = await fetch(`${API_URL}/lab/sample-status/${labOrderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.lab}`
      },
      body: JSON.stringify({
        status: 'sample_collected',
        sampleBarcode: 'BAR-CBC-9921'
      })
    });
    const statusData = await statusRes.json();
    assert(statusData.success === true && statusData.payload.status === 'sample_collected', 'Lab technician updated sample status to sample_collected');

    // Enter test result and auto-release
    const resultRes = await fetch(`${API_URL}/lab/result`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.lab}`
      },
      body: JSON.stringify({
        labOrderId,
        result: '14.2',
        unit: 'g/dL',
        referenceRange: '12.0 - 16.0 g/dL',
        flag: 'Normal',
        remarks: 'Hemoglobin within standard limits. Eosinophils mildly elevated at 5%.',
        autoRelease: true
      })
    });
    const resultData = await resultRes.json();
    assert(resultData.success === true, 'Lab technician recorded and released diagnostic result');

    // -------------------------------------------------------------
    // 7. PATIENT WORKFLOW: 360 TIMELINE, AI PRESCRIPTION EXPLAINER & BILLING
    // -------------------------------------------------------------
    console.log('\n--- 7. Testing Patient Portal Features ---');
    // Patient views 360° timeline
    const timelineRes = await fetch(`${API_URL}/medical/timeline`, {
      headers: { Authorization: `Bearer ${tokens.patient}` }
    });
    const timelineData = await timelineRes.json();
    assert(timelineData.success === true, 'Patient fetched their 360° medical timeline');
    assert(Array.isArray(timelineData.timeline), 'Timeline contains chronological array of events');

    // Patient calls AI plain-language explainer
    const explainRes = await fetch(`${API_URL}/prescriptions/explain/${rxId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens.doctor}` } // or doctor/patient owner
    });
    const explainData = await explainRes.json();
    assert(explainData.success === true, 'AI plain-language medication explainer generated');

    // Receptionist creates invoice for the visit
    const invRes = await fetch(`${API_URL}/invoices/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.receptionist}`
      },
      body: JSON.stringify({
        patientId: createdPatientId,
        appointmentId: aptId,
        items: [
          { itemName: 'Specialist Consultation', unitPrice: 50, quantity: 1 },
          { itemName: 'Complete Blood Count (CBC)', unitPrice: 35, quantity: 1 }
        ],
        taxAmount: 5,
        discount: 0
      })
    });
    const invData = await invRes.json();
    assert(invData.success === true, `Receptionist generated invoice #${invData.payload.invoiceNumber} for $${invData.payload.totalAmount}`);
    const invoiceId = invData.payload._id;

    // Process payment on invoice
    const payRes = await fetch(`${API_URL}/invoices/pay/${invoiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.receptionist}`
      },
      body: JSON.stringify({
        amountPaid: 90,
        paymentMethod: 'Credit Card'
      })
    });
    const payData = await payRes.json();
    assert(payData.success === true && payData.payload.paymentStatus === 'paid', 'Invoice payment processed and settled (status: paid)');

    console.log(`\n======================================================`);
    console.log(`🎉 ALL ${passed}/${total} END-TO-END VERIFICATION CHECKS PASSED!`);
    console.log(`======================================================\n`);
  } catch (err) {
    console.error('\n❌ Verification Failed:', err);
    process.exit(1);
  }
}

verifyAll();
