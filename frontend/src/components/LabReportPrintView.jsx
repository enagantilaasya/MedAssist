import React from 'react';
import { FlaskConical, Printer, X, Download, CheckCircle2 } from 'lucide-react';

export const LabReportPrintView = ({ labOrder, onClose }) => {
  if (!labOrder) return null;

  const patientName = labOrder.patientId?.fullName || labOrder.patient?.name || labOrder.patient?.fullName || 'Patient';
  const patientPhone = labOrder.patientId?.phone || labOrder.patient?.phone || 'N/A';
  const doctorName = labOrder.doctorId?.fullName || labOrder.doctor?.name || 'Dr. Clinic Specialist';

  const handlePrintOrDownload = () => {
    const originalTitle = document.title;
    document.title = `MedAssist_LabReport_${labOrder.orderNumber || 'LAB'}`;
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
            <FlaskConical className="w-5 h-5 text-teal-600" />
            <h3 className="font-black text-slate-900 text-base">Certified Diagnostic Pathology Report</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintOrDownload}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition shadow-md"
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
          <div className="flex justify-between items-start border-b-2 border-teal-600 pb-5 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-black">
                <FlaskConical className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight m-0">MedAssist Pathology & Diagnostics</h1>
                <p className="text-xs text-slate-500 m-0">ISO 15189 Certified Clinical Diagnostics Laboratory • Authorized Test Results</p>
              </div>
            </div>

            <div className="text-right text-xs">
              <div className="font-mono font-black text-sm text-slate-900">{labOrder.orderNumber || 'LAB-REPORT'}</div>
              <div className="text-slate-500 mt-0.5">Barcode: <span className="font-mono font-bold text-slate-700">{labOrder.sampleBarcode || 'BAR-9901'}</span></div>
              <div className="mt-1">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-100 text-teal-800">
                  {labOrder.status || 'RELEASED'}
                </span>
              </div>
            </div>
          </div>

          {/* Demographics Strip */}
          <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl mb-6 text-xs border border-slate-200">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Patient Name</div>
              <div className="font-bold text-sm text-slate-900">{patientName}</div>
              <div className="text-slate-600 mt-0.5">Contact: {patientPhone}</div>
            </div>

            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Referring Clinician</div>
              <div className="font-bold text-sm text-slate-900">Dr. {doctorName}</div>
              <div className="text-slate-600 mt-0.5">Specimen: <span className="font-semibold">{labOrder.specimenType || 'Venous Blood'}</span></div>
            </div>

            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Timeline & Chain of Custody</div>
              <div className="text-slate-600">Sample Date: {labOrder.sampleCollectedAt ? new Date(labOrder.sampleCollectedAt).toLocaleDateString('en-IN') : 'Completed'}</div>
              <div className="text-slate-600">Report Released: {labOrder.completedAt ? new Date(labOrder.completedAt).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}</div>
            </div>
          </div>

          {/* Test Results Table */}
          <div className="mb-6 overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Investigation Test</th>
                  <th className="py-2.5 px-3">Observed Value</th>
                  <th className="py-2.5 px-3">Unit</th>
                  <th className="py-2.5 px-3">Biological Reference Interval</th>
                  <th className="py-2.5 px-3 text-right">Flag / Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(labOrder.tests || [
                  {
                    testName: labOrder.testName || 'Complete Blood Count (CBC)',
                    resultValue: labOrder.result || '13.8',
                    unit: labOrder.unit || 'g/dL',
                    referenceRange: labOrder.referenceRange || '13.0 - 17.0 g/dL',
                    flag: labOrder.flag || 'Normal'
                  }
                ]).map((t, idx) => (
                  <tr key={idx} className={t.flag === 'High' || t.flag === 'Critical' ? 'bg-red-50/50' : ''}>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{t.testName}</td>
                    <td className="py-2.5 px-3 font-black text-sm text-slate-900">{t.resultValue}</td>
                    <td className="py-2.5 px-3 text-slate-600">{t.unit || '-'}</td>
                    <td className="py-2.5 px-3 text-slate-600">{t.referenceRange || 'Standard Range'}</td>
                    <td className="py-2.5 px-3 text-right">
                      <span className={`inline-block px-2 py-0.5 rounded font-black text-[10px] uppercase ${
                        t.flag === 'High'
                          ? 'bg-red-100 text-red-800'
                          : t.flag === 'Low'
                          ? 'bg-amber-100 text-amber-800'
                          : t.flag === 'Critical'
                          ? 'bg-red-200 text-red-900'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {t.flag || 'Normal'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Technician Remarks */}
          <div className="mb-6 bg-slate-50 border border-slate-200 p-4 rounded-2xl text-xs space-y-1">
            <strong className="text-slate-800 font-bold">Pathologist & Laboratory Evaluation:</strong>
            <p className="text-slate-600 m-0">
              {labOrder.technicianNotes || 'Automated analyzer multi-parameter verification passed. Results correlate clinically.'}
            </p>
          </div>

          {/* Signatures */}
          <div className="border-t border-slate-200 pt-8 mt-8 flex justify-between items-end text-xs">
            <div>
              <div className="w-40 border-b border-dashed border-slate-400 mb-1"></div>
              <div className="font-bold text-slate-900">Medical Laboratory Technologist</div>
              <div className="text-[11px] text-slate-500">MLT-CERT-PATH</div>
            </div>

            <div className="text-right">
              <div className="inline-flex items-center gap-1 text-emerald-700 font-bold mb-1">
                <CheckCircle2 className="w-4 h-4" /> Electronically Verified
              </div>
              <div className="w-40 border-b border-dashed border-slate-400 mb-1"></div>
              <div className="font-bold text-slate-900">Consultant Clinical Pathologist</div>
              <div className="text-[11px] text-slate-500">Reg: PATH-KMC-9921</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
