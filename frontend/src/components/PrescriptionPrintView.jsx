import React from 'react';
import { Activity, Printer, X, Download } from 'lucide-react';

export const PrescriptionPrintView = ({ prescription, onClose }) => {
  if (!prescription) return null;

  const doctorName = prescription.doctorId?.fullName || prescription.doctor?.name || 'Dr. Clinic Physician';
  const doctorSpec = prescription.doctorId?.specialization || 'General Medicine';
  const doctorLicense = prescription.doctorId?.licenseNumber || 'MCI-STATE-REG';
  const patientName = prescription.patientId?.fullName || prescription.patient?.name || 'Patient';
  const patientPhone = prescription.patientId?.phone || prescription.patient?.phone || 'N/A';

  const handlePrintOrDownload = () => {
    const originalTitle = document.title;
    document.title = `MedAssist_Prescription_${prescription.prescriptionNumber || 'RX'}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl my-8">
        {/* Action Header */}
        <div className="no-print flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-sky-600" />
            <h3 className="font-black text-slate-900 text-base">Official Medical Prescription (Rx)</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintOrDownload}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition shadow-md"
              title="Print or Save as PDF"
            >
              <Download className="w-4 h-4" /> Download PDF / Print
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet */}
        <div className="printable-area bg-white text-slate-900 font-sans p-4 sm:p-6">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-sky-600 pb-5 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-black">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight m-0">MedAssist Healthcare Clinic</h1>
                <p className="text-xs text-slate-500 m-0">Department of Outpatient Clinical Medicine • Electronic Medical Prescription</p>
              </div>
            </div>

            <div className="text-right text-xs">
              <div className="font-mono font-black text-sm text-slate-900">{prescription.prescriptionNumber}</div>
              <div className="text-slate-500 mt-0.5">Date: {new Date(prescription.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
            </div>
          </div>

          {/* Doctor & Patient Info Strip */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl mb-6 text-xs border border-slate-200">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Prescribing Physician</div>
              <div className="font-bold text-sm text-slate-900">Dr. {doctorName}</div>
              <div className="text-slate-600 mt-0.5">{doctorSpec}</div>
              <div className="text-slate-500 text-[11px]">License: {doctorLicense}</div>
            </div>

            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Patient Demographics</div>
              <div className="font-bold text-sm text-slate-900">{patientName}</div>
              <div className="text-slate-600 mt-0.5">Contact: {patientPhone}</div>
              <div className="text-slate-500 text-[11px]">Encounter Status: Clinical Verified</div>
            </div>
          </div>

          {/* Diagnosis */}
          {prescription.diagnosis && (
            <div className="mb-6 bg-sky-50 border-l-4 border-sky-600 p-3 rounded-r-xl text-xs">
              <strong className="text-sky-900">Clinical Assessment / Diagnosis:</strong>
              <span className="text-sky-800 ml-2 font-semibold">{prescription.diagnosis}</span>
            </div>
          )}

          {/* Medications Table */}
          <div className="mb-6 overflow-hidden rounded-xl border border-slate-200">
            <div className="bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 border-b border-slate-200">
              Prescribed Medications (Rx)
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Medication Name</th>
                  <th className="py-2.5 px-3">Dosage</th>
                  <th className="py-2.5 px-3">Frequency</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Special Instructions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(prescription.medicines || prescription.items || []).map((m, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 px-3 text-slate-500 font-semibold">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{m.name || m.medicineName}</td>
                    <td className="py-2.5 px-3 text-slate-700 font-medium">{m.dosage || 'Standard'}</td>
                    <td className="py-2.5 px-3 text-slate-700">{m.frequency}</td>
                    <td className="py-2.5 px-3 text-slate-700">{m.duration}</td>
                    <td className="py-2.5 px-3 text-slate-600 italic">{m.instructions || m.timing || 'As directed'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* AI / Patient Explanations */}
          {prescription.plainLanguageSummary && (
            <div className="mb-6 bg-teal-50 border border-teal-200 p-4 rounded-2xl text-xs space-y-1">
              <strong className="text-teal-900 font-black">Patient Non-Diagnostic Medication Guidance:</strong>
              <p className="text-teal-800 m-0 leading-relaxed">{prescription.plainLanguageSummary}</p>
            </div>
          )}

          {/* Signatures */}
          <div className="border-t border-slate-200 pt-8 mt-8 flex justify-between items-end text-xs">
            <div className="text-slate-400 text-[11px]">
              <p className="m-0 font-semibold text-slate-600">MedAssist Clinical Portal</p>
              <p className="m-0">Authenticated via Secure Digital Clinical Protocol</p>
            </div>
            <div className="text-right">
              <div className="w-44 border-b border-dashed border-slate-400 mb-1"></div>
              <div className="font-bold text-slate-900">Dr. {doctorName}</div>
              <div className="text-[11px] text-slate-500">{doctorSpec}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
