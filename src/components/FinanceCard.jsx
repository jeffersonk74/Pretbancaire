import React from 'react';

const TONE_STYLES = {
  neutral: 'bg-white text-slate-950 border-slate-300',
  positive: 'bg-emerald-50 text-emerald-900 border-emerald-300',
  warning: 'bg-blue-50 text-blue-900 border-blue-300',
  critical: 'bg-rose-50 text-rose-900 border-rose-300',
  info: 'bg-sky-50 text-sky-900 border-sky-300',
};

const ICON_STYLES = {
  neutral: 'bg-slate-100 text-slate-700',
  positive: 'bg-emerald-100 text-emerald-900',
  warning: 'bg-blue-100 text-blue-900',
  critical: 'bg-rose-100 text-rose-900',
  info: 'bg-sky-100 text-sky-900',
};

const FinanceCard = ({ title, value, metric, icon: Icon, tone = 'neutral' }) => {
  return (
    <div className={`rounded-lg border-2 p-6 shadow-sm ${TONE_STYLES[tone] || TONE_STYLES.neutral}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{title}</p>
          <h3 className="mt-4 text-3xl font-black tracking-tight">{value}</h3>
        </div>
        <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${ICON_STYLES[tone] || ICON_STYLES.neutral}`}>
          {Icon ? <Icon size={20} /> : null}
        </div>
      </div>
      <p className="mt-4 text-sm text-slate-500">{metric}</p>
    </div>
  );
};

export default FinanceCard;
