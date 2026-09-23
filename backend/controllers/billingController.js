import Invoice from '../models/Invoice.js';
import User from '../models/User.js';
import ClinicService from '../models/ClinicService.js';
import { logAudit } from '../middleware/audit.js';

export const getInvoices = async (req, res) => {
  try {
    const { status, patientId } = req.query;
    let query = {};

    if (req.user.role === 'patient') {
      query.patient = req.user._id;
    } else if (patientId) {
      query.patient = patientId;
    }

    if (status) {
      query.status = status;
    }

    const invoices = await Invoice.find(query)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email')
      .populate('processedBy', 'name')
      .populate('items.service')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: invoices.length, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email')
      .populate('processedBy', 'name')
      .populate('items.service');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (req.user.role === 'patient' && String(invoice.patient._id) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access forbidden' });
    }

    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createInvoice = async (req, res) => {
  try {
    const {
      patientId,
      appointmentId,
      doctorId,
      items,
      taxPercentage = 0,
      discountAmount = 0,
      notes = ''
    } = req.body;

    const count = await Invoice.countDocuments();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    // Calculate subtotal
    const subtotal = (items || []).reduce((acc, item) => {
      return acc + (Number(item.unitPrice) * Number(item.quantity || 1));
    }, 0);

    const calculatedItems = (items || []).map(item => ({
      ...item,
      totalPrice: Number(item.unitPrice) * Number(item.quantity || 1)
    }));

    const taxAmount = (subtotal * Number(taxPercentage)) / 100;
    const totalAmount = Math.max(0, subtotal + taxAmount - Number(discountAmount));
    const balanceDue = totalAmount;

    const invoice = await Invoice.create({
      invoiceNumber,
      patient: patientId,
      appointment: appointmentId || null,
      doctor: doctorId || null,
      items: calculatedItems,
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      amountPaid: 0,
      balanceDue,
      status: 'pending',
      paymentMethod: 'Pending',
      notes
    });

    await logAudit({
      req,
      action: 'INVOICE_CREATED',
      resourceType: 'Invoice',
      resourceId: invoice._id,
      patientAffected: patientId,
      details: `Invoice ${invoiceNumber} created for total $${totalAmount}`
    });

    const populated = await Invoice.findById(invoice._id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const processPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amountPaid, paymentMethod = 'Cash', notes = '' } = req.body;

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const newAmountPaid = invoice.amountPaid + Number(amountPaid);
    const newBalanceDue = Math.max(0, invoice.totalAmount - newAmountPaid);

    invoice.amountPaid = newAmountPaid;
    invoice.balanceDue = newBalanceDue;
    invoice.paymentMethod = paymentMethod;
    invoice.processedBy = req.user._id;
    if (notes) invoice.notes = notes;

    if (newBalanceDue === 0) {
      invoice.status = 'paid';
      invoice.paidAt = new Date();
    } else if (newAmountPaid > 0) {
      invoice.status = 'partially_paid';
    }

    await invoice.save();

    await logAudit({
      req,
      action: 'PAYMENT_COLLECTED',
      resourceType: 'Invoice',
      resourceId: invoice._id,
      patientAffected: invoice.patient,
      details: `Payment of $${amountPaid} received via ${paymentMethod} for ${invoice.invoiceNumber}. New Status: ${invoice.status}`
    });

    const updated = await Invoice.findById(id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email')
      .populate('processedBy', 'name');

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBillingStats = async (req, res) => {
  try {
    const invoices = await Invoice.find();

    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
    const totalBilled = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const totalPending = invoices.reduce((sum, inv) => sum + (inv.balanceDue || 0), 0);
    const paidCount = invoices.filter(inv => inv.status === 'paid').length;
    const pendingCount = invoices.filter(inv => inv.status === 'pending' || inv.status === 'partially_paid').length;

    res.json({
      success: true,
      stats: {
        totalRevenue,
        totalBilled,
        totalPending,
        paidCount,
        pendingCount,
        totalInvoices: invoices.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
