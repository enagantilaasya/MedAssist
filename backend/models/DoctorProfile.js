import mongoose from 'mongoose';

const doctorProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  specialization: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  qualifications: {
    type: String,
    default: 'MBBS, MD'
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
  bio: {
    type: String,
    default: ''
  },
  schedule: [{
    dayOfWeek: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true
    },
    startTime: {
      type: String, // e.g. "09:00"
      default: "09:00"
    },
    endTime: {
      type: String, // e.g. "17:00"
      default: "17:00"
    },
    slotDurationMinutes: {
      type: Number,
      default: 30
    },
    isAvailable: {
      type: Boolean,
      default: true
    }
  }]
}, {
  timestamps: true
});

export default mongoose.model('DoctorProfile', doctorProfileSchema);
