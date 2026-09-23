import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { 
  Activity, 
  LogOut, 
  ShieldCheck, 
  Stethoscope, 
  Calendar, 
  FlaskConical, 
  Heart,
  User
} from 'lucide-react';

const roleMeta = {
  admin: { label: 'Clinic Admin', color: 'text-purple-700 bg-purple-50 border-purple-200', icon: ShieldCheck },
  doctor: { label: 'Doctor', color: 'text-sky-700 bg-sky-50 border-sky-200', icon: Stethoscope },
  receptionist: { label: 'Receptionist', color: 'text-amber-700 bg-amber-50 border-amber-200', icon: Calendar },
  lab: { label: 'Lab Technician', color: 'text-teal-700 bg-teal-50 border-teal-200', icon: FlaskConical },
  patient: { label: 'Patient', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: Heart }
};

export const Navbar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user || location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  const currentMeta = roleMeta[user.role] || { label: user.role, color: 'text-slate-600 bg-slate-50', icon: User };
  const CurrentIcon = currentMeta.icon;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Role-specific navigation links strictly for the logged-in role
  const getNavLinks = () => {
    switch (user.role) {
      case 'admin':
        return [
          { to: '/admin', label: 'Admin Overview' },
          { to: '/admin/users', label: 'Staff & Users' },
          { to: '/admin/services', label: 'Services & Pricing' },
          { to: '/admin/departments', label: 'Departments' },
          { to: '/admin/audit', label: 'Audit Trail' }
        ];
      case 'doctor':
        return [
          { to: '/doctor', label: 'Doctor Portal' },
          { to: '/doctor/appointments', label: 'My Appointments' },
          { to: '/doctor/notes', label: 'Clinical Notes' },
          { to: '/doctor/prescriptions', label: 'Prescriptions' },
          { to: '/doctor/lab-orders', label: 'Lab Orders' }
        ];
      case 'receptionist':
        return [
          { to: '/reception', label: 'Front-Desk Queue' },
          { to: '/reception/appointments', label: 'Appointments' },
          { to: '/reception/patients', label: 'Patient Intake' },
          { to: '/reception/invoices', label: 'Billing Desk' }
        ];
      case 'lab':
        return [
          { to: '/lab', label: 'Laboratory Workbench' },
          { to: '/lab/results', label: 'Test Results & Releases' }
        ];
      case 'patient':
      default:
        return [
          { to: '/patient', label: 'My Health Home' },
          { to: '/patient/appointments', label: 'Appointments' },
          { to: '/patient/prescriptions', label: 'Prescriptions' },
          { to: '/patient/reports', label: 'Lab Reports' },
          { to: '/patient/invoices', label: 'Bills & Invoices' }
        ];
    }
  };

  const navLinks = getNavLinks();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-teal-500 flex items-center justify-center text-white shadow-md">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-xl text-slate-900 tracking-tight">MedAssist</span>
              <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                Clinic Portal
              </span>
            </div>
          </Link>

          {/* User Role Badge, Identity & Log Out (NO Role Switcher) */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider ${currentMeta.color}`}>
              <CurrentIcon className="w-3.5 h-3.5" />
              <span>{currentMeta.label}</span>
            </div>

            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-900">{user.name}</div>
              <div className="text-[11px] text-slate-500">{user.email}</div>
            </div>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Navigation Row for Current Role */}
        <nav className="flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-100">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
                  isActive
                    ? 'bg-sky-50 text-sky-700 font-bold border border-sky-100'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
