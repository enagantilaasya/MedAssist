import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  FileText, 
  Pill, 
  FlaskConical, 
  CreditCard, 
  ShieldCheck, 
  Sparkles, 
  Clock, 
  Activity,
  HeartHandshake
} from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();
  const role = user?.role || 'patient';

  const getNavItems = () => {
    switch (role) {
      case 'admin':
        return [
          { id: 'dashboard', label: 'Clinic Overview', icon: LayoutDashboard },
          { id: 'users', label: 'Users & Staff', icon: Users },
          { id: 'appointments', label: 'All Appointments', icon: Calendar },
          { id: 'services', label: 'Services & Pricing', icon: Activity },
          { id: 'billing', label: 'Billing & Invoices', icon: CreditCard },
          { id: 'audit', label: 'Security & Audit Logs', icon: ShieldCheck }
        ];
      case 'doctor':
        return [
          { id: 'dashboard', label: 'Doctor Dashboard', icon: LayoutDashboard },
          { id: 'consultation', label: 'Consultation Room', icon: Activity, badge: 'Active' },
          { id: 'appointments', label: 'My Appointments', icon: Calendar },
          { id: 'records', label: 'EMR & Clinical Notes', icon: FileText },
          { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
          { id: 'lab', label: 'Lab Orders', icon: FlaskConical }
        ];
      case 'receptionist':
        return [
          { id: 'dashboard', label: 'Reception & Queue', icon: LayoutDashboard },
          { id: 'appointments', label: 'Book & Reschedule', icon: Calendar },
          { id: 'patients', label: 'Register Patient', icon: Users },
          { id: 'billing', label: 'Cashier & Invoicing', icon: CreditCard }
        ];
      case 'lab_technician':
        return [
          { id: 'dashboard', label: 'Lab Workbench', icon: LayoutDashboard },
          { id: 'lab', label: 'Sample Tracker & Results', icon: FlaskConical }
        ];
      case 'patient':
      default:
        return [
          { id: 'dashboard', label: 'My Health Home', icon: LayoutDashboard },
          { id: 'timeline', label: '360° Medical Timeline', icon: Clock },
          { id: 'appointments', label: 'My Appointments', icon: Calendar },
          { id: 'prescriptions', label: 'Prescriptions & AI Guide', icon: Pill },
          { id: 'lab', label: 'My Lab Results', icon: FlaskConical },
          { id: 'billing', label: 'Invoices & Receipts', icon: CreditCard }
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="sidebar no-print" style={{
      width: '260px',
      background: '#ffffff',
      borderRight: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      padding: '24px 16px',
      gap: '8px'
    }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 12px 8px 12px' }}>
        Navigation
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '10px',
                border: 'none',
                background: isActive ? '#f0f9ff' : 'transparent',
                color: isActive ? '#0284c7' : '#475569',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = '#f8fafc';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'transparent';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icon size={18} color={isActive ? '#0284c7' : '#64748b'} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  background: '#dbeafe',
                  color: '#1e40af',
                  padding: '2px 6px',
                  borderRadius: '9999px'
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Clinic System Status Card at bottom */}
      <div style={{
        marginTop: 'auto',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '14px',
        fontSize: '0.8rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}></span>
          MedAssist v1.0 Active
        </div>
        <div style={{ color: '#64748b', fontSize: '0.72rem' }}>
          MongoDB & AI Engine Ready
        </div>
      </div>
    </aside>
  );
};
