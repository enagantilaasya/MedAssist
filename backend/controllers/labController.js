import LabOrder from '../models/LabOrder.js';
import User from '../models/User.js';
import ClinicService from '../models/ClinicService.js';
import { logAudit } from '../middleware/audit.js';

export const getLabOrders = async (req, res) => {
  try {
    const { status, priority, patientId } = req.query;
    let query = {};

    if (req.user.role === 'patient') {
      query.patient = req.user._id;
      query.isReleasedToPatient = true; // Patients only see released reports
    } else if (patientId) {
      query.patient = patientId;
    }

    if (status) {
      query.status = status;
    }

    if (priority) {
      query.priority = priority;
    }

    const orders = await LabOrder.find(query)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email')
      .populate('sampleCollectedBy', 'name')
      .populate('verifiedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createLabOrder = async (req, res) => {
  try {
    const {
      patientId,
      appointmentId,
      tests,
      clinicalNotes = '',
      priority = 'Routine',
      specimenType = 'Blood'
    } = req.body;

    const doctorId = req.user._id;

    // Generate Order Number
    const count = await LabOrder.countDocuments();
    const orderNumber = `LAB-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    const sampleBarcode = `BAR-${Math.floor(100000 + Math.random() * 900000)}`;

    const labOrder = await LabOrder.create({
      orderNumber,
      patient: patientId,
      doctor: doctorId,
      appointment: appointmentId || null,
      tests,
      clinicalNotes,
      priority,
      specimenType,
      sampleBarcode,
      status: 'ordered'
    });

    await logAudit({
      req,
      action: 'LAB_ORDER_CREATED',
      resourceType: 'LabOrder',
      resourceId: labOrder._id,
      patientAffected: patientId,
      details: `Lab order ${orderNumber} created (${tests.length} tests, ${priority})`
    });

    const populated = await LabOrder.findById(labOrder._id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateLabStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, technicianNotes, sampleBarcode } = req.body;

    const order = await LabOrder.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Lab order not found' });
    }

    if (status) {
      order.status = status;
      if (status === 'sample_collected') {
        order.sampleCollectedAt = new Date();
        order.sampleCollectedBy = req.user._id;
      }
      if (status === 'in_processing') {
        order.processingStartedAt = new Date();
      }
      if (status === 'completed') {
        order.completedAt = new Date();
      }
    }

    if (technicianNotes !== undefined) order.technicianNotes = technicianNotes;
    if (sampleBarcode) order.sampleBarcode = sampleBarcode;

    await order.save();

    await logAudit({
      req,
      action: `LAB_STATUS_${status?.toUpperCase() || 'UPDATED'}`,
      resourceType: 'LabOrder',
      resourceId: order._id,
      patientAffected: order.patient,
      details: `Lab order status changed to ${status}`
    });

    const updated = await LabOrder.findById(id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email')
      .populate('sampleCollectedBy', 'name')
      .populate('verifiedBy', 'name');

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateLabResults = async (req, res) => {
  try {
    const { id } = req.params;
    const { tests, technicianNotes, autoVerify = false } = req.body;

    const order = await LabOrder.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Lab order not found' });
    }

    order.tests = tests;
    if (technicianNotes !== undefined) order.technicianNotes = technicianNotes;
    order.status = 'completed';
    order.completedAt = new Date();

    if (autoVerify) {
      order.status = 'verified';
      order.verifiedAt = new Date();
      order.verifiedBy = req.user._id;
      order.isReleasedToPatient = true;
    }

    await order.save();

    await logAudit({
      req,
      action: autoVerify ? 'LAB_RESULTS_VERIFIED' : 'LAB_RESULTS_ENTERED',
      resourceType: 'LabOrder',
      resourceId: order._id,
      patientAffected: order.patient,
      details: `Lab results recorded for ${order.orderNumber}`
    });

    const updated = await LabOrder.findById(id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email')
      .populate('verifiedBy', 'name');

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyAndReleaseReport = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await LabOrder.findById(id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Lab order not found' });
    }

    order.status = 'verified';
    order.verifiedAt = new Date();
    order.verifiedBy = req.user._id;
    order.isReleasedToPatient = true;

    await order.save();

    await logAudit({
      req,
      action: 'LAB_REPORT_RELEASED',
      resourceType: 'LabOrder',
      resourceId: order._id,
      patientAffected: order.patient,
      details: `Lab report ${order.orderNumber} verified and released to patient`
    });

    const updated = await LabOrder.findById(id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email')
      .populate('verifiedBy', 'name');

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
