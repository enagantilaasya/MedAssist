import express from 'express';
import { PrescriptionModel } from '../models/PrescriptionModel.js';
import { AppointmentModel } from '../models/AppointmentModel.js';
import { DoctorModel } from '../models/DoctorModel.js';
import { PatientModel } from '../models/PatientModel.js';
import { verifyToken } from '../middleware/verifyToken.js';
import { verifyRole } from '../middleware/verifyRole.js';
import { logAudit } from '../middleware/auditLogger.js';
import { generatePatientPlainLanguageGuide } from '../services/aiService.js';

const router = express.Router();

router.use(verifyToken);

// POST /prescriptions/add - ONLY DOCTORS CAN ISSUE PRESCRIPTIONS
router.post('/add', verifyRole('doctor'), async (req, res) => {
  try {
    const { appointmentId, medicines, instructions, followUpDate } = req.body;

    const appointment = await AppointmentModel.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (String(appointment.doctorUserId) !== String(req.userId)) {
      return res.status(403).json({ success: false, message: '403 Forbidden: You are not the assigned doctor for this encounter' });
    }

    const doctor = await DoctorModel.findOne({ userId: req.userId });
    const patient = await PatientModel.findById(appointment.patientId);

    // Generate AI Plain-Language Guide automatically
    const aiExplanation = await generatePatientPlainLanguageGuide({
      patientName: patient?.fullName,
      diagnosis: appointment.reason || 'Medical consultation',
      medications: medicines.map(m => ({ medicineName: m.name, dosage: m.dosage, frequency: m.frequency, timing: m.instructions || 'After meals', duration: m.duration })),
      generalAdvice: instructions
    });

    const prescription = await PrescriptionModel.create({
      patientId: appointment.patientId,
      userId: appointment.userId,
      doctorId: doctor._id,
      doctorUserId: req.userId,
      appointmentId: appointment._id,
      medicines,
      instructions: instructions || '',
      followUpDate: followUpDate || null,
      aiExplanation
    });

    await logAudit({
      req,
      action: 'CREATE_PRESCRIPTION',
      module: 'PRESCRIPTION',
      recordId: prescription._id,
      details: `Prescription issued with ${medicines.length} medicine(s) for ${patient?.fullName}`
    });

    const populated = await PrescriptionModel.findById(prescription._id)
      .populate('patientId')
      .populate({ path: 'doctorId', populate: { path: 'userId' } });

    res.status(201).json({ success: true, message: 'Prescription created', payload: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /prescriptions/all - Filtered strictly by role
router.get('/all', async (req, res) => {
  try {
    let query = {};

    if (req.role === 'patient') {
      // Patient sees only their own prescriptions
      query.userId = req.userId;
    } else if (req.role === 'doctor') {
      // Doctor sees prescriptions they issued
      query.doctorUserId = req.userId;
    } else if (req.role === 'admin') {
      // Admin audit view
    } else {
      return res.status(403).json({ success: false, message: '403 Forbidden: Access Denied to prescriptions' });
    }

    const prescriptions = await PrescriptionModel.find(query)
      .populate('patientId')
      .populate({ path: 'doctorId', populate: { path: 'userId' } })
      .sort({ createdAt: -1 });

    res.json({ success: true, count: prescriptions.length, payload: prescriptions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /prescriptions/explain/:id - AI Plain Language Explanation
router.post('/explain/:id', async (req, res) => {
  try {
    const rx = await PrescriptionModel.findById(req.params.id).populate('patientId');
    if (!rx) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }

    // Ownership check
    if (req.role === 'patient' && String(rx.userId) !== String(req.userId)) {
      return res.status(403).json({ success: false, message: '403 Forbidden: Access Denied' });
    }

    const aiGuide = await generatePatientPlainLanguageGuide({
      patientName: rx.patientId?.fullName,
      diagnosis: 'Doctor consultation',
      medications: rx.medicines.map(m => ({ medicineName: m.name, dosage: m.dosage, frequency: m.frequency, timing: m.instructions || 'After meals', duration: m.duration })),
      generalAdvice: rx.instructions
    });

    rx.aiExplanation = aiGuide;
    await rx.save();

    res.json({ success: true, payload: aiGuide });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
