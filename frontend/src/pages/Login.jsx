import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Activity, Lock, Mail, ArrowRight, ShieldCheck, Stethoscope, Users, CheckCircle2 } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, error } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRoleRedirect = (role) => {
    const routes = {
      admin: '/admin',
      doctor: '/doctor',
      receptionist: '/reception',
      lab: '/lab',
      patient: '/patient'
    };
    navigate(routes[role] || '/');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.success) {
      handleRoleRedirect(res.user.role);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-teal-50 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden grid md:grid-cols-2">
        {/* Left Side: Professional Clinical Portal Presentation */}
        <div className="bg-gradient-to-br from-sky-700 via-sky-600 to-teal-600 p-8 sm:p-10 text-white flex flex-col justify-between">
          <div>
            <Link to="/" className="inline-flex items-center gap-3 mb-6 group">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner group-hover:scale-105 transition">
                <Activity className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">MedAssist</h1>
                <p className="text-xs text-sky-100 font-medium">Clinic Operations & Patient Care</p>
              </div>
            </Link>

            <h2 className="text-xl font-bold text-white mb-3">
              One Unified System for 5 Interconnected Roles
            </h2>
            <p className="text-xs text-sky-100 mb-6 leading-relaxed">
              Login with your registered credentials. MedAssist provides secure, role-restricted clinical dashboards for Administrators, Doctors, Receptionists, Lab Staff, and Patients.
            </p>

            <div className="space-y-3 bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 text-xs">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 mt-0.5 shrink-0" />
                <span><strong>Role Isolation:</strong> One role cannot view or modify features assigned to another.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 mt-0.5 shrink-0" />
                <span><strong>Live Coordination:</strong> Appointments, SOAP notes, prescriptions & lab orders connect in real time.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 mt-0.5 shrink-0" />
                <span><strong>Embedded AI:</strong> Structured clinical summaries for doctors and plain-English guides for patients.</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-sky-200 mt-8 pt-4 border-t border-white/10 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-300" /> End-to-End Secure JWT
            </span>
            <Link to="/" className="text-white hover:underline font-semibold">
              ← Return to Home
            </Link>
          </div>
        </div>

        {/* Right Side: Clean Authentication Form */}
        <div className="p-8 sm:p-10 flex flex-col justify-center">
          <h2 className="text-2xl font-black text-slate-900 mb-1">Sign In</h2>
          <p className="text-xs text-slate-500 mb-6">Enter your email and password to access your role portal.</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="name@medassist.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">Password</label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500 focus:bg-white transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-500">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-bold text-sky-600 hover:text-sky-700">
              Create an Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
