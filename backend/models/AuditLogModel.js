import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  userName: {
    type: String,
    default: 'System'
  },
  role: {
    type: String,
    default: 'system'
  },
  action: {
    type: String,
    required: true
  },
  module: {
    type: String,
    required: true
  },
  recordId: {
    type: String,
    default: ''
  },
  details: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

export const AuditLogModel = mongoose.model('AuditLog', auditLogSchema);
