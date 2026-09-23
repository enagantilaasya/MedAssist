import mongoose from 'mongoose';

const prescriptionItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { type: String, required: true },
  duration: { type: String, required: true },
  instructions: { type: String, default: '' }
});

const prescriptionSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  doctorUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  medicines: [prescriptionItemSchema],
  instructions: {
    type: String,
    default: ''
  },
  followUpDate: {
    type: Date
  },
  aiExplanation: {
    summary: { type: String, default: '' },
    medicationGuide: [{
      medicine: String,
      purpose: String,
      howToTake: String,
      importantWarnings: String
    }],
    generalTips: [{ type: String }],
    whenToCallDoctor: [{ type: String }]
  }
}, {
  timestamps: true
});

export const PrescriptionModel = mongoose.model('Prescription', prescriptionSchema);
