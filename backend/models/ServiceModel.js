import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  category: {
    type: String,
    enum: ['Consultation', 'Laboratory', 'Radiology', 'Procedure', 'Nursing', 'Pharmacy'],
    default: 'Consultation'
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  taxPercentage: {
    type: Number,
    default: 0
  },
  normalRange: {
    type: String,
    default: ''
  },
  unit: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

export const ServiceModel = mongoose.model('Service', serviceSchema);
