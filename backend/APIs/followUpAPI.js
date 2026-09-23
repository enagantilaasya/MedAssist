import express from 'express';
import { FollowUpModel } from '../models/FollowUpModel.js';
import { AppointmentModel } from '../models/AppointmentModel.js';
import { DoctorModel } from '../models/DoctorModel.js';
import { PatientModel } from '../models/PatientModel.js';
import { verifyToken } from '../middleware/verifyToken.js';
import { verifyRole } from '../middleware/verifyRole.js';
import { logAudit } from '../middleware/auditLogger.js';

const router = express.Router();

router.use(verifyToken);

// POST /follow-ups/add - Doctor schedules follow-up
router.post('/add', verifyRole('doctor'), async (req, res) => {
  try {
    const { appointmentId, followUpDate, instructions } = req.body;

    const appointment = await AppointmentModel.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (String(appointment.doctorUserId) !== String(req.userId)) {
      return res.status(403).json({ success: false, message: '403 Forbidden: Not your assigned appointment' });
    }

    const doctor = await DoctorModel.findOne({ userId: req.userId });

    const followUp = await FollowUpModel.create({
      patientId: appointment.patientId,
      userId: appointment.userId,
      doctorId: doctor._id,
      doctorUserId: req.userId,
      appointmentId: appointment._id,
      followUpDate,
      instructions
    });

    await logAudit({
      req,
      action: 'CREATE_FOLLOW_UP',
      module: 'FOLLOW_UP',
      recordId: followUp._id,
      details: `Scheduled follow-up on ${new Date(followUpDate).toLocaleDateString()}`
    });

    res.status(201).json({ success: true, message: 'Follow-up scheduled', payload: followUp });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /follow-ups/all - Filtered by role & ownership
router.get('/all', async (req, res) => {
  try {
    let query = {};

    if (req.role === 'patient') {
      // Patient sees only their own follow-ups
      query.userId = req.userId;
    } else if (req.role === 'doctor') {
      query.doctorUserId = req.userId;
    } else if (req.role === 'receptionist' || req.role === 'admin') {
      // Front desk can view upcoming follow-ups to assist booking
    } else {
      return res.status(403).json({ success: false, message: '403 Forbidden: Access Denied' });
    }

    const followUps = await FollowUpModel.find(query)
      .populate('patientId')
      .populate({ path: 'doctorId', populate: { path: 'userId' } })
      .sort({ followUpDate: 1 });

    res.json({ success: true, count: followUps.length, payload: followUps });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
