import mongoose from 'mongoose';

const patientProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  patientCode: {
    type: String,
    required: true,
    unique: true // e.g. "PAT-2026-001"
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
    default: 'Unknown'
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  allergies: [{
    type: String
  }],
  chronicConditions: [{
    type: String
  }],
  insuranceDetails: {
    provider: String,
    policyNumber: String,
    validUntil: Date
  }
}, {
  timestamps: true
});

export default mongoose.model('PatientProfile', patientProfileSchema);
