import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import { DashboardCard } from '../components/DashboardCard';
import { AppointmentCard } from '../components/AppointmentCard';
import { InvoicePrintView } from '../components/InvoicePrintView';
import {
  Calendar,
  Users,
  UserPlus,
  Clock,
  CheckCircle2,
  Plus,
  AlertCircle,
  CreditCard,
  Search,
  Printer,
  IndianRupee,
  FileText,
  DollarSign,
  Filter
} from 'lucide-react';

export const ReceptionDashboard = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('queue');

  // Synchronize activeTab with URL subpath
  useEffect(() => {
    if (location.pathname.includes('/appointments')) setActiveTab('appointments');
    else if (location.pathname.includes('/patients')) setActiveTab('patients');
    else if (location.pathname.includes('/invoices')) setActiveTab('invoices');
    else setActiveTab('queue');
  }, [location.pathname]);

  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter States
  const [appointmentSearch, setAppointmentSearch] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [invoiceSearch, setInvoiceSearch] = useState('');

  // Booking Modal
  const [showBookModal, setShowBookModal] = useState(false);
  const [bookingMode, setBookingMode] = useState('existing'); // 'existing' | 'walkin'
  const [bookingLoading, setBookingLoading] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedPatient, setSelectedPatient] = useState('');
  const [bookDate, setBookDate] = useState(new Date().toISOString().split('T')[0]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [reason, setReason] = useState('');
  const [walkinPatient, setWalkinPatient] = useState({
    fullName: '',
    phone: '',
    email: '',
    gender: 'Male',
    dateOfBirth: '1995-01-01'
  });

  // Register Patient Modal
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [newPatient, setNewPatient] = useState({
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '1995-01-01',
    gender: 'Male',
    bloodGroup: 'O+',
    allergies: '',
    chronicConditions: ''
  });

  // Create Invoice Modal
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoicePatientId, setInvoicePatientId] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState(500);
  const [invoiceDesc, setInvoiceDesc] = useState('General Outpatient Consultation');

  // Collect Payment Modal
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [collectingPayment, setCollectingPayment] = useState(false);

  // Printable Invoice Modal
  const [printableInvoice, setPrintableInvoice] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [aptsRes, docsRes, patsRes, invRes] = await Promise.all([
        api.get('/appointments/all'),
        api.get('/doctors/all'),
        api.get('/patients/all'),
        api.get('/invoices/all')
      ]);

      if (aptsRes.data.success) setAppointments(aptsRes.data.payload);
      if (docsRes.data.success) setDoctors(docsRes.data.payload);
      if (patsRes.data.success) setPatients(patsRes.data.payload);
      if (invRes.data.success) setInvoices(invRes.data.payload);
    } catch (err) {
      console.error('Reception data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Pre-select first doctor when doctors load
  useEffect(() => {
    if (doctors.length > 0 && !selectedDoctor) {
      setSelectedDoctor(doctors[0]._id);
    }
  }, [doctors, selectedDoctor]);

  // Pre-select first patient when patients load if none selected
  useEffect(() => {
    if (patients.length > 0 && !selectedPatient) {
      setSelectedPatient(patients[0]._id);
    }
  }, [patients, selectedPatient]);

  // Fetch slots whenever selected doctor or date changes
  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedDoctor || !bookDate) {
        setAvailableSlots([]);
        return;
      }

      try {
        const res = await api.get(`/doctors/slots/${selectedDoctor}?date=${bookDate}`);
        if (res.data?.success && res.data.payload) {
          const raw = res.data.payload.slots || res.data.payload;
          let slotsList = [];
          if (Array.isArray(raw)) {
            slotsList = raw.map(s => typeof s === 'string' ? { slot: s, isAvailable: true } : s);
          } else if (Array.isArray(res.data.payload?.availableSlots)) {
            slotsList = res.data.payload.availableSlots.map(s => ({ slot: s, isAvailable: true }));
          }
          setAvailableSlots(slotsList);
          const firstAvailable = slotsList.find(s => s.isAvailable);
          if (firstAvailable) {
            setSelectedSlot(firstAvailable.slot);
          } else if (slotsList.length > 0) {
            setSelectedSlot(slotsList[0].slot);
          } else {
            setSelectedSlot('');
          }
        }
      } catch (err) {
        console.error('Error fetching doctor slots:', err);
        const fallbackSlots = [
          { slot: '09:00 - 09:30', isAvailable: true },
          { slot: '09:30 - 10:00', isAvailable: true },
          { slot: '10:00 - 10:30', isAvailable: true },
          { slot: '10:30 - 11:00', isAvailable: true },
          { slot: '11:00 - 11:30', isAvailable: true },
          { slot: '14:00 - 14:30', isAvailable: true },
          { slot: '14:30 - 15:00', isAvailable: true },
          { slot: '15:00 - 15:30', isAvailable: true },
          { slot: '15:30 - 16:00', isAvailable: true }
        ];
        setAvailableSlots(fallbackSlots);
        setSelectedSlot('09:00 - 09:30');
      }
    };
    fetchSlots();
  }, [selectedDoctor, bookDate]);

  const handleCheckIn = async (appointment) => {
    try {
      const res = await api.put(`/appointments/update/${appointment._id}`, { status: 'waiting' });
      if (res.data.success) {
        setAppointments(appointments.map(a => a._id === appointment._id ? { ...a, status: 'waiting' } : a));
      }
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    const reason = window.prompt('Please enter cancellation reason:', 'Patient request');
    if (!reason) return;
    try {
      const res = await api.put(`/appointments/cancel/${appointmentId}`, { cancellationReason: reason });
      if (res.data.success) {
        alert('Appointment marked as cancelled.');
        fetchData();
      }
    } catch (err) {
      alert('Error cancelling appointment: ' + err.message);
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!selectedDoctor) {
      alert('Please select a doctor.');
      return;
    }
    if (!selectedSlot) {
      alert('Please choose an available doctor slot.');
      return;
    }

    setBookingLoading(true);
    try {
      let patientIdToBook = selectedPatient;

      // Handle walk-in patient quick auto-registration
      if (bookingMode === 'walkin') {
        if (!walkinPatient.fullName || !walkinPatient.phone) {
          alert('Please enter patient name and phone number for the walk-in visit.');
          setBookingLoading(false);
          return;
        }

        const walkinEmail = walkinPatient.email || `walkin_${Date.now()}@medassist.local`;
        const regRes = await api.post('/patients/register', {
          fullName: walkinPatient.fullName,
          phone: walkinPatient.phone,
          email: walkinEmail,
          gender: walkinPatient.gender,
          dateOfBirth: walkinPatient.dateOfBirth
        });

        if (regRes.data?.success && regRes.data.payload) {
          patientIdToBook = regRes.data.payload._id;
        } else {
          alert('Could not register walk-in patient. Please try again.');
          setBookingLoading(false);
          return;
        }
      }

      if (!patientIdToBook) {
        alert('Please choose or register a patient.');
        setBookingLoading(false);
        return;
      }

      const res = await api.post('/appointments/add', {
        patientId: patientIdToBook,
        doctorId: selectedDoctor,
        appointmentDate: bookDate,
        appointmentTime: selectedSlot,
        reason: reason || 'Outpatient Consultation'
      });

      if (res.data?.success) {
        alert('Appointment successfully booked with conflict guard!');
        setShowBookModal(false);
        setSelectedSlot('');
        setReason('');
        setWalkinPatient({
          fullName: '',
          phone: '',
          email: '',
          gender: 'Male',
          dateOfBirth: '1995-01-01'
        });
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to book appointment.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleRegisterPatient = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/patients/register', {
        ...newPatient,
        allergies: newPatient.allergies.split(',').map(s => s.trim()).filter(Boolean),
        chronicConditions: newPatient.chronicConditions.split(',').map(s => s.trim()).filter(Boolean)
      });

      if (res.data.success) {
        alert('Patient registered and assigned clinic ID!');
        setShowRegisterModal(false);
        setNewPatient({
          fullName: '',
          email: '',
          phone: '',
          dateOfBirth: '1995-01-01',
          gender: 'Male',
          bloodGroup: 'O+',
          allergies: '',
          chronicConditions: ''
        });
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/invoices/add', {
        patientId: invoicePatientId,
        items: [{
          description: invoiceDesc,
          quantity: 1,
          unitPrice: Number(invoiceAmount),
          totalPrice: Number(invoiceAmount)
        }]
      });

      if (res.data.success) {
        alert(`Invoice #${res.data.payload.invoiceNumber} created for ₹${invoiceAmount}!`);
        setShowInvoiceModal(false);
        setInvoiceAmount(500);
        setInvoiceDesc('General Outpatient Consultation');
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleOpenPayment = (inv) => {
    setSelectedInvoiceForPayment(inv);
    setPaymentAmount(inv.balanceDue.toString());
    setPaymentMethod('Cash');
  };

  const handleCollectPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInvoiceForPayment) return;
    setCollectingPayment(true);
    try {
      const res = await api.post(`/invoices/pay/${selectedInvoiceForPayment._id}`, {
        amountPaid: Number(paymentAmount),
        paymentMethod
      });

      if (res.data.success) {
        alert(`Payment of ₹${paymentAmount} collected successfully!`);
        setSelectedInvoiceForPayment(null);
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setCollectingPayment(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayApts = appointments.filter(a => a.appointmentDate === todayStr);

  // Financial metrics
  const totalRevenue = invoices.reduce((acc, i) => acc + (Number(i.amountPaid) || 0), 0);
  const pendingReceivables = invoices.reduce((acc, i) => acc + (Number(i.balanceDue) || 0), 0);

  // Filtered lists
  const filteredAppointments = appointments.filter(a => {
    const pName = (a.patientId?.fullName || '').toLowerCase();
    const dName = (a.doctorId?.fullName || '').toLowerCase();
    const q = appointmentSearch.toLowerCase();
    return pName.includes(q) || dName.includes(q) || a.appointmentDate.includes(q);
  });

  const filteredPatients = patients.filter(p => {
    const q = patientSearch.toLowerCase();
    return (
      (p.fullName || '').toLowerCase().includes(q) ||
      (p.patientCode || '').toLowerCase().includes(q) ||
      (p.phone || '').toLowerCase().includes(q)
    );
  });

  const filteredInvoices = invoices.filter(inv => {
    const q = invoiceSearch.toLowerCase();
    const invNum = (inv.invoiceNumber || '').toLowerCase();
    const patName = (inv.patientId?.fullName || '').toLowerCase();
    return invNum.includes(q) || patName.includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Front-Desk & Reception</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Patient queue check-in, conflict-free scheduling & billing desk.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowRegisterModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition"
          >
            <UserPlus className="w-4 h-4" /> Register Patient
          </button>
          <button
            onClick={() => {
              setBookingMode('existing');
              if (!selectedPatient && patients.length > 0) {
                setSelectedPatient(patients[0]._id);
              }
              setShowBookModal(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition shadow-md"
          >
            <Calendar className="w-4 h-4" /> Schedule Visit
          </button>
          <button
            onClick={() => {
              setInvoicePatientId('');
              setShowInvoiceModal(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-md"
          >
            <CreditCard className="w-4 h-4" /> Create Bill
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <DashboardCard
          title="Today's Appointments"
          value={todayApts.length}
          subtext="Scheduled for today"
          icon={Calendar}
          color="amber"
        />
        <DashboardCard
          title="Waiting in Clinic"
          value={todayApts.filter(a => a.status === 'waiting').length}
          subtext="Checked in queue"
          icon={Clock}
          color="sky"
        />
        <DashboardCard
          title="Revenue Collected"
          value={`₹${totalRevenue.toLocaleString('en-IN')}`}
          subtext="Payments received"
          icon={CreditCard}
          color="emerald"
        />
        <DashboardCard
          title="Pending Receivables"
          value={`₹${pendingReceivables.toLocaleString('en-IN')}`}
          subtext={`${invoices.filter(i => i.paymentStatus !== 'paid').length} unpaid bills`}
          icon={IndianRupee}
          color="purple"
        />
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('queue')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'queue'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" /> Today's Arrival Queue ({todayApts.length})
        </button>

        <button
          onClick={() => setActiveTab('appointments')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'appointments'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" /> All Appointments ({appointments.length})
        </button>

        <button
          onClick={() => setActiveTab('patients')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'patients'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" /> Patient Directory ({patients.length})
        </button>

        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'invoices'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4" /> Billing Desk & Cashier ({invoices.length})
        </button>
      </div>

      {/* TAB 1: Today's Arrival Queue */}
      {activeTab === 'queue' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-slate-900 text-lg">Today's Patient Arrival Queue</h3>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
              Date: {todayStr}
            </span>
          </div>

          {todayApts.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No patients scheduled for today. Click "Schedule Visit" to book an appointment.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {todayApts.map((apt) => (
                <AppointmentCard
                  key={apt._id}
                  appointment={apt}
                  actionLabel={apt.status === 'scheduled' ? 'Check In Patient' : null}
                  onAction={handleCheckIn}
                  actionColor="bg-amber-600 hover:bg-amber-700"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: All Appointments */}
      {activeTab === 'appointments' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Clinic Appointments Schedule</h3>
              <p className="text-xs text-slate-500">Monitor all scheduled, checked-in, and completed visits</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search patient, doctor, date..."
                value={appointmentSearch}
                onChange={(e) => setAppointmentSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          {filteredAppointments.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">No matching appointments found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Date & Slot</th>
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-4">Doctor</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredAppointments.map((apt) => (
                    <tr key={apt._id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{apt.appointmentDate}</div>
                        <div className="text-[11px] text-amber-700 font-semibold">{apt.appointmentTime}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{apt.patientId?.fullName}</div>
                        <div className="text-[10px] text-slate-400">{apt.patientId?.patientCode || apt.patientId?.phone}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-semibold">
                        Dr. {apt.doctorId?.fullName} ({apt.doctorId?.specialization})
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-[200px] truncate">
                        {apt.reason || 'General checkup'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          apt.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : apt.status === 'in_consultation'
                            ? 'bg-purple-100 text-purple-800'
                            : apt.status === 'waiting'
                            ? 'bg-sky-100 text-sky-800'
                            : apt.status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {apt.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {apt.status === 'scheduled' && (
                            <button
                              onClick={() => handleCheckIn(apt)}
                              className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg text-[11px] transition shadow-sm"
                            >
                              Check In
                            </button>
                          )}
                          {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                            <button
                              onClick={() => handleCancelAppointment(apt._id)}
                              className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-lg text-[11px] border border-red-200 transition"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Patient Intake Directory */}
      {activeTab === 'patients' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Registered Clinic Patients</h3>
              <p className="text-xs text-slate-500">Search patient database, view medical codes, or schedule encounters</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by name, ID, phone..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          {filteredPatients.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">No patients matching search criteria.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Patient Code</th>
                    <th className="py-3 px-4">Full Name</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Gender & DOB</th>
                    <th className="py-3 px-4">Blood Group</th>
                    <th className="py-3 px-4">Allergies</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredPatients.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                          {p.patientCode || 'PAT-NEW'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{p.fullName}</td>
                      <td className="py-3 px-4">
                        <div>{p.phone || 'No phone'}</div>
                        <div className="text-[10px] text-slate-400">{p.email || p.userId?.email}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {p.gender}, {p.dateOfBirth ? p.dateOfBirth.substring(0, 10) : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold px-2 py-0.5 bg-rose-50 text-rose-700 rounded-md border border-rose-200">
                          {p.bloodGroup || 'O+'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {p.allergies && p.allergies.length > 0 ? p.allergies.join(', ') : 'None'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedPatient(p._id);
                              setBookingMode('existing');
                              setShowBookModal(true);
                            }}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-lg border border-amber-200 transition"
                          >
                            Book Visit
                          </button>
                          <button
                            onClick={() => {
                              setInvoicePatientId(p._id);
                              setShowInvoiceModal(true);
                            }}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg border border-emerald-200 transition"
                          >
                            Bill
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Billing Desk & Cashier */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Billing Desk & Fee Collection</h3>
              <p className="text-xs text-slate-500">Track invoices, record patient fee collections, and issue official receipts</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search invoice # or patient..."
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">No invoices found. Click "Create Bill" to issue a new invoice.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-4">Service Details</th>
                    <th className="py-3 px-4">Total (₹)</th>
                    <th className="py-3 px-4">Paid (₹)</th>
                    <th className="py-3 px-4">Balance (₹)</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv._id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {inv.patientId?.fullName || 'Patient'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-[200px] truncate">
                        {inv.items && inv.items[0] ? inv.items[0].description : 'Clinic Service'}
                      </td>
                      <td className="py-3 px-4 font-black text-slate-900">
                        ₹{Number(inv.totalAmount).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-emerald-700 font-bold">
                        ₹{Number(inv.amountPaid).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 font-bold">
                        <span className={inv.balanceDue > 0 ? 'text-red-600 font-black' : 'text-slate-400'}>
                          ₹{Number(inv.balanceDue).toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                          inv.paymentStatus === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inv.paymentStatus === 'partial'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {inv.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {inv.balanceDue > 0 && (
                            <button
                              onClick={() => handleOpenPayment(inv)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] transition shadow-sm"
                            >
                              Collect Fee
                            </button>
                          )}
                          <button
                            onClick={() => setPrintableInvoice(inv)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] border border-slate-300 transition flex items-center gap-1"
                          >
                            <Printer className="w-3 h-3" /> Print
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal 1: Book Appointment */}
      {showBookModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-black text-slate-900 text-lg">Schedule Patient Appointment</h3>
                <p className="text-xs text-slate-500">Book conflict-free doctor visit with arrival queue tracking</p>
              </div>
              <button onClick={() => setShowBookModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            {/* Toggle Patient Mode: Existing vs New Walk-in */}
            <div className="flex bg-slate-100 p-1 rounded-xl mb-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => setBookingMode('existing')}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  bookingMode === 'existing' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Registered Patient ({patients.length})
              </button>
              <button
                type="button"
                onClick={() => setBookingMode('walkin')}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  bookingMode === 'walkin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                + New Walk-in Patient
              </button>
            </div>

            <form onSubmit={handleBookAppointment} className="space-y-3.5 text-xs">
              {bookingMode === 'existing' ? (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Select Patient *</label>
                  <select
                    required
                    value={selectedPatient}
                    onChange={(e) => setSelectedPatient(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="">-- Choose Patient --</option>
                    {patients.map(p => (
                      <option key={p._id} value={p._id}>{p.fullName} ({p.patientCode || p.phone})</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-2.5 p-3 bg-amber-50/60 border border-amber-200 rounded-2xl">
                  <div className="font-bold text-amber-900 text-[11px]">Walk-in Patient Quick Registration</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-0.5">Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ramesh Kumar"
                        value={walkinPatient.fullName}
                        onChange={(e) => setWalkinPatient({ ...walkinPatient, fullName: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-0.5">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 98765 43210"
                        value={walkinPatient.phone}
                        onChange={(e) => setWalkinPatient({ ...walkinPatient, phone: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Attending Doctor *</label>
                <select
                  required
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="">-- Choose Doctor --</option>
                  {doctors.map(d => (
                    <option key={d._id} value={d._id}>Dr. {d.fullName} ({d.specialization}) - ₹{d.consultationFee}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Appointment Date *</label>
                <input
                  type="date"
                  required
                  value={bookDate}
                  onChange={(e) => setBookDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              {selectedDoctor && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-slate-700">Available Time Slots *</label>
                    <span className="text-[10px] text-slate-400">Guarded against double-booking</span>
                  </div>
                  {availableSlots.length > 0 ? (
                    <div className="grid grid-cols-3 gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                      {availableSlots.map((s, idx) => (
                        <button
                          type="button"
                          key={idx}
                          disabled={!s.isAvailable}
                          onClick={() => setSelectedSlot(s.slot)}
                          className={`p-1.5 rounded-lg text-[11px] font-bold transition ${
                            !s.isAvailable
                              ? 'bg-slate-200 text-slate-400 line-through cursor-not-allowed opacity-60'
                              : selectedSlot === s.slot
                              ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-400'
                              : 'bg-white text-slate-800 border border-slate-200 hover:bg-amber-50'
                          }`}
                        >
                          {s.slot}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded-xl border border-amber-200 text-center font-medium">
                      No slots available for this doctor on the selected date.
                    </div>
                  )}
                  {selectedSlot ? (
                    <p className="text-emerald-700 font-bold mt-1 text-[11px]">✓ Confirmed slot: {selectedSlot}</p>
                  ) : (
                    <p className="text-amber-700 font-semibold mt-1 text-[11px]">Please choose an available slot above.</p>
                  )}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Visit</label>
                <input
                  type="text"
                  placeholder="e.g. Fever & sore throat, routine review"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
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
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 font-bold rounded-xl text-white shadow-md transition disabled:opacity-50"
                >
                  {bookingLoading ? 'Scheduling...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Register Patient */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="font-black text-slate-900 text-lg">Register New Clinic Patient</h3>
              <button onClick={() => setShowRegisterModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleRegisterPatient} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Marcus Brookes"
                  value={newPatient.fullName}
                  onChange={(e) => setNewPatient({ ...newPatient, fullName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="marcus@gmail.com"
                    value={newPatient.email}
                    onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={newPatient.phone}
                    onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={newPatient.dateOfBirth}
                    onChange={(e) => setNewPatient({ ...newPatient, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={newPatient.gender}
                    onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Blood Group</label>
                  <select
                    value={newPatient.bloodGroup}
                    onChange={(e) => setNewPatient({ ...newPatient, bloodGroup: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Known Allergies (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Penicillin, Peanuts"
                  value={newPatient.allergies}
                  onChange={(e) => setNewPatient({ ...newPatient, allergies: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 font-bold rounded-xl text-white shadow-md"
                >
                  Register & Assign Patient ID
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Create Bill */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="font-black text-slate-900 text-lg">Generate Clinic Bill / Invoice</h3>
              <button onClick={() => setShowInvoiceModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Patient *</label>
                <select
                  required
                  value={invoicePatientId}
                  onChange={(e) => setInvoicePatientId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map(p => (
                    <option key={p._id} value={p._id}>{p.fullName} ({p.patientCode || p.phone})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Service / Procedure Description</label>
                <input
                  type="text"
                  required
                  value={invoiceDesc}
                  onChange={(e) => setInvoiceDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-black text-sm text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 font-bold rounded-xl text-white shadow-md"
                >
                  Generate Invoice (₹{invoiceAmount})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Collect Payment Modal */}
      {selectedInvoiceForPayment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-black text-slate-900 text-lg">Collect Fee Payment</h3>
                <p className="text-xs text-slate-500">Invoice: #{selectedInvoiceForPayment.invoiceNumber}</p>
              </div>
              <button onClick={() => setSelectedInvoiceForPayment(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleCollectPaymentSubmit} className="space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Patient:</span>
                  <span className="font-bold text-slate-900">{selectedInvoiceForPayment.patientId?.fullName}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Total Bill Amount:</span>
                  <span className="font-bold text-slate-900">₹{selectedInvoiceForPayment.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Already Paid:</span>
                  <span className="font-bold text-emerald-600">₹{selectedInvoiceForPayment.amountPaid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-black text-sm text-red-600 border-t border-slate-200 pt-1">
                  <span>Balance Due:</span>
                  <span>₹{selectedInvoiceForPayment.balanceDue.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedInvoiceForPayment.balanceDue}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-black text-base text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="Cash">Cash (Front-Desk)</option>
                  <option value="UPI">UPI / QR Code</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Net Banking">Net Banking</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedInvoiceForPayment(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={collectingPayment}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {collectingPayment ? 'Recording...' : `Record Payment (₹${paymentAmount})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 5: Printable Invoice Receipt */}
      {printableInvoice && (
        <InvoicePrintView
          invoice={printableInvoice}
          onClose={() => setPrintableInvoice(null)}
        />
      )}
    </div>
  );
};
