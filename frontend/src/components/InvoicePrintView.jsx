import React from 'react';
import { CreditCard, Printer, X, Download, CheckCircle2 } from 'lucide-react';

export const InvoicePrintView = ({ invoice, onClose }) => {
  if (!invoice) return null;

  const patientName = invoice.patientId?.fullName || invoice.patient?.fullName || invoice.patient?.name || 'Valued Patient';
  const patientPhone = invoice.patientId?.phone || invoice.patient?.phone || 'N/A';
  const patientCode = invoice.patientId?.patientCode || 'PAT-ESTABLISHED';
  const paymentStatus = (invoice.paymentStatus || invoice.status || 'pending').toUpperCase();

  const handlePrintOrDownload = () => {
    const originalTitle = document.title;
    document.title = `MedAssist_Invoice_${invoice.invoiceNumber || 'INV'}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl my-8">
        {/* Action Header (Hidden in Print/PDF) */}
        <div className="no-print flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            <h3 className="font-black text-slate-900 text-base">Official Clinical Tax Invoice</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintOrDownload}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-md"
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

        {/* Printable Area - Isolated Clean White Sheet */}
        <div className="printable-area bg-white text-slate-900 font-sans p-4 sm:p-6">
          {/* Header Banner */}
          <div className="flex justify-between items-start border-b-2 border-emerald-600 pb-5 mb-6">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight m-0">MedAssist Healthcare Clinic</h1>
                  <p className="text-xs text-slate-500 m-0">Patient Billing & Outpatient Accounts • Official Tax Invoice</p>
                </div>
              </div>
            </div>

            <div className="text-right text-xs">
              <div className="font-mono font-black text-sm text-slate-900">{invoice.invoiceNumber}</div>
              <div className="text-slate-500 mt-0.5">Date: {new Date(invoice.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
              <div className="mt-1">
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {paymentStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Patient & Payment Information Strip */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl mb-6 text-xs border border-slate-200">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Billed To (Patient)</div>
              <div className="font-bold text-sm text-slate-900">{patientName}</div>
              <div className="text-slate-600 mt-0.5">Patient ID: <span className="font-mono font-semibold">{patientCode}</span></div>
              <div className="text-slate-600">Contact: {patientPhone}</div>
            </div>

            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Payment Method & Settlement</div>
              <div className="font-bold text-slate-900">Mode: {invoice.paymentMethod || 'Cash / Front-Desk'}</div>
              <div className="text-slate-600 mt-0.5">Payment Status: <span className="font-bold">{paymentStatus}</span></div>
              <div className="text-slate-500 text-[11px]">Authorized by: Front-Desk Cashier / Reception</div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="mb-6 overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Service / Procedure Description</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Price (₹)</th>
                  <th className="py-2.5 px-3 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(invoice.items || []).map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 px-3 font-semibold text-slate-500">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{item.description || item.itemName || 'Clinical Service'}</td>
                    <td className="py-2.5 px-3 text-center text-slate-600">{item.quantity || 1}</td>
                    <td className="py-2.5 px-3 text-right text-slate-700 font-medium">₹{Number(item.unitPrice).toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right text-slate-900 font-black">₹{Number(item.totalPrice || (item.unitPrice * (item.quantity || 1))).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Totals Breakdown */}
          <div className="flex justify-end mb-8">
            <div className="w-72 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold">₹{Number(invoice.subtotal || invoice.totalAmount).toFixed(2)}</span>
              </div>
              {invoice.taxAmount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Applicable Tax:</span>
                  <span className="font-semibold">+₹{Number(invoice.taxAmount).toFixed(2)}</span>
                </div>
              )}
              {invoice.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount:</span>
                  <span className="font-semibold">-₹{Number(invoice.discountAmount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-sm text-slate-900 border-t border-slate-200 pt-2">
                <span>Total Amount:</span>
                <span>₹{Number(invoice.totalAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>Amount Paid:</span>
                <span>₹{Number(invoice.amountPaid).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold border-t border-dashed border-slate-300 pt-1.5">
                <span className={invoice.balanceDue > 0 ? 'text-red-600' : 'text-slate-600'}>Balance Due:</span>
                <span className={invoice.balanceDue > 0 ? 'text-red-600 font-black' : 'text-slate-600'}>
                  ₹{Number(invoice.balanceDue).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Official Sign-off & Notice */}
          <div className="border-t border-slate-200 pt-6 flex justify-between items-end text-xs text-slate-500">
            <div>
              <p className="font-bold text-slate-700 mb-0.5">MedAssist Multi-Speciality Clinic</p>
              <p className="m-0 text-[11px]">This is a computer-generated tax receipt. Valid without signature.</p>
            </div>
            <div className="text-right">
              <div className="w-36 border-b border-dashed border-slate-400 mb-1"></div>
              <span className="text-[11px] font-bold text-slate-700">Authorized Accounts Signatory</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
