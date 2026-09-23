import express from 'express';
import { generateClinicalSummary, generatePatientPlainLanguageGuide } from '../services/aiService.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

router.use(verifyToken);

// POST /ai/clinical-summary (Used by doctors in consultation)
router.post('/clinical-summary', async (req, res) => {
  try {
    const { patientName, vitals, soapNotes, diagnosis } = req.body;
    const summary = await generateClinicalSummary({
      patientName,
      vitals,
      soapNotes,
      diagnosis
    });

    res.json({ success: true, payload: summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /ai/patient-explainer (Used by patients to understand medicine)
router.post('/patient-explainer', async (req, res) => {
  try {
    const { patientName, diagnosis, medications, generalAdvice } = req.body;
    const explanation = await generatePatientPlainLanguageGuide({
      patientName,
      diagnosis,
      medications,
      generalAdvice
    });

    res.json({ success: true, payload: explanation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
