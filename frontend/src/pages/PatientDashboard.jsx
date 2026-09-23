import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { DashboardCard } from '../components/DashboardCard';
import { AppointmentCard } from '../components/AppointmentCard';
import { 
  Heart, 
  Calendar, 
  Pill, 
  FlaskConical, 
  CreditCard, 
  Sparkles, 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Printer, 
  FileText, 
  User, 
  ShieldAlert,
  ChevronRight,
  Download
} from 'lucide-react';
import { InvoicePrintView } from '../components/InvoicePrintView';
import { PrescriptionPrintView } from '../components/PrescriptionPrintView';
import { LabReportPrintView } from '../components/LabReportPrintView';

export const PatientDashboard = () => {
  const { user } = useAuthStore();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('timeline');
  const [loading, setLoading] = useState(true);

  // Synchronize activeTab with URL subpath
  useEffect(() => {
    if (location.pathname.includes('/appointments')) setActiveTab('appointments');
    else if (location.pathname.includes('/prescriptions')) setActiveTab('prescriptions');
    else if (location.pathname.includes('/reports')) setActiveTab('labs');
    else if (location.pathname.includes('/invoices')) setActiveTab('invoices');
    else setActiveTab('timeline');
  }, [location.pathname]);

  // Data states
  const [patientProfile, setPatientProfile] = useState(null);
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [labResults, setLabResults] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [doctors, setDoctors] = useState([]);

  // Booking Modal
  const [showBookModal, setShowBookModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [bookDate, setBookDate] = useState(new Date().toISOString().split('T')[0]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [reason, setReason] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  // AI Explainer Modal
  const [selectedRx, setSelectedRx] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState(null);

  // Payment Modal
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState('Credit Card');
  const [paying, setPaying] = useState(false);

  // Print Item Modal
  const [printItem, setPrintItem] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [timelineRes, aptsRes, rxRes, labRes, invRes, docsRes] = await Promise.all([
        api.get('/medical/timeline').catch(() => ({ data: { success: false, timeline: [] } })),
        api.get('/appointments/all').catch(() => ({ data: { success: false, payload: [] } })),
        api.get('/prescriptions/all').catch(() => ({ data: { success: false, payload: [] } })),
        api.get('/lab/results').catch(() => ({ data: { success: false, payload: [] } })),
        api.get('/invoices/all').catch(() => ({ data: { success: false, payload: [] } })),
        api.get('/doctors/all').catch(() => ({ data: { success: false, payload: [] } }))
      ]);

      if (timelineRes.data?.success) {
        setTimelineEvents(timelineRes.data.timeline || []);
        if (timelineRes.data.patient) setPatientProfile(timelineRes.data.patient);
      }
      if (aptsRes.data?.success) setAppointments(aptsRes.data.payload || []);
      if (rxRes.data?.success) setPrescriptions(rxRes.data.payload || []);
      if (labRes.data?.success) setLabResults(labRes.data.payload || []);
      if (invRes.data?.success) setInvoices(invRes.data.payload || []);
      if (docsRes.data?.success) setDoctors(docsRes.data.payload || []);
    } catch (err) {
      console.error('Failed to load patient dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch doctor slots when doctor or date changes
  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedDoctor || !bookDate) {
        setAvailableSlots([]);
        return;
      }
      try {
        const res = await api.get(`/doctors/slots/${selectedDoctor}?date=${bookDate}`);
        if (res.data?.success) {
          const slotsList = res.data.payload?.availableSlots || (Array.isArray(res.data.payload) ? res.data.payload.filter(s => s.isAvailable).map(s => s.slot) : []);
          setAvailableSlots(slotsList);
          setSelectedSlot(slotsList[0] || '10:00 AM');
        }
      } catch (err) {
        console.error('Error fetching slots:', err);
        const fallback = ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM'];
        setAvailableSlots(fallback);
        setSelectedSlot('09:00 AM');
      }
    };
    fetchSlots();
  }, [selectedDoctor, bookDate]);

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!selectedDoctor || !selectedSlot) {
      alert('Please choose a doctor and an available time slot.');
      return;
    }
    setBookingLoading(true);
    try {
      const res = await api.post('/appointments/add', {
        doctorId: selectedDoctor,
        appointmentDate: bookDate,
        appointmentTime: selectedSlot,
        reason: reason || 'Routine Checkup'
      });

      if (res.data?.success) {
        alert('Appointment successfully booked!');
        setShowBookModal(false);
        setReason('');
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to book appointment. Doctor may have a conflict.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleOpenAiExplainer = async (rx) => {
    setSelectedRx(rx);
    if (rx.aiExplanation && rx.aiExplanation.summary) {
      setAiExplanation(rx.aiExplanation);
      return;
    }
    setAiLoading(true);
    try {
      const res = await api.post(`/prescriptions/explain/${rx._id}`);
      if (res.data?.success) {
        setAiExplanation(res.data.payload);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Could not generate AI explanation');
    } finally {
      setAiLoading(false);
    }
  };

  const handleOpenPayModal = (inv) => {
    setSelectedInvoice(inv);
    setPayAmount(inv.balanceDue);
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setPaying(true);
    try {
      const res = await api.post(`/invoices/pay/${selectedInvoice._id}`, {
        amountPaid: Number(payAmount),
        paymentMethod: payMethod
      });
      if (res.data?.success) {
        alert('Payment processed successfully in Rupees (₹)!');
        setSelectedInvoice(null);
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Payment processing failed');
    } finally {
      setPaying(false);
    }
  };

  const pendingDues = invoices
    .filter(inv => inv.paymentStatus !== 'paid')
    .reduce((acc, curr) => acc + (curr.balanceDue || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Patient Header Profile */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center font-black text-2xl shadow-inner">
              {patientProfile?.fullName?.[0] || user?.name?.[0] || 'P'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                  {patientProfile?.fullName || user?.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 backdrop-blur-sm border border-white/30">
                  {patientProfile?.bloodGroup || 'Blood: O+'}
                </span>
              </div>
              <p className="text-emerald-100 text-xs sm:text-sm mt-1">
                UHID: {patientProfile?.patientCode || patientProfile?.uhid || 'MED-PT-001'} • Gender: {patientProfile?.gender || 'N/A'} • Phone: {patientProfile?.phone || user?.phone || 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowBookModal(true)}
              className="px-5 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-black rounded-xl shadow-md transition inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Book Appointment
            </button>
          </div>
        </div>

        {/* Clinical alerts row */}
        {(patientProfile?.allergies?.length > 0 || patientProfile?.chronicConditions?.length > 0) && (
          <div className="mt-6 pt-4 border-t border-white/20 flex flex-wrap items-center gap-4 text-xs font-medium">
            {patientProfile?.allergies?.length > 0 && (
              <div className="flex items-center gap-1.5 text-amber-200 bg-amber-950/30 px-3 py-1 rounded-lg">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Allergies: <strong>{patientProfile.allergies.join(', ')}</strong></span>
              </div>
            )}
            {patientProfile?.chronicConditions?.length > 0 && (
              <div className="flex items-center gap-1.5 text-sky-200 bg-sky-950/30 px-3 py-1 rounded-lg">
                <Heart className="w-3.5 h-3.5" />
                <span>Conditions: <strong>{patientProfile.chronicConditions.join(', ')}</strong></span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Analytics / Stats Row in Rupees (₹) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <DashboardCard
          title="Appointments"
          value={appointments.length}
          subtext="Total booked visits"
          icon={Calendar}
          color="emerald"
        />
        <DashboardCard
          title="Prescriptions"
          value={prescriptions.length}
          subtext="With AI Plain Explainer"
          icon={Pill}
          color="sky"
        />
        <DashboardCard
          title="Lab Reports"
          value={labResults.length}
          subtext="Verified diagnostic results"
          icon={FlaskConical}
          color="teal"
        />
        <DashboardCard
          title="Pending Dues"
          value={`₹${pendingDues.toFixed(2)}`}
          subtext={`${invoices.filter(i => i.paymentStatus !== 'paid').length} unpaid bills`}
          icon={CreditCard}
          color="purple"
        />
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-slate-200 space-x-2 sm:space-x-4 overflow-x-auto pb-1">
        {[
          { id: 'timeline', label: '360° Medical Timeline', icon: Clock },
          { id: 'appointments', label: 'My Appointments', icon: Calendar },
          { id: 'prescriptions', label: 'Prescriptions & AI Guide', icon: Pill },
          { id: 'labs', label: 'Lab Reports', icon: FlaskConical },
          { id: 'invoices', label: 'Billing & Invoices', icon: CreditCard }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold text-xs sm:text-sm transition whitespace-nowrap ${
                isActive
                  ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-xl'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT 1: 360° MEDICAL TIMELINE */}
      {activeTab === 'timeline' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900">Chronological Care Timeline</h2>
            <span className="text-xs text-slate-500 font-medium">{timelineEvents.length} events logged</span>
          </div>

          {timelineEvents.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-400">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold text-slate-600">No medical events on record yet</p>
              <p className="text-xs text-slate-400 mt-1">Book an appointment to begin your health journey.</p>
            </div>
          ) : (
            <div className="relative pl-6 sm:pl-8 border-l-2 border-emerald-200 space-y-6 my-4">
              {timelineEvents.map((evt, idx) => (
                <div key={idx} className="relative group">
                  <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-4 h-4 rounded-full border-2 border-white bg-emerald-600 shadow-md group-hover:scale-125 transition"></div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700">
                          {evt.type}
                        </span>
                        <h3 className="font-black text-slate-900 text-sm">{evt.title}</h3>
                      </div>
                      <span className="text-xs text-slate-400 font-medium">
                        {new Date(evt.date).toLocaleDateString()} {new Date(evt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {evt.doctor && (
                      <p className="text-xs text-sky-700 font-bold mb-1">
                        Doctor / Attending: {evt.doctor}
                      </p>
                    )}

                    <p className="text-xs text-slate-600 mt-1">{evt.details}</p>

                    {evt.type === 'PRESCRIPTION' && evt.data && (
                      <button
                        onClick={() => handleOpenAiExplainer(evt.data)}
                        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-200 transition"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        AI Plain-Language Guide
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 2: APPOINTMENTS */}
      {activeTab === 'appointments' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900">Your Appointment Schedule</h2>
            <button
              onClick={() => setShowBookModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-md inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Book New Visit
            </button>
          </div>

          {appointments.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-400">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold text-slate-600">No scheduled appointments</p>
              <button
                onClick={() => setShowBookModal(true)}
                className="mt-4 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow"
              >
                Schedule Appointment Now
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {appointments.map((apt) => (
                <div key={apt._id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-xs font-bold text-slate-400">Queue #{apt.queueNumber || '-'}</span>
                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                        apt.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                        apt.status === 'confirmed' ? 'bg-sky-100 text-sky-800' :
                        apt.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {apt.status}
                      </span>
                    </div>

                    <h3 className="font-black text-slate-900 text-base mb-1">
                      {apt.doctorId?.fullName || 'Assigned Physician'}
                    </h3>
                    <p className="text-xs text-slate-500 mb-2">
                      {apt.doctorId?.specialization || 'General Practice'} • Suite {apt.doctorId?.roomNumber || '101'}
                    </p>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Date & Time:</span>
                        <span className="font-bold text-slate-800">{apt.appointmentDate} at {apt.appointmentTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Reason:</span>
                        <span className="font-medium text-slate-700">{apt.reason || 'General Consultation'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 3: PRESCRIPTIONS & AI EXPLAINER */}
      {activeTab === 'prescriptions' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">Prescribed Medications</h2>
              <p className="text-xs text-slate-500">Plain-language AI instructions explain when & how to take your drugs safely.</p>
            </div>
          </div>

          {prescriptions.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-400">
              <Pill className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold text-slate-600">No active prescriptions</p>
              <p className="text-xs text-slate-400 mt-1">Prescriptions issued by your doctor will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {prescriptions.map((rx) => (
                <div key={rx._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-xs text-slate-400 font-medium">Issued on {new Date(rx.createdAt).toLocaleDateString()}</span>
                      <h3 className="font-black text-slate-900 text-base">
                        Prescribed by {rx.doctorId?.fullName || 'Physician'}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenAiExplainer(rx)}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow transition inline-flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Explain in Plain English
                      </button>
                      <button
                        onClick={() => setPrintItem({ type: 'PRESCRIPTION', data: rx })}
                        className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition"
                        title="Print Prescription"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Medicines table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                        <tr>
                          <th className="py-2.5 px-4">Medicine</th>
                          <th className="py-2.5 px-4">Dosage</th>
                          <th className="py-2.5 px-4">Frequency</th>
                          <th className="py-2.5 px-4">Duration</th>
                          <th className="py-2.5 px-4">Special Instructions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {rx.medicines?.map((med, mIdx) => (
                          <tr key={mIdx}>
                            <td className="py-2.5 px-4 font-bold text-slate-900">{med.name}</td>
                            <td className="py-2.5 px-4 text-slate-700">{med.dosage}</td>
                            <td className="py-2.5 px-4 text-emerald-700 font-semibold">{med.frequency}</td>
                            <td className="py-2.5 px-4 text-slate-600">{med.duration}</td>
                            <td className="py-2.5 px-4 text-slate-500">{med.instructions || 'With water after food'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {rx.instructions && (
                    <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100 text-xs text-emerald-900">
                      <strong>Doctor's Advice:</strong> {rx.instructions}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 4: VERIFIED LAB REPORTS */}
      {activeTab === 'labs' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">Verified Diagnostic Reports</h2>
              <p className="text-xs text-slate-500">Only verified and doctor-released test results are accessible here.</p>
            </div>
          </div>

          {labResults.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-400">
              <FlaskConical className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold text-slate-600">No released lab results available</p>
              <p className="text-xs text-slate-400 mt-1">Pending test orders become visible once verified by lab staff.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {labResults.map((result) => (
                <div key={result._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                      {result.status}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(result.verifiedAt || result.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-black text-slate-900 text-base">{result.testName}</h3>
                    <p className="text-xs text-slate-500">Verified by: {result.verifiedBy?.name || 'Pathology Staff'}</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-500">Measured Value</div>
                      <div className="text-xl font-black text-slate-900">
                        {result.result} <span className="text-xs font-normal text-slate-500">{result.unit}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500">Reference Interval</div>
                      <div className="text-xs font-bold text-slate-700">{result.referenceRange || 'Standard Range'}</div>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded mt-1 inline-block ${
                        result.flag === 'Normal' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {result.flag}
                      </span>
                    </div>
                  </div>

                  {result.remarks && (
                    <p className="text-xs text-slate-600 italic">"{result.remarks}"</p>
                  )}

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => setPrintItem({ type: 'LAB_REPORT', data: result })}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
                    >
                      <Printer className="w-3.5 h-3.5" /> Printable Lab Certificate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 5: INVOICES & BILLING IN RUPEES (₹) */}
      {activeTab === 'invoices' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">Billing & Payment Statements</h2>
              <p className="text-xs text-slate-500">Review line items, tax breakdowns, and pay outstanding balances securely in Indian Rupees (₹).</p>
            </div>
          </div>

          {invoices.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-400">
              <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold text-slate-600">No invoices on file</p>
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.map((inv) => (
                <div key={inv._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-slate-700">{inv.invoiceNumber}</span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          inv.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {inv.paymentStatus}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">Billed on {new Date(inv.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs text-slate-400">Total Billed</div>
                        <div className="text-lg font-black text-slate-900">₹{inv.totalAmount.toFixed(2)}</div>
                      </div>
                      {inv.paymentStatus !== 'paid' ? (
                        <button
                          onClick={() => handleOpenPayModal(inv)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow transition"
                        >
                          Pay Now (₹{inv.balanceDue.toFixed(2)})
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-black">
                          <CheckCircle2 className="w-4 h-4" /> Settled
                        </span>
                      )}
                      <button
                        onClick={() => setPrintItem({ type: 'INVOICE', data: inv })}
                        className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition"
                        title="Print Receipt"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Line items list */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                        <tr>
                          <th className="py-2 px-3">Service / Item</th>
                          <th className="py-2 px-3">Quantity</th>
                          <th className="py-2 px-3">Unit Price</th>
                          <th className="py-2 px-3 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {inv.items?.map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-2 px-3 text-slate-900 font-bold">{item.description || item.itemName}</td>
                            <td className="py-2 px-3 text-slate-600">{item.quantity}</td>
                            <td className="py-2 px-3 text-slate-600">₹{item.unitPrice.toFixed(2)}</td>
                            <td className="py-2 px-3 text-right font-black text-slate-900">₹{item.totalPrice.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <div>Paid so far: <strong className="text-emerald-700">₹{inv.amountPaid.toFixed(2)}</strong></div>
                    <div>Remaining Balance: <strong className="text-red-600">₹{inv.balanceDue.toFixed(2)}</strong></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: BOOK APPOINTMENT */}
      {showBookModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-lg">Book Clinic Appointment</h3>
              <button onClick={() => setShowBookModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleBookAppointment} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Physician / Specialist</label>
                <select
                  required
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="">-- Choose a Doctor --</option>
                  {doctors.map((doc) => (
                    <option key={doc._id} value={doc._id}>
                      {doc.fullName} ({doc.specialization} - Fee: ₹{doc.consultationFee})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Preferred Date</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={bookDate}
                    onChange={(e) => setBookDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Available Time Slot</label>
                  <select
                    required
                    value={selectedSlot}
                    onChange={(e) => setSelectedSlot(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-medium"
                  >
                    {availableSlots.length > 0 ? (
                      availableSlots.map((slot) => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))
                    ) : (
                      <option value="">No slots found</option>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Visit / Symptoms</label>
                <textarea
                  rows="3"
                  placeholder="Describe your health concern or symptoms briefly..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 font-bold rounded-xl text-white shadow-md transition disabled:opacity-50"
                >
                  {bookingLoading ? 'Checking & Booking...' : 'Confirm Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: AI PLAIN-LANGUAGE EXPLAINER */}
      {selectedRx && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-slate-900 text-lg">AI Plain-English Medication Guide</h3>
              </div>
              <button 
                onClick={() => { setSelectedRx(null); setAiExplanation(null); }} 
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {aiLoading ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <div className="text-sm font-bold text-slate-800">Translating Medical Jargon to Plain English...</div>
                <div className="text-xs text-slate-500">Analyzing dosage schedules, safe intervals, and diet cautions.</div>
              </div>
            ) : aiExplanation ? (
              <div className="space-y-4 text-xs">
                {/* Summary Box */}
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-emerald-950">
                  <div className="font-bold text-xs uppercase tracking-wider text-emerald-800 mb-1">Simple Overview</div>
                  <p className="leading-relaxed">{aiExplanation.summary}</p>
                </div>

                {/* Medication Breakdown */}
                {aiExplanation.medications?.length > 0 && (
                  <div className="space-y-2">
                    <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">How to Take Your Medicines</div>
                    <div className="space-y-2">
                      {aiExplanation.medications.map((m, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-black text-slate-900">{m.medicineName}</span>
                            <span className="text-emerald-700 font-bold">{m.dosage}</span>
                          </div>
                          <p className="text-slate-600">{m.plainExplanation || `${m.frequency} - ${m.timing}`}</p>
                          {m.cautions && <p className="text-amber-700 mt-1 font-semibold text-[11px]">⚠️ {m.cautions}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Warnings & Lifestyle */}
                {aiExplanation.warnings?.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-amber-900">
                    <div className="font-bold mb-1 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      Important Precautions:
                    </div>
                    <ul className="list-disc list-inside space-y-0.5">
                      {aiExplanation.warnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => { setSelectedRx(null); setAiExplanation(null); }}
                    className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow"
                  >
                    Got It, Thank You
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500">
                Failed to generate AI guidance. Please consult your physician directly.
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: PAY INVOICE IN RUPEES (₹) */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-lg">Pay Invoice Balance</h3>
              <button onClick={() => setSelectedInvoice(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleProcessPayment} className="space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Invoice Number:</span>
                  <span className="font-bold text-slate-900">{selectedInvoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Total Amount:</span>
                  <span className="font-bold text-slate-900">₹{selectedInvoice.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Remaining Balance:</span>
                  <span className="font-black text-red-600 text-sm">₹{selectedInvoice.balanceDue.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Amount to Pay (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedInvoice.balanceDue}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-black text-base"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="Credit Card">Credit / Debit Card</option>
                  <option value="Net Banking">Net Banking</option>
                  <option value="Cash">Cash at Counter</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paying}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 font-bold rounded-xl text-white shadow-md transition disabled:opacity-50"
                >
                  {paying ? 'Processing...' : `Submit Payment (₹${payAmount})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OFFICIAL PRINT & PDF DOWNLOAD MODALS */}
      {printItem && printItem.type === 'INVOICE' && (
        <InvoicePrintView
          invoice={printItem.data}
          onClose={() => setPrintItem(null)}
        />
      )}

      {printItem && printItem.type === 'PRESCRIPTION' && (
        <PrescriptionPrintView
          prescription={printItem.data}
          onClose={() => setPrintItem(null)}
        />
      )}

      {printItem && printItem.type === 'LAB_REPORT' && (
        <LabReportPrintView
          labOrder={printItem.data}
          onClose={() => setPrintItem(null)}
        />
      )}
    </div>
  );
};

export default PatientDashboard;
