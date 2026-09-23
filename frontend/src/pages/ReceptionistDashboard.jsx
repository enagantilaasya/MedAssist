import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  Calendar, 
  Users, 
  UserPlus, 
  Clock, 
  CheckCircle, 
  DollarSign, 
  Plus, 
  Search, 
  AlertCircle,
  Loader2,
  Check,
  CreditCard
} from 'lucide-react';

export const ReceptionistDashboard = ({ activeSubTab = 'dashboard' }) => {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Booking Modal
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [bookingType, setBookingType] = useState('Scheduled');
  const [chiefComplaint, setChiefComplaint] = useState('');

  // Register Patient Modal
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [newPatient, setNewPatient] = useState({
    name: '',
    email: '',
    phone: '',
    password: 'password123',
    patientDetails: {
      dateOfBirth: '1995-01-01',
      gender: 'Male',
      bloodGroup: 'O+',
      allergies: [],
      chronicConditions: []
    }
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [aptsRes, doctorsRes, patientsRes, servicesRes] = await Promise.all([
        api.getAppointments(),
        api.getUsers({ role: 'doctor' }),
        api.getUsers({ role: 'patient' }),
        api.getServices()
      ]);

      if (aptsRes.success) setAppointments(aptsRes.data);
      if (doctorsRes.success) setDoctors(doctorsRes.data);
      if (patientsRes.success) setPatients(patientsRes.data);
      if (servicesRes.success) setServices(servicesRes.data);
    } catch (err) {
      console.error('Error fetching receptionist data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch slots whenever selected doctor or date changes
  useEffect(() => {
    const fetchSlots = async () => {
      if (selectedDoctor && bookingDate) {
        try {
          const res = await api.getDoctorSlots(selectedDoctor, bookingDate);
          if (res.success) {
            setAvailableSlots(res.data);
          }
        } catch (err) {
          console.error('Error fetching slots:', err);
        }
      }
    };
    fetchSlots();
  }, [selectedDoctor, bookingDate]);

  const handleCheckIn = async (appointmentId) => {
    try {
      const res = await api.updateAppointmentStatus(appointmentId, { status: 'checked_in' });
      if (res.success) {
        setAppointments(appointments.map(a => a._id === appointmentId ? res.data : a));
      }
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      alert('Please select an available time slot.');
      return;
    }

    try {
      const res = await api.createAppointment({
        patientId: selectedPatient,
        doctorId: selectedDoctor,
        serviceId: selectedService || null,
        date: bookingDate,
        timeSlot: selectedSlot,
        type: bookingType,
        chiefComplaint
      });

      if (res.success) {
        alert('Appointment successfully booked and token assigned!');
        setShowBookingModal(false);
        setAppointments([...appointments, res.data]);
        setSelectedSlot('');
        setChiefComplaint('');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRegisterPatient = async (e) => {
    e.preventDefault();
    try {
      const res = await api.register({
        ...newPatient,
        role: 'patient'
      });
      if (res.success) {
        alert('Patient registered successfully!');
        setShowRegisterModal(false);
        setPatients([...patients, res.user]);
        setNewPatient({
          name: '',
          email: '',
          phone: '',
          password: 'password123',
          patientDetails: {
            dateOfBirth: '1995-01-01',
            gender: 'Male',
            bloodGroup: 'O+',
            allergies: [],
            chronicConditions: []
          }
        });
      }
    } catch (err) {
      alert('Error registering patient: ' + err.message);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayApts = appointments.filter(a => a.date === todayStr);

  return (
    <div className="page-body">
      {/* Welcome Title */}
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>Front Desk & Patient Flow</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '4px' }}>
            Check in arriving patients, manage appointments & resolve schedule conflicts in real time.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setShowRegisterModal(true)} className="btn btn-secondary">
            <UserPlus size={16} /> Register Patient
          </button>
          <button onClick={() => setShowBookingModal(true)} className="btn btn-primary">
            <Calendar size={16} /> Book / Walk-in Slot
          </button>
        </div>
      </div>

      {/* Today's Queue Management Table */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <div className="card-header">
          <div className="card-title">
            <Clock size={20} color="#d97706" /> Today's Patient Check-in & Queue Control
          </div>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Date: <strong>{todayStr}</strong></span>
        </div>

        {todayApts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            No appointments scheduled for today. Click "Book / Walk-in Slot" above.
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Token #</th>
                  <th>Patient Name</th>
                  <th>Doctor</th>
                  <th>Time Slot</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Front-Desk Action</th>
                </tr>
              </thead>
              <tbody>
                {todayApts.map((apt) => (
                  <tr key={apt._id}>
                    <td style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0284c7' }}>
                      #{apt.tokenNumber || 1}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{apt.patient?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{apt.patient?.phone || 'No phone'}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{apt.doctor?.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{apt.doctorProfile?.department}</div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{apt.timeSlot}</td>
                    <td>
                      <span className="badge" style={{ background: '#f1f5f9', color: '#334155' }}>
                        {apt.type}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${apt.status}`}>
                        {apt.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      {apt.status === 'scheduled' ? (
                        <button
                          onClick={() => handleCheckIn(apt._id)}
                          className="btn btn-teal btn-sm"
                        >
                          <CheckCircle size={14} /> Check In Patient
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 600 }}>
                          ✓ Patient Checked In
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Booking Modal with Conflict Detection */}
      {showBookingModal && (
        <div className="modal-overlay" onClick={() => setShowBookingModal(false)}>
          <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontWeight: 700 }}>Book Appointment / Walk-in Slot</h3>
              <button onClick={() => setShowBookingModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleBookAppointment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Select Patient *</label>
                  <select
                    required
                    className="form-control"
                    value={selectedPatient}
                    onChange={(e) => setSelectedPatient(e.target.value)}
                  >
                    <option value="">-- Select Patient --</option>
                    {patients.map(p => (
                      <option key={p._id} value={p._id}>{p.name} ({p.email})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Select Doctor *</label>
                  <select
                    required
                    className="form-control"
                    value={selectedDoctor}
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                  >
                    <option value="">-- Select Doctor --</option>
                    {doctors.map(d => (
                      <option key={d._id} value={d._id}>{d.name} — {d.profile?.department || 'General'}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input
                    type="date"
                    required
                    className="form-control"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Visit Type</label>
                  <select
                    className="form-control"
                    value={bookingType}
                    onChange={(e) => setBookingType(e.target.value)}
                  >
                    <option value="Scheduled">Scheduled Consultation</option>
                    <option value="Walk-in">Walk-in Visit</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Follow-up">Follow-up</option>
                  </select>
                </div>
              </div>

              {/* Real-time Slot Picker with Conflict Detection */}
              {selectedDoctor && (
                <div className="form-group">
                  <label className="form-label">Doctor Availability Slots (Conflict Guard Enabled)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', maxHeight: '160px', overflowY: 'auto' }}>
                    {availableSlots.map((item, idx) => (
                      <button
                        type="button"
                        key={idx}
                        disabled={!item.isAvailable}
                        onClick={() => setSelectedSlot(item.slot)}
                        style={{
                          padding: '8px',
                          borderRadius: '8px',
                          border: selectedSlot === item.slot ? '2px solid #0284c7' : '1px solid #e2e8f0',
                          background: !item.isAvailable ? '#f1f5f9' : (selectedSlot === item.slot ? '#e0f2fe' : '#ffffff'),
                          color: !item.isAvailable ? '#94a3b8' : (selectedSlot === item.slot ? '#0369a1' : '#0f172a'),
                          fontWeight: selectedSlot === item.slot ? 700 : 500,
                          fontSize: '0.78rem',
                          cursor: item.isAvailable ? 'pointer' : 'not-allowed',
                          textDecoration: !item.isAvailable ? 'line-through' : 'none'
                        }}
                      >
                        {item.slot}
                      </button>
                    ))}
                  </div>
                  {selectedSlot && (
                    <div style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 600, marginTop: '6px' }}>
                      ✓ Selected Slot: {selectedSlot}
                    </div>
                  )}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Chief Complaint / Reason for Visit</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Mild chest pain, fever, follow-up on medication"
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowBookingModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register Patient Modal */}
      {showRegisterModal && (
        <div className="modal-overlay" onClick={() => setShowRegisterModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontWeight: 700 }}>Register New Patient</h3>
              <button onClick={() => setShowRegisterModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleRegisterPatient} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. Alice Cooper"
                  value={newPatient.name}
                  onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    required
                    className="form-control"
                    placeholder="alice@gmail.com"
                    value={newPatient.email}
                    onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="+1 (555) 123-4567"
                    value={newPatient.phone}
                    onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid-3">
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input
                    type="date"
                    className="form-control"
                    value={newPatient.patientDetails.dateOfBirth}
                    onChange={(e) => setNewPatient({
                      ...newPatient,
                      patientDetails: { ...newPatient.patientDetails, dateOfBirth: e.target.value }
                    })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select
                    className="form-control"
                    value={newPatient.patientDetails.gender}
                    onChange={(e) => setNewPatient({
                      ...newPatient,
                      patientDetails: { ...newPatient.patientDetails, gender: e.target.value }
                    })}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Blood Group</label>
                  <select
                    className="form-control"
                    value={newPatient.patientDetails.bloodGroup}
                    onChange={(e) => setNewPatient({
                      ...newPatient,
                      patientDetails: { ...newPatient.patientDetails, bloodGroup: e.target.value }
                    })}
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowRegisterModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Register & Assign Patient ID
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
