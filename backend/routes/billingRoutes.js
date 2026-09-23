import express from 'express';
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  processPayment,
  getBillingStats
} from '../controllers/billingController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getInvoices);
router.get('/stats', authorize('admin', 'receptionist'), getBillingStats);
router.get('/:id', getInvoiceById);
router.post('/', authorize('admin', 'receptionist', 'doctor'), createInvoice);
router.post('/:id/pay', authorize('admin', 'receptionist', 'patient'), processPayment);

export default router;
