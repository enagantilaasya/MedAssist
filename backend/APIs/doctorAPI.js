import express from 'express';
import { DoctorModel } from '../models/DoctorModel.js';
import { AppointmentModel } from '../models/AppointmentModel.js';
import { verifyToken } from '../middleware/verifyToken.js';
import { verifyRole } from '../middleware/verifyRole.js';

const router = express.Router();

router.use(verifyToken);

// GET /doctors/all - Available to patient, receptionist, doctor, admin to browse doctors
router.get('/all', async (req, res) => {
  try {
    const doctors = await DoctorModel.find().populate('userId', 'name email phone status').populate('departmentId');
    res.json({ success: true, count: doctors.length, payload: doctors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /doctors/me - Doctor gets own profile
router.get('/me', verifyRole('doctor'), async (req, res) => {
  try {
    const doctor = await DoctorModel.findOne({ userId: req.userId }).populate('departmentId');
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }
    res.json({ success: true, payload: doctor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /doctors/slots/:id - Availability slots for date with conflict detection
router.get('/slots/:id', async (req, res) => {
  try {
    const { id } = req.params; // doctorId (DoctorModel _id or userId)
    const { date } = req.query; // YYYY-MM-DD

    const doctor = await DoctorModel.findById(id) || await DoctorModel.findOne({ userId: id });
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    const standardSlots = [
      '09:00 - 09:30', '09:30 - 10:00', '10:00 - 10:30', '10:30 - 11:00',
      '11:00 - 11:30', '11:30 - 12:00', '14:00 - 14:30', '14:30 - 15:00',
      '15:00 - 15:30', '15:30 - 16:00', '16:00 - 16:30', '16:30 - 17:00'
    ];

    const bookedAppointments = await AppointmentModel.find({
      doctorId: doctor._id,
      appointmentDate: date || new Date().toISOString().split('T')[0],
      status: { $nin: ['cancelled'] }
    });

    const bookedTimes = bookedAppointments.map(a => a.appointmentTime);

    const slots = standardSlots.map(time => ({
      slot: time,
      isAvailable: !bookedTimes.includes(time)
    }));

    const availableSlots = slots.filter(s => s.isAvailable).map(s => s.slot);

    res.json({
      success: true,
      date: date || new Date().toISOString().split('T')[0],
      payload: {
        slots,
        availableSlots
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
