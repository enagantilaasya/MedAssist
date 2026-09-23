import mongoose from 'mongoose';

const medicalNoteSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true // Patient's user id for ownership
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  doctorUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true // Doctor's user id
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  vitals: {
    bloodPressure: { type: String, default: '' },
    heartRate: { type: String, default: '' },
    respiratoryRate: { type: String, default: '' },
    temperature: { type: String, default: '' },
    spO2: { type: String, default: '' },
    weight: { type: String, default: '' },
    height: { type: String, default: '' },
    bmi: { type: String, default: '' }
  },
  symptoms: [{ type: String }],
  clinicalNotes: {
    type: String,
    default: ''
  },
  diagnosis: {
    type: String,
    required: true
  },
  observations: {
    type: String,
    default: ''
  },
  aiSummary: {
    clinicalSynopsis: { type: String, default: '' },
    keyActionItems: [{ type: String }],
    criticalFlags: [{ type: String }]
  }
}, {
  timestamps: true
});

export const MedicalNoteModel = mongoose.model('MedicalNote', medicalNoteSchema);
