import express from 'express';
import { summarizeEncounter, explainPrescription } from '../controllers/aiController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/summarize-encounter', summarizeEncounter);
router.post('/explain-prescription', explainPrescription);

export default router;
