import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  fullName: {
    type: String,
    required: true
  },
  specialization: {
    type: String,
    required: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  licenseNumber: {
    type: String,
    required: true
  },
  consultationFee: {
    type: Number,
    default: 50
  },
  roomNumber: {
    type: String,
    default: 'Room 101'
  },
  schedule: [{
    dayOfWeek: String, // 'Monday', 'Tuesday', ...
    startTime: String, // '09:00'
    endTime: String,   // '17:00'
    slotDurationMinutes: { type: Number, default: 30 },
    isAvailable: { type: Boolean, default: true }
  }]
}, {
  timestamps: true
});

export const DoctorModel = mongoose.model('Doctor', doctorSchema);
