import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { InvoicePrintView } from '../components/InvoicePrintView';
import { 
  CreditCard, 
  DollarSign, 
  Plus, 
  Search, 
  Printer, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  TrendingUp,
  Receipt
} from 'lucide-react';

export const BillingPage = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState(null);
  const [patients, setPatients] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(null);
  const [printInvoice, setPrintInvoice] = useState(null);

  // New Invoice Form
  const [selectedPatient, setSelectedPatient] = useState('');
  const [invoiceItems, setInvoiceItems] = useState([
    { serviceId: '', description: '', category: 'Consultation', quantity: 1, unitPrice: 45 }
  ]);
  const [taxPercent, setTaxPercent] = useState(5);
  const [discount, setDiscount] = useState(0);

  // Pay Form
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invRes, statsRes, patientsRes, servicesRes] = await Promise.all([
        api.getInvoices({ status: statusFilter }),
        api.getBillingStats(),
        api.getUsers({ role: 'patient' }),
        api.getServices()
      ]);

      if (invRes.success) setInvoices(invRes.data);
      if (statsRes.success) setStats(statsRes.stats);
      if (patientsRes.success) setPatients(patientsRes.data);
      if (servicesRes.success) setServices(servicesRes.data);
    } catch (err) {
      console.error('Error fetching billing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const handleAddItem = () => {
    setInvoiceItems([
      ...invoiceItems,
      { serviceId: '', description: '', category: 'Consultation', quantity: 1, unitPrice: 30 }
    ]);
  };

  const handleItemServiceChange = (index, serviceId) => {
    const srv = services.find(s => s._id === serviceId);
    if (!srv) return;

    const updated = [...invoiceItems];
    updated[index].serviceId = srv._id;
    updated[index].description = srv.name;
    updated[index].category = srv.category;
    updated[index].unitPrice = srv.price;
    setInvoiceItems(updated);
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createInvoice({
        patientId: selectedPatient,
        items: invoiceItems.map(i => ({
          service: i.serviceId || null,
          description: i.description,
          category: i.category,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
          totalPrice: Number(i.quantity) * Number(i.unitPrice)
        })),
        taxPercentage: taxPercent,
        discountAmount: discount
      });

      if (res.success) {
        alert('Invoice created successfully!');
        setShowCreateModal(false);
        setInvoices([res.data, ...invoices]);
        fetchData();
      }
    } catch (err) {
      alert('Error creating invoice: ' + err.message);
    }
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!showPayModal) return;

    try {
      const res = await api.processPayment(showPayModal._id, {
        amountPaid: Number(paymentAmount),
        paymentMethod
      });

      if (res.success) {
        alert('Payment collected and receipt generated!');
        setShowPayModal(null);
        setInvoices(invoices.map(inv => inv._id === showPayModal._id ? res.data : inv));
        fetchData();
      }
    } catch (err) {
      alert('Error processing payment: ' + err.message);
    }
  };

  return (
    <div className="page-body">
      {/* Title */}
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>Cashier & Billing Center</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '4px' }}>
            Invoice generation, payment collections, revenue statistics & itemized receipts.
          </p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          <Plus size={16} /> Create Invoice
        </button>
      </div>

      {/* Financial Metrics */}
      {stats && (
        <div className="grid-3" style={{ marginBottom: '28px' }}>
          <div className="card" style={{ borderLeft: '4px solid #059669' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>
              <span>TOTAL COLLECTED REVENUE</span>
              <DollarSign size={18} color="#059669" />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: '8px 0 2px 0' }}>
              ₹{Number(stats.totalRevenue).toFixed(2)}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#059669' }}>
              {stats.paidCount} fully paid invoices
            </div>
          </div>

          <div className="card" style={{ borderLeft: '4px solid #dc2626' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>
              <span>OUTSTANDING BALANCE DUE</span>
              <AlertCircle size={18} color="#dc2626" />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: '8px 0 2px 0' }}>
              ₹{Number(stats.totalPending).toFixed(2)}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#dc2626' }}>
              {stats.pendingCount} unpaid / partial invoices
            </div>
          </div>

          <div className="card" style={{ borderLeft: '4px solid #0284c7' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>
              <span>TOTAL BILLED GROSS</span>
              <Receipt size={18} color="#0284c7" />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: '8px 0 2px 0' }}>
              ₹{Number(stats.totalBilled).toFixed(2)}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Across {stats.totalInvoices} total patient bills
            </div>
          </div>
        </div>
      )}

      {/* Invoices List */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <CreditCard size={20} color="#9333ea" /> Billing Records & Invoices
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-control"
            style={{ width: '160px', padding: '6px 10px', fontSize: '0.85rem' }}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="paid">Paid</option>
          </select>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Patient</th>
                <th>Services</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Balance Due</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv._id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#0284c7' }}>
                    {inv.invoiceNumber}
                  </td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{inv.patient?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{inv.patient?.phone || 'No phone'}</div>
                  </td>
                  <td style={{ fontSize: '0.8rem', maxWidth: '240px' }}>
                    {inv.items.map(i => i.description).join(', ')}
                  </td>
                  <td style={{ fontWeight: 700 }}>₹{inv.totalAmount.toFixed(2)}</td>
                  <td style={{ color: '#059669', fontWeight: 600 }}>₹{inv.amountPaid.toFixed(2)}</td>
                  <td style={{ color: inv.balanceDue > 0 ? '#dc2626' : '#64748b', fontWeight: 700 }}>
                    ₹{inv.balanceDue.toFixed(2)}
                  </td>
                  <td>
                    <span className={`badge badge-${inv.status}`}>
                      {inv.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {inv.balanceDue > 0 && (
                        <button
                          onClick={() => {
                            setShowPayModal(inv);
                            setPaymentAmount(inv.balanceDue);
                          }}
                          className="btn btn-teal btn-sm"
                        >
                          Collect Pay
                        </button>
                      )}
                      <button
                        onClick={() => setPrintInvoice(inv)}
                        className="btn btn-secondary btn-sm"
                      >
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

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontWeight: 700 }}>Create New Patient Bill</h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleCreateInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Select Patient *</label>
                <select
                  required
                  className="form-control"
                  value={selectedPatient}
                  onChange={(e) => setSelectedPatient(e.target.value)}
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map(p => (
                    <option key={p._id} value={p._id}>{p.name} ({p.email})</option>
                  ))}
                </select>
              </div>

              {/* Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" style={{ margin: 0 }}>Billable Items / Services</label>
                  <button type="button" onClick={handleAddItem} className="btn btn-secondary btn-sm">
                    <Plus size={14} /> Add Item
                  </button>
                </div>

                {invoiceItems.map((item, idx) => (
                  <div key={idx} className="grid-3" style={{ gridTemplateColumns: '1.5fr 1fr 1fr', gap: '10px', background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Select Preset Service</label>
                      <select
                        className="form-control"
                        onChange={(e) => handleItemServiceChange(idx, e.target.value)}
                      >
                        <option value="">-- Choose Service --</option>
                        {services.map(s => (
                          <option key={s._id} value={s._id}>{s.name} (${s.price})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Description</label>
                      <input
                        type="text"
                        required
                        className="form-control"
                        value={item.description}
                        onChange={(e) => {
                          const updated = [...invoiceItems];
                          updated[idx].description = e.target.value;
                          setInvoiceItems(updated);
                        }}
                      />
                    </div>

                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Unit Price (₹)</label>
                      <input
                        type="number"
                        required
                        min="0"
                        className="form-control"
                        value={item.unitPrice}
                        onChange={(e) => {
                          const updated = [...invoiceItems];
                          updated[idx].unitPrice = Number(e.target.value);
                          setInvoiceItems(updated);
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Tax Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="form-control"
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(Number(e.target.value))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Discount Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Generate Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Collect Payment Modal */}
      {showPayModal && (
        <div className="modal-overlay" onClick={() => setShowPayModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontWeight: 700 }}>Record Payment Collection</h3>
              <button onClick={() => setShowPayModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleProcessPayment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px' }}>
                <div>Invoice: <strong>{showPayModal.invoiceNumber}</strong></div>
                <div>Patient: <strong>{showPayModal.patient?.name}</strong></div>
                <div style={{ marginTop: '6px', fontSize: '1.1rem', fontWeight: 800, color: '#dc2626' }}>
                  Total Balance Due: ₹{showPayModal.balanceDue.toFixed(2)}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Amount Collecting (₹) *</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  max={showPayModal.balanceDue}
                  className="form-control"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Payment Mode *</label>
                <select
                  className="form-control"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="Cash">Cash</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="UPI">UPI / Digital</option>
                  <option value="Insurance">Insurance</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowPayModal(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-teal">
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Receipt */}
      {printInvoice && (
        <InvoicePrintView
          invoice={printInvoice}
          onClose={() => setPrintInvoice(null)}
        />
      )}
    </div>
  );
};
