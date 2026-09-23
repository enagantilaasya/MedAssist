import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
import { UserModel } from '../models/UserModel.js';
import { DepartmentModel } from '../models/DepartmentModel.js';
import { DoctorModel } from '../models/DoctorModel.js';
import { PatientModel } from '../models/PatientModel.js';
import { ServiceModel } from '../models/ServiceModel.js';
import { AppointmentModel } from '../models/AppointmentModel.js';
import { MedicalNoteModel } from '../models/MedicalNoteModel.js';
import { PrescriptionModel } from '../models/PrescriptionModel.js';
import { LabOrderModel } from '../models/LabOrderModel.js';
import { LabResultModel } from '../models/LabResultModel.js';
import { InvoiceModel } from '../models/InvoiceModel.js';
import { FollowUpModel } from '../models/FollowUpModel.js';
import { AuditLogModel } from '../models/AuditLogModel.js';

dotenv.config();

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  console.warn('DNS server configuration warning:', e.message);
}

const seedDatabase = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medassist';
    await mongoose.connect(mongoURI);
    console.log('🌱 Connected to MongoDB for seeding...');

    // Drop database to clear old indexes
    await mongoose.connection.db.dropDatabase();
    console.log('🧹 Cleaned existing database and dropped stale indexes.');

    // 1. Create Departments
    const deptCardio = await DepartmentModel.create({
      name: 'Cardiology',
      code: 'DEP-CARD',
      description: 'Cardiac care and heart disease management'
    });

    const deptGeneral = await DepartmentModel.create({
      name: 'General Medicine',
      code: 'DEP-GEN',
      description: 'Primary healthcare and preventive medicine'
    });

    const deptPediatrics = await DepartmentModel.create({
      name: 'Pediatrics',
      code: 'DEP-PED',
      description: 'Infant, child and adolescent health'
    });

    // 2. Create Services
    const srv1 = await ServiceModel.create({
      name: 'General Consultation',
      code: 'SRV-GEN-01',
      category: 'Consultation',
      departmentId: deptGeneral._id,
      price: 500,
      taxPercentage: 5,
      description: 'Standard outpatient consultation'
    });

    const srv2 = await ServiceModel.create({
      name: 'Cardiology Specialist Consultation',
      code: 'SRV-CARD-01',
      category: 'Consultation',
      departmentId: deptCardio._id,
      price: 1000,
      taxPercentage: 5,
      description: 'Consultation with specialist cardiologist'
    });

    const srv3 = await ServiceModel.create({
      name: 'Complete Blood Count (CBC)',
      code: 'LAB-CBC-01',
      category: 'Laboratory',
      departmentId: deptGeneral._id,
      price: 350,
      taxPercentage: 0,
      normalRange: 'WBC: 4.5-11.0, RBC: 4.3-5.9',
      unit: 'x10^3/uL',
      description: 'Automated 5-part differential blood count'
    });

    const srv4 = await ServiceModel.create({
      name: 'Fasting Blood Glucose & HbA1c',
      code: 'LAB-GLU-01',
      category: 'Laboratory',
      departmentId: deptGeneral._id,
      price: 450,
      taxPercentage: 0,
      normalRange: 'Glucose: 70-99 mg/dL, HbA1c: <5.7%',
      unit: 'mg/dL',
      description: 'Diabetes monitoring panel'
    });

    // 3. Create Admin
    const admin = await UserModel.create({
      name: 'Admin User',
      email: 'admin@medassist.com',
      password: 'password123',
      role: 'admin',
      phone: '+1 (555) 000-0001',
      status: 'active'
    });

    // 4. Create Doctor
    const doctorUser = await UserModel.create({
      name: 'Dr. Sarah Jenkins',
      email: 'doctor@medassist.com',
      password: 'password123',
      role: 'doctor',
      phone: '+1 (555) 000-0002',
      status: 'active'
    });

    const doctorProfile = await DoctorModel.create({
      userId: doctorUser._id,
      fullName: 'Dr. Sarah Jenkins',
      specialization: 'Cardiology & Internal Medicine',
      departmentId: deptCardio._id,
      licenseNumber: 'MD-CARD-89210',
      consultationFee: 800,
      roomNumber: 'Suite 302',
      schedule: [
        { dayOfWeek: 'Monday', startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 'Tuesday', startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 'Wednesday', startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 'Thursday', startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 'Friday', startTime: '09:00', endTime: '17:00' }
      ]
    });

    // 5. Create Receptionist
    const receptionUser = await UserModel.create({
      name: 'David Kim',
      email: 'reception@medassist.com',
      password: 'password123',
      role: 'receptionist',
      phone: '+1 (555) 000-0003',
      status: 'active'
    });

    // 6. Create Lab Tech
    const labUser = await UserModel.create({
      name: 'Alex Rivera',
      email: 'lab@medassist.com',
      password: 'password123',
      role: 'lab',
      phone: '+1 (555) 000-0004',
      status: 'active'
    });

    // 7. Create Patient
    const patientUser = await UserModel.create({
      name: 'Robert Chen',
      email: 'patient@medassist.com',
      password: 'password123',
      role: 'patient',
      phone: '+1 (555) 000-0005',
      status: 'active'
    });

    const patientProfile = await PatientModel.create({
      userId: patientUser._id,
      patientCode: 'PAT-2026-0001',
      fullName: 'Robert Chen',
      email: 'patient@medassist.com',
      phone: '+1 (555) 000-0005',
      dateOfBirth: new Date('1978-06-14'),
      gender: 'Male',
      bloodGroup: 'O+',
      address: {
        street: '742 Evergreen Terrace',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62704'
      },
      emergencyContact: {
        name: 'Helen Chen',
        relationship: 'Spouse',
        phone: '+1 (555) 000-0006'
      },
      allergies: ['Penicillin', 'Sulfa Drugs'],
      chronicConditions: ['Stage 1 Essential Hypertension', 'Type 2 Diabetes']
    });

    // 8. Create Sample Appointments
    const todayStr = new Date().toISOString().split('T')[0];

    const apt1 = await AppointmentModel.create({
      patientId: patientProfile._id,
      userId: patientUser._id,
      doctorId: doctorProfile._id,
      doctorUserId: doctorUser._id,
      departmentId: deptCardio._id,
      serviceId: srv2._id,
      appointmentDate: todayStr,
      appointmentTime: '09:30 - 10:00',
      reason: 'Routine blood pressure review and mild exertion-related fatigue',
      status: 'confirmed',
      queueNumber: 1
    });

    const apt2 = await AppointmentModel.create({
      patientId: patientProfile._id,
      userId: patientUser._id,
      doctorId: doctorProfile._id,
      doctorUserId: doctorUser._id,
      departmentId: deptCardio._id,
      serviceId: srv2._id,
      appointmentDate: todayStr,
      appointmentTime: '10:30 - 11:00',
      reason: 'Follow-up consultation',
      status: 'waiting',
      queueNumber: 2
    });

    // 9. Create Sample Medical Note for Patient 1
    const note1 = await MedicalNoteModel.create({
      patientId: patientProfile._id,
      userId: patientUser._id,
      doctorId: doctorProfile._id,
      doctorUserId: doctorUser._id,
      appointmentId: apt1._id,
      vitals: {
        bloodPressure: '138/86 mmHg',
        heartRate: '76 bpm',
        temperature: '98.4 F',
        spO2: '98%',
        weight: '82 kg',
        height: '178 cm',
        bmi: '25.9'
      },
      symptoms: ['Mild afternoon fatigue', 'Morning headache'],
      clinicalNotes: 'Blood pressure slightly elevated above target goal. Adjusting antihypertensive therapy.',
      diagnosis: 'Stage 1 Essential Hypertension',
      observations: 'Chest clear bilaterally, normal heart sounds.',
      aiSummary: {
        clinicalSynopsis: 'Patient presented for hypertension review. Blood pressure recorded at 138/86 mmHg. Initiated Telmisartan 40mg regimen with lifestyle sodium restriction.',
        keyActionItems: [
          'Review compliance with Telmisartan 40mg.',
          'Schedule repeat BP check in 3 weeks.'
        ],
        criticalFlags: ['Mildly elevated Blood Pressure (138/86 mmHg)']
      }
    });

    // 10. Create Sample Prescription
    const rx1 = await PrescriptionModel.create({
      patientId: patientProfile._id,
      userId: patientUser._id,
      doctorId: doctorProfile._id,
      doctorUserId: doctorUser._id,
      appointmentId: apt1._id,
      medicines: [
        {
          name: 'Telmisartan Tablets',
          dosage: '40 mg',
          frequency: 'Once Daily (1-0-0)',
          duration: '30 Days',
          instructions: 'Morning after breakfast with water'
        },
        {
          name: 'Metformin Hydrochloride',
          dosage: '500 mg',
          frequency: 'Twice Daily (1-0-1)',
          duration: '30 Days',
          instructions: 'Take with food to prevent gastric discomfort'
        }
      ],
      instructions: 'Limit sodium to under one teaspoon daily. Walk 30 minutes 5 days a week.',
      followUpDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      aiExplanation: {
        summary: 'Hello Robert, here is your easy-to-understand medication guide. These medicines help keep your blood pressure steady and manage your daily blood sugar levels.',
        medicationGuide: [
          {
            medicine: 'Telmisartan (40 mg)',
            purpose: 'Relaxes blood vessels to lower blood pressure and protect heart health.',
            howToTake: 'Take 1 pill each morning after breakfast with water.',
            importantWarnings: 'Do not stop abruptly without speaking to your doctor.'
          },
          {
            medicine: 'Metformin (500 mg)',
            purpose: 'Helps your body handle sugar efficiently.',
            howToTake: 'Take 1 pill with breakfast and 1 pill with dinner.',
            importantWarnings: 'Always take with food.'
          }
        ],
        generalTips: [
          'Log your blood pressure twice a week.',
          'Stay well hydrated throughout the day.'
        ],
        whenToCallDoctor: [
          'If you feel sudden severe dizziness or chest tightness.',
          'If home blood pressure reading exceeds 160/100 mmHg.'
        ]
      }
    });

    // 11. Create Sample Lab Order & Verified Lab Result
    const labOrder1 = await LabOrderModel.create({
      patientId: patientProfile._id,
      userId: patientUser._id,
      doctorId: doctorProfile._id,
      doctorUserId: doctorUser._id,
      appointmentId: apt1._id,
      testName: 'Fasting Plasma Glucose & Lipid Panel',
      testCode: 'LAB-GLU-01',
      instructions: '10-hour overnight fasting required',
      specimenType: 'Blood',
      sampleBarcode: 'BAR-882103',
      status: 'released',
      orderedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      sampleCollectedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      sampleCollectedBy: labUser._id
    });

    const labResult1 = await LabResultModel.create({
      labOrderId: labOrder1._id,
      patientId: patientProfile._id,
      userId: patientUser._id,
      technicianId: labUser._id,
      testName: 'Fasting Plasma Glucose',
      result: '104',
      unit: 'mg/dL',
      referenceRange: '70 - 99 mg/dL',
      flag: 'High',
      remarks: 'Mild fasting hyperglycemia noted.',
      status: 'released',
      verifiedBy: labUser._id,
      verifiedAt: new Date()
    });

    // 12. Create Sample Invoices (1 Paid, 1 Pending)
    const inv1 = await InvoiceModel.create({
      patientId: patientProfile._id,
      userId: patientUser._id,
      appointmentId: apt1._id,
      invoiceNumber: 'INV-2026-0001',
      items: [
        {
          description: 'Cardiology Specialist Consultation',
          quantity: 1,
          unitPrice: 800,
          totalPrice: 800
        },
        {
          description: 'Fasting Plasma Glucose Panel',
          quantity: 1,
          unitPrice: 450,
          totalPrice: 450
        }
      ],
      subtotal: 1250,
      discount: 100,
      taxAmount: 50,
      totalAmount: 1200,
      amountPaid: 1200,
      balanceDue: 0,
      paymentStatus: 'paid',
      paymentMethod: 'Credit Card',
      paidAt: new Date()
    });

    const inv2 = await InvoiceModel.create({
      patientId: patientProfile._id,
      userId: patientUser._id,
      appointmentId: apt2._id,
      invoiceNumber: 'INV-2026-0002',
      items: [
        {
          description: 'Complete Blood Count (CBC) Laboratory Work',
          quantity: 1,
          unitPrice: 350,
          totalPrice: 350
        },
        {
          description: 'Nursing & Specimen Handling Fee',
          quantity: 1,
          unitPrice: 150,
          totalPrice: 150
        }
      ],
      subtotal: 500,
      discount: 0,
      taxAmount: 25,
      totalAmount: 525,
      amountPaid: 0,
      balanceDue: 525,
      paymentStatus: 'pending',
      paymentMethod: 'Pending'
    });

    // 13. Create Sample Follow-up
    const fu1 = await FollowUpModel.create({
      patientId: patientProfile._id,
      userId: patientUser._id,
      doctorId: doctorProfile._id,
      doctorUserId: doctorUser._id,
      appointmentId: apt1._id,
      followUpDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      instructions: 'Review blood pressure log and check repeat fasting glucose levels.',
      status: 'pending'
    });

    // 14. Initial Audit Logs
    await AuditLogModel.create([
      {
        userId: admin._id,
        userName: admin.name,
        role: admin.role,
        action: 'SYSTEM_INIT',
        module: 'SYSTEM',
        details: 'MedAssist database seeded and initialized with role permissions.'
      },
      {
        userId: doctorUser._id,
        userName: doctorUser.name,
        role: doctorUser.role,
        action: 'CREATE_NOTE',
        module: 'MEDICAL',
        recordId: note1._id.toString(),
        details: 'Doctor recorded clinical consultation note.'
      },
      {
        userId: labUser._id,
        userName: labUser.name,
        role: labUser.role,
        action: 'RELEASE_LAB_RESULT',
        module: 'LAB',
        recordId: labResult1._id.toString(),
        details: 'Lab technician verified and released diagnostic result.'
      }
    ]);

    console.log('🎉 Seed database completed successfully!');
    console.log(`
      Test Logins (Password: password123):
      👑 Admin:        admin@medassist.com
      🩺 Doctor:       doctor@medassist.com
      📋 Receptionist: reception@medassist.com
      🔬 Lab Tech:     lab@medassist.com
      👤 Patient:      patient@medassist.com
    `);

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedDatabase();
