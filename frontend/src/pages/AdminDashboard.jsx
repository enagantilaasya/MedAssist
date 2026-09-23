import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import { DashboardCard } from '../components/DashboardCard';
import {
  Users, IndianRupee, Calendar, Activity, ShieldCheck, Plus,
  CheckCircle, XCircle, Search, Layers, FileText, Stethoscope,
  ClipboardList, FlaskConical, Eye, EyeOff, Copy, Check, Filter, UserCheck
} from 'lucide-react';

export const AdminDashboard = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Directory Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'doctor' | 'receptionist' | 'lab' | 'patient' | 'admin'

  // Add Staff Modal
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffRole, setStaffRole] = useState('doctor'); // 'doctor' | 'receptionist' | 'lab'
  const [showPassword, setShowPassword] = useState(false);
  const [submittingStaff, setSubmittingStaff] = useState(false);
  const [copiedCreds, setCopiedCreds] = useState(false);
  const [createdStaffCreds, setCreatedStaffCreds] = useState(null);

  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: 'password123',
    // Doctor Details
    specialization: 'General Medicine',
    licenseNumber: '',
    consultationFee: 500,
    roomNumber: 'Suite 101',
    departmentId: '',
    // Receptionist Details
    deskLocation: 'Front Desk Counter 1',
    shift: 'Morning (08:00 AM - 04:00 PM)',
    // Lab Tech Details
    labSection: 'Hematology & Clinical Pathology',
    certificationId: ''
  });

  // Synchronize activeTab with URL subpath
  useEffect(() => {
    if (location.pathname.includes('/users')) setActiveTab('users');
    else if (location.pathname.includes('/services') || location.pathname.includes('/departments')) setActiveTab('services');
    else if (location.pathname.includes('/audit')) setActiveTab('audit');
    else setActiveTab('overview');
  }, [location.pathname]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, servicesRes, deptsRes, logsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/services'),
        api.get('/admin/departments').catch(() => ({ data: { success: true, payload: [] } })),
        api.get('/admin/audit-logs')
      ]);

      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (usersRes.data.success) setUsers(usersRes.data.payload);
      if (servicesRes.data.success) setServices(servicesRes.data.payload);
      if (deptsRes.data.success) setDepartments(deptsRes.data.payload || []);
      if (logsRes.data.success) setAuditLogs(logsRes.data.payload);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddStaffModal = (role = 'doctor') => {
    setStaffRole(role);
    setCreatedStaffCreds(null);
    setCopiedCreds(false);
    setStaffForm({
      name: '',
      email: '',
      phone: '',
      password: 'password123',
      specialization: role === 'doctor' ? 'Cardiology & Internal Medicine' : 'General Medicine',
      licenseNumber: `LIC-${Math.floor(10000 + Math.random() * 90000)}`,
      consultationFee: 600,
      roomNumber: 'Room 201',
      departmentId: departments.length > 0 ? departments[0]._id : '',
      deskLocation: 'Main Reception Desk #1',
      shift: 'Morning (08:00 AM - 04:00 PM)',
      labSection: 'Clinical Pathology & Biochemistry',
      certificationId: `MLT-${Math.floor(1000 + Math.random() * 9000)}`
    });
    setShowStaffModal(true);
  };

  const handleToggleStatus = async (u) => {
    try {
      const res = await api.put(`/admin/toggle-user/${u._id}`);
      if (res.data.success) {
        setUsers(users.map(item => item._id === u._id ? { ...item, status: res.data.payload.status } : item));
      }
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  const handleAddStaffSubmit = async (e) => {
    e.preventDefault();
    setSubmittingStaff(true);
    try {
      const payload = {
        name: staffForm.name,
        email: staffForm.email.toLowerCase().trim(),
        phone: staffForm.phone,
        password: staffForm.password || 'password123',
        role: staffRole
      };

      if (staffRole === 'doctor') {
        payload.doctorDetails = {
          specialization: staffForm.specialization,
          licenseNumber: staffForm.licenseNumber || `LIC-${Math.floor(10000 + Math.random() * 90000)}`,
          consultationFee: Number(staffForm.consultationFee || 500),
          roomNumber: staffForm.roomNumber || 'Room 101',
          departmentId: staffForm.departmentId || null
        };
      }

      const res = await api.post('/admin/add-staff', payload);
      if (res.data.success) {
        setCreatedStaffCreds({
          name: staffForm.name,
          email: staffForm.email,
          password: staffForm.password || 'password123',
          role: staffRole
        });
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to add staff member');
    } finally {
      setSubmittingStaff(false);
    }
  };

  const copyCredsToClipboard = () => {
    if (!createdStaffCreds) return;
    const text = `MedAssist Staff Portal Credentials:\nRole: ${createdStaffCreds.role.toUpperCase()}\nName: ${createdStaffCreds.name}\nEmail: ${createdStaffCreds.email}\nPassword: ${createdStaffCreds.password}\nLogin URL: ${window.location.origin}/login`;
    navigator.clipboard.writeText(text);
    setCopiedCreds(true);
    setTimeout(() => setCopiedCreds(false), 2500);
  };

  // Filtered users for directory
  const filteredUsers = users.filter(u => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q);
    return matchesRole && matchesSearch;
  });

  const doctorCount = users.filter(u => u.role === 'doctor').length;
  const receptionistCount = users.filter(u => u.role === 'receptionist').length;
  const labCount = users.filter(u => u.role === 'lab').length;
  const patientCount = users.filter(u => u.role === 'patient').length;
  const adminCount = users.filter(u => u.role === 'admin').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Clinic Administration</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Provision medical staff (Doctors, Receptionists, Lab Technicians), configure Indian Rupee (₹) pricing, and inspect audit trails.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => openAddStaffModal('doctor')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
          >
            <Stethoscope className="w-3.5 h-3.5" /> + Register Doctor
          </button>
          <button
            onClick={() => openAddStaffModal('receptionist')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
          >
            <ClipboardList className="w-3.5 h-3.5" /> + Register Receptionist
          </button>
          <button
            onClick={() => openAddStaffModal('lab')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
          >
            <FlaskConical className="w-3.5 h-3.5" /> + Register Lab Tech
          </button>
        </div>
      </div>

      {/* Analytics Row in Rupees (₹) */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <DashboardCard
            title="Total Patients"
            value={stats.totalPatients}
            subtext="Registered clinic patients"
            icon={Users}
            color="emerald"
          />
          <DashboardCard
            title="Doctors & Staff"
            value={stats.totalDoctors + stats.totalStaff}
            subtext={`${stats.totalDoctors} Doctors • ${stats.totalStaff} Staff`}
            icon={Activity}
            color="sky"
          />
          <DashboardCard
            title="Today's Appointments"
            value={stats.todayAppointments}
            subtext={`Total All-Time: ${stats.totalAppointments}`}
            icon={Calendar}
            color="amber"
          />
          <DashboardCard
            title="Collected Revenue"
            value={`₹${stats.totalRevenue.toFixed(2)}`}
            subtext={`Pending: ₹${stats.pendingDues.toFixed(2)}`}
            icon={IndianRupee}
            color="purple"
          />
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 space-x-2 sm:space-x-4 overflow-x-auto pb-1">
        {[
          { id: 'overview', label: 'All Modules' },
          { id: 'users', label: `Staff & User Directory (${users.length})` },
          { id: 'services', label: 'Services & Pricing (₹)' },
          { id: 'audit', label: 'Security Audit Trail' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-2.5 px-4 font-bold text-xs sm:text-sm border-b-2 transition whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Staff & User Directory */}
      {(activeTab === 'overview' || activeTab === 'users') && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-slate-900 text-base">Clinic Staff & User Directory</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Manage and activate verified clinic doctors, receptionists, lab technicians, and patients.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => openAddStaffModal('doctor')}
                className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-bold rounded-lg transition inline-flex items-center gap-1.5"
              >
                <Stethoscope className="w-3.5 h-3.5" /> + Doctor
              </button>
              <button
                onClick={() => openAddStaffModal('receptionist')}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold rounded-lg transition inline-flex items-center gap-1.5"
              >
                <ClipboardList className="w-3.5 h-3.5" /> + Receptionist
              </button>
              <button
                onClick={() => openAddStaffModal('lab')}
                className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-bold rounded-lg transition inline-flex items-center gap-1.5"
              >
                <FlaskConical className="w-3.5 h-3.5" /> + Lab Tech
              </button>
            </div>
          </div>

          {/* Directory Search & Role Filters */}
          <div className="px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search staff by name, email, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 focus:bg-white"
              />
            </div>

            {/* Role Filter Badges */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { id: 'all', label: `All (${users.length})` },
                { id: 'doctor', label: `Doctors (${doctorCount})` },
                { id: 'receptionist', label: `Receptionists (${receptionistCount})` },
                { id: 'lab', label: `Lab (${labCount})` },
                { id: 'patient', label: `Patients (${patientCount})` },
                { id: 'admin', label: `Admins (${adminCount})` }
              ].map(rf => (
                <button
                  key={rf.id}
                  onClick={() => setRoleFilter(rf.id)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition whitespace-nowrap ${
                    roleFilter === rf.id
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {rf.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-6">Name</th>
                  <th className="py-3 px-6">Email / Phone</th>
                  <th className="py-3 px-6">Role</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-400">
                      No staff members or users matching "{searchQuery}" with role "{roleFilter}".
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const roleBadgeConfig = {
                      doctor: { bg: 'bg-sky-50 text-sky-700 border-sky-200', icon: Stethoscope, label: 'Doctor' },
                      receptionist: { bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: ClipboardList, label: 'Receptionist' },
                      lab: { bg: 'bg-purple-50 text-purple-700 border-purple-200', icon: FlaskConical, label: 'Lab Tech' },
                      patient: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Users, label: 'Patient' },
                      admin: { bg: 'bg-rose-50 text-rose-700 border-rose-200', icon: ShieldCheck, label: 'Admin' }
                    }[u.role] || { bg: 'bg-slate-100 text-slate-700 border-slate-200', icon: Users, label: u.role };

                    const IconComp = roleBadgeConfig.icon;

                    return (
                      <tr key={u._id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3.5 px-6">
                          <div className="font-bold text-slate-900">{u.name}</div>
                          <div className="text-[10px] text-slate-400">ID: {u._id}</div>
                        </td>
                        <td className="py-3.5 px-6 text-slate-600">
                          <div>{u.email}</div>
                          <div className="text-[10px] text-slate-400">{u.phone || 'No phone'}</div>
                        </td>
                        <td className="py-3.5 px-6">
                          <span className={`inline-flex items-center gap-1 font-bold text-[11px] px-2.5 py-1 rounded-lg border ${roleBadgeConfig.bg}`}>
                            <IconComp className="w-3 h-3" />
                            {roleBadgeConfig.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-6">
                          <span className={`inline-flex items-center gap-1 font-bold ${u.status === 'active' ? 'text-emerald-600' : 'text-red-500'}`}>
                            {u.status === 'active' ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                            {u.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-6">
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition"
                          >
                            {u.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Services & Diagnostic Pricing in Rupees (₹) */}
      {(activeTab === 'overview' || activeTab === 'services') && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-600" />
              <h3 className="font-bold text-slate-900">Clinic Services & Pricing Schedule (₹ INR)</h3>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-6">Code</th>
                  <th className="py-3 px-6">Service Name</th>
                  <th className="py-3 px-6">Category</th>
                  <th className="py-3 px-6">Price (₹)</th>
                  <th className="py-3 px-6">Tax (%)</th>
                  <th className="py-3 px-6">Reference Range</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {services.map((srv) => (
                  <tr key={srv._id}>
                    <td className="py-3 px-6 font-mono font-bold text-sky-600">{srv.code}</td>
                    <td className="py-3 px-6 font-bold text-slate-900">{srv.name}</td>
                    <td className="py-3 px-6 text-slate-600">{srv.category}</td>
                    <td className="py-3 px-6 font-black text-slate-900">₹{srv.price.toFixed(2)}</td>
                    <td className="py-3 px-6 text-slate-600">{srv.taxPercentage}%</td>
                    <td className="py-3 px-6 text-slate-500">{srv.normalRange || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Security & Audit Logs */}
      {(activeTab === 'overview' || activeTab === 'audit') && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-slate-900">Security & Access Audit Trail</h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">Immutable system history</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-6">Timestamp</th>
                  <th className="py-3 px-6">Actor</th>
                  <th className="py-3 px-6">Action</th>
                  <th className="py-3 px-6">Module</th>
                  <th className="py-3 px-6">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {auditLogs.slice(0, 15).map((log) => (
                  <tr key={log._id}>
                    <td className="py-3 px-6 text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-6 font-bold text-slate-900">{log.userName} ({log.role})</td>
                    <td className="py-3 px-6">
                      <span className="font-mono text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded text-sky-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-slate-600">{log.module}</td>
                    <td className="py-3 px-6 text-slate-700">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Staff Registration Modal */}
      {showStaffModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-black text-slate-900 text-lg">Register Clinic Medical Staff</h3>
                <p className="text-xs text-slate-500">Add an authentic Doctor, Receptionist, or Lab Tech account.</p>
              </div>
              <button
                onClick={() => setShowStaffModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {createdStaffCreds ? (
              /* Success / Credentials View */
              <div className="space-y-4 py-2">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-900 text-sm">Staff Member Registered Successfully!</h4>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      The {createdStaffCreds.role} account has been provisioned and is ready for login.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs font-mono">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Role:</span>
                    <span className="font-bold text-slate-900 uppercase">{createdStaffCreds.role}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Full Name:</span>
                    <span className="font-bold text-slate-900">{createdStaffCreds.name}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Login Email:</span>
                    <span className="font-bold text-sky-700">{createdStaffCreds.email}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Password:</span>
                    <span className="font-bold text-purple-700">{createdStaffCreds.password}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 pt-1 border-t border-slate-200">
                    <span>Login Route:</span>
                    <span className="font-bold text-emerald-700">/login → /{createdStaffCreds.role === 'receptionist' ? 'reception' : createdStaffCreds.role}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={copyCredsToClipboard}
                    className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    {copiedCreds ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    {copiedCreds ? 'Copied Credentials!' : 'Copy Staff Credentials'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCreatedStaffCreds(null);
                      setShowStaffModal(false);
                    }}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              /* Registration Form */
              <form onSubmit={handleAddStaffSubmit} className="space-y-4 text-xs">
                {/* Role Switcher Cards */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Select Role to Register *</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setStaffRole('doctor')}
                      className={`p-2.5 rounded-xl border text-left transition flex flex-col items-center sm:items-start text-center sm:text-left gap-1 ${
                        staffRole === 'doctor'
                          ? 'border-sky-500 bg-sky-50 text-sky-900 shadow-sm ring-2 ring-sky-300'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Stethoscope className="w-4 h-4 text-sky-600" />
                      <span className="font-bold text-xs">Doctor</span>
                      <span className="text-[10px] text-slate-500 hidden sm:inline">Clinical consultations & Rx</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStaffRole('receptionist')}
                      className={`p-2.5 rounded-xl border text-left transition flex flex-col items-center sm:items-start text-center sm:text-left gap-1 ${
                        staffRole === 'receptionist'
                          ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-sm ring-2 ring-amber-300'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <ClipboardList className="w-4 h-4 text-amber-600" />
                      <span className="font-bold text-xs">Receptionist</span>
                      <span className="text-[10px] text-slate-500 hidden sm:inline">Queue, bookings & bills</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStaffRole('lab')}
                      className={`p-2.5 rounded-xl border text-left transition flex flex-col items-center sm:items-start text-center sm:text-left gap-1 ${
                        staffRole === 'lab'
                          ? 'border-purple-500 bg-purple-50 text-purple-900 shadow-sm ring-2 ring-purple-300'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <FlaskConical className="w-4 h-4 text-purple-600" />
                      <span className="font-bold text-xs">Lab Tech</span>
                      <span className="text-[10px] text-slate-500 hidden sm:inline">Specimens & pathology</span>
                    </button>
                  </div>
                </div>

                {/* Common Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {staffRole === 'doctor' ? 'Doctor Full Name *' : 'Staff Full Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={staffRole === 'doctor' ? 'e.g. Dr. Rajesh Mehra' : 'e.g. Priya Sharma'}
                      value={staffForm.name}
                      onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Email Address (Login ID) *</label>
                    <input
                      type="email"
                      required
                      placeholder={staffRole === 'doctor' ? 'doctor.name@medassist.com' : `${staffRole}@medassist.com`}
                      value={staffForm.email}
                      onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Password *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        placeholder="••••••••"
                        value={staffForm.password}
                        onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-purple-500 focus:outline-none pr-9 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={staffForm.phone}
                      onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Role Specific Details: DOCTOR */}
                {staffRole === 'doctor' && (
                  <div className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-2xl space-y-3">
                    <div className="font-bold text-sky-900 text-xs flex items-center gap-1.5">
                      <Stethoscope className="w-4 h-4 text-sky-600" />
                      Doctor Clinical Profile & Scheduling
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block font-bold text-slate-700 mb-0.5">Specialization *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Cardiology & Internal Medicine"
                          value={staffForm.specialization}
                          onChange={(e) => setStaffForm({ ...staffForm, specialization: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-0.5">Consultation Fee (₹ INR) *</label>
                        <input
                          type="number"
                          required
                          min={0}
                          placeholder="e.g. 500"
                          value={staffForm.consultationFee}
                          onChange={(e) => setStaffForm({ ...staffForm, consultationFee: Number(e.target.value) })}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block font-bold text-slate-700 mb-0.5">Medical License #</label>
                        <input
                          type="text"
                          placeholder="e.g. MCI-29182"
                          value={staffForm.licenseNumber}
                          onChange={(e) => setStaffForm({ ...staffForm, licenseNumber: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-0.5">OPD Chamber / Room</label>
                        <input
                          type="text"
                          placeholder="e.g. Suite 204"
                          value={staffForm.roomNumber}
                          onChange={(e) => setStaffForm({ ...staffForm, roomNumber: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-0.5">Department</label>
                        <select
                          value={staffForm.departmentId}
                          onChange={(e) => setStaffForm({ ...staffForm, departmentId: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        >
                          <option value="">General OPD</option>
                          {departments.map(d => (
                            <option key={d._id} value={d._id}>{d.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Role Specific Details: RECEPTIONIST */}
                {staffRole === 'receptionist' && (
                  <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2.5">
                    <div className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                      <ClipboardList className="w-4 h-4 text-amber-600" />
                      Front Desk & Billing Station Configuration
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block font-bold text-slate-700 mb-0.5">Reception Counter / Desk</label>
                        <input
                          type="text"
                          placeholder="e.g. Main Lobby Counter #2"
                          value={staffForm.deskLocation}
                          onChange={(e) => setStaffForm({ ...staffForm, deskLocation: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-0.5">Assigned Shift</label>
                        <select
                          value={staffForm.shift}
                          onChange={(e) => setStaffForm({ ...staffForm, shift: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        >
                          <option value="Morning (08:00 AM - 04:00 PM)">Morning (08:00 AM - 04:00 PM)</option>
                          <option value="Evening (01:00 PM - 09:00 PM)">Evening (01:00 PM - 09:00 PM)</option>
                          <option value="Night (09:00 PM - 08:00 AM)">Night (09:00 PM - 08:00 AM)</option>
                          <option value="General Outpatient Shift">General Outpatient Shift</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Role Specific Details: LAB TECH */}
                {staffRole === 'lab' && (
                  <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-2.5">
                    <div className="font-bold text-purple-900 text-xs flex items-center gap-1.5">
                      <FlaskConical className="w-4 h-4 text-purple-600" />
                      Diagnostic Laboratory Assignment
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block font-bold text-slate-700 mb-0.5">Laboratory Section</label>
                        <select
                          value={staffForm.labSection}
                          onChange={(e) => setStaffForm({ ...staffForm, labSection: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        >
                          <option value="Hematology & Clinical Pathology">Hematology & Clinical Pathology</option>
                          <option value="Biochemistry & Metabolic Panels">Biochemistry & Metabolic Panels</option>
                          <option value="Microbiology & Serology">Microbiology & Serology</option>
                          <option value="Histopathology & Cytology">Histopathology & Cytology</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-0.5">Lab Technician Certification #</label>
                        <input
                          type="text"
                          placeholder="e.g. MLT-2026-88"
                          value={staffForm.certificationId}
                          onChange={(e) => setStaffForm({ ...staffForm, certificationId: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowStaffModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingStaff}
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-700 font-bold rounded-xl text-white shadow-md transition disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    {submittingStaff ? 'Registering...' : `Create ${staffRole.charAt(0).toUpperCase() + staffRole.slice(1)} Account`}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
