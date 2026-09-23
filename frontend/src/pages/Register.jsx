import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Activity, ShieldCheck, Heart, ArrowRight, Info, Building2, User } from 'lucide-react';

export const Register = () => {
  const [selectedRole, setSelectedRole] = useState('patient'); // 'patient' | 'admin'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    // Patient Details
    dateOfBirth: '1995-01-01',
    gender: 'Male',
    bloodGroup: 'O+',
    allergies: '',
    chronicConditions: '',
    // Admin Details
    clinicName: 'MedAssist Multi-Speciality Clinic'
  });

  const { register, error } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      role: selectedRole
    };

    if (selectedRole === 'patient') {
      payload.patientDetails = {
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        bloodGroup: formData.bloodGroup,
        allergies: formData.allergies ? formData.allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
        chronicConditions: formData.chronicConditions ? formData.chronicConditions.split(',').map(s => s.trim()).filter(Boolean) : []
      };
    } else if (selectedRole === 'admin') {
      payload.clinicName = formData.clinicName;
    }

    const res = await register(payload);
    setLoading(false);
    if (res.success) {
      navigate(res.user?.role === 'admin' ? '/admin' : '/patient');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-teal-50 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-xl w-full bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-teal-500 flex items-center justify-center text-white shadow-md">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">MedAssist Portal</h1>
            <p className="text-xs text-slate-500 font-medium">Create Patient or Clinic Administrator Account</p>
          </div>
        </div>

        {/* Account Type Selector (Patient vs Admin) */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-slate-700 mb-2">Select Registration Type</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedRole('patient')}
              className={`p-3.5 rounded-2xl border text-left transition flex items-start gap-3 ${
                selectedRole === 'patient'
                  ? 'border-sky-600 bg-sky-50/60 shadow-sm ring-2 ring-sky-500/20'
                  : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 text-slate-600'
              }`}
            >
              <div className={`p-2 rounded-xl ${selectedRole === 'patient' ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                <Heart className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-black text-slate-900">Patient Account</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Appointments, prescriptions & test reports</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('admin')}
              className={`p-3.5 rounded-2xl border text-left transition flex items-start gap-3 ${
                selectedRole === 'admin'
                  ? 'border-purple-600 bg-purple-50/60 shadow-sm ring-2 ring-purple-500/20'
                  : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 text-slate-600'
              }`}
            >
              <div className={`p-2 rounded-xl ${selectedRole === 'admin' ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-black text-slate-900">Clinic Admin</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Manage doctors, staff & clinic billing</div>
              </div>
            </button>
          </div>
        </div>

        {/* Staff Notice Banner */}
        <div className="mb-6 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-2.5 text-xs text-slate-600">
          <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-800">Medical Staff Notice: </span>
            Doctors, Receptionists, and Laboratory Technicians are onboarded directly by the Clinic Administrator inside the Admin Dashboard. Staff members should{' '}
            <Link to="/login" className="font-bold text-sky-600 underline hover:text-sky-800">
              Sign In Here
            </Link>.
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Common Account Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {selectedRole === 'admin' ? 'Administrator Name *' : 'Full Legal Name *'}
              </label>
              <input
                type="text"
                required
                placeholder={selectedRole === 'admin' ? 'e.g. Dr. Arthur Vance' : 'e.g. Johnathan Doe'}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none transition"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                placeholder={selectedRole === 'admin' ? 'admin@clinic.com' : 'john@example.com'}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Password *</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none transition"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Conditional Fields: Patient Details */}
          {selectedRole === 'patient' && (
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Patient Medical Demographics
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none transition text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none transition text-xs"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Blood Group</label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none transition text-xs"
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
                <label className="block font-bold text-slate-700 mb-1">Known Allergies (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Penicillin, Peanuts, Aspirin (optional)"
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-sky-500 focus:outline-none transition"
                />
              </div>
            </div>
          )}

          {/* Conditional Fields: Admin Details */}
          {selectedRole === 'admin' && (
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="text-[11px] font-black uppercase tracking-wider text-purple-600">
                Clinic Organization Settings
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Clinic / Hospital Center Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Health & Medical Centre"
                  value={formData.clinicName}
                  onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-purple-500 focus:outline-none transition"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 text-white font-bold rounded-xl transition shadow-md disabled:opacity-50 mt-4 flex items-center justify-center gap-2 text-xs ${
              selectedRole === 'admin'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-purple-500/20'
                : 'bg-gradient-to-r from-sky-600 to-teal-500 hover:from-sky-700 hover:to-teal-600 shadow-sky-500/20'
            }`}
          >
            {loading ? 'Creating Account...' : `Register as ${selectedRole === 'admin' ? 'Clinic Administrator' : 'Patient'}`}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-sky-600 hover:underline">
            Sign In with Email & Password
          </Link>
        </div>
      </div>
    </div>
  );
};
