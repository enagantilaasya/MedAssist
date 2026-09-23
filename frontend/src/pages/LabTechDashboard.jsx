import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { LabReportPrintView } from '../components/LabReportPrintView';
import { 
  FlaskConical, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Printer, 
  Edit3, 
  Barcode, 
  Loader2, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export const LabTechDashboard = () => {
  const [labOrders, setLabOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Result Entry Modal State
  const [activeOrder, setActiveOrder] = useState(null);
  const [testsResults, setTestsResults] = useState([]);
  const [techNotes, setTechNotes] = useState('');
  const [autoVerify, setAutoVerify] = useState(true);

  // Printable View
  const [printOrder, setPrintOrder] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.getLabOrders({ priority: priorityFilter, status: statusFilter });
      if (res.success) setLabOrders(res.data);
    } catch (err) {
      console.error('Error fetching lab orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [priorityFilter, statusFilter]);

  const handleCollectSample = async (orderId) => {
    const generatedBarcode = `BAR-${Math.floor(100000 + Math.random() * 900000)}`;
    try {
      const res = await api.updateLabStatus(orderId, {
        status: 'sample_collected',
        sampleBarcode: generatedBarcode
      });
      if (res.success) {
        setLabOrders(labOrders.map(o => o._id === orderId ? res.data : o));
      }
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  const handleStartProcessing = async (orderId) => {
    try {
      const res = await api.updateLabStatus(orderId, { status: 'in_processing' });
      if (res.success) {
        setLabOrders(labOrders.map(o => o._id === orderId ? res.data : o));
      }
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  const handleOpenResultModal = (order) => {
    setActiveOrder(order);
    setTestsResults(order.tests.map(t => ({
      ...t,
      resultValue: t.resultValue || '',
      flag: t.flag || 'Normal',
      notes: t.notes || ''
    })));
    setTechNotes(order.technicianNotes || '');
  };

  const handleSaveResults = async (e) => {
    e.preventDefault();
    if (!activeOrder) return;

    try {
      const res = await api.updateLabResults(activeOrder._id, {
        tests: testsResults,
        technicianNotes: techNotes,
        autoVerify
      });

      if (res.success) {
        alert(autoVerify ? 'Results saved, verified, and released to patient!' : 'Results saved successfully.');
        setActiveOrder(null);
        setLabOrders(labOrders.map(o => o._id === activeOrder._id ? res.data : o));
      }
    } catch (err) {
      alert('Error saving results: ' + err.message);
    }
  };

  const handleVerifyRelease = async (orderId) => {
    try {
      const res = await api.verifyAndReleaseLabReport(orderId);
      if (res.success) {
        alert('Lab report verified and released to patient portal!');
        setLabOrders(labOrders.map(o => o._id === orderId ? res.data : o));
      }
    } catch (err) {
      alert('Error releasing report: ' + err.message);
    }
  };

  const pendingCount = labOrders.filter(o => o.status === 'ordered').length;
  const inProcessCount = labOrders.filter(o => o.status === 'sample_collected' || o.status === 'in_processing').length;
  const verifiedCount = labOrders.filter(o => o.status === 'verified').length;

  return (
    <div className="page-body">
      {/* Top Banner */}
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>
            Diagnostic Laboratory Workbench
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '4px' }}>
            Specimen intake, automated analyzer processing, flag verification & electronic report releases.
          </p>
        </div>
        <button onClick={fetchOrders} className="btn btn-secondary">
          Refresh Workbench
        </button>
      </div>

      {/* Metrics */}
      <div className="grid-3" style={{ marginBottom: '28px' }}>
        <div className="card" style={{ borderLeft: '4px solid #0284c7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>PENDING COLLECTION</span>
            <Clock size={18} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: '8px 0 2px 0' }}>
            {pendingCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#0284c7' }}>
            Awaiting phlebotomy / specimen intake
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #d97706' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>IN PROCESSING</span>
            <FlaskConical size={18} color="#d97706" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: '8px 0 2px 0' }}>
            {inProcessCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#d97706' }}>
            Active on analyzer instruments
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #059669' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>VERIFIED & RELEASED</span>
            <CheckCircle2 size={18} color="#059669" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: '8px 0 2px 0' }}>
            {verifiedCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#059669' }}>
            Available in patient & doctor portal
          </div>
        </div>
      </div>

      {/* Lab Orders Queue Card */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <FlaskConical size={20} color="#0d9488" /> Active Diagnostic Test Orders
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="form-control"
              style={{ width: '150px', padding: '6px 10px', fontSize: '0.85rem' }}
            >
              <option value="">All Priorities</option>
              <option value="Routine">Routine</option>
              <option value="Urgent">Urgent</option>
              <option value="STAT">STAT Emergency</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-control"
              style={{ width: '170px', padding: '6px 10px', fontSize: '0.85rem' }}
            >
              <option value="">All Workflow Stages</option>
              <option value="ordered">Ordered</option>
              <option value="sample_collected">Sample Collected</option>
              <option value="in_processing">In Processing</option>
              <option value="completed">Completed</option>
              <option value="verified">Verified & Released</option>
            </select>
          </div>
        </div>

        {labOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            No lab orders matching this filter.
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order # / Barcode</th>
                  <th>Patient</th>
                  <th>Specimen & Tests</th>
                  <th>Priority</th>
                  <th>Workflow Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {labOrders.map((order) => (
                  <tr key={order._id}>
                    <td>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.85rem', color: '#0284c7' }}>
                        {order.orderNumber}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Barcode size={12} /> {order.sampleBarcode || 'Unassigned'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{order.patient?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Ordering: {order.doctor?.name || 'Doctor'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0f766e' }}>
                        {order.specimenType} Specimen
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#475569' }}>
                        {order.tests.map(t => t.testName).join(', ')}
                      </div>
                    </td>
                    <td>
                      <span className="badge" style={{
                        background: order.priority === 'STAT' ? '#fee2e2' : order.priority === 'Urgent' ? '#fef3c7' : '#f1f5f9',
                        color: order.priority === 'STAT' ? '#dc2626' : order.priority === 'Urgent' ? '#d97706' : '#475569',
                        fontWeight: 700
                      }}>
                        {order.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${order.status}`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {order.status === 'ordered' && (
                          <button
                            onClick={() => handleCollectSample(order._id)}
                            className="btn btn-teal btn-sm"
                          >
                            <Barcode size={14} /> Collect Specimen
                          </button>
                        )}

                        {order.status === 'sample_collected' && (
                          <button
                            onClick={() => handleStartProcessing(order._id)}
                            className="btn btn-primary btn-sm"
                          >
                            <FlaskConical size={14} /> Start Analyzer
                          </button>
                        )}

                        {(order.status === 'in_processing' || order.status === 'completed') && (
                          <button
                            onClick={() => handleOpenResultModal(order)}
                            className="btn btn-ai btn-sm"
                          >
                            <Edit3 size={14} /> Enter Results
                          </button>
                        )}

                        {order.status === 'completed' && !order.isReleasedToPatient && (
                          <button
                            onClick={() => handleVerifyRelease(order._id)}
                            className="btn btn-teal btn-sm"
                          >
                            <ShieldCheck size={14} /> Release Report
                          </button>
                        )}

                        {order.status === 'verified' && (
                          <button
                            onClick={() => setPrintOrder(order)}
                            className="btn btn-secondary btn-sm"
                          >
                            <Printer size={14} /> View / Print
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

      {/* Result Entry Modal */}
      {activeOrder && (
        <div className="modal-overlay" onClick={() => setActiveOrder(null)}>
          <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0, fontWeight: 700 }}>Enter Diagnostic Test Results</h3>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Order: {activeOrder.orderNumber} • Patient: {activeOrder.patient?.name}
                </div>
              </div>
              <button onClick={() => setActiveOrder(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSaveResults} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {testsResults.map((test, idx) => (
                  <div key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>{test.testName}</span>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Reference: {test.referenceRange || 'Standard'}</span>
                    </div>

                    <div className="grid-3" style={{ gap: '10px' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Observed Result Value *</label>
                        <input
                          type="text"
                          required
                          className="form-control"
                          placeholder="e.g. 104"
                          value={test.resultValue}
                          onChange={(e) => {
                            const updated = [...testsResults];
                            updated[idx].resultValue = e.target.value;
                            setTestsResults(updated);
                          }}
                        />
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Unit</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. mg/dL"
                          value={test.unit}
                          onChange={(e) => {
                            const updated = [...testsResults];
                            updated[idx].unit = e.target.value;
                            setTestsResults(updated);
                          }}
                        />
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Flag</label>
                        <select
                          className="form-control"
                          value={test.flag}
                          onChange={(e) => {
                            const updated = [...testsResults];
                            updated[idx].flag = e.target.value;
                            setTestsResults(updated);
                          }}
                        >
                          <option value="Normal">Normal</option>
                          <option value="High">High</option>
                          <option value="Low">Low</option>
                          <option value="Abnormal">Abnormal</option>
                          <option value="Critical">Critical</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="form-group">
                <label className="form-label">Technician Notes / Instrument Remarks</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="e.g. Analyzer calibrated; duplicate run performed."
                  value={techNotes}
                  onChange={(e) => setTechNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f0fdfa', padding: '10px 14px', borderRadius: '8px', border: '1px solid #99f6e4' }}>
                <input
                  type="checkbox"
                  id="autoVerifyCheck"
                  checked={autoVerify}
                  onChange={(e) => setAutoVerify(e.target.checked)}
                />
                <label htmlFor="autoVerifyCheck" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f766e', cursor: 'pointer' }}>
                  Auto-Verify & Immediately Release to Patient Portal
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button type="button" onClick={() => setActiveOrder(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Results
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Report Modal */}
      {printOrder && (
        <LabReportPrintView
          labOrder={printOrder}
          onClose={() => setPrintOrder(null)}
        />
      )}
    </div>
  );
};
