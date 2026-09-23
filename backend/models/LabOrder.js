import mongoose from 'mongoose';

const labTestResultSchema = new mongoose.Schema({
  testName: {
    type: String,
    required: true
  },
  testCode: {
    type: String,
    default: ''
  },
  resultValue: {
    type: String,
    default: ''
  },
  unit: {
    type: String,
    default: ''
  },
  referenceRange: {
    type: String,
    default: ''
  },
  flag: {
    type: String,
    enum: ['Normal', 'High', 'Low', 'Abnormal', 'Critical', 'Pending'],
    default: 'Pending'
  },
  notes: {
    type: String,
    default: ''
  }
});

const labOrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true // e.g. "LAB-2026-0001"
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
  tests: [labTestResultSchema],
  clinicalNotes: {
    type: String,
    default: ''
  },
  priority: {
    type: String,
    enum: ['Routine', 'Urgent', 'STAT'],
    default: 'Routine'
  },
  specimenType: {
    type: String,
    default: 'Blood' // Blood, Urine, Sputum, Swab, Tissue, Stool
  },
  sampleBarcode: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['ordered', 'sample_collected', 'in_processing', 'completed', 'verified', 'cancelled'],
    default: 'ordered'
  },
  sampleCollectedAt: Date,
  sampleCollectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processingStartedAt: Date,
  completedAt: Date,
  verifiedAt: Date,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  technicianNotes: {
    type: String,
    default: ''
  },
  isReleasedToPatient: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

export default mongoose.model('LabOrder', labOrderSchema);
