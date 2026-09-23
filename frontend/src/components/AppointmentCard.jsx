import React from 'react';
import { Calendar, Clock, User, Stethoscope } from 'lucide-react';

export const AppointmentCard = ({ appointment, onAction, actionLabel, actionColor = 'bg-sky-600 hover:bg-sky-700' }) => {
  const statusStyles = {
    scheduled: 'bg-sky-100 text-sky-800 border-sky-200',
    confirmed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    waiting: 'bg-amber-100 text-amber-800 border-amber-200',
    completed: 'bg-slate-100 text-slate-800 border-slate-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200'
  };

  const statusStyle = statusStyles[appointment.status] || 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-mono font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded">
            Token #{appointment.queueNumber || 1}
          </span>
          <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${statusStyle}`}>
            {appointment.status}
          </span>
        </div>

        <h4 className="text-base font-bold text-slate-900 mb-1">
          {appointment.patientId?.fullName || 'Patient Name'}
        </h4>

        <div className="space-y-1 text-xs text-slate-600 mb-4">
          <div className="flex items-center gap-1.5">
            <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
            <span>Dr. {appointment.doctorId?.fullName || 'Doctor'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{appointment.appointmentDate}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{appointment.appointmentTime}</span>
          </div>
        </div>

        {appointment.reason && (
          <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mb-4 line-clamp-2">
            <strong>Reason:</strong> {appointment.reason}
          </p>
        )}
      </div>

      {onAction && actionLabel && (
        <button
          onClick={() => onAction(appointment)}
          className={`w-full py-2 px-3 text-white text-xs font-bold rounded-lg transition shadow-sm ${actionColor}`}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
