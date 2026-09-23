import express from 'express';
import { UserModel } from '../models/UserModel.js';
import { DoctorModel } from '../models/DoctorModel.js';
import { PatientModel } from '../models/PatientModel.js';
import { DepartmentModel } from '../models/DepartmentModel.js';
import { ServiceModel } from '../models/ServiceModel.js';
import { AppointmentModel } from '../models/AppointmentModel.js';
import { InvoiceModel } from '../models/InvoiceModel.js';
import { LabOrderModel } from '../models/LabOrderModel.js';
import { AuditLogModel } from '../models/AuditLogModel.js';
import { verifyToken } from '../middleware/verifyToken.js';
import { verifyRole } from '../middleware/verifyRole.js';
import { logAudit } from '../middleware/auditLogger.js';

const router = express.Router();

router.use(verifyToken);
router.use(verifyRole('admin')); // STRICT ADMIN ROLE GUARD

// GET /admin/stats - Clinic overview analytics
router.get('/stats', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [
      totalPatients,
      totalDoctors,
      totalReceptionists,
      totalLabTechs,
      todayAppointments,
      totalAppointments,
      pendingLabOrders,
      invoices
    ] = await Promise.all([
      PatientModel.countDocuments(),
      DoctorModel.countDocuments(),
      UserModel.countDocuments({ role: 'receptionist', status: 'active' }),
      UserModel.countDocuments({ role: 'lab', status: 'active' }),
      AppointmentModel.countDocuments({ appointmentDate: today }),
      AppointmentModel.countDocuments(),
      LabOrderModel.countDocuments({ status: { $in: ['ordered', 'sample_pending', 'sample_collected', 'processing'] } }),
      InvoiceModel.find()
    ]);

    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
    const pendingDues = invoices.reduce((sum, inv) => sum + (inv.balanceDue || 0), 0);

    res.json({
      success: true,
      stats: {
        totalPatients,
        totalDoctors,
        totalStaff: totalReceptionists + totalLabTechs,
        todayAppointments,
        totalAppointments,
        pendingLabOrders,
        totalRevenue,
        pendingDues
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /admin/users - User directory
router.get('/users', async (req, res) => {
  try {
    const { role } = req.query;
    let query = {};
    if (role) query.role = role;

    const users = await UserModel.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, payload: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /admin/add-staff - Admin adds doctor, receptionist, or lab technician
router.post('/add-staff', async (req, res) => {
  try {
    const { name, email, password = 'password123', role, phone, doctorDetails } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Staff name and email address are required' });
    }

    if (!['doctor', 'receptionist', 'lab', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid staff role specified. Allowed: doctor, receptionist, lab, admin' });
    }

    if (password && password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: `An account with email ${email} already exists` });
    }

    const user = await UserModel.create({
      name,
      email,
      password: password || 'password123',
      role,
      phone: phone || '',
      status: 'active'
    });

    let doctorProfile = null;
    if (role === 'doctor') {
      doctorProfile = await DoctorModel.create({
        userId: user._id,
        fullName: name,
        specialization: doctorDetails?.specialization || 'General Medicine',
        departmentId: doctorDetails?.departmentId || null,
        licenseNumber: doctorDetails?.licenseNumber || `LIC-${Math.floor(10000 + Math.random() * 90000)}`,
        consultationFee: Number(doctorDetails?.consultationFee || 500),
        roomNumber: doctorDetails?.roomNumber || 'Room 101',
        schedule: [
          { dayOfWeek: 'Monday', startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30, isAvailable: true },
          { dayOfWeek: 'Tuesday', startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30, isAvailable: true },
          { dayOfWeek: 'Wednesday', startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30, isAvailable: true },
          { dayOfWeek: 'Thursday', startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30, isAvailable: true },
          { dayOfWeek: 'Friday', startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30, isAvailable: true }
        ]
      });
    }

    await logAudit({
      req,
      action: 'ADD_STAFF_USER',
      module: 'ADMIN',
      recordId: user._id,
      details: `Admin added staff ${name} as ${role}`
    });

    res.status(201).json({
      success: true,
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully`,
      payload: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        status: user.status,
        createdAt: user.createdAt,
        doctorProfile
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /admin/toggle-user/:id - Activate or deactivate user
router.put('/toggle-user/:id', async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.status = user.status === 'active' ? 'inactive' : 'active';
    await user.save();

    await logAudit({
      req,
      action: 'TOGGLE_USER_STATUS',
      module: 'ADMIN',
      recordId: user._id,
      details: `Changed ${user.name} status to ${user.status}`
    });

    res.json({ success: true, message: `User status changed to ${user.status}`, payload: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /admin/departments & POST /admin/departments
router.get('/departments', async (req, res) => {
  try {
    const departments = await DepartmentModel.find().sort({ name: 1 });
    res.json({ success: true, payload: departments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/departments', async (req, res) => {
  try {
    const department = await DepartmentModel.create(req.body);
    res.status(201).json({ success: true, payload: department });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /admin/services & POST /admin/services
router.get('/services', async (req, res) => {
  try {
    const services = await ServiceModel.find().populate('departmentId').sort({ category: 1, name: 1 });
    res.json({ success: true, payload: services });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/services', async (req, res) => {
  try {
    const service = await ServiceModel.create(req.body);
    res.status(201).json({ success: true, payload: service });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /admin/audit-logs - View immutable audit logs
router.get('/audit-logs', async (req, res) => {
  try {
    const logs = await AuditLogModel.find().sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, count: logs.length, payload: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
