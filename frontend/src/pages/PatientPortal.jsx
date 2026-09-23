import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Timeline } from '../components/Timeline';
import { AIPatientExplainerModal } from '../components/AIPatientExplainerModal';
import { PrescriptionPrintView } from '../components/PrescriptionPrintView';
import { LabReportPrintView } from '../components/LabReportPrintView';
import { InvoicePrintView } from '../components/InvoicePrintView';
import { 
  Heart, 
  Sparkles, 
  Calendar, 
  Pill, 
  FlaskConical, 
  CreditCard, 
  Clock, 
  Printer, 
  AlertTriangle, 
  Plus, 
  Loader2,
  CheckCircle,
  FileText
} from 'lucide-react';

export const PatientPortal = ({ activeSubTab = 'dashboard' }) => {
  const { user } = useAuth();
  const [timelineData, setTimelineData] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [labReports, setLabReports] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [selectedRxForAI, setSelectedRxForAI] = useState(null);
  const [printPrescription, setPrintPrescription] = useState(null);
  const [printLabReport, setPrintLabReport] = useState(null);
  const [printInvoice, setPrintInvoice] = useState(null);

  // Quick Book Modal
  const [showBookModal, setShowBookModal] = useState(false);
  const [bookDoctor, setBookDoctor] = useState('');
  const [bookDate, setBookDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookSlots, setBookSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [bookComplaint, setBookComplaint] = useState('');

  // Payment Modal
  const [payInvoiceModal, setPayInvoiceModal] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [timelineRes, rxRes, labRes, invRes, aptRes, docsRes] = await Promise.all([
        api.getPatientTimeline(),
        api.getPrescriptions(),
        api.getLabOrders(),
        api.getInvoices(),
        api.getAppointments(),
        api.getUsers({ role: 'doctor' })
      ]);

      if (timelineRes.success) setTimelineData(timelineRes);
      if (rxRes.success) setPrescriptions(rxRes.data);
      if (labRes.success) setLabReports(labRes.data);
      if (invRes.success) setInvoices(invRes.data);
      if (aptRes.success) setAppointments(aptRes.data);
      if (docsRes.success) setDoctors(docsRes.data);
    } catch (err) {
      console.error('Error fetching patient portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const loadSlots = async () => {
      if (bookDoctor && bookDate) {
        try {
          const res = await api.getDoctorSlots(bookDoctor, bookDate);
          if (res.success) setBookSlots(res.data);
        } catch (err) {
          console.error(err);
        }
      }
    };
    loadSlots();
  }, [bookDoctor, bookDate]);

  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      alert('Please choose a time slot.');
      return;
    }
    try {
      const res = await api.createAppointment({
        doctorId: bookDoctor,
        date: bookDate,
        timeSlot: selectedSlot,
        type: 'Scheduled',
        chiefComplaint: bookComplaint
      });
      if (res.success) {
        alert('Appointment requested successfully!');
        setShowBookModal(false);
        setAppointments([...appointments, res.data]);
        setSelectedSlot('');
        setBookComplaint('');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handlePayInvoice = async (e) => {
    e.preventDefault();
    if (!payInvoiceModal) return;

    try {
      const res = await api.processPayment(payInvoiceModal._id, {
        amountPaid: payInvoiceModal.balanceDue,
        paymentMethod
      });
      if (res.success) {
        alert('Payment successful! Receipt generated.');
        setPayInvoiceModal(null);
        setInvoices(invoices.map(inv => inv._id === payInvoiceModal._id ? res.data : inv));
      }
    } catch (err) {
      alert('Payment failed: ' + err.message);
    }
  };

  const profile = timelineData?.profile || {};
  const upcomingApt = appointments.find(a => a.status === 'scheduled' || a.status === 'checked_in');

  if (loading && !timelineData) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Loader2 size={36} className="animate-spin" color="#059669" />
      </div>
    );
  }

  return (
    <div className="page-body">
      {/* Patient Greeting Card */}
      <div className="card" style={{
        marginBottom: '28px',
        background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
        color: '#ffffff',
        border: 'none',
        boxShadow: '0 10px 25px -5px rgba(5, 150, 105, 0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#a7f3d0', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Heart size={16} /> Patient Health Care Home
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '6px 0', color: 'white' }}>
              Welcome, {user?.name}
            </h1>
            <div style={{ fontSize: '0.85rem', color: '#ccfbf1' }}>
              Patient Code: <strong>{profile.patientCode || 'PAT-CURRENT'}</strong> • Blood Group: <strong>{profile.bloodGroup || 'O+'}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setShowBookModal(true)} className="btn btn-secondary" style={{ background: '#ffffff', color: '#065f46', border: 'none' }}>
              <Plus size={16} /> Book Appointment
            </button>
          </div>
        </div>

        {/* Quick Highlights Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#a7f3d0', textTransform: 'uppercase' }}>Upcoming Visit</div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
              {upcomingApt ? `${upcomingApt.date} (${upcomingApt.timeSlot})` : 'No upcoming visit'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#a7f3d0', textTransform: 'uppercase' }}>Active Prescriptions</div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{prescriptions.length} Records</div>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#a7f3d0', textTransform: 'uppercase' }}>Verified Lab Reports</div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{labReports.length} Reports Ready</div>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#a7f3d0', textTransform: 'uppercase' }}>Known Allergies</div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
              {profile.allergies?.length > 0 ? profile.allergies.join(', ') : 'None'}
            </div>
          </div>
        </div>
      </div>

      {/* Sub Tabs Switching */}
      {activeSubTab === 'prescriptions' && (
        <div className="card" style={{ marginBottom: '28px' }}>
          <div className="card-header">
            <div className="card-title">
              <Pill size={20} color="#059669" /> My Prescriptions & AI Plain-English Guides
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {prescriptions.map((rx) => (
              <div key={rx._id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>{rx.prescriptionNumber}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      Prescribed by {rx.doctor?.name} on {new Date(rx.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setSelectedRxForAI(rx)} className="btn btn-ai btn-sm">
                      <Sparkles size={14} /> AI Plain English Guide
                    </button>
                    <button onClick={() => setPrintPrescription(rx)} className="btn btn-secondary btn-sm">
                      <Printer size={14} /> Print Rx
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {rx.medications.map((m, i) => (
                    <div key={i} style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '10px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>{m.medicineName}</strong> — {m.dosage} ({m.frequency})
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Timing: {m.timing} for {m.duration}</div>
                      </div>
                      <span style={{ fontSize: '0.75rem', background: '#ecfdf5', color: '#047857', padding: '2px 8px', borderRadius: '9999px', fontWeight: 600 }}>
                        Active
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'lab' && (
        <div className="card" style={{ marginBottom: '28px' }}>
          <div className="card-header">
            <div className="card-title">
              <FlaskConical size={20} color="#0d9488" /> Diagnostic Test Reports
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Report #</th>
                  <th>Investigations</th>
                  <th>Status</th>
                  <th>Report Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {labReports.map((lab) => (
                  <tr key={lab._id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#0284c7' }}>
                      {lab.orderNumber}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{lab.tests.map(t => t.testName).join(', ')}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Specimen: {lab.specimenType}</div>
                    </td>
                    <td>
                      <span className="badge badge-verified">
                        Verified & Released
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {new Date(lab.verifiedAt || lab.completedAt || lab.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <button onClick={() => setPrintLabReport(lab)} className="btn btn-secondary btn-sm">
                        <Printer size={14} /> View / Print Report
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'billing' && (
        <div className="card" style={{ marginBottom: '28px' }}>
          <div className="card-header">
            <div className="card-title">
              <CreditCard size={20} color="#9333ea" /> Invoices & Payment Receipts
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Services</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv._id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{inv.invoiceNumber}</td>
                    <td>{inv.items.map(i => i.description).join(', ')}</td>
                    <td style={{ fontWeight: 800 }}>₹{inv.totalAmount.toFixed(2)}</td>
                    <td>
                      <span className={`badge badge-${inv.status}`}>{inv.status}</span>
                    </td>
                    <td>{new Date(inv.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {inv.status !== 'paid' && (
                          <button onClick={() => setPayInvoiceModal(inv)} className="btn btn-teal btn-sm">
                            <CreditCard size={14} /> Pay Now
                          </button>
                        )}
                        <button onClick={() => setPrintInvoice(inv)} className="btn btn-secondary btn-sm">
                          <Printer size={14} /> Receipt
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 360° Comprehensive Timeline Home View */}
      {(activeSubTab === 'dashboard' || activeSubTab === 'timeline') && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Clock size={20} color="#0284c7" /> 360° Comprehensive Medical History Timeline
            </div>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              All visits, clinical notes, prescriptions, investigations & invoices in chronological order
            </span>
          </div>

          <Timeline
            timelineData={timelineData?.timeline || []}
            onOpenAIModal={(rxData) => setSelectedRxForAI(rxData)}
            onPrintItem={(item) => {
              if (item.type === 'PRESCRIPTION') setPrintPrescription(item.data);
              else if (item.type === 'LAB_INVESTIGATION') setPrintLabReport(item.data);
              else if (item.type === 'BILLING') setPrintInvoice(item.data);
            }}
          />
        </div>
      )}

      {/* Book Appointment Modal */}
      {showBookModal && (
        <div className="modal-overlay" onClick={() => setShowBookModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontWeight: 700 }}>Book a Doctor Appointment</h3>
              <button onClick={() => setShowBookModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleBook} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Select Doctor *</label>
                <select
                  required
                  className="form-control"
                  value={bookDoctor}
                  onChange={(e) => setBookDoctor(e.target.value)}
                >
                  <option value="">-- Choose Doctor --</option>
                  {doctors.map(d => (
                    <option key={d._id} value={d._id}>{d.name} ({d.profile?.department || 'Specialist'})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Date *</label>
                <input
                  type="date"
                  required
                  className="form-control"
                  value={bookDate}
                  onChange={(e) => setBookDate(e.target.value)}
                />
              </div>

              {bookDoctor && (
                <div className="form-group">
                  <label className="form-label">Available Slots</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
                    {bookSlots.map((s, idx) => (
                      <button
                        type="button"
                        key={idx}
                        disabled={!s.isAvailable}
                        onClick={() => setSelectedSlot(s.slot)}
                        style={{
                          padding: '6px',
                          borderRadius: '6px',
                          border: selectedSlot === s.slot ? '2px solid #059669' : '1px solid #e2e8f0',
                          background: !s.isAvailable ? '#f1f5f9' : (selectedSlot === s.slot ? '#ecfdf5' : '#ffffff'),
                          color: !s.isAvailable ? '#94a3b8' : (selectedSlot === s.slot ? '#065f46' : '#0f172a'),
                          fontWeight: selectedSlot === s.slot ? 700 : 500,
                          fontSize: '0.75rem',
                          cursor: s.isAvailable ? 'pointer' : 'not-allowed'
                        }}
                      >
                        {s.slot}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Reason / Symptoms</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Describe reason for visit..."
                  value={bookComplaint}
                  onChange={(e) => setBookComplaint(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button type="button" onClick={() => setShowBookModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-teal">
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Online Modal */}
      {payInvoiceModal && (
        <div className="modal-overlay" onClick={() => setPayInvoiceModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontWeight: 700 }}>Secure Checkout</h3>
              <button onClick={() => setPayInvoiceModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handlePayInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '6px' }}>
                  <span>Invoice Number:</span>
                  <strong>{payInvoiceModal.invoiceNumber}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                  <span>Amount to Pay:</span>
                  <span style={{ color: '#059669' }}>₹{payInvoiceModal.balanceDue.toFixed(2)}</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select
                  className="form-control"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="UPI">UPI / Instant Transfer</option>
                  <option value="Insurance">Insurance Claim</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                Pay ₹{payInvoiceModal.balanceDue.toFixed(2)} & Download Receipt
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modals for AI, Rx, Lab, Invoice */}
      <AIPatientExplainerModal
        isOpen={!!selectedRxForAI}
        onClose={() => setSelectedRxForAI(null)}
        prescription={selectedRxForAI}
      />

      <PrescriptionPrintView
        prescription={printPrescription}
        onClose={() => setPrintPrescription(null)}
      />

      <LabReportPrintView
        labOrder={printLabReport}
        onClose={() => setPrintLabReport(null)}
      />

      <InvoicePrintView
        invoice={printInvoice}
        onClose={() => setPrintInvoice(null)}
      />
    </div>
  );
};
