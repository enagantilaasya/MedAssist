import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, 
  Clock, 
  User, 
  Search, 
  Plus, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader2,
  CalendarCheck
} from 'lucide-react';

export const AppointmentsPage = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');

  // Cancel Modal
  const [cancelModalApt, setCancelModalApt] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const [aptsRes, docsRes, patientsRes] = await Promise.all([
        api.getAppointments({
          date: dateFilter,
          status: statusFilter,
          doctorId: doctorFilter
        }),
        api.getUsers({ role: 'doctor' }),
        api.getUsers({ role: 'patient' })
      ]);

      if (aptsRes.success) setAppointments(aptsRes.data);
      if (docsRes.success) setDoctors(docsRes.data);
      if (patientsRes.success) setPatients(patientsRes.data);
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [dateFilter, statusFilter, doctorFilter]);

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await api.updateAppointmentStatus(id, { status });
      if (res.success) {
        setAppointments(appointments.map(a => a._id === id ? res.data : a));
      }
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  const handleCancelAppointment = async (e) => {
    e.preventDefault();
    if (!cancelModalApt) return;

    try {
      const res = await api.updateAppointmentStatus(cancelModalApt._id, {
        status: 'cancelled',
        cancellationReason
      });
      if (res.success) {
        alert('Appointment cancelled.');
        setCancelModalApt(null);
        setCancellationReason('');
        setAppointments(appointments.map(a => a._id === cancelModalApt._id ? res.data : a));
      }
    } catch (err) {
      alert('Error cancelling: ' + err.message);
    }
  };

  return (
    <div className="page-body">
      {/* Top Title */}
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>Appointment Schedule</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '4px' }}>
            Interactive clinic appointments calendar with conflict detection, check-in status & rescheduling.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '2px' }}>Filter by Date</label>
            <input
              type="date"
              className="form-control"
              style={{ padding: '6px 10px', fontSize: '0.85rem' }}
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '2px' }}>Status</label>
            <select
              className="form-control"
              style={{ padding: '6px 10px', fontSize: '0.85rem', width: '160px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="checked_in">Checked In</option>
              <option value="in_consultation">In Consultation</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {user?.role !== 'doctor' && (
            <div>
              <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '2px' }}>Doctor</label>
              <select
                className="form-control"
                style={{ padding: '6px 10px', fontSize: '0.85rem', width: '180px' }}
                value={doctorFilter}
                onChange={(e) => setDoctorFilter(e.target.value)}
              >
                <option value="">All Doctors</option>
                {doctors.map(d => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'flex-end', paddingTop: '16px' }}>
            <button
              onClick={() => { setDateFilter(''); setStatusFilter(''); setDoctorFilter(''); }}
              className="btn btn-secondary btn-sm"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Appointment Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <CalendarCheck size={20} color="#0284c7" /> Bookings & Appointments ({appointments.length})
          </div>
        </div>

        {appointments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            No appointments found for the selected criteria.
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Appointment #</th>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Date & Time</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt) => (
                  <tr key={apt._id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.85rem', color: '#0284c7' }}>
                      {apt.appointmentNumber}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{apt.patient?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{apt.patient?.phone || 'No phone'}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{apt.doctor?.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{apt.doctorProfile?.department || 'General'}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{apt.date}</div>
                      <div style={{ fontSize: '0.75rem', color: '#475569' }}>{apt.timeSlot}</div>
                    </td>
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
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {apt.status === 'scheduled' && (user?.role === 'receptionist' || user?.role === 'admin') && (
                          <button
                            onClick={() => handleUpdateStatus(apt._id, 'checked_in')}
                            className="btn btn-teal btn-sm"
                          >
                            Check In
                          </button>
                        )}
                        {apt.status !== 'completed' && apt.status !== 'cancelled' && (
                          <button
                            onClick={() => setCancelModalApt(apt)}
                            className="btn btn-secondary btn-sm"
                            style={{ color: '#dc2626' }}
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

      {/* Cancel Modal */}
      {cancelModalApt && (
        <div className="modal-overlay" onClick={() => setCancelModalApt(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontWeight: 700, color: '#dc2626' }}>Cancel Appointment</h3>
              <button onClick={() => setCancelModalApt(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleCancelAppointment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ fontSize: '0.9rem', color: '#334155', margin: 0 }}>
                Are you sure you want to cancel appointment <strong>{cancelModalApt.appointmentNumber}</strong> for <strong>{cancelModalApt.patient?.name}</strong>?
              </p>

              <div className="form-group">
                <label className="form-label">Cancellation Reason</label>
                <textarea
                  required
                  className="form-control"
                  rows={2}
                  placeholder="e.g. Patient requested reschedule / emergency..."
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setCancelModalApt(null)} className="btn btn-secondary">
                  Keep Appointment
                </button>
                <button type="submit" className="btn btn-danger">
                  Confirm Cancellation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
