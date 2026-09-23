import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import { DashboardCard } from '../components/DashboardCard';
import { LabReportPrintView } from '../components/LabReportPrintView';
import {
  FlaskConical,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Edit3,
  Barcode,
  Printer,
  ShieldCheck,
  Search,
  Filter
} from 'lucide-react';

export const LabDashboard = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('workbench');

  // Synchronize activeTab with URL subpath
  useEffect(() => {
    if (location.pathname.includes('/results')) {
      setActiveTab('results');
    } else {
      setActiveTab('workbench');
    }
  }, [location.pathname]);

  const [orders, setOrders] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Result Entry Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [resultData, setResultData] = useState({
    result: '',
    unit: 'mg/dL',
    referenceRange: '70 - 99 mg/dL',
    flag: 'Normal',
    remarks: '',
    autoRelease: true
  });

  // Printable Report Modal
  const [printableReport, setPrintableReport] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, resultsRes] = await Promise.all([
        api.get('/lab/orders'),
        api.get('/lab/results')
      ]);

      if (ordersRes.data.success) setOrders(ordersRes.data.payload);
      if (resultsRes.data.success) setResults(resultsRes.data.payload);
    } catch (err) {
      console.error('Lab fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCollectSample = async (orderId) => {
    const barcode = `BAR-${Math.floor(100000 + Math.random() * 900000)}`;
    try {
      const res = await api.put(`/lab/sample-status/${orderId}`, {
        status: 'sample_collected',
        sampleBarcode: barcode
      });
      if (res.data.success) {
        setOrders(orders.map(o => o._id === orderId ? res.data.payload : o));
      }
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  const handleStartProcessing = async (orderId) => {
    try {
      const res = await api.put(`/lab/sample-status/${orderId}`, { status: 'processing' });
      if (res.data.success) {
        setOrders(orders.map(o => o._id === orderId ? res.data.payload : o));
      }
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  const handleOpenResultModal = (order) => {
    setSelectedOrder(order);
    setResultData({
      result: '',
      unit: order.testName.toLowerCase().includes('glucose') ? 'mg/dL' : 'g/dL',
      referenceRange: order.testName.toLowerCase().includes('glucose') ? '70 - 99 mg/dL' : '13.0 - 17.0 g/dL',
      flag: 'Normal',
      remarks: 'Automated diagnostic calibration verified.',
      autoRelease: true
    });
  };

  const handleSubmitResult = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      const res = await api.post('/lab/result', {
        labOrderId: selectedOrder._id,
        ...resultData
      });

      if (res.data.success) {
        alert('Diagnostic result saved and released to patient portal!');
        setSelectedOrder(null);
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleVerifyResult = async (resultId) => {
    try {
      const res = await api.put(`/lab/verify/${resultId}`);
      if (res.data.success) {
        alert('Result verified & released to patient portal!');
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handlePrintResult = (resItem) => {
    // Format for LabReportPrintView
    const printable = {
      orderNumber: resItem.labOrderId?.orderNumber || 'LAB-ORD-01',
      sampleBarcode: resItem.labOrderId?.sampleBarcode || 'BAR-9901',
      status: resItem.status,
      specimenType: resItem.labOrderId?.specimenType || 'Venous Blood',
      patient: {
        name: resItem.patientId?.fullName || 'Patient',
        phone: resItem.patientId?.phone || 'N/A'
      },
      doctor: {
        name: resItem.doctorId?.fullName || 'Dr. Clinic Specialist'
      },
      sampleCollectedAt: resItem.createdAt,
      completedAt: resItem.updatedAt,
      tests: [
        {
          testName: resItem.testName,
          resultValue: `${resItem.result} ${resItem.unit || ''}`,
          unit: resItem.unit,
          referenceRange: resItem.referenceRange,
          flag: resItem.flag
        }
      ],
      technicianNotes: resItem.remarks || 'Standard diagnostic analyzer evaluation.'
    };
    setPrintableReport(printable);
  };

  const pendingCollection = orders.filter(o => o.status === 'ordered');
  const inProcessing = orders.filter(o => o.status === 'sample_collected' || o.status === 'processing');
  const releasedCount = results.filter(r => r.status === 'released').length;

  // Filtered
  const filteredOrders = orders.filter(o => {
    const q = searchQuery.toLowerCase();
    const pName = (o.patientId?.fullName || '').toLowerCase();
    const tName = (o.testName || '').toLowerCase();
    const bCode = (o.sampleBarcode || '').toLowerCase();
    return pName.includes(q) || tName.includes(q) || bCode.includes(q);
  });

  const filteredResults = results.filter(r => {
    const q = searchQuery.toLowerCase();
    const pName = (r.patientId?.fullName || '').toLowerCase();
    const tName = (r.testName || '').toLowerCase();
    return pName.includes(q) || tName.includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Diagnostic Lab Workbench</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Specimen tracking, automated analyzers, test results & verification.</p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search patient, test, barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl"
          />
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <DashboardCard
          title="Awaiting Sample Collection"
          value={pendingCollection.length}
          subtext="Ordered by doctors"
          icon={Clock}
          color="amber"
        />
        <DashboardCard
          title="In Lab Processing"
          value={inProcessing.length}
          subtext="Specimens being analyzed"
          icon={FlaskConical}
          color="sky"
        />
        <DashboardCard
          title="Verified & Released"
          value={releasedCount}
          subtext="Available in patient portal"
          icon={CheckCircle2}
          color="teal"
        />
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('workbench')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'workbench'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FlaskConical className="w-4 h-4" /> Specimen Workbench & Orders ({orders.length})
        </button>

        <button
          onClick={() => setActiveTab('results')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'results'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" /> Released Test Results ({results.length})
        </button>
      </div>

      {/* TAB 1: Specimen Workbench (Orders) */}
      {activeTab === 'workbench' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-teal-600" />
              <h3 className="font-bold text-slate-900">Lab Orders & Specimen Intake</h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">{filteredOrders.length} orders listed</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-6">Barcode / ID</th>
                  <th className="py-3 px-6">Patient</th>
                  <th className="py-3 px-6">Test Name & Specimen</th>
                  <th className="py-3 px-6">Ordering Doctor</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Workflow Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-slate-400">
                      No lab orders found.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((o) => (
                    <tr key={o._id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-6">
                        <span className="font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded flex items-center gap-1 w-max border border-sky-100">
                          <Barcode className="w-3 h-3" /> {o.sampleBarcode || 'Pending Barcode'}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 font-bold text-slate-900">{o.patientId?.fullName}</td>
                      <td className="py-3.5 px-6">
                        <div className="font-bold text-slate-900">{o.testName}</div>
                        <div className="text-[11px] text-teal-700 font-semibold">{o.specimenType} Specimen</div>
                      </td>
                      <td className="py-3.5 px-6 text-slate-600">Dr. {o.doctorId?.fullName}</td>
                      <td className="py-3.5 px-6">
                        <span className={`font-bold uppercase tracking-wider text-[10px] px-2.5 py-0.5 rounded-full ${
                          o.status === 'released'
                            ? 'bg-emerald-100 text-emerald-800'
                            : o.status === 'processing'
                            ? 'bg-sky-100 text-sky-800'
                            : o.status === 'sample_collected'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {o.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {o.status === 'ordered' && (
                            <button
                              onClick={() => handleCollectSample(o._id)}
                              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-sm text-[11px] transition"
                            >
                              Collect Sample
                            </button>
                          )}
                          {o.status === 'sample_collected' && (
                            <button
                              onClick={() => handleStartProcessing(o._id)}
                              className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg shadow-sm text-[11px] transition"
                            >
                              Process
                            </button>
                          )}
                          {(o.status === 'processing' || o.status === 'sample_collected') && (
                            <button
                              onClick={() => handleOpenResultModal(o)}
                              className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg shadow-sm text-[11px] transition"
                            >
                              Enter Result
                            </button>
                          )}
                          {o.status === 'released' && (
                            <span className="text-emerald-600 font-bold flex items-center gap-1 text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Released
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Verified Results & Reports */}
      {activeTab === 'results' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-900">Recorded Diagnostic Results & Reports</h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">{filteredResults.length} reports</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-6">Patient</th>
                  <th className="py-3 px-6">Investigation Test</th>
                  <th className="py-3 px-6">Observed Result</th>
                  <th className="py-3 px-6">Reference Range</th>
                  <th className="py-3 px-6">Biological Flag</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredResults.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-slate-400">
                      No released test results found.
                    </td>
                  </tr>
                ) : (
                  filteredResults.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-6 font-bold text-slate-900">{r.patientId?.fullName}</td>
                      <td className="py-3.5 px-6 font-bold text-slate-900">{r.testName}</td>
                      <td className="py-3.5 px-6 font-black text-sm text-slate-900">
                        {r.result} <span className="text-xs font-normal text-slate-500">{r.unit}</span>
                      </td>
                      <td className="py-3.5 px-6 text-slate-500">{r.referenceRange || 'Standard'}</td>
                      <td className="py-3.5 px-6">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                          r.flag === 'High'
                            ? 'bg-red-100 text-red-700'
                            : r.flag === 'Low'
                            ? 'bg-amber-100 text-amber-700'
                            : r.flag === 'Critical'
                            ? 'bg-red-200 text-red-900 font-black'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {r.flag}
                        </span>
                      </td>
                      <td className="py-3.5 px-6">
                        {r.status === 'pending' ? (
                          <span className="text-amber-600 font-bold">Pending Review</span>
                        ) : (
                          <span className="font-bold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Released
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {r.status === 'pending' ? (
                            <button
                              onClick={() => handleVerifyResult(r._id)}
                              className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-[11px] shadow-sm transition"
                            >
                              Verify & Release
                            </button>
                          ) : (
                            <button
                              onClick={() => handlePrintResult(r)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] border border-slate-300 transition flex items-center gap-1"
                            >
                              <Printer className="w-3 h-3" /> Print
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Result Entry Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-black text-slate-900 text-lg">Enter Test Result</h3>
                <p className="text-xs text-slate-500">{selectedOrder.testName} for {selectedOrder.patientId?.fullName}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmitResult} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Result Value *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 104"
                    value={resultData.result}
                    onChange={(e) => setResultData({ ...resultData, result: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unit</label>
                  <input
                    type="text"
                    placeholder="e.g. mg/dL"
                    value={resultData.unit}
                    onChange={(e) => setResultData({ ...resultData, unit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Biological Reference Range</label>
                  <input
                    type="text"
                    placeholder="e.g. 70 - 99 mg/dL"
                    value={resultData.referenceRange}
                    onChange={(e) => setResultData({ ...resultData, referenceRange: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Biological Flag</label>
                  <select
                    value={resultData.flag}
                    onChange={(e) => setResultData({ ...resultData, flag: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Low">Low</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Technician Remarks</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Automated analyzer calibration verified."
                  value={resultData.remarks}
                  onChange={(e) => setResultData({ ...resultData, remarks: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center gap-2 p-2.5 bg-teal-50 border border-teal-200 rounded-xl">
                <input
                  type="checkbox"
                  id="autoRel"
                  checked={resultData.autoRelease}
                  onChange={(e) => setResultData({ ...resultData, autoRelease: e.target.checked })}
                />
                <label htmlFor="autoRel" className="font-bold text-teal-900 cursor-pointer">
                  Verify & immediately release result to patient portal
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 font-bold rounded-xl text-white shadow-md"
                >
                  Save & Authorize Result
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Diagnostic Report Modal */}
      {printableReport && (
        <LabReportPrintView
          labOrder={printableReport}
          onClose={() => setPrintableReport(null)}
        />
      )}
    </div>
  );
};
