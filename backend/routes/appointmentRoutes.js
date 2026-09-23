import express from 'express';
import {
  getAppointments,
  getTodayQueue,
  createAppointment,
  updateAppointmentStatus,
  getDoctorSlots
} from '../controllers/appointmentController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getAppointments);
router.get('/today-queue', authorize('doctor', 'receptionist', 'admin'), getTodayQueue);
router.post('/', authorize('receptionist', 'admin', 'doctor', 'patient'), createAppointment);
router.patch('/:id/status', authorize('receptionist', 'admin', 'doctor'), updateAppointmentStatus);
router.get('/doctor-slots/:doctorId', getDoctorSlots);

export default router;
