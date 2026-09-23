import express from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/UserModel.js';
import { PatientModel } from '../models/PatientModel.js';
import { DoctorModel } from '../models/DoctorModel.js';
import { verifyToken } from '../middleware/verifyToken.js';
import { logAudit } from '../middleware/auditLogger.js';

const router = express.Router();

const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || 'medassist_student_super_secret_jwt_key_2026',
    { expiresIn: '7d' }
  );
};

// POST /auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'patient', phone, patientDetails } = req.body;

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email is already registered' });
    }

    const user = await UserModel.create({
      name,
      email,
      password,
      role,
      phone,
      status: 'active'
    });

    let patientProfile = null;
    let doctorProfile = null;

    if (role === 'patient') {
      const count = await PatientModel.countDocuments();
      const patientCode = `PAT-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

      patientProfile = await PatientModel.create({
        userId: user._id,
        patientCode,
        fullName: name,
        phone: phone || '',
        email: email || '',
        dateOfBirth: patientDetails?.dateOfBirth || new Date('1995-01-01'),
        gender: patientDetails?.gender || 'Other',
        bloodGroup: patientDetails?.bloodGroup || 'Unknown',
        address: patientDetails?.address || {},
        emergencyContact: patientDetails?.emergencyContact || {},
        allergies: patientDetails?.allergies || [],
        chronicConditions: patientDetails?.chronicConditions || []
      });
    } else if (role === 'doctor') {
      const { doctorDetails } = req.body;
      doctorProfile = await DoctorModel.create({
        userId: user._id,
        fullName: name,
        specialization: doctorDetails?.specialization || 'General Medicine',
        licenseNumber: doctorDetails?.licenseNumber || `LIC-${Math.floor(10000 + Math.random() * 90000)}`,
        consultationFee: Number(doctorDetails?.consultationFee || 50),
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

    const token = generateToken(user._id, user.role);

    await logAudit({
      req: { userId: user._id, user, role: user.role },
      action: 'USER_REGISTER',
      module: 'AUTH',
      recordId: user._id,
      details: `Registered as ${user.role} (${user.email})`
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        patientProfile,
        doctorProfile
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Support alias for receptionist login
    let emailQuery = email;
    if (email === 'receptionist@medassist.com' || email === 'reception@medassist.com') {
      emailQuery = { $in: ['receptionist@medassist.com', 'reception@medassist.com'] };
    }

    const user = await UserModel.findOne({ email: emailQuery }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact admin.' });
    }

    const token = generateToken(user._id, user.role);

    let profile = null;
    if (user.role === 'patient') {
      profile = await PatientModel.findOne({ userId: user._id });
    } else if (user.role === 'doctor') {
      profile = await DoctorModel.findOne({ userId: user._id });
    }

    await logAudit({
      req: { userId: user._id, user, role: user.role },
      action: 'LOGIN',
      module: 'AUTH',
      recordId: user._id,
      details: `${user.name} logged in (${user.role})`
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      message: 'Login successful',
      token,
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
});

// GET /auth/profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await UserModel.findById(req.userId);
    let profile = null;

    if (user.role === 'patient') {
      profile = await PatientModel.findOne({ userId: user._id });
    } else if (user.role === 'doctor') {
      profile = await DoctorModel.findOne({ userId: user._id }).populate('departmentId');
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        status: user.status,
        profile
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully' });
});

// POST /auth/demo-login (Instant 1-click login for test review)
router.post('/demo-login', async (req, res) => {
  try {
    const { role } = req.body;
    const user = await UserModel.findOne({ role, status: 'active' });

    if (!user) {
      return res.status(404).json({ success: false, message: `No active user found with role: ${role}` });
    }

    const token = generateToken(user._id, user.role);

    let profile = null;
    if (user.role === 'patient') {
      profile = await PatientModel.findOne({ userId: user._id });
    } else if (user.role === 'doctor') {
      profile = await DoctorModel.findOne({ userId: user._id }).populate('departmentId');
    }

    res.json({
      success: true,
      message: `Demo logged in as ${role}`,
      token,
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
});

export default router;
