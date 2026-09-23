import express from 'express';
import {
  createPrescription,
  getPrescriptions,
  getPrescriptionById,
  generateAIExplanation
} from '../controllers/prescriptionController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', authorize('doctor', 'admin'), createPrescription);
router.get('/', getPrescriptions);
router.get('/:id', getPrescriptionById);
router.post('/:id/explain-ai', generateAIExplanation);

export default router;
