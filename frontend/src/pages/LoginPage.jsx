import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Activity, 
  Sparkles, 
  ShieldCheck, 
  Stethoscope, 
  Calendar, 
  FlaskConical, 
  Heart,
  Lock,
  Mail,
  ArrowRight,
  Loader2
} from 'lucide-react';

export const LoginPage = () => {
  const { login, demoLogin, register, error } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('patient');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLocalError('');

    if (isRegister) {
      const res = await register({ name, email, password, role, phone });
      if (!res.success) setLocalError(res.message);
    } else {
      const res = await login(email, password);
      if (!res.success) setLocalError(res.message);
    }
    setLoading(false);
  };

  const handleQuickDemo = async (demoRole) => {
    setLoading(true);
    setLocalError('');
    const res = await demoLogin(demoRole);
    if (!res.success) setLocalError(res.message);
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f0fdfa 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{
        maxWidth: '1050px',
        width: '100%',
        background: '#ffffff',
        borderRadius: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.12)',
        overflow: 'hidden',
        display: 'grid',
        gridTemplateColumns: '1.1fr 0.9fr'
      }}>
        {/* Left Side: Presentation & 1-Click Role Switcher */}
        <div style={{
          background: 'linear-gradient(135deg, #075985 0%, #0369a1 50%, #0d9488 100%)',
          padding: '44px',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Activity size={28} color="#ffffff" />
              </div>
              <div>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>MedAssist</h1>
                <div style={{ fontSize: '0.85rem', color: '#bae6fd' }}>Clinic Operations & AI Care Portal</div>
              </div>
            </div>

            <p style={{ fontSize: '0.95rem', color: '#e0f2fe', lineHeight: 1.6, marginBottom: '28px' }}>
              Integrated clinical care coordinating Patients, Doctors, Reception, Laboratory diagnostics, and Clinic Administrators with AI-powered clinical intelligence.
            </p>

            {/* Quick 1-Click Demo Evaluation Profiles */}
            <div style={{ background: 'rgba(255, 255, 255, 0.12)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} color="#fde047" /> Instant 1-Click Role Access:
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { role: 'admin', label: '👑 Clinic Admin', desc: 'Manage clinic, staff, pricing & audit logs', email: 'admin@medassist.com' },
                  { role: 'doctor', label: '🩺 Doctor Portal', desc: 'Consultations, SOAP EMR, Rx & AI Notes', email: 'dr.sarah@medassist.com' },
                  { role: 'receptionist', label: '📋 Reception & Queue', desc: 'Walk-ins, Appointments & Billing', email: 'receptionist@medassist.com' },
                  { role: 'lab_technician', label: '🔬 Lab Technician', desc: 'Specimen tracking & diagnostic results', email: 'labtech@medassist.com' },
                  { role: 'patient', label: '👤 Patient Portal', desc: '360° Timeline & AI Plain-Language Guide', email: 'patient@medassist.com' }
                ].map((item) => (
                  <button
                    key={item.role}
                    onClick={() => handleQuickDemo(item.role)}
                    disabled={loading}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(255, 255, 255, 0.95)',
                      color: '#0f172a',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = '#ffffff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)'; }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{item.label}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{item.desc}</div>
                    </div>
                    <ArrowRight size={16} color="#0284c7" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ fontSize: '0.75rem', color: '#bae6fd', marginTop: '24px' }}>
            Built on MERN Stack • MongoDB + Express + React + Node + AI
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div style={{ padding: '44px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
            {isRegister ? 'Create an Account' : 'Welcome Back'}
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '24px' }}>
            {isRegister ? 'Register your profile to access MedAssist services.' : 'Sign in to access your clinic portal dashboard.'}
          </p>

          {(localError || error) && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px' }}>
              {localError || error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {isRegister && (
              <>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="e.g. John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select
                    className="form-control"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="patient">Patient</option>
                    <option value="doctor">Doctor</option>
                    <option value="receptionist">Receptionist</option>
                    <option value="lab_technician">Lab Technician</option>
                    <option value="admin">Clinic Admin</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  required
                  className="form-control"
                  placeholder="name@medassist.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  required
                  className="form-control"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: '6px' }}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : (isRegister ? 'Create Account' : 'Sign In to Portal')}
            </button>
          </form>

          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.85rem', color: '#64748b' }}>
            {isRegister ? (
              <span>Already have an account? <button onClick={() => setIsRegister(false)} style={{ background: 'none', border: 'none', color: '#0284c7', fontWeight: 700, cursor: 'pointer' }}>Sign In</button></span>
            ) : (
              <span>New to MedAssist? <button onClick={() => setIsRegister(true)} style={{ background: 'none', border: 'none', color: '#0284c7', fontWeight: 700, cursor: 'pointer' }}>Register here</button></span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
