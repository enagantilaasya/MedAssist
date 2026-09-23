import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { 
  Activity, 
  ShieldCheck, 
  Stethoscope, 
  Calendar, 
  FlaskConical, 
  Heart, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  FileText, 
  Users,
  ChevronRight,
  Lock
} from 'lucide-react';

export const Home = () => {
  const { user } = useAuthStore();

  const getRoleDashboardRoute = (role) => {
    const map = {
      admin: '/admin',
      doctor: '/doctor',
      receptionist: '/reception',
      lab: '/lab',
      patient: '/patient'
    };
    return map[role] || '/login';
  };

  const roleWorkflows = [
    {
      role: 'Receptionist',
      title: '1. Front-Desk Intake',
      icon: Calendar,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      badge: 'bg-amber-100 text-amber-800',
      desc: 'Registers new patients, issues queue tokens, and books visits with intelligent conflict detection so no doctor is double-booked.'
    },
    {
      role: 'Doctor',
      title: '2. Clinical Consultation',
      icon: Stethoscope,
      color: 'text-sky-600 bg-sky-50 border-sky-200',
      badge: 'bg-sky-100 text-sky-800',
      desc: 'Records vitals, creates structured SOAP notes, triggers AI clinical summaries, prescribes medications, and requests lab tests.'
    },
    {
      role: 'Lab Technician',
      title: '3. Laboratory Diagnostics',
      icon: FlaskConical,
      color: 'text-teal-600 bg-teal-50 border-teal-200',
      badge: 'bg-teal-100 text-teal-800',
      desc: 'Scans specimen barcodes, enters test parameters, flags values against biological reference intervals, and verifies & releases results.'
    },
    {
      role: 'Patient',
      title: '4. Patient Portal',
      icon: Heart,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      badge: 'bg-emerald-100 text-emerald-800',
      desc: 'Explores their 360° medical timeline, reads AI plain-English medication guidance, views verified lab reports, and settles invoices.'
    },
    {
      role: 'Clinic Admin',
      title: '5. Executive Governance',
      icon: ShieldCheck,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      badge: 'bg-purple-100 text-purple-800',
      desc: 'Monitors clinic metrics, manages staff accounts and fees, configures diagnostic pricing, and inspects immutable security audit logs.'
    }
  ];

  const features = [
    {
      title: 'Strict Role-Based Access Control',
      desc: 'Engineered so one role can never access or modify another role’s data. Every API endpoint enforces strict 403 Forbidden verification.',
      icon: Lock,
      color: 'text-rose-600 bg-rose-50'
    },
    {
      title: 'AI Clinical Note Summarizer',
      desc: 'Clinicians get instant, structured summaries of patient complaints, vital signs, physical exams, and key action items.',
      icon: Sparkles,
      color: 'text-sky-600 bg-sky-50'
    },
    {
      title: 'AI Plain-Language Rx Guide',
      desc: 'Translates complex medical jargon into clear, everyday instructions on how, when, and with what foods to take medications.',
      icon: FileText,
      color: 'text-emerald-600 bg-emerald-50'
    },
    {
      title: 'Conflict-Free Appointment Scheduler',
      desc: 'Checks doctor schedules and slot availability in real time, preventing scheduling collisions and double-booking.',
      icon: Clock,
      color: 'text-amber-600 bg-amber-50'
    },
    {
      title: '360° Comprehensive Care Timeline',
      desc: 'A unified chronological stream bringing together visits, SOAP notes, prescriptions, laboratory reports, and billing.',
      icon: Activity,
      color: 'text-teal-600 bg-teal-50'
    },
    {
      title: 'Integrated Billing & Invoicing',
      desc: 'Automated itemization of consultation and diagnostic services, instant tax calculations, and multi-channel payment tracking.',
      icon: CreditCard,
      color: 'text-purple-600 bg-purple-50'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Public Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-teal-500 flex items-center justify-center text-white shadow-md">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-xl text-slate-900 tracking-tight">MedAssist</span>
              <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded">
                Clinic Portal
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600">
            <a href="#workflow" className="hover:text-sky-600 transition">How Roles Connect</a>
            <a href="#features" className="hover:text-sky-600 transition">System Features</a>
            <a href="#security" className="hover:text-sky-600 transition">Data Privacy</a>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to={getRoleDashboardRoute(user.role)}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md transition inline-flex items-center gap-2"
              >
                Go to My Dashboard ({user.role})
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-slate-700 hover:text-slate-900 font-bold text-xs rounded-xl hover:bg-slate-100 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md transition"
                >
                  Create Account
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 bg-gradient-to-b from-sky-50/60 via-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-100 border border-sky-200 text-sky-800 text-xs font-bold shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            Next-Gen Clinic Operations & Patient Care Portal
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
            Coordinating Modern Healthcare Across Five Clinical Roles
          </h1>

          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            MedAssist connects <strong>Patients</strong>, <strong>Doctors</strong>, <strong>Receptionists</strong>, <strong>Lab Technicians</strong>, and <strong>Administrators</strong> into one seamless workflow with strict data boundaries and embedded AI assistance.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-6 py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2"
            >
              Create Account for Any Role
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-800 font-black text-xs sm:text-sm rounded-xl border border-slate-200 shadow-sm transition flex items-center justify-center gap-2"
            >
              Sign In to Your Portal
            </Link>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-10">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-2xl font-black text-sky-600">5</div>
              <div className="text-xs font-bold text-slate-700 mt-0.5">Specialized Portals</div>
              <div className="text-[10px] text-slate-400">Admin, Doc, Rec, Lab, Pt</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-2xl font-black text-emerald-600">100%</div>
              <div className="text-xs font-bold text-slate-700 mt-0.5">RBAC Isolation</div>
              <div className="text-[10px] text-slate-400">403 on role mismatch</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-2xl font-black text-teal-600">AI</div>
              <div className="text-xs font-bold text-slate-700 mt-0.5">Dual Intelligence</div>
              <div className="text-[10px] text-slate-400">SOAP notes + Plain Rx</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-2xl font-black text-purple-600">360°</div>
              <div className="text-xs font-bold text-slate-700 mt-0.5">Unified Care Stream</div>
              <div className="text-[10px] text-slate-400">Chronological history</div>
            </div>
          </div>
        </div>
      </section>

      {/* How Roles Connect Section */}
      <section id="workflow" className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-sky-600 mb-1">Clinical Handoff Pipeline</h2>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">How All Five Roles Connect</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Every action taken by one role updates the system and flows directly into the appropriate workflow of the next.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {roleWorkflows.map((wf, idx) => {
              const Icon = wf.icon;
              return (
                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-3xl p-5 flex flex-col justify-between hover:shadow-md transition">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${wf.badge}`}>
                        {wf.role}
                      </span>
                      <span className="font-mono text-xs text-slate-400 font-bold">#{idx + 1}</span>
                    </div>

                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${wf.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <h4 className="font-black text-slate-900 text-sm mb-1">{wf.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{wf.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-teal-600 mb-1">Engineered for Excellence</h2>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Core Clinical Capabilities</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Built on a standard MERN stack with modern Tailwind styling and robust data isolation.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                  <div>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${feat.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-base mb-2">{feat.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Security & Strict RBAC Section */}
      <section id="security" className="py-16 bg-gradient-to-r from-sky-900 via-slate-900 to-teal-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-bold border border-white/20">
              <ShieldCheck className="w-4 h-4" /> Strict Authorization Guarantee
            </div>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
              One Role Cannot Access Another Role’s Features or Data
            </h3>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Every request is verified against JSON Web Tokens and active database roles. Unauthorized endpoints return an explicit <strong>403 Forbidden</strong> response, preventing data leaks across patients, doctors, and staff.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Link
              to="/register"
              className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg transition"
            >
              Register New Account
            </Link>
            <Link
              to="/login"
              className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm rounded-xl border border-white/20 transition"
            >
              Sign In to Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 text-center text-xs text-slate-500 space-y-2">
        <div className="flex items-center justify-center gap-2 font-bold text-slate-800">
          <Activity className="w-4 h-4 text-sky-600" /> MedAssist Medical Centre Portal
        </div>
        <p>Built with MongoDB, Express.js, React (Vite), Node.js, Zustand & Tailwind CSS.</p>
        <p className="text-[11px] text-slate-400">Strict Role Separation • AI Clinical Summaries • 360° Care Timeline</p>
      </footer>
    </div>
  );
};

export default Home;
