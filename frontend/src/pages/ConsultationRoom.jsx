import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AIClinicalSummaryModal } from '../components/AIClinicalSummaryModal';
import { 
  Stethoscope, 
  Activity, 
  Sparkles, 
  FileText, 
  Pill, 
  FlaskConical, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  ArrowLeft,
  Loader2,
  Clock
} from 'lucide-react';

export const ConsultationRoom = ({ appointment, onBack, onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState([]);
  const [patientTimeline, setPatientTimeline] = useState(null);

  // Vitals State
  const [vitals, setVitals] = useState({
    bloodPressure: '120/80 mmHg',
    heartRate: '72 bpm',
    respiratoryRate: '16 /min',
    temperature: '98.6 F',
    spO2: '99%',
    weight: '70 kg',
    height: '175 cm',
    bmi: '22.9'
  });

  // SOAP Notes State
  const [soapNotes, setSoapNotes] = useState({
    subjective: {
      chiefComplaint: appointment?.chiefComplaint || '',
      historyOfPresentIllness: '',
      symptoms: ['Fatigue', 'Headache']
    },
    objective: {
      physicalExam: 'Chest clear bilaterally. Heart sounds S1/S2 normal without murmur.',
      generalAppearance: 'Alert, oriented, in no acute respiratory distress.',
      systemicExam: 'Abdomen soft, non-tender.'
    },
    assessment: {
      primaryDiagnosis: '',
      secondaryDiagnoses: [],
      clinicalNotes: ''
    },
    plan: {
      treatmentGoals: 'Symptom relief and metabolic stabilization.',
      dietAndLifestyleAdvice: 'Maintain hydration, avoid processed sugars, low sodium diet.',
      followUpInstructions: 'Return in 2 weeks for follow-up review.'
    }
  });

  // AI Summary State
  const [aiSummary, setAiSummary] = useState(null);
  const [showAISummaryModal, setShowAISummaryModal] = useState(false);

  // Medications State
  const [medications, setMedications] = useState([
    {
      medicineName: 'Amoxicillin Trihydrate',
      dosage: '500 mg',
      frequency: 'Three times daily (1-1-1)',
      route: 'Oral',
      timing: 'After Meals',
      duration: '5 Days',
      instructions: 'Complete full course with water'
    }
  ]);

  // Lab Tests Order State
  const [selectedLabTests, setSelectedLabTests] = useState([]);
  const [labPriority, setLabPriority] = useState('Routine');
  const [labSpecimen, setLabSpecimen] = useState('Blood');

  useEffect(() => {
    const init = async () => {
      try {
        const [servicesRes, timelineRes] = await Promise.all([
          api.getServices(),
          appointment?.patient?._id ? api.getPatientTimeline(appointment.patient._id) : Promise.resolve(null)
        ]);

        if (servicesRes.success) setServices(servicesRes.data);
        if (timelineRes && timelineRes.success) setPatientTimeline(timelineRes);
      } catch (err) {
        console.error('Error initializing consult room:', err);
      }
    };
    init();
  }, [appointment]);

  const addMedication = () => {
    setMedications([
      ...medications,
      {
        medicineName: '',
        dosage: '1 Tab',
        frequency: 'Twice daily (1-0-1)',
        route: 'Oral',
        timing: 'After Meals',
        duration: '7 Days',
        instructions: ''
      }
    ]);
  };

  const removeMedication = (index) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const updateMedication = (index, field, value) => {
    const updated = [...medications];
    updated[index][field] = value;
    setMedications(updated);
  };

  const handleLabTestToggle = (service) => {
    const exists = selectedLabTests.find(t => t.testName === service.name);
    if (exists) {
      setSelectedLabTests(selectedLabTests.filter(t => t.testName !== service.name));
    } else {
      setSelectedLabTests([
        ...selectedLabTests,
        {
          testName: service.name,
          testCode: service.code,
          unit: service.unit || '',
          referenceRange: service.normalRange || '',
          flag: 'Pending'
        }
      ]);
    }
  };

  const handleSaveEncounter = async () => {
    if (!soapNotes.assessment.primaryDiagnosis) {
      alert('Please enter a Primary Diagnosis before finalizing the encounter.');
      return;
    }

    setLoading(true);
    try {
      // 1. Create EMR Record
      const emrRes = await api.createMedicalRecord({
        patientId: appointment.patient._id,
        appointmentId: appointment._id,
        vitals,
        soapNotes
      });

      // 2. Create Prescription if medications added
      const validMeds = medications.filter(m => m.medicineName.trim() !== '');
      if (validMeds.length > 0) {
        await api.createPrescription({
          patientId: appointment.patient._id,
          appointmentId: appointment._id,
          medicalRecordId: emrRes.data._id,
          diagnosis: soapNotes.assessment.primaryDiagnosis,
          medications: validMeds,
          generalAdvice: soapNotes.plan.dietAndLifestyleAdvice
        });
      }

      // 3. Create Lab Order if tests selected
      if (selectedLabTests.length > 0) {
        await api.createLabOrder({
          patientId: appointment.patient._id,
          appointmentId: appointment._id,
          tests: selectedLabTests,
          priority: labPriority,
          specimenType: labSpecimen,
          clinicalNotes: `Requisition from Dr. consultation for ${soapNotes.assessment.primaryDiagnosis}`
        });
      }

      alert('Encounter successfully finalized and added to Patient History!');
      if (onComplete) onComplete();
      else if (onBack) onBack();
    } catch (err) {
      alert('Error saving encounter: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const patient = appointment?.patient || {};
  const profile = patientTimeline?.profile || {};

  return (
    <div className="page-body">
      {/* Top Banner Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={onBack} className="btn btn-secondary btn-sm">
          <ArrowLeft size={16} /> Back to Queue
        </button>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowAISummaryModal(true)}
            className="btn btn-ai"
          >
            <Sparkles size={16} /> AI Note Summarizer
          </button>
          <button
            onClick={handleSaveEncounter}
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            Finalize Encounter & Save
          </button>
        </div>
      </div>

      {/* Patient Header Banner */}
      <div className="card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: 'white', border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#bae6fd', textTransform: 'uppercase', fontWeight: 700 }}>
              Active Patient Encounter • Token #{appointment?.tokenNumber || 1}
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '4px 0', color: 'white' }}>
              {patient.name || 'Patient Name'}
            </h2>
            <div style={{ fontSize: '0.85rem', color: '#e0f2fe' }}>
              Code: <strong>{profile.patientCode || 'PAT-CURRENT'}</strong> • Blood Group: <strong>{profile.bloodGroup || 'O+'}</strong> • Gender: <strong>{profile.gender || 'Male'}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {/* Allergies Warning */}
            <div style={{ background: 'rgba(239, 68, 68, 0.25)', border: '1px solid rgba(254, 202, 202, 0.4)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem' }}>
              <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertTriangle size={14} color="#fca5a5" /> Known Allergies:
              </div>
              <div style={{ color: '#fee2e2' }}>
                {(profile.allergies && profile.allergies.length > 0) ? profile.allergies.join(', ') : 'No known drug allergies recorded'}
              </div>
            </div>

            {/* Chronic conditions */}
            <div style={{ background: 'rgba(255, 255, 255, 0.15)', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem' }}>
              <div style={{ fontWeight: 700 }}>Chronic Conditions:</div>
              <div style={{ color: '#e0f2fe' }}>
                {(profile.chronicConditions && profile.chronicConditions.length > 0) ? profile.chronicConditions.join(', ') : 'None documented'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-3" style={{ gridTemplateColumns: '1.8fr 1.2fr', alignItems: 'start' }}>
        {/* Left Column: Vitals & SOAP Notes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Vitals Recording Grid */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Activity size={18} color="#0284c7" /> Clinical Vitals
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Recorded today</span>
            </div>

            <div className="grid-4" style={{ gap: '12px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Blood Pressure</label>
                <input
                  type="text"
                  className="form-control"
                  value={vitals.bloodPressure}
                  onChange={(e) => setVitals({ ...vitals, bloodPressure: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Heart Rate</label>
                <input
                  type="text"
                  className="form-control"
                  value={vitals.heartRate}
                  onChange={(e) => setVitals({ ...vitals, heartRate: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Oxygen (SpO2)</label>
                <input
                  type="text"
                  className="form-control"
                  value={vitals.spO2}
                  onChange={(e) => setVitals({ ...vitals, spO2: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Temperature</label>
                <input
                  type="text"
                  className="form-control"
                  value={vitals.temperature}
                  onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* SOAP Clinical Note Workspace */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <FileText size={18} color="#059669" /> SOAP Clinical Consultation Note
              </div>
              <button onClick={() => setShowAISummaryModal(true)} className="btn btn-ai btn-sm">
                <Sparkles size={14} /> AI Synopsis
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* S: Subjective */}
              <div className="form-group">
                <label className="form-label" style={{ color: '#0284c7', fontWeight: 700 }}>
                  [S] Subjective — Chief Complaint & History of Illness
                </label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Patient stated complaints, onset, duration, severity..."
                  value={soapNotes.subjective.chiefComplaint}
                  onChange={(e) => setSoapNotes({
                    ...soapNotes,
                    subjective: { ...soapNotes.subjective, chiefComplaint: e.target.value }
                  })}
                />
              </div>

              {/* O: Objective */}
              <div className="form-group">
                <label className="form-label" style={{ color: '#059669', fontWeight: 700 }}>
                  [O] Objective — Physical Examination Findings
                </label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="General appearance, auscultation, palpation, systems..."
                  value={soapNotes.objective.physicalExam}
                  onChange={(e) => setSoapNotes({
                    ...soapNotes,
                    objective: { ...soapNotes.objective, physicalExam: e.target.value }
                  })}
                />
              </div>

              {/* A: Assessment */}
              <div className="form-group">
                <label className="form-label" style={{ color: '#d97706', fontWeight: 700 }}>
                  [A] Assessment — Primary Clinical Diagnosis *
                </label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. Acute Bronchitis / Stage 1 Hypertension"
                  value={soapNotes.assessment.primaryDiagnosis}
                  onChange={(e) => setSoapNotes({
                    ...soapNotes,
                    assessment: { ...soapNotes.assessment, primaryDiagnosis: e.target.value }
                  })}
                />
              </div>

              {/* P: Plan */}
              <div className="form-group">
                <label className="form-label" style={{ color: '#9333ea', fontWeight: 700 }}>
                  [P] Plan — Treatment Goals, Advice & Follow-up
                </label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Lifestyle advice, patient counseling, return instructions..."
                  value={soapNotes.plan.dietAndLifestyleAdvice}
                  onChange={(e) => setSoapNotes({
                    ...soapNotes,
                    plan: { ...soapNotes.plan, dietAndLifestyleAdvice: e.target.value }
                  })}
                />
              </div>

              {/* Attached AI Summary Banner if present */}
              {aiSummary && (
                <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#9333ea', fontWeight: 700, fontSize: '0.85rem', marginBottom: '4px' }}>
                    <Sparkles size={14} /> AI Clinical Summary Attached
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#334155' }}>{aiSummary.clinicalSynopsis}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Prescriptions & Lab Requisitions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Prescription Writer */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Pill size={18} color="#059669" /> Issue Prescription (Rx)
              </div>
              <button onClick={addMedication} className="btn btn-teal btn-sm">
                <Plus size={14} /> Add Medicine
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {medications.map((med, index) => (
                <div key={index} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>Medication #{index + 1}</span>
                    {medications.length > 1 && (
                      <button onClick={() => removeMedication(index)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Medicine name (e.g. Paracetamol 500mg)"
                      value={med.medicineName}
                      onChange={(e) => updateMedication(index, 'medicineName', e.target.value)}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Frequency (e.g. 1-0-1)"
                        value={med.frequency}
                        onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                      />
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Duration (e.g. 5 Days)"
                        value={med.duration}
                        onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                      />
                    </div>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Timing (e.g. After Meals)"
                      value={med.timing}
                      onChange={(e) => updateMedication(index, 'timing', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lab Test Order Requester */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <FlaskConical size={18} color="#0d9488" /> Order Diagnostic Lab Tests
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
              <select
                className="form-control"
                value={labPriority}
                onChange={(e) => setLabPriority(e.target.value)}
                style={{ fontSize: '0.85rem' }}
              >
                <option value="Routine">Routine Priority</option>
                <option value="Urgent">Urgent Priority</option>
                <option value="STAT">STAT Emergency</option>
              </select>

              <select
                className="form-control"
                value={labSpecimen}
                onChange={(e) => setLabSpecimen(e.target.value)}
                style={{ fontSize: '0.85rem' }}
              >
                <option value="Blood">Blood</option>
                <option value="Urine">Urine</option>
                <option value="Swab">Throat / Nasal Swab</option>
                <option value="Sputum">Sputum</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
              {services.filter(s => s.category === 'Laboratory').map((srv) => {
                const isChecked = !!selectedLabTests.find(t => t.testName === srv.name);
                return (
                  <label
                    key={srv._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: isChecked ? '#f0fdfa' : '#ffffff',
                      border: isChecked ? '1px solid #99f6e4' : '1px solid #e2e8f0',
                      cursor: 'pointer',
                      fontSize: '0.82rem'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleLabTestToggle(srv)}
                    />
                    <span style={{ fontWeight: isChecked ? 700 : 500, color: isChecked ? '#0f766e' : '#334155' }}>
                      {srv.name}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* AI Clinical Note Summarizer Modal */}
      <AIClinicalSummaryModal
        isOpen={showAISummaryModal}
        onClose={() => setShowAISummaryModal(false)}
        noteData={{
          patientName: patient.name,
          vitals,
          soapNotes,
          diagnosis: soapNotes.assessment.primaryDiagnosis
        }}
        onApply={(summary) => {
          setAiSummary(summary);
        }}
      />
    </div>
  );
};
