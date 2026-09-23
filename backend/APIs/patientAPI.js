import express from 'express';
import { PatientModel } from '../models/PatientModel.js';
import { UserModel } from '../models/UserModel.js';
import { AppointmentModel } from '../models/AppointmentModel.js';
import { verifyToken } from '../middleware/verifyToken.js';
import { verifyRole } from '../middleware/verifyRole.js';
import { logAudit } from '../middleware/auditLogger.js';

const router = express.Router();

router.use(verifyToken);

// GET /patients/all - Only receptionist, doctor, admin (NEVER patient)
router.get('/all', verifyRole('receptionist', 'doctor', 'admin'), async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    // If doctor, optionally filter to assigned patients or all registered clinic patients
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { patientCode: { $regex: search, $options: 'i' } }
      ];
    }

    const patients = await PatientModel.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: patients.length, payload: patients });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /patients/me - Patient views own profile
router.get('/me', verifyRole('patient'), async (req, res) => {
  try {
    const patient = await PatientModel.findOne({ userId: req.userId });
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient profile not found' });
    }
    res.json({ success: true, payload: patient });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /patients/:id - Doctor, Receptionist, Admin, or Patient (Strict ownership check!)
router.get('/:id', async (req, res) => {
  try {
    const patient = await PatientModel.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    // Ownership check for patient role: Patient can ONLY see their own profile
    if (req.role === 'patient' && String(patient.userId) !== String(req.userId)) {
      return res.status(403).json({ success: false, message: '403 Forbidden: You can only access your own records' });
    }

    // Lab technicians cannot inspect full patient records outside orders
    if (req.role === 'lab') {
      return res.status(403).json({ success: false, message: '403 Forbidden: Access Denied' });
    }

    res.json({ success: true, payload: patient });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /patients/register - Receptionist and Admin register a new patient
router.post('/register', verifyRole('receptionist', 'admin'), async (req, res) => {
  try {
    const { fullName, email, phone, password = 'password123', dateOfBirth, gender, bloodGroup, address, emergencyContact, allergies, chronicConditions } = req.body;

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const user = await UserModel.create({
      name: fullName,
      email,
      password,
      role: 'patient',
      phone,
      status: 'active'
    });

    const count = await PatientModel.countDocuments();
    const patientCode = `PAT-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const patient = await PatientModel.create({
      userId: user._id,
      patientCode,
      fullName,
      email,
      phone,
      dateOfBirth: dateOfBirth || new Date('1990-01-01'),
      gender: gender || 'Other',
      bloodGroup: bloodGroup || 'Unknown',
      address: address || {},
      emergencyContact: emergencyContact || {},
      allergies: allergies || [],
      chronicConditions: chronicConditions || []
    });

    await logAudit({
      req,
      action: 'CREATE_PATIENT',
      module: 'PATIENT',
      recordId: patient._id,
      details: `Registered patient ${fullName} (${patientCode})`
    });

    res.status(201).json({ success: true, message: 'Patient registered successfully', payload: patient });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /patients/update/:id - Update patient profile
router.put('/update/:id', async (req, res) => {
  try {
    const patient = await PatientModel.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    // Ownership check: If patient, must be own ID
    if (req.role === 'patient' && String(patient.userId) !== String(req.userId)) {
      return res.status(403).json({ success: false, message: '403 Forbidden: You can only edit your own details' });
    }

    // Only patient, receptionist, or admin can update demographics
    if (!['patient', 'receptionist', 'admin'].includes(req.role)) {
      return res.status(403).json({ success: false, message: '403 Forbidden: Not authorized to edit patient profile' });
    }

    const updated = await PatientModel.findByIdAndUpdate(req.params.id, req.body, { new: true });

    await logAudit({
      req,
      action: 'UPDATE_PATIENT',
      module: 'PATIENT',
      recordId: patient._id,
      details: `Updated patient ${patient.fullName}`
    });

    res.json({ success: true, message: 'Profile updated', payload: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
