import mongoose from 'mongoose';

const labResultSchema = new mongoose.Schema({
  labOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LabOrder',
    required: true
  },
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
  technicianId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  testName: {
    type: String,
    required: true
  },
  result: {
    type: String,
    required: true
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
    enum: ['Normal', 'High', 'Low', 'Critical'],
    default: 'Normal'
  },
  remarks: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'released'],
    default: 'pending'
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date
}, {
  timestamps: true
});

export const LabResultModel = mongoose.model('LabResult', labResultSchema);
