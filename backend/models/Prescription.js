import mongoose from 'mongoose';

const prescriptionItemSchema = new mongoose.Schema({
  medicineName: {
    type: String,
    required: true
  },
  dosage: {
    type: String,
    required: true // e.g. "500 mg"
  },
  frequency: {
    type: String,
    required: true // e.g. "Twice daily (1-0-1)", "Once daily in morning"
  },
  route: {
    type: String,
    default: 'Oral' // Oral, Topical, Inhalation, Injection
  },
  timing: {
    type: String,
    default: 'After Meals' // After Meals, Before Meals, With Food, At Bedtime
  },
  duration: {
    type: String,
    required: true // e.g. "7 Days", "30 Days"
  },
  instructions: {
    type: String,
    default: ''
  }
});

const prescriptionSchema = new mongoose.Schema({
  prescriptionNumber: {
    type: String,
    required: true,
    unique: true // e.g. "RX-2026-0001"
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
  medicalRecord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MedicalRecord'
  },
  diagnosis: {
    type: String,
    default: ''
  },
  medications: [prescriptionItemSchema],
  generalAdvice: {
    type: String,
    default: ''
  },
  aiPlainLanguageExplanation: {
    summary: { type: String, default: '' },
    medicationGuide: [{
      medicine: String,
      purpose: String,
      howToTake: String,
      importantWarnings: String
    }],
    generalTips: [{ type: String }],
    whenToCallDoctor: [{ type: String }],
    generatedAt: { type: Date }
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'discontinued'],
    default: 'active'
  }
}, {
  timestamps: true
});

export default mongoose.model('Prescription', prescriptionSchema);
