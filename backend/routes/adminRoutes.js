import express from 'express';
import {
  getClinicStats,
  getUsers,
  updateUser,
  getServices,
  createService,
  updateService,
  getAuditLogs
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getClinicStats);
router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.get('/services', getServices);
router.post('/services', createService);
router.put('/services/:id', updateService);
router.get('/audit-logs', getAuditLogs);

export default router;
