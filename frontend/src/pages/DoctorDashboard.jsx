import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { DashboardCard } from '../components/DashboardCard';
import { AppointmentCard } from '../components/AppointmentCard';
import { 
  Stethoscope, 
  Clock, 
  CheckCircle2, 
  Calendar, 
  Sparkles, 
  Plus, 
  Trash2, 
  FileText, 
  Pill, 
  FlaskConical, 
  AlertTriangle, 
  ArrowLeft,
  ChevronRight,
  User
} from 'lucide-react';

export const DoctorDashboard = () => {
  const { user } = useAuthStore();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('queue');

  // Synchronize activeTab with URL subpath
  useEffect(() => {
    if (location.pathname.includes('/appointments')) setActiveTab('appointments');
    else if (location.pathname.includes('/notes')) setActiveTab('notes');
    else if (location.pathname.includes('/prescriptions')) setActiveTab('prescriptions');
    else if (location.pathname.includes('/lab-orders')) setActiveTab('lab-orders');
    else setActiveTab('queue');
  }, [location.pathname]);

  const [appointments, setAppointments] = useState([]);
  const [medicalNotes, setMedicalNotes] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [labOrders, setLabOrders] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Consultation Encounter State
  const [activeConsultation, setActiveConsultation] = useState(null);
  const [vitals, setVitals] = useState({
    bloodPressure: '120/80 mmHg',
    heartRate: '72 bpm',
    temperature: '98.6 F',
    spO2: '99%',
    weight: '70 kg',
    height: '175 cm'
  });
  const [symptoms, setSymptoms] = useState('Mild fatigue, headache');
  const [observations, setObservations] = useState('Heart sounds normal S1/S2, lungs clear to auscultation.');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [instructions, setInstructions] = useState('Drink water, low salt intake.');

  // AI Summary State
  const [aiSummary, setAiSummary] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Medications State
  const [medicines, setMedicines] = useState([
    { name: 'Paracetamol', dosage: '500 mg', frequency: 'Twice Daily (1-0-1)', duration: '5 Days', instructions: 'After meals' }
  ]);

  // Lab Order State
  const [labTests, setLabTests] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [aptsRes, srvRes, notesRes, rxRes, labRes] = await Promise.all([
        api.get('/appointments/all').catch(() => ({ data: { success: false, payload: [] } })),
        api.get('/admin/services').catch(() => ({ data: { success: false, payload: [] } })),
        api.get('/medical/notes').catch(() => ({ data: { success: false, payload: [] } })),
        api.get('/prescriptions/all').catch(() => ({ data: { success: false, payload: [] } })),
        api.get('/lab/orders').catch(() => ({ data: { success: false, payload: [] } }))
      ]);

      if (aptsRes.data?.success) setAppointments(aptsRes.data.payload || []);
      if (srvRes.data?.success) setServices(srvRes.data.payload?.filter(s => s.category === 'Laboratory') || []);
      if (notesRes.data?.success) setMedicalNotes(notesRes.data.payload || []);
      if (rxRes.data?.success) setPrescriptions(rxRes.data.payload || []);
      if (labRes.data?.success) setLabOrders(labRes.data.payload || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStartConsult = (appointment) => {
    setActiveConsultation(appointment);
    setDiagnosis(appointment.reason || '');
    setAiSummary(null);
    setActiveTab('queue');
  };

  const handleAddMedicine = () => {
    setMedicines([...medicines, { name: '', dosage: '1 Tab', frequency: 'Twice Daily', duration: '7 Days', instructions: 'After food' }]);
  };

  const handleRemoveMedicine = (idx) => {
    setMedicines(medicines.filter((_, i) => i !== idx));
  };

  const handleToggleLab = (srvName) => {
    if (labTests.includes(srvName)) {
      setLabTests(labTests.filter(t => t !== srvName));
    } else {
      setLabTests([...labTests, srvName]);
    }
  };

  // Generate AI Clinical Summary
  const handleGenerateAISummary = async () => {
    if (!diagnosis) {
      alert('Please enter a clinical diagnosis first.');
      return;
    }
    setAiLoading(true);
    try {
      const res = await api.post('/ai/clinical-summary', {
        patientName: activeConsultation.patientId?.fullName,
        vitals,
        soapNotes: {
          subjective: { chiefComplaint: activeConsultation.reason, symptoms: symptoms.split(',') },
          objective: { physicalExam: observations },
          assessment: { primaryDiagnosis: diagnosis, clinicalNotes },
          plan: { followUpInstructions: instructions }
        },
        diagnosis
      });
      if (res.data?.success) {
        setAiSummary(res.data.payload);
      }
    } catch (err) {
      alert('AI error: ' + (err.response?.data?.message || err.message));
    } finally {
      setAiLoading(false);
    }
  };

  // Finalize Encounter & Save to MongoDB
  const handleSaveEncounter = async () => {
    if (!diagnosis) {
      alert('Clinical diagnosis is required.');
      return;
    }

    try {
      // 1. Create Medical Note (SOAP)
      await api.post('/medical/add-note', {
        appointmentId: activeConsultation._id,
        diagnosis,
        symptoms: symptoms.split(',').map(s => s.trim()),
        observations,
        clinicalNotes,
        vitals,
        aiSummary: aiSummary || {}
      });

      // 2. Create Prescription if medicines added
      const validMeds = medicines.filter(m => m.name.trim() !== '');
      if (validMeds.length > 0) {
        await api.post('/prescriptions/add', {
          appointmentId: activeConsultation._id,
          medicines: validMeds,
          instructions,
          followUpDate: followUpDate || null
        });
      }

      // 3. Create Lab Orders if tests selected
      for (const tName of labTests) {
        await api.post('/lab/order', {
          appointmentId: activeConsultation._id,
          testName: tName,
          instructions: `Order from Dr. consultation for ${diagnosis}`
        });
      }

      // 4. Create Follow-up if date selected
      if (followUpDate) {
        await api.post('/follow-ups/add', {
          appointmentId: activeConsultation._id,
          followUpDate,
          instructions
        });
      }

      alert('Encounter successfully finalized and saved to patient record!');
      setActiveConsultation(null);
      fetchData();
    } catch (err) {
      alert('Error saving encounter: ' + (err.response?.data?.message || err.message));
    }
  };

  const waitingApts = appointments.filter(a => a.status === 'scheduled' || a.status === 'confirmed' || a.status === 'waiting');
  const completedApts = appointments.filter(a => a.status === 'completed');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Doctor Clinical Portal</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Dr. {user?.name} • Patient consultations, SOAP notes, prescriptions & AI summaries.</p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <DashboardCard
          title="In Queue / Waiting"
          value={waitingApts.length}
          subtext="Ready for consultation"
          icon={Clock}
          color="amber"
        />
        <DashboardCard
          title="Completed Today"
          value={completedApts.length}
          subtext="Consultations finalized"
          icon={CheckCircle2}
          color="emerald"
        />
        <DashboardCard
          title="Total Assigned"
          value={appointments.length}
          subtext="Appointments on schedule"
          icon={Calendar}
          color="sky"
        />
        <DashboardCard
          title="Prescriptions"
          value={prescriptions.length}
          subtext="Issued with AI guide"
          icon={Pill}
          color="purple"
        />
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 space-x-2 sm:space-x-4 overflow-x-auto pb-1">
        {[
          { id: 'queue', label: `Encounter Queue (${waitingApts.length})`, icon: Clock },
          { id: 'appointments', label: `All Appointments (${appointments.length})`, icon: Calendar },
          { id: 'notes', label: `Clinical SOAP Notes (${medicalNotes.length})`, icon: FileText },
          { id: 'prescriptions', label: `Prescriptions Issued (${prescriptions.length})`, icon: Pill },
          { id: 'lab-orders', label: `Lab Orders (${labOrders.length})`, icon: FlaskConical }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveConsultation(null);
                setActiveTab(tab.id);
              }}
              className={`flex items-center gap-1.5 py-2.5 px-4 font-bold text-xs sm:text-sm border-b-2 transition whitespace-nowrap ${
                activeTab === tab.id && !activeConsultation
                  ? 'border-sky-600 text-sky-700 bg-sky-50/50 rounded-t-xl'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ACTIVE CONSULTATION ROOM */}
      {activeConsultation ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
            <div>
              <button
                onClick={() => setActiveConsultation(null)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 mb-2 transition"
              >
                <ArrowLeft className="w-4 h-4" /> Exit Encounter Room
              </button>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Consultation: {activeConsultation.patientId?.fullName}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Token #{activeConsultation.queueNumber} • Blood Group: <span className="font-bold text-red-600">{activeConsultation.patientId?.bloodGroup || 'O+'}</span> • Gender: {activeConsultation.patientId?.gender}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerateAISummary}
                disabled={aiLoading}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold rounded-xl transition shadow-md disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                {aiLoading ? 'Generating...' : 'AI Clinical Synopsis'}
              </button>

              <button
                onClick={handleSaveEncounter}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-md"
              >
                Finalize & Save Encounter
              </button>
            </div>
          </div>

          {/* Vitals Input Row */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Vitals Recorded</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Blood Pressure</label>
                <input
                  type="text"
                  value={vitals.bloodPressure}
                  onChange={(e) => setVitals({ ...vitals, bloodPressure: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Heart Rate</label>
                <input
                  type="text"
                  value={vitals.heartRate}
                  onChange={(e) => setVitals({ ...vitals, heartRate: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Temperature</label>
                <input
                  type="text"
                  value={vitals.temperature}
                  onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">SpO2 Oxygen</label>
                <input
                  type="text"
                  value={vitals.spO2}
                  onChange={(e) => setVitals({ ...vitals, spO2: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Clinical SOAP Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Chief Symptoms (Subjective)</label>
              <textarea
                rows="2"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Physical Observations (Objective)</label>
              <textarea
                rows="2"
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Clinical Diagnosis (Assessment) *</label>
              <input
                type="text"
                required
                placeholder="e.g. Essential Hypertension, Bronchitis"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Doctor's Clinical Notes</label>
              <input
                type="text"
                placeholder="Therapeutic plan, instructions..."
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          {/* AI Clinical Summary Banner */}
          {aiSummary && (
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-indigo-900">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                AI Generated Clinical Synopsis
              </div>
              <p className="text-slate-700">{aiSummary.clinicalSynopsis}</p>
              {aiSummary.keyActionItems?.length > 0 && (
                <div className="text-indigo-800 font-semibold">
                  Action items: {aiSummary.keyActionItems.join(' • ')}
                </div>
              )}
            </div>
          )}

          {/* Electronic Prescription */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Pill className="w-4 h-4 text-sky-600" /> Prescribe Medications
              </h4>
              <button
                type="button"
                onClick={handleAddMedicine}
                className="inline-flex items-center gap-1 px-3 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 text-xs font-bold rounded-lg border border-sky-200 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add Drug
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {medicines.map((med, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <input
                    type="text"
                    placeholder="Medicine Name"
                    value={med.name}
                    onChange={(e) => {
                      const updated = [...medicines];
                      updated[idx].name = e.target.value;
                      setMedicines(updated);
                    }}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-bold"
                  />
                  <input
                    type="text"
                    placeholder="Dosage (e.g. 500 mg)"
                    value={med.dosage}
                    onChange={(e) => {
                      const updated = [...medicines];
                      updated[idx].dosage = e.target.value;
                      setMedicines(updated);
                    }}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Frequency & Duration"
                    value={med.frequency}
                    onChange={(e) => {
                      const updated = [...medicines];
                      updated[idx].frequency = e.target.value;
                      setMedicines(updated);
                    }}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Timing (After food)"
                      value={med.instructions}
                      onChange={(e) => {
                        const updated = [...medicines];
                        updated[idx].instructions = e.target.value;
                        setMedicines(updated);
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
                    />
                    {medicines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMedicine(idx)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Diagnostic Lab Tests Requisition */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <FlaskConical className="w-4 h-4 text-teal-600" /> Requisition Lab Tests
            </h4>
            <div className="flex flex-wrap gap-2 text-xs">
              {['Complete Blood Count (CBC)', 'Fasting Blood Glucose & HbA1c', 'Lipid Profile', 'Liver Function Test (LFT)', 'Renal Function Test (RFT)'].map((tName) => (
                <button
                  key={tName}
                  type="button"
                  onClick={() => handleToggleLab(tName)}
                  className={`px-3 py-1.5 rounded-lg border font-semibold transition ${
                    labTests.includes(tName)
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {labTests.includes(tName) ? '✓ ' : '+ '}{tName}
                </button>
              ))}
            </div>
          </div>

          {/* Follow-up Plan */}
          <div className="pt-4 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 mb-1">Next Follow-up Consultation Date</label>
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>
        </div>
      ) : null}

      {/* TAB: ENCOUNTER QUEUE */}
      {!activeConsultation && activeTab === 'queue' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-lg">Assigned Patient Queue ({waitingApts.length} waiting)</h3>
          </div>

          {waitingApts.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 text-slate-500 text-xs">
              No patients currently waiting in your consultation queue.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {waitingApts.map((apt) => (
                <AppointmentCard
                  key={apt._id}
                  appointment={apt}
                  actionLabel="Start Consultation Room"
                  onAction={handleStartConsult}
                  actionColor="bg-sky-600 hover:bg-sky-700"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: ALL APPOINTMENTS */}
      {!activeConsultation && activeTab === 'appointments' && (
        <div className="space-y-4">
          <h3 className="font-bold text-slate-900 text-lg">All Doctor Appointments ({appointments.length})</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {appointments.map((apt) => (
              <div key={apt._id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900">{apt.patientId?.fullName || 'Patient'}</span>
                  <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100">{apt.status}</span>
                </div>
                <div className="text-slate-500">{apt.appointmentDate} at {apt.appointmentTime}</div>
                <div className="text-slate-700 font-medium">Reason: {apt.reason || 'Consultation'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: CLINICAL NOTES RECORDED */}
      {!activeConsultation && activeTab === 'notes' && (
        <div className="space-y-4">
          <h3 className="font-bold text-slate-900 text-lg">Recorded SOAP Clinical Notes ({medicalNotes.length})</h3>
          {medicalNotes.length === 0 ? (
            <div className="bg-white p-8 text-center rounded-2xl border text-slate-400 text-xs">No clinical notes recorded yet.</div>
          ) : (
            <div className="space-y-3">
              {medicalNotes.map((note) => (
                <div key={note._id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-slate-900 text-sm">{note.diagnosis}</span>
                    <span className="text-slate-400">{new Date(note.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="text-sky-700 font-semibold">Patient: {note.patientId?.fullName}</div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                    <div><strong>Vitals:</strong> BP: {note.vitals?.bloodPressure || 'N/A'}, HR: {note.vitals?.heartRate || 'N/A'}</div>
                    <div><strong>Observations:</strong> {note.observations || 'Clear'}</div>
                    {note.aiSummary?.clinicalSynopsis && (
                      <div className="text-indigo-800 font-medium pt-1">
                        <strong>AI Synopsis:</strong> {note.aiSummary.clinicalSynopsis}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: PRESCRIPTIONS ISSUED */}
      {!activeConsultation && activeTab === 'prescriptions' && (
        <div className="space-y-4">
          <h3 className="font-bold text-slate-900 text-lg">Issued Prescriptions ({prescriptions.length})</h3>
          {prescriptions.length === 0 ? (
            <div className="bg-white p-8 text-center rounded-2xl border text-slate-400 text-xs">No prescriptions issued yet.</div>
          ) : (
            <div className="space-y-3">
              {prescriptions.map((rx) => (
                <div key={rx._id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900">Patient: {rx.patientId?.fullName}</span>
                    <span className="text-slate-400">{new Date(rx.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="text-emerald-700 font-semibold">{rx.medicines?.length} Medication(s) Prescribed</div>
                  <div className="bg-slate-50 p-3 rounded-xl space-y-1">
                    {rx.medicines?.map((m, i) => (
                      <div key={i} className="flex justify-between text-slate-700">
                        <span><strong>{m.name}</strong> ({m.dosage})</span>
                        <span>{m.frequency}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: LAB ORDERS */}
      {!activeConsultation && activeTab === 'lab-orders' && (
        <div className="space-y-4">
          <h3 className="font-bold text-slate-900 text-lg">Requested Lab Orders ({labOrders.length})</h3>
          {labOrders.length === 0 ? (
            <div className="bg-white p-8 text-center rounded-2xl border text-slate-400 text-xs">No lab tests requested yet.</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {labOrders.map((ord) => (
                <div key={ord._id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900">{ord.testName}</span>
                    <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">{ord.status}</span>
                  </div>
                  <div className="text-slate-500">Patient: {ord.patientId?.fullName}</div>
                  <div className="text-slate-400 font-mono text-[11px]">Barcode: {ord.sampleBarcode || 'Pending collection'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
