import React from 'react';
import { User, Phone, Mail, Droplets, AlertTriangle } from 'lucide-react';

export const PatientCard = ({ patient, onViewTimeline }) => {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
          {patient.patientCode}
        </span>
        <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded flex items-center gap-1">
          <Droplets className="w-3 h-3" /> {patient.bloodGroup || 'O+'}
        </span>
      </div>

      <h4 className="text-base font-bold text-slate-900 mb-1">{patient.fullName}</h4>
      <div className="text-xs text-slate-500 mb-3">{patient.gender} • Born {new Date(patient.dateOfBirth).toLocaleDateString()}</div>

      <div className="space-y-1 text-xs text-slate-600 mb-4">
        <div className="flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5 text-slate-400" />
          <span>{patient.phone || 'No phone'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Mail className="w-3.5 h-3.5 text-slate-400" />
          <span>{patient.email || 'No email'}</span>
        </div>
      </div>

      {patient.allergies && patient.allergies.length > 0 && (
        <div className="mb-4 text-xs bg-red-50 text-red-700 p-2 rounded-lg border border-red-100 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate"><strong>Allergies:</strong> {patient.allergies.join(', ')}</span>
        </div>
      )}

      {onViewTimeline && (
        <button
          onClick={() => onViewTimeline(patient)}
          className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition"
        >
          View 360° Medical Timeline
        </button>
      )}
    </div>
  );
};
