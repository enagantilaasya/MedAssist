import mongoose from 'mongoose';

const clinicServiceSchema = new mongoose.Schema({
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
    enum: ['Consultation', 'Laboratory', 'Radiology', 'Procedure', 'Nursing', 'Pharmacy', 'Other'],
    default: 'Consultation'
  },
  department: {
    type: String,
    default: 'General'
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
  description: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  normalRange: {
    type: String,
    default: '' // used for lab tests, e.g. "70-99 mg/dL"
  },
  unit: {
    type: String,
    default: '' // e.g. "mg/dL", "x10^3/uL"
  }
}, {
  timestamps: true
});

export default mongoose.model('ClinicService', clinicServiceSchema);
