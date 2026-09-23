import Prescription from '../models/Prescription.js';
import User from '../models/User.js';
import { generatePatientPlainLanguageGuide } from '../services/aiService.js';
import { logAudit } from '../middleware/audit.js';

export const createPrescription = async (req, res) => {
  try {
    const {
      patientId,
      appointmentId,
      medicalRecordId,
      diagnosis,
      medications,
      generalAdvice
    } = req.body;

    const doctorId = req.user._id;

    // Generate RX number
    const count = await Prescription.countDocuments();
    const prescriptionNumber = `RX-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const patient = await User.findById(patientId);

    // Generate AI Patient Plain-Language Guide
    const aiGuide = await generatePatientPlainLanguageGuide({
      patientName: patient?.name,
      diagnosis,
      medications,
      generalAdvice
    });

    const prescription = await Prescription.create({
      prescriptionNumber,
      patient: patientId,
      doctor: doctorId,
      appointment: appointmentId || null,
      medicalRecord: medicalRecordId || null,
      diagnosis,
      medications,
      generalAdvice,
      aiPlainLanguageExplanation: {
        summary: aiGuide.summary,
        medicationGuide: aiGuide.medicationGuide,
        generalTips: aiGuide.generalTips,
        whenToCallDoctor: aiGuide.whenToCallDoctor,
        generatedAt: new Date()
      },
      status: 'active'
    });

    await logAudit({
      req,
      action: 'PRESCRIPTION_CREATED',
      resourceType: 'Prescription',
      resourceId: prescription._id,
      patientAffected: patientId,
      patientName: patient?.name,
      details: `Prescription ${prescriptionNumber} issued with ${medications.length} medication(s)`
    });

    const populated = await Prescription.findById(prescription._id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPrescriptions = async (req, res) => {
  try {
    const { patientId } = req.query;
    let query = {};

    if (req.user.role === 'patient') {
      query.patient = req.user._id;
    } else if (patientId) {
      query.patient = patientId;
    }

    const prescriptions = await Prescription.find(query)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: prescriptions.length, data: prescriptions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPrescriptionById = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email');

    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }

    if (req.user.role === 'patient' && String(prescription.patient._id) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access forbidden' });
    }

    res.json({ success: true, data: prescription });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const generateAIExplanation = async (req, res) => {
  try {
    const { id } = req.params;
    const prescription = await Prescription.findById(id).populate('patient', 'name');

    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }

    const aiGuide = await generatePatientPlainLanguageGuide({
      patientName: prescription.patient?.name,
      diagnosis: prescription.diagnosis,
      medications: prescription.medications,
      generalAdvice: prescription.generalAdvice
    });

    prescription.aiPlainLanguageExplanation = {
      summary: aiGuide.summary,
      medicationGuide: aiGuide.medicationGuide,
      generalTips: aiGuide.generalTips,
      whenToCallDoctor: aiGuide.whenToCallDoctor,
      generatedAt: new Date()
    };

    await prescription.save();

    res.json({ success: true, data: prescription.aiPlainLanguageExplanation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
