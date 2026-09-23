import express from 'express';
import { LabOrderModel } from '../models/LabOrderModel.js';
import { LabResultModel } from '../models/LabResultModel.js';
import { AppointmentModel } from '../models/AppointmentModel.js';
import { DoctorModel } from '../models/DoctorModel.js';
import { PatientModel } from '../models/PatientModel.js';
import { verifyToken } from '../middleware/verifyToken.js';
import { verifyRole } from '../middleware/verifyRole.js';
import { logAudit } from '../middleware/auditLogger.js';

const router = express.Router();

router.use(verifyToken);

// POST /lab/order - Doctor creates a lab order
router.post('/order', verifyRole('doctor'), async (req, res) => {
  try {
    const { appointmentId, testName, testCode, instructions, specimenType = 'Blood' } = req.body;

    const appointment = await AppointmentModel.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (String(appointment.doctorUserId) !== String(req.userId)) {
      return res.status(403).json({ success: false, message: '403 Forbidden: Not your assigned appointment' });
    }

    const doctor = await DoctorModel.findOne({ userId: req.userId });

    const labOrder = await LabOrderModel.create({
      patientId: appointment.patientId,
      userId: appointment.userId,
      doctorId: doctor._id,
      doctorUserId: req.userId,
      appointmentId: appointment._id,
      testName,
      testCode: testCode || '',
      instructions: instructions || '',
      specimenType,
      sampleBarcode: `BAR-${Math.floor(100000 + Math.random() * 900000)}`,
      status: 'ordered'
    });

    await logAudit({
      req,
      action: 'CREATE_LAB_ORDER',
      module: 'LAB',
      recordId: labOrder._id,
      details: `Lab order created for ${testName}`
    });

    res.status(201).json({ success: true, message: 'Lab test ordered', payload: labOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /lab/orders - Filtered by role
router.get('/orders', async (req, res) => {
  try {
    let query = {};

    if (req.role === 'patient') {
      // Patient sees only their own orders
      query.userId = req.userId;
    } else if (req.role === 'doctor') {
      query.doctorUserId = req.userId;
    } else if (req.role === 'lab' || req.role === 'admin') {
      // Lab techs see all clinic lab orders to process
    } else {
      return res.status(403).json({ success: false, message: '403 Forbidden: Access Denied' });
    }

    const orders = await LabOrderModel.find(query)
      .populate('patientId')
      .populate({ path: 'doctorId', populate: { path: 'userId' } })
      .sort({ createdAt: -1 });

    res.json({ success: true, count: orders.length, payload: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /lab/sample-status/:id - Lab technician updates sample status
router.put('/sample-status/:id', verifyRole('lab', 'admin'), async (req, res) => {
  try {
    const { status, sampleBarcode } = req.body;
    const order = await LabOrderModel.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Lab order not found' });
    }

    if (status) order.status = status;
    if (sampleBarcode) order.sampleBarcode = sampleBarcode;
    if (status === 'sample_collected') {
      order.sampleCollectedAt = new Date();
      order.sampleCollectedBy = req.userId;
    }

    await order.save();

    await logAudit({
      req,
      action: 'UPDATE_SAMPLE_STATUS',
      module: 'LAB',
      recordId: order._id,
      details: `Sample status updated to ${status}`
    });

    res.json({ success: true, message: 'Sample status updated', payload: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /lab/result - Lab technician enters test results
router.post('/result', verifyRole('lab', 'admin'), async (req, res) => {
  try {
    const { labOrderId, result, unit, referenceRange, flag = 'Normal', remarks, autoRelease = false } = req.body;

    const order = await LabOrderModel.findById(labOrderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Lab order not found' });
    }

    const labResult = await LabResultModel.create({
      labOrderId: order._id,
      patientId: order.patientId,
      userId: order.userId,
      technicianId: req.userId,
      testName: order.testName,
      result,
      unit: unit || '',
      referenceRange: referenceRange || '',
      flag,
      remarks: remarks || '',
      status: autoRelease ? 'released' : 'pending',
      verifiedBy: autoRelease ? req.userId : null,
      verifiedAt: autoRelease ? new Date() : null
    });

    order.status = autoRelease ? 'released' : 'completed';
    await order.save();

    await logAudit({
      req,
      action: autoRelease ? 'VERIFY_LAB_RESULT' : 'UPDATE_LAB_RESULT',
      module: 'LAB',
      recordId: labResult._id,
      details: `Lab result recorded for ${order.testName}: ${result} ${unit || ''}`
    });

    res.status(201).json({ success: true, message: 'Lab result saved', payload: labResult });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /lab/results - View lab results with strict release protection
router.get('/results', async (req, res) => {
  try {
    let query = {};

    if (req.role === 'patient') {
      // Patients can ONLY view their own VERIFIED & RELEASED lab results!
      query.userId = req.userId;
      query.status = { $in: ['verified', 'released'] };
    } else if (req.role === 'doctor') {
      query.patientId = { $exists: true };
    } else if (req.role === 'lab' || req.role === 'admin') {
      // Lab techs see all
    } else {
      return res.status(403).json({ success: false, message: '403 Forbidden: Access Denied' });
    }

    const results = await LabResultModel.find(query)
      .populate('patientId')
      .populate('technicianId', 'name email')
      .populate('verifiedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: results.length, payload: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /lab/verify/:id - Lab technician verifies and releases result
router.put('/verify/:id', verifyRole('lab', 'admin'), async (req, res) => {
  try {
    const result = await LabResultModel.findById(req.params.id);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Lab result not found' });
    }

    result.status = 'released';
    result.verifiedBy = req.userId;
    result.verifiedAt = new Date();
    await result.save();

    await LabOrderModel.findByIdAndUpdate(result.labOrderId, { status: 'released' });

    await logAudit({
      req,
      action: 'RELEASE_LAB_RESULT',
      module: 'LAB',
      recordId: result._id,
      details: `Released lab result for ${result.testName}`
    });

    res.json({ success: true, message: 'Result verified and released to patient', payload: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
