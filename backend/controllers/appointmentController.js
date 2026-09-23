import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import PatientProfile from '../models/PatientProfile.js';
import DoctorProfile from '../models/DoctorProfile.js';
import ClinicService from '../models/ClinicService.js';
import { logAudit } from '../middleware/audit.js';

export const getAppointments = async (req, res) => {
  try {
    const { date, status, doctorId, patientId } = req.query;
    let query = {};

    if (req.user.role === 'patient') {
      query.patient = req.user._id;
    } else if (req.user.role === 'doctor') {
      query.doctor = req.user._id;
    } else if (doctorId) {
      query.doctor = doctorId;
    }

    if (patientId && req.user.role !== 'patient') {
      query.patient = patientId;
    }

    if (date) {
      query.date = date;
    }

    if (status) {
      query.status = status;
    }

    const appointments = await Appointment.find(query)
      .populate('patient', 'name email phone avatar')
      .populate('patientProfile')
      .populate('doctor', 'name email phone')
      .populate('doctorProfile')
      .populate('service')
      .sort({ date: 1, timeSlot: 1 });

    res.json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTodayQueue = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    let query = { date: today };

    if (req.user.role === 'doctor') {
      query.doctor = req.user._id;
    }

    const appointments = await Appointment.find(query)
      .populate('patient', 'name email phone avatar')
      .populate('patientProfile')
      .populate('doctor', 'name email phone')
      .populate('doctorProfile')
      .populate('service')
      .sort({ tokenNumber: 1, timeSlot: 1 });

    res.json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createAppointment = async (req, res) => {
  try {
    const {
      patientId,
      doctorId,
      serviceId,
      date,
      timeSlot,
      type = 'Scheduled',
      chiefComplaint = '',
      notes = ''
    } = req.body;

    // Determine actual patient ID
    const actualPatientId = req.user.role === 'patient' ? req.user._id : (patientId || req.user._id);

    // Conflict detection: verify doctor is not already booked for this slot on this date
    const existingBooking = await Appointment.findOne({
      doctor: doctorId,
      date,
      timeSlot,
      status: { $nin: ['cancelled', 'no_show'] }
    });

    if (existingBooking) {
      return res.status(409).json({
        success: false,
        message: `Doctor already has an appointment booked for ${timeSlot} on ${date}. Please select another time slot.`
      });
    }

    // Generate appointment number
    const count = await Appointment.countDocuments();
    const appointmentNumber = `APT-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    // Calculate today's token number for the doctor
    const todayTokens = await Appointment.countDocuments({ doctor: doctorId, date });
    const tokenNumber = todayTokens + 1;

    const patientProfile = await PatientProfile.findOne({ user: actualPatientId });
    const doctorProfile = await DoctorProfile.findOne({ user: doctorId });

    const appointment = await Appointment.create({
      appointmentNumber,
      patient: actualPatientId,
      patientProfile: patientProfile?._id,
      doctor: doctorId,
      doctorProfile: doctorProfile?._id,
      service: serviceId || null,
      date,
      timeSlot,
      tokenNumber,
      type,
      status: 'scheduled',
      chiefComplaint,
      notes
    });

    await logAudit({
      req,
      action: 'APPOINTMENT_CREATED',
      resourceType: 'Appointment',
      resourceId: appointment._id,
      patientAffected: actualPatientId,
      details: `Appointment ${appointmentNumber} booked for ${date} at ${timeSlot}`
    });

    const populated = await Appointment.findById(appointment._id)
      .populate('patient', 'name email phone')
      .populate('patientProfile')
      .populate('doctor', 'name email phone')
      .populate('doctorProfile')
      .populate('service');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, cancellationReason, timeSlot, date } = req.body;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (status) {
      appointment.status = status;
      if (status === 'checked_in') appointment.checkedInAt = new Date();
      if (status === 'in_consultation') appointment.consultationStartedAt = new Date();
      if (status === 'completed') appointment.consultationCompletedAt = new Date();
      if (status === 'cancelled' && cancellationReason) appointment.cancellationReason = cancellationReason;
    }

    if (date) appointment.date = date;
    if (timeSlot) appointment.timeSlot = timeSlot;

    await appointment.save();

    await logAudit({
      req,
      action: `APPOINTMENT_${status?.toUpperCase() || 'UPDATED'}`,
      resourceType: 'Appointment',
      resourceId: appointment._id,
      patientAffected: appointment.patient,
      details: `Status updated to ${status}`
    });

    const updated = await Appointment.findById(id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email phone')
      .populate('service');

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDoctorSlots = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query; // YYYY-MM-DD

    const doctorProfile = await DoctorProfile.findOne({ user: doctorId });
    if (!doctorProfile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    // Default slots
    const standardSlots = [
      '09:00 - 09:30', '09:30 - 10:00', '10:00 - 10:30', '10:30 - 11:00',
      '11:00 - 11:30', '11:30 - 12:00', '14:00 - 14:30', '14:30 - 15:00',
      '15:00 - 15:30', '15:30 - 16:00', '16:00 - 16:30', '16:30 - 17:00'
    ];

    // Find already booked slots on that date
    const bookedAppointments = await Appointment.find({
      doctor: doctorId,
      date: date || new Date().toISOString().split('T')[0],
      status: { $nin: ['cancelled', 'no_show'] }
    });

    const bookedSlots = bookedAppointments.map(a => a.timeSlot);

    const availableSlots = standardSlots.map(slot => ({
      slot,
      isAvailable: !bookedSlots.includes(slot)
    }));

    res.json({ success: true, date: date || new Date().toISOString().split('T')[0], data: availableSlots });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
