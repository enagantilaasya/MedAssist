import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  appointmentNumber: {
    type: String,
    required: true,
    unique: true // e.g. "APT-2026-0001"
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
  doctorProfile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DoctorProfile'
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClinicService'
  },
  date: {
    type: String, // "YYYY-MM-DD"
    required: true
  },
  timeSlot: {
    type: String, // "10:00 - 10:30"
    required: true
  },
  tokenNumber: {
    type: Number,
    default: 1
  },
  type: {
    type: String,
    enum: ['Scheduled', 'Walk-in', 'Emergency', 'Follow-up'],
    default: 'Scheduled'
  },
  status: {
    type: String,
    enum: ['scheduled', 'checked_in', 'in_consultation', 'completed', 'cancelled', 'no_show'],
    default: 'scheduled'
  },
  chiefComplaint: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  cancellationReason: {
    type: String,
    default: ''
  },
  checkedInAt: Date,
  consultationStartedAt: Date,
  consultationCompletedAt: Date
}, {
  timestamps: true
});

export default mongoose.model('Appointment', appointmentSchema);
