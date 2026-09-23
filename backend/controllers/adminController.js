import User from '../models/User.js';
import PatientProfile from '../models/PatientProfile.js';
import DoctorProfile from '../models/DoctorProfile.js';
import ClinicService from '../models/ClinicService.js';
import Appointment from '../models/Appointment.js';
import MedicalRecord from '../models/MedicalRecord.js';
import LabOrder from '../models/LabOrder.js';
import Invoice from '../models/Invoice.js';
import AuditLog from '../models/AuditLog.js';
import { logAudit } from '../middleware/audit.js';

export const getClinicStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [
      totalPatients,
      totalDoctors,
      totalStaff,
      todayAppointments,
      totalAppointments,
      pendingLabOrders,
      invoices,
      recentAuditLogs
    ] = await Promise.all([
      User.countDocuments({ role: 'patient', isActive: true }),
      User.countDocuments({ role: 'doctor', isActive: true }),
      User.countDocuments({ role: { $in: ['receptionist', 'lab_technician', 'admin'] }, isActive: true }),
      Appointment.countDocuments({ date: today }),
      Appointment.countDocuments(),
      LabOrder.countDocuments({ status: { $in: ['ordered', 'sample_collected', 'in_processing'] } }),
      Invoice.find(),
      AuditLog.find().sort({ createdAt: -1 }).limit(10)
    ]);

    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
    const outstandingDues = invoices.reduce((sum, inv) => sum + (inv.balanceDue || 0), 0);

    res.json({
      success: true,
      stats: {
        totalPatients,
        totalDoctors,
        totalStaff,
        todayAppointments,
        totalAppointments,
        pendingLabOrders,
        totalRevenue,
        outstandingDues
      },
      recentActivity: recentAuditLogs
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUsers = async (req, res) => {
  try {
    const { role, search } = req.query;
    let query = {};

    if (role) {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query).sort({ createdAt: -1 });
    
    // Attach doctor/patient profiles
    const enhancedUsers = await Promise.all(
      users.map(async (u) => {
        let profile = null;
        if (u.role === 'patient') {
          profile = await PatientProfile.findOne({ user: u._id });
        } else if (u.role === 'doctor') {
          profile = await DoctorProfile.findOne({ user: u._id });
        }
        return {
          ...u.toObject(),
          profile
        };
      })
    );

    res.json({ success: true, count: enhancedUsers.length, data: enhancedUsers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, isActive, role, doctorProfile, patientProfile } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (isActive !== undefined) user.isActive = isActive;
    if (role) user.role = role;

    await user.save();

    if (user.role === 'doctor' && doctorProfile) {
      await DoctorProfile.findOneAndUpdate({ user: user._id }, doctorProfile, { upsert: true, new: true });
    }

    if (user.role === 'patient' && patientProfile) {
      await PatientProfile.findOneAndUpdate({ user: user._id }, patientProfile, { upsert: true, new: true });
    }

    await logAudit({
      req,
      action: 'USER_UPDATED_BY_ADMIN',
      resourceType: 'User',
      resourceId: user._id,
      details: `Admin updated user ${user.name} (${user.email})`
    });

    res.json({ success: true, message: 'User updated successfully', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getServices = async (req, res) => {
  try {
    const services = await ClinicService.find().sort({ category: 1, name: 1 });
    res.json({ success: true, count: services.length, data: services });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createService = async (req, res) => {
  try {
    const service = await ClinicService.create(req.body);
    
    await logAudit({
      req,
      action: 'SERVICE_CREATED',
      resourceType: 'ClinicService',
      resourceId: service._id,
      details: `Created service ${service.name} (${service.code})`
    });

    res.status(201).json({ success: true, data: service });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateService = async (req, res) => {
  try {
    const service = await ClinicService.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    await logAudit({
      req,
      action: 'SERVICE_UPDATED',
      resourceType: 'ClinicService',
      resourceId: service._id,
      details: `Updated service ${service.name}`
    });

    res.json({ success: true, data: service });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAuditLogs = async (req, res) => {
  try {
    const { action, role, limit = 100 } = req.query;
    let query = {};

    if (action) query.action = { $regex: action, $options: 'i' };
    if (role) query.actorRole = role;

    const logs = await AuditLog.find(query)
      .populate('actor', 'name email role')
      .populate('patientAffected', 'name email')
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
