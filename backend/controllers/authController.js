import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import PatientProfile from '../models/PatientProfile.js';
import DoctorProfile from '../models/DoctorProfile.js';
import { logAudit } from '../middleware/audit.js';

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'medassist_super_secret_jwt_key_2026', {
    expiresIn: '30d'
  });
};

export const register = async (req, res) => {
  try {
    const { name, email, password, role = 'patient', phone, patientDetails, doctorDetails } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      phone
    });

    let extraProfile = null;

    if (role === 'patient') {
      const patientCount = await PatientProfile.countDocuments();
      const patientCode = `PAT-${new Date().getFullYear()}-${String(patientCount + 1).padStart(4, '0')}`;

      extraProfile = await PatientProfile.create({
        user: user._id,
        patientCode,
        dateOfBirth: patientDetails?.dateOfBirth || new Date('1990-01-01'),
        gender: patientDetails?.gender || 'Other',
        bloodGroup: patientDetails?.bloodGroup || 'Unknown',
        address: patientDetails?.address || {},
        emergencyContact: patientDetails?.emergencyContact || {},
        allergies: patientDetails?.allergies || [],
        chronicConditions: patientDetails?.chronicConditions || []
      });
    } else if (role === 'doctor') {
      extraProfile = await DoctorProfile.create({
        user: user._id,
        specialization: doctorDetails?.specialization || 'General Medicine',
        department: doctorDetails?.department || 'Outpatient',
        qualifications: doctorDetails?.qualifications || 'MBBS, MD',
        licenseNumber: doctorDetails?.licenseNumber || `DOC-LIC-${Date.now().toString().slice(-5)}`,
        consultationFee: doctorDetails?.consultationFee || 50,
        roomNumber: doctorDetails?.roomNumber || 'Room 101',
        schedule: doctorDetails?.schedule || [
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
      action: 'USER_REGISTERED',
      resourceType: 'User',
      resourceId: user._id,
      details: `User registered with role ${role} (${user.email})`
    });

    res.status(201).json({
      success: true,
      token: generateToken(user._id, user.role),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profile: extraProfile
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Please contact the administrator.' });
    }

    user.lastLogin = new Date();
    await user.save();

    let profile = null;
    if (user.role === 'patient') {
      profile = await PatientProfile.findOne({ user: user._id });
    } else if (user.role === 'doctor') {
      profile = await DoctorProfile.findOne({ user: user._id });
    }

    req.user = user;
    await logAudit({
      req,
      action: 'USER_LOGIN',
      resourceType: 'User',
      resourceId: user._id,
      details: `${user.name} logged in (${user.role})`
    });

    res.json({
      success: true,
      token: generateToken(user._id, user.role),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profile
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    let profile = null;

    if (user.role === 'patient') {
      profile = await PatientProfile.findOne({ user: user._id });
    } else if (user.role === 'doctor') {
      profile = await DoctorProfile.findOne({ user: user._id });
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profile
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const demoLogin = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findOne({ role, isActive: true });

    if (!user) {
      return res.status(404).json({ success: false, message: `No active demo user found for role ${role}. Please run seed.` });
    }

    user.lastLogin = new Date();
    await user.save();

    let profile = null;
    if (user.role === 'patient') {
      profile = await PatientProfile.findOne({ user: user._id });
    } else if (user.role === 'doctor') {
      profile = await DoctorProfile.findOne({ user: user._id });
    }

    req.user = user;
    await logAudit({
      req,
      action: 'DEMO_LOGIN',
      resourceType: 'User',
      resourceId: user._id,
      details: `Quick Demo Login as ${role} (${user.name})`
    });

    res.json({
      success: true,
      token: generateToken(user._id, user.role),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profile
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
