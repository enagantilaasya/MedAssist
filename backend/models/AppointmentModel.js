import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true // Patient's user account for direct ownership checks
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  doctorUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true // Doctor's user account for direct ownership checks
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  },
  appointmentDate: {
    type: String, // "YYYY-MM-DD"
    required: true
  },
  appointmentTime: {
    type: String, // e.g. "09:30 - 10:00"
    required: true
  },
  reason: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'waiting', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  queueNumber: {
    type: Number,
    default: 1
  },
  cancellationReason: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

export const AppointmentModel = mongoose.model('Appointment', appointmentSchema);
