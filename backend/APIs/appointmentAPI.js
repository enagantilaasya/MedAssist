import express from 'express';
import { AppointmentModel } from '../models/AppointmentModel.js';
import { DoctorModel } from '../models/DoctorModel.js';
import { PatientModel } from '../models/PatientModel.js';
import { UserModel } from '../models/UserModel.js';
import { verifyToken } from '../middleware/verifyToken.js';
import { verifyRole } from '../middleware/verifyRole.js';
import { logAudit } from '../middleware/auditLogger.js';

const router = express.Router();

router.use(verifyToken);

// GET /appointments/all - Strictly filtered by role!
router.get('/all', async (req, res) => {
  try {
    const { date, status, doctorId } = req.query;
    let query = {};

    // 1. DATA OWNERSHIP ENFORCEMENT
    if (req.role === 'patient') {
      // Patient can ONLY see their own appointments
      query.userId = req.userId;
    } else if (req.role === 'doctor') {
      // Doctor can ONLY see their own assigned appointments
      query.doctorUserId = req.userId;
    } else if (req.role === 'lab') {
      // Lab technician cannot view general appointment schedules
      return res.status(403).json({ success: false, message: '403 Forbidden: Lab technicians cannot access appointment schedules' });
    } else if (doctorId) {
      query.doctorId = doctorId;
    }

    if (date) query.appointmentDate = date;
    if (status) query.status = status;

    const appointments = await AppointmentModel.find(query)
      .populate('patientId')
      .populate({
        path: 'doctorId',
        populate: { path: 'userId departmentId' }
      })
      .populate('departmentId')
      .populate('serviceId')
      .sort({ appointmentDate: 1, appointmentTime: 1 });

    res.json({ success: true, count: appointments.length, payload: appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /appointments/queue/today - Receptionist, Doctor, Admin queue view
router.get('/queue/today', verifyRole('receptionist', 'doctor', 'admin'), async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    let query = { appointmentDate: today };

    if (req.role === 'doctor') {
      query.doctorUserId = req.userId;
    }

    const queue = await AppointmentModel.find(query)
      .populate('patientId')
      .populate({ path: 'doctorId', populate: { path: 'userId' } })
      .populate('serviceId')
      .sort({ queueNumber: 1 });

    res.json({ success: true, count: queue.length, payload: queue });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /appointments/:id
router.get('/:id', async (req, res) => {
  try {
    const appointment = await AppointmentModel.findById(req.params.id)
      .populate('patientId')
      .populate({ path: 'doctorId', populate: { path: 'userId' } })
      .populate('serviceId');

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Ownership check: If patient, must be own appointment
    if (req.role === 'patient' && String(appointment.userId) !== String(req.userId)) {
      return res.status(403).json({ success: false, message: '403 Forbidden: Access Denied' });
    }

    // Ownership check: If doctor, must be assigned doctor
    if (req.role === 'doctor' && String(appointment.doctorUserId) !== String(req.userId)) {
      return res.status(403).json({ success: false, message: '403 Forbidden: Not your assigned appointment' });
    }

    res.json({ success: true, payload: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /appointments/add - Receptionist, Admin, Doctor, or Patient (Patient books for themselves)
router.post('/add', verifyRole('receptionist', 'admin', 'patient', 'doctor'), async (req, res) => {
  try {
    const { doctorId, appointmentDate, appointmentTime, reason, departmentId, serviceId } = req.body;
    let { patientId } = req.body;

    if (!doctorId) {
      return res.status(400).json({ success: false, message: 'Please select a doctor for the appointment.' });
    }
    if (!appointmentDate || !appointmentTime) {
      return res.status(400).json({ success: false, message: 'Please select both an appointment date and an available time slot.' });
    }

    // If patient is booking, ensure they only book for their own patient profile
    if (req.role === 'patient') {
      const myPatientProfile = await PatientModel.findOne({ userId: req.userId });
      if (!myPatientProfile) {
        return res.status(400).json({ success: false, message: 'Patient profile not found. Please contact reception.' });
      }
      patientId = myPatientProfile._id;
    } else if (!patientId) {
      return res.status(400).json({ success: false, message: 'Please select a patient to schedule the appointment for.' });
    }

    let patient = null;
    try {
      patient = await PatientModel.findById(patientId) || await PatientModel.findOne({ userId: patientId });
    } catch {
      patient = await PatientModel.findOne({ userId: patientId });
    }

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient record not found. Please select a valid patient.' });
    }

    let doctor = null;
    try {
      doctor = await DoctorModel.findById(doctorId) || await DoctorModel.findOne({ userId: doctorId });
    } catch {
      doctor = await DoctorModel.findOne({ userId: doctorId });
    }

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found. Please select a valid doctor.' });
    }

    // Ensure valid user ObjectIds
    const patientUserId = patient.userId || (await UserModel.findOne({ email: patient.email }))?._id || req.userId;
    const doctorUserId = doctor.userId || (await UserModel.findOne({ email: doctor.email }))?._id;

    // BASIC CONFLICT CHECKING: Doctor should not receive two appointments at the same time
    const existingConflict = await AppointmentModel.findOne({
      doctorId: doctor._id,
      appointmentDate,
      appointmentTime,
      status: { $nin: ['cancelled'] }
    });

    if (existingConflict) {
      return res.status(409).json({
        success: false,
        message: `Conflict Detected: Dr. ${doctor.fullName} already has a confirmed booking for ${appointmentTime} on ${appointmentDate}. Please choose another time slot.`
      });
    }

    // Calculate queue number for the day
    const dayCount = await AppointmentModel.countDocuments({
      doctorId: doctor._id,
      appointmentDate
    });

    const appointment = await AppointmentModel.create({
      patientId: patient._id,
      userId: patientUserId,
      doctorId: doctor._id,
      doctorUserId: doctorUserId,
      departmentId: departmentId || doctor.departmentId || null,
      serviceId: serviceId || null,
      appointmentDate,
      appointmentTime,
      reason: reason || 'General Consultation',
      status: 'scheduled',
      queueNumber: dayCount + 1
    });

    await logAudit({
      req,
      action: 'CREATE_APPOINTMENT',
      module: 'APPOINTMENT',
      recordId: appointment._id,
      details: `Booked appointment for ${patient.fullName} with Dr. ${doctor.fullName} on ${appointmentDate} at ${appointmentTime}`
    });

    const populated = await AppointmentModel.findById(appointment._id)
      .populate('patientId')
      .populate({ path: 'doctorId', populate: { path: 'userId' } });

    res.status(201).json({ success: true, message: 'Appointment booked successfully', payload: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /appointments/update/:id
router.put('/update/:id', verifyRole('receptionist', 'admin', 'doctor'), async (req, res) => {
  try {
    const { status, appointmentDate, appointmentTime, reason } = req.body;

    const appointment = await AppointmentModel.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // If rescheduling, check conflict
    if ((appointmentDate && appointmentDate !== appointment.appointmentDate) ||
        (appointmentTime && appointmentTime !== appointment.appointmentTime)) {
      const conflict = await AppointmentModel.findOne({
        _id: { $ne: appointment._id },
        doctorId: appointment.doctorId,
        appointmentDate: appointmentDate || appointment.appointmentDate,
        appointmentTime: appointmentTime || appointment.appointmentTime,
        status: { $nin: ['cancelled'] }
      });

      if (conflict) {
        return res.status(409).json({ success: false, message: 'Doctor is already booked for this rescheduled slot' });
      }
    }

    if (status) appointment.status = status;
    if (appointmentDate) appointment.appointmentDate = appointmentDate;
    if (appointmentTime) appointment.appointmentTime = appointmentTime;
    if (reason) appointment.reason = reason;

    await appointment.save();

    await logAudit({
      req,
      action: 'UPDATE_APPOINTMENT',
      module: 'APPOINTMENT',
      recordId: appointment._id,
      details: `Appointment status updated to ${status || 'updated'}`
    });

    res.json({ success: true, message: 'Appointment updated successfully', payload: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /appointments/cancel/:id
router.put('/cancel/:id', async (req, res) => {
  try {
    const { cancellationReason } = req.body;
    const appointment = await AppointmentModel.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Ownership check: Patient can cancel their own, Receptionist/Admin can cancel any
    if (req.role === 'patient' && String(appointment.userId) !== String(req.userId)) {
      return res.status(403).json({ success: false, message: '403 Forbidden: Cannot cancel another patient appointment' });
    }

    if (req.role === 'lab') {
      return res.status(403).json({ success: false, message: '403 Forbidden: Access Denied' });
    }

    appointment.status = 'cancelled';
    appointment.cancellationReason = cancellationReason || 'Cancelled by user';
    await appointment.save();

    await logAudit({
      req,
      action: 'CANCEL_APPOINTMENT',
      module: 'APPOINTMENT',
      recordId: appointment._id,
      details: `Cancelled appointment. Reason: ${appointment.cancellationReason}`
    });

    res.json({ success: true, message: 'Appointment cancelled', payload: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
