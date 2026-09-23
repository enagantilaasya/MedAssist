import mongoose from 'mongoose';

const labOrderSchema = new mongoose.Schema({
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
  testName: {
    type: String,
    required: true
  },
  testCode: {
    type: String,
    default: ''
  },
  instructions: {
    type: String,
    default: ''
  },
  specimenType: {
    type: String,
    default: 'Blood'
  },
  sampleBarcode: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: [
      'ordered',
      'sample_pending',
      'sample_collected',
      'processing',
      'completed',
      'verified',
      'released'
    ],
    default: 'ordered'
  },
  orderedAt: {
    type: Date,
    default: Date.now
  },
  sampleCollectedAt: Date,
  sampleCollectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

export const LabOrderModel = mongoose.model('LabOrder', labOrderSchema);
