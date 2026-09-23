import express from 'express';
import {
  getLabOrders,
  createLabOrder,
  updateLabStatus,
  updateLabResults,
  verifyAndReleaseReport
} from '../controllers/labController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getLabOrders);
router.post('/', authorize('doctor', 'admin'), createLabOrder);
router.patch('/:id/status', authorize('lab_technician', 'admin'), updateLabStatus);
router.put('/:id/results', authorize('lab_technician', 'admin'), updateLabResults);
router.patch('/:id/verify-release', authorize('lab_technician', 'doctor', 'admin'), verifyAndReleaseReport);

export default router;
