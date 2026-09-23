import AuditLog from '../models/AuditLog.js';

export const logAudit = async ({
  req,
  action,
  resourceType,
  resourceId = '',
  patientAffected = null,
  patientName = '',
  details = ''
}) => {
  try {
    const actor = req?.user?._id || null;
    const actorName = req?.user?.name || 'System';
    const actorRole = req?.user?.role || 'system';
    const ipAddress = req?.ip || req?.connection?.remoteAddress || '127.0.0.1';
    const userAgent = req?.headers ? req.headers['user-agent'] : '';

    await AuditLog.create({
      actor,
      actorName,
      actorRole,
      action,
      resourceType,
      resourceId: String(resourceId),
      patientAffected,
      patientName,
      details,
      ipAddress,
      userAgent
    });
  } catch (error) {
    console.error('Audit log creation failed:', error.message);
  }
};
