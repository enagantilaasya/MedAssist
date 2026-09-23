import MedicalRecord from '../models/MedicalRecord.js';
import Appointment from '../models/Appointment.js';
import Prescription from '../models/Prescription.js';
import LabOrder from '../models/LabOrder.js';
import Invoice from '../models/Invoice.js';
import PatientProfile from '../models/PatientProfile.js';
import User from '../models/User.js';
import { generateClinicalSummary } from '../services/aiService.js';
import { logAudit } from '../middleware/audit.js';

export const createMedicalRecord = async (req, res) => {
  try {
    const {
      patientId,
      appointmentId,
      vitals,
      soapNotes,
      attachments = []
    } = req.body;

    const doctorId = req.user._id;
    const patientProfile = await PatientProfile.findOne({ user: patientId });

    // Generate EMR record number
    const count = await MedicalRecord.countDocuments();
    const recordNumber = `EMR-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    // Generate AI Clinical Summary automatically or allow manual override
    const patient = await User.findById(patientId);
    const aiSummaryResult = await generateClinicalSummary({
      patientName: patient?.name,
      vitals,
      soapNotes,
      diagnosis: soapNotes?.assessment?.primaryDiagnosis
    });

    const medicalRecord = await MedicalRecord.create({
      recordNumber,
      patient: patientId,
      patientProfile: patientProfile?._id,
      doctor: doctorId,
      appointment: appointmentId || null,
      vitals,
      soapNotes,
      aiSummary: {
        clinicalSynopsis: aiSummaryResult.clinicalSynopsis,
        keyActionItems: aiSummaryResult.keyActionItems,
        criticalFlags: aiSummaryResult.criticalFlags,
        generatedAt: new Date()
      },
      attachments
    });

    // If appointment is attached, update its status to completed
    if (appointmentId) {
      await Appointment.findByIdAndUpdate(appointmentId, {
        status: 'completed',
        consultationCompletedAt: new Date()
      });
    }

    await logAudit({
      req,
      action: 'EMR_CREATED',
      resourceType: 'MedicalRecord',
      resourceId: medicalRecord._id,
      patientAffected: patientId,
      patientName: patient?.name,
      details: `EMR ${recordNumber} created with diagnosis: ${soapNotes?.assessment?.primaryDiagnosis}`
    });

    const populated = await MedicalRecord.findById(medicalRecord._id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email')
      .populate('appointment');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMedicalRecords = async (req, res) => {
  try {
    const { patientId } = req.query;
    let query = {};

    if (req.user.role === 'patient') {
      query.patient = req.user._id;
    } else if (patientId) {
      query.patient = patientId;
    }

    const records = await MedicalRecord.find(query)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email')
      .populate('appointment')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: records.length, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMedicalRecordById = async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id)
      .populate('patient', 'name email phone')
      .populate('patientProfile')
      .populate('doctor', 'name email')
      .populate('appointment');

    if (!record) {
      return res.status(404).json({ success: false, message: 'Medical record not found' });
    }

    if (req.user.role === 'patient' && String(record.patient._id) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access forbidden' });
    }

    res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPatientTimeline = async (req, res) => {
  try {
    const patientId = req.user.role === 'patient' ? req.user._id : req.params.patientId;

    if (!patientId) {
      return res.status(400).json({ success: false, message: 'Patient ID required' });
    }

    const patient = await User.findById(patientId).select('name email phone');
    const profile = await PatientProfile.findOne({ user: patientId });

    // Fetch all related entities in parallel
    const [appointments, records, prescriptions, labOrders, invoices] = await Promise.all([
      Appointment.find({ patient: patientId }).populate('doctor', 'name').sort({ createdAt: -1 }),
      MedicalRecord.find({ patient: patientId }).populate('doctor', 'name').sort({ createdAt: -1 }),
      Prescription.find({ patient: patientId }).populate('doctor', 'name').sort({ createdAt: -1 }),
      LabOrder.find({ patient: patientId }).populate('doctor', 'name').populate('verifiedBy', 'name').sort({ createdAt: -1 }),
      Invoice.find({ patient: patientId }).sort({ createdAt: -1 })
    ]);

    // Build unified chronological timeline
    const timelineEvents = [];

    appointments.forEach(apt => {
      timelineEvents.push({
        id: apt._id,
        type: 'APPOINTMENT',
        date: apt.createdAt,
        title: `Appointment: ${apt.type} (${apt.timeSlot})`,
        status: apt.status,
        doctor: apt.doctor?.name,
        details: apt.chiefComplaint || 'Routine Visit',
        data: apt
      });
    });

    records.forEach(rec => {
      timelineEvents.push({
        id: rec._id,
        type: 'CLINICAL_NOTE',
        date: rec.encounterDate || rec.createdAt,
        title: `Clinical Encounter: ${rec.soapNotes?.assessment?.primaryDiagnosis || 'Consultation'}`,
        doctor: rec.doctor?.name,
        details: rec.aiSummary?.clinicalSynopsis || rec.soapNotes?.subjective?.chiefComplaint,
        vitals: rec.vitals,
        data: rec
      });
    });

    prescriptions.forEach(rx => {
      timelineEvents.push({
        id: rx._id,
        type: 'PRESCRIPTION',
        date: rx.createdAt,
        title: `Prescription: ${rx.medications?.length} Medication(s)`,
        doctor: rx.doctor?.name,
        details: rx.diagnosis || 'Prescription issued',
        status: rx.status,
        data: rx
      });
    });

    labOrders.forEach(lab => {
      timelineEvents.push({
        id: lab._id,
        type: 'LAB_INVESTIGATION',
        date: lab.createdAt,
        title: `Lab Order (${lab.priority}): ${lab.tests?.map(t => t.testName).join(', ')}`,
        status: lab.status,
        doctor: lab.doctor?.name,
        details: `Specimen: ${lab.specimenType} | ${lab.tests?.length} tests`,
        data: lab
      });
    });

    invoices.forEach(inv => {
      timelineEvents.push({
        id: inv._id,
        type: 'BILLING',
        date: inv.createdAt,
        title: `Invoice ${inv.invoiceNumber} - $${inv.totalAmount}`,
        status: inv.status,
        details: `Paid: $${inv.amountPaid} | Due: $${inv.balanceDue}`,
        data: inv
      });
    });

    // Sort timeline strictly newest first
    timelineEvents.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      success: true,
      patient,
      profile,
      summary: {
        totalVisits: appointments.length,
        totalPrescriptions: prescriptions.length,
        totalLabOrders: labOrders.length,
        totalInvoices: invoices.length
      },
      timeline: timelineEvents
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
