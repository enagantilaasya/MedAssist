import express from 'express';
import {
  createMedicalRecord,
  getMedicalRecords,
  getMedicalRecordById,
  getPatientTimeline
} from '../controllers/emrController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', authorize('doctor', 'admin'), createMedicalRecord);
router.get('/', getMedicalRecords);
router.get('/record/:id', getMedicalRecordById);
router.get('/timeline/:patientId?', getPatientTimeline);

export default router;
