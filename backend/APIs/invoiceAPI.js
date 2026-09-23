import express from 'express';
import { InvoiceModel } from '../models/InvoiceModel.js';
import { PatientModel } from '../models/PatientModel.js';
import { verifyToken } from '../middleware/verifyToken.js';
import { verifyRole } from '../middleware/verifyRole.js';
import { logAudit } from '../middleware/auditLogger.js';

const router = express.Router();

router.use(verifyToken);

// POST /invoices/add - Receptionist and Admin create invoices
router.post('/add', verifyRole('receptionist', 'admin'), async (req, res) => {
  try {
    const { patientId, appointmentId, items, discount = 0, taxAmount = 0 } = req.body;

    const patient = await PatientModel.findById(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const subtotal = items.reduce((acc, item) => acc + (Number(item.unitPrice) * Number(item.quantity || 1)), 0);
    const totalAmount = Math.max(0, subtotal + Number(taxAmount) - Number(discount));
    const count = await InvoiceModel.countDocuments();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const calculatedItems = items.map(item => ({
      description: item.description || item.itemName || 'Medical Service',
      quantity: Number(item.quantity || 1),
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.unitPrice) * Number(item.quantity || 1)
    }));

    const invoice = await InvoiceModel.create({
      patientId: patient._id,
      userId: patient.userId,
      appointmentId: appointmentId || null,
      invoiceNumber,
      items: calculatedItems,
      subtotal,
      discount,
      taxAmount,
      totalAmount,
      amountPaid: 0,
      balanceDue: totalAmount,
      paymentStatus: 'pending',
      paymentMethod: 'Pending'
    });

    await logAudit({
      req,
      action: 'CREATE_INVOICE',
      module: 'BILLING',
      recordId: invoice._id,
      details: `Created invoice ${invoiceNumber} for ₹${totalAmount}`
    });

    res.status(201).json({ success: true, message: 'Invoice created', payload: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /invoices/all - Strictly filtered by role
router.get('/all', async (req, res) => {
  try {
    let query = {};

    if (req.role === 'patient') {
      // Patient sees only their own bills
      query.userId = req.userId;
    } else if (req.role === 'receptionist' || req.role === 'admin') {
      // Receptionist & Admin manage all clinic invoices
    } else {
      return res.status(403).json({ success: false, message: '403 Forbidden: Access Denied' });
    }

    const invoices = await InvoiceModel.find(query).populate('patientId').sort({ createdAt: -1 });
    res.json({ success: true, count: invoices.length, payload: invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /invoices/pay/:id - Pay an invoice
router.post('/pay/:id', async (req, res) => {
  try {
    const { amountPaid, paymentMethod = 'Cash' } = req.body;
    const invoice = await InvoiceModel.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Ownership check for patient role: Patient can only pay their own bill
    if (req.role === 'patient' && String(invoice.userId) !== String(req.userId)) {
      return res.status(403).json({ success: false, message: '403 Forbidden: Access Denied' });
    }

    const newAmountPaid = invoice.amountPaid + Number(amountPaid);
    const newBalanceDue = Math.max(0, invoice.totalAmount - newAmountPaid);

    invoice.amountPaid = newAmountPaid;
    invoice.balanceDue = newBalanceDue;
    invoice.paymentMethod = paymentMethod;

    if (newBalanceDue === 0) {
      invoice.paymentStatus = 'paid';
      invoice.paidAt = new Date();
    }

    await invoice.save();

    await logAudit({
      req,
      action: 'COLLECT_PAYMENT',
      module: 'BILLING',
      recordId: invoice._id,
      details: `Collected payment of ₹${amountPaid} via ${paymentMethod}`
    });

    res.json({ success: true, message: 'Payment recorded', payload: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
