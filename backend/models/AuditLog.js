import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  actorName: {
    type: String,
    default: 'System'
  },
  actorRole: {
    type: String,
    default: 'system'
  },
  action: {
    type: String,
    required: true // e.g. "AUTH_LOGIN", "EMR_CREATE", "PRESCRIPTION_ISSUED", "LAB_VERIFY", "BILL_PAID"
  },
  resourceType: {
    type: String,
    required: true // e.g. "User", "Appointment", "MedicalRecord", "Prescription", "LabOrder", "Invoice"
  },
  resourceId: {
    type: String,
    default: ''
  },
  patientAffected: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  patientName: {
    type: String,
    default: ''
  },
  details: {
    type: String,
    default: ''
  },
  ipAddress: {
    type: String,
    default: '127.0.0.1'
  },
  userAgent: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

export default mongoose.model('AuditLog', auditLogSchema);
