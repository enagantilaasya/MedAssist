import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { connectDB } from './config/db.js';

// Route imports
import authAPI from './APIs/authAPI.js';
import patientAPI from './APIs/patientAPI.js';
import doctorAPI from './APIs/doctorAPI.js';
import appointmentAPI from './APIs/appointmentAPI.js';
import medicalAPI from './APIs/medicalAPI.js';
import prescriptionAPI from './APIs/prescriptionAPI.js';
import labAPI from './APIs/labAPI.js';
import invoiceAPI from './APIs/invoiceAPI.js';
import followUpAPI from './APIs/followUpAPI.js';
import adminAPI from './APIs/adminAPI.js';
import aiAPI from './APIs/aiAPI.js';

dotenv.config();

// Connect MongoDB
connectDB();

const app = express();

// Middlewares
app.use(cors({
  origin: true, // Allow any Vercel frontend domain, localhost, and custom domains
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With', 'Accept']
}));
app.options('*', cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'MedAssist Clinic Operations & Patient Care API',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// Mount Student-Style APIs
app.use('/api/auth', authAPI);
app.use('/api/patients', patientAPI);
app.use('/api/doctors', doctorAPI);
app.use('/api/appointments', appointmentAPI);
app.use('/api/medical', medicalAPI);
app.use('/api/prescriptions', prescriptionAPI);
app.use('/api/lab', labAPI);
app.use('/api/invoices', invoiceAPI);
app.use('/api/follow-ups', followUpAPI);
app.use('/api/admin', adminAPI);
app.use('/api/ai', aiAPI);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found - ${req.originalUrl}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  console.error('API Error:', err.message);
  res.status(statusCode).json({
    success: false,
    message: err.message
  });
});

const PORT = parseInt(process.env.PORT || '5001', 10);

const server = app.listen(PORT, () => {
  console.log(` MedAssist API Server running on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is in use. Please terminate the conflicting process or change PORT in .env`);
  } else {
    console.error('Server error:', err);
  }
});
