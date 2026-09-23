import { generateClinicalSummary, generatePatientPlainLanguageGuide } from '../services/aiService.js';

export const summarizeEncounter = async (req, res) => {
  try {
    const { patientName, vitals, soapNotes, diagnosis } = req.body;
    const summary = await generateClinicalSummary({
      patientName,
      vitals,
      soapNotes,
      diagnosis
    });

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const explainPrescription = async (req, res) => {
  try {
    const { patientName, diagnosis, medications, generalAdvice } = req.body;
    const explanation = await generatePatientPlainLanguageGuide({
      patientName,
      diagnosis,
      medications,
      generalAdvice
    });

    res.json({
      success: true,
      data: explanation
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
