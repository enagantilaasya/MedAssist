import { AuditLogModel } from '../models/AuditLogModel.js';

export const logAudit = async ({ req, action, module, recordId = '', details = '' }) => {
  try {
    await AuditLogModel.create({
      userId: req?.userId || null,
      userName: req?.user?.name || 'System',
      role: req?.role || 'system',
      action,
      module,
      recordId: String(recordId),
      details
    });
  } catch (error) {
    console.error('Audit logging error:', error.message);
  }
};
