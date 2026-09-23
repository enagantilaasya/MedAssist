import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const ProtectedRoute = ({ allowedRoles = [], children }) => {
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <div className="text-sm font-semibold text-slate-700">Verifying Authorization...</div>
        </div>
      </div>
    );
  }

  // Not logged in -> Redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Role check: Strict authorization guard
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Determine user's allowed dashboard route to redirect
    const roleRoutes = {
      admin: '/admin',
      doctor: '/doctor',
      receptionist: '/reception',
      lab: '/lab',
      patient: '/patient'
    };
    const defaultRoute = roleRoutes[user.role] || '/login';

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-red-200">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            403
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Forbidden</h2>
          <p className="text-sm text-slate-600 mb-6">
            Your role (<span className="font-semibold text-red-600 uppercase">{user.role}</span>) is not permitted to access this feature or data.
          </p>
          <a
            href={defaultRoute}
            className="inline-block px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm rounded-lg transition"
          >
            Return to My Authorized Dashboard
          </a>
        </div>
      </div>
    );
  }

  return children;
};
