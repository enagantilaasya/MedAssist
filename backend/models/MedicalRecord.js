import mongoose from 'mongoose';

const medicalRecordSchema = new mongoose.Schema({
  recordNumber: {
    type: String,
    required: true,
    unique: true // e.g. "EMR-2026-0001"
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  patientProfile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PatientProfile'
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  encounterDate: {
    type: Date,
    default: Date.now
  },
  vitals: {
    bloodPressure: { type: String, default: '' }, // e.g. "120/80 mmHg"
    heartRate: { type: String, default: '' },      // e.g. "72 bpm"
    respiratoryRate: { type: String, default: '' },// e.g. "16 /min"
    temperature: { type: String, default: '' },    // e.g. "98.6 F"
    spO2: { type: String, default: '' },           // e.g. "99%"
    weight: { type: String, default: '' },         // e.g. "70 kg"
    height: { type: String, default: '' },         // e.g. "175 cm"
    bmi: { type: String, default: '' }
  },
  soapNotes: {
    subjective: {
      chiefComplaint: { type: String, default: '' },
      historyOfPresentIllness: { type: String, default: '' },
      symptoms: [{ type: String }]
    },
    objective: {
      physicalExam: { type: String, default: '' },
      generalAppearance: { type: String, default: '' },
      systemicExam: { type: String, default: '' }
    },
    assessment: {
      primaryDiagnosis: { type: String, required: true },
      secondaryDiagnoses: [{ type: String }],
      clinicalNotes: { type: String, default: '' }
    },
    plan: {
      treatmentGoals: { type: String, default: '' },
      dietAndLifestyleAdvice: { type: String, default: '' },
      followUpDate: { type: Date },
      followUpInstructions: { type: String, default: '' }
    }
  },
  aiSummary: {
    clinicalSynopsis: { type: String, default: '' },
    keyActionItems: [{ type: String }],
    criticalFlags: [{ type: String }],
    generatedAt: { type: Date }
  },
  attachments: [{
    fileName: String,
    fileUrl: String,
    uploadedAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

export default mongoose.model('MedicalRecord', medicalRecordSchema);
