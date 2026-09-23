import express from 'express';
import { MedicalNoteModel } from '../models/MedicalNoteModel.js';
import { AppointmentModel } from '../models/AppointmentModel.js';
import { PatientModel } from '../models/PatientModel.js';
import { DoctorModel } from '../models/DoctorModel.js';
import { PrescriptionModel } from '../models/PrescriptionModel.js';
import { LabOrderModel } from '../models/LabOrderModel.js';
import { LabResultModel } from '../models/LabResultModel.js';
import { InvoiceModel } from '../models/InvoiceModel.js';
import { FollowUpModel } from '../models/FollowUpModel.js';
import { verifyToken } from '../middleware/verifyToken.js';
import { verifyRole } from '../middleware/verifyRole.js';
import { logAudit } from '../middleware/auditLogger.js';

const router = express.Router();

router.use(verifyToken);

// POST /medical/add-note - ONLY DOCTORS CAN CREATE MEDICAL NOTES
router.post('/add-note', verifyRole('doctor'), async (req, res) => {
  try {
    const { appointmentId, symptoms, clinicalNotes, diagnosis, observations, vitals, aiSummary } = req.body;

    const appointment = await AppointmentModel.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Associated appointment not found' });
    }

    // Ownership check: Doctor must be the assigned doctor for this appointment
    if (String(appointment.doctorUserId) !== String(req.userId)) {
      return res.status(403).json({ success: false, message: '403 Forbidden: You are not the assigned doctor for this patient encounter' });
    }

    const doctor = await DoctorModel.findOne({ userId: req.userId });

    const note = await MedicalNoteModel.create({
      patientId: appointment.patientId,
      userId: appointment.userId,
      doctorId: doctor._id,
      doctorUserId: req.userId,
      appointmentId: appointment._id,
      vitals: vitals || {},
      symptoms: symptoms || [],
      clinicalNotes: clinicalNotes || '',
      diagnosis,
      observations: observations || '',
      aiSummary: aiSummary || {}
    });

    // Mark appointment completed
    appointment.status = 'completed';
    await appointment.save();

    await logAudit({
      req,
      action: 'CREATE_NOTE',
      module: 'MEDICAL',
      recordId: note._id,
      details: `Created clinical note with diagnosis: ${diagnosis}`
    });

    const populated = await MedicalNoteModel.findById(note._id)
      .populate('patientId')
      .populate({ path: 'doctorId', populate: { path: 'userId' } });

    res.status(201).json({ success: true, message: 'Medical note recorded', payload: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /medical/notes - View notes with strict role & ownership checking
router.get('/notes', async (req, res) => {
  try {
    let query = {};

    if (req.role === 'patient') {
      // Patient only sees their own notes
      query.userId = req.userId;
    } else if (req.role === 'doctor') {
      // Doctor only sees notes they authored or for their patients
      query.doctorUserId = req.userId;
    } else if (req.role === 'admin') {
      // Admin audit view
    } else {
      // Receptionist & Lab technicians CANNOT view clinical medical notes
      return res.status(403).json({
        success: false,
        message: `403 Forbidden: Role '${req.role}' is not permitted to view confidential medical notes`
      });
    }

    const notes = await MedicalNoteModel.find(query)
      .populate('patientId')
      .populate({ path: 'doctorId', populate: { path: 'userId' } })
      .sort({ createdAt: -1 });

    res.json({ success: true, count: notes.length, payload: notes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /medical/timeline/:patientId - 360° Comprehensive Chronological Patient Timeline
router.get('/timeline/:patientId?', async (req, res) => {
  try {
    let targetPatientId = req.params.patientId;

    if (req.role === 'patient') {
      // If patient, ALWAYS force to own profile regardless of param
      const myPatient = await PatientModel.findOne({ userId: req.userId });
      if (!myPatient) {
        return res.status(404).json({ success: false, message: 'Patient profile not found' });
      }
      targetPatientId = myPatient._id;
    } else if (req.role === 'lab') {
      return res.status(403).json({ success: false, message: '403 Forbidden: Access Denied' });
    } else if (!targetPatientId) {
      return res.status(400).json({ success: false, message: 'Patient ID is required' });
    }

    const patient = await PatientModel.findById(targetPatientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    // Parallel fetch of all records for this patient
    const [appointments, notes, prescriptions, labOrders, labResults, invoices, followUps] = await Promise.all([
      AppointmentModel.find({ patientId: targetPatientId }).populate({ path: 'doctorId', populate: { path: 'userId' } }),
      MedicalNoteModel.find({ patientId: targetPatientId }).populate({ path: 'doctorId', populate: { path: 'userId' } }),
      PrescriptionModel.find({ patientId: targetPatientId }).populate({ path: 'doctorId', populate: { path: 'userId' } }),
      LabOrderModel.find({ patientId: targetPatientId }).populate({ path: 'doctorId', populate: { path: 'userId' } }),
      LabResultModel.find({ patientId: targetPatientId, status: { $in: req.role === 'patient' ? ['verified', 'released'] : ['pending', 'verified', 'released'] } }),
      InvoiceModel.find({ patientId: targetPatientId }),
      FollowUpModel.find({ patientId: targetPatientId }).populate({ path: 'doctorId', populate: { path: 'userId' } })
    ]);

    // Construct unified chronological timeline
    const timeline = [];

    appointments.forEach(apt => {
      timeline.push({
        id: apt._id,
        type: 'APPOINTMENT',
        date: apt.createdAt,
        title: `Appointment (${apt.appointmentTime})`,
        doctor: apt.doctorId?.fullName || 'Assigned Doctor',
        status: apt.status,
        details: apt.reason || 'Medical Visit',
        data: apt
      });
    });

    notes.forEach(note => {
      timeline.push({
        id: note._id,
        type: 'MEDICAL_NOTE',
        date: note.createdAt,
        title: `Clinical Note: ${note.diagnosis}`,
        doctor: note.doctorId?.fullName,
        details: note.aiSummary?.clinicalSynopsis || note.clinicalNotes || 'Doctor visit assessment',
        vitals: note.vitals,
        data: note
      });
    });

    prescriptions.forEach(rx => {
      timeline.push({
        id: rx._id,
        type: 'PRESCRIPTION',
        date: rx.createdAt,
        title: `Prescription: ${rx.medicines?.length} Medicine(s)`,
        doctor: rx.doctorId?.fullName,
        details: rx.instructions || 'Prescription medications prescribed',
        data: rx
      });
    });

    labOrders.forEach(order => {
      timeline.push({
        id: order._id,
        type: 'LAB_ORDER',
        date: order.createdAt,
        title: `Lab Order: ${order.testName}`,
        doctor: order.doctorId?.fullName,
        status: order.status,
        details: `Specimen: ${order.specimenType} | Status: ${order.status}`,
        data: order
      });
    });

    labResults.forEach(resItem => {
      timeline.push({
        id: resItem._id,
        type: 'LAB_RESULT',
        date: resItem.verifiedAt || resItem.createdAt,
        title: `Lab Result: ${resItem.testName} (${resItem.result} ${resItem.unit || ''})`,
        status: resItem.status,
        flag: resItem.flag,
        details: `Reference: ${resItem.referenceRange} | Remarks: ${resItem.remarks || 'None'}`,
        data: resItem
      });
    });

    invoices.forEach(inv => {
      timeline.push({
        id: inv._id,
        type: 'INVOICE',
        date: inv.createdAt,
        title: `Invoice #${inv.invoiceNumber} (₹${inv.totalAmount})`,
        status: inv.paymentStatus,
        details: `Paid: ₹${inv.amountPaid} | Balance Due: ₹${inv.balanceDue}`,
        data: inv
      });
    });

    followUps.forEach(fu => {
      timeline.push({
        id: fu._id,
        type: 'FOLLOW_UP',
        date: fu.createdAt,
        title: `Follow-up Scheduled for ${new Date(fu.followUpDate).toLocaleDateString()}`,
        status: fu.status,
        details: fu.instructions,
        data: fu
      });
    });

    timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      success: true,
      patient,
      summary: {
        totalAppointments: appointments.length,
        totalNotes: notes.length,
        totalPrescriptions: prescriptions.length,
        totalLabOrders: labOrders.length,
        totalInvoices: invoices.length
      },
      timeline
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
