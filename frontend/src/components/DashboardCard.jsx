import React from 'react';

export const DashboardCard = ({ title, value, subtext, icon: Icon, color = 'sky' }) => {
  const colorMap = {
    sky: 'border-l-sky-500 text-sky-600 bg-sky-50',
    emerald: 'border-l-emerald-500 text-emerald-600 bg-emerald-50',
    amber: 'border-l-amber-500 text-amber-600 bg-amber-50',
    purple: 'border-l-purple-500 text-purple-600 bg-purple-50',
    red: 'border-l-red-500 text-red-600 bg-red-50',
    teal: 'border-l-teal-500 text-teal-600 bg-teal-50'
  };

  const styling = colorMap[color] || colorMap.sky;

  return (
    <div className={`bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 ${styling.split(' ')[0]} transition hover:shadow-md`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</span>
        {Icon && (
          <div className={`p-2 rounded-xl ${styling.split(' ').slice(1).join(' ')}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">{value}</div>
      {subtext && <div className="text-xs text-slate-500 font-medium">{subtext}</div>}
    </div>
  );
};
