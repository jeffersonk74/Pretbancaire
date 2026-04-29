import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, XCircle, ArrowRightCircle, Info } from 'lucide-react';

const STATUS_VARIANTS = {
  PENDING_GESTIONNAIRE: {
    label: 'En attente gestion',
    icon: Clock,
    classes: 'bg-blue-50 text-blue-900 border-blue-300',
  },
  PENDING_DG: {
    label: 'En attente DG',
    icon: Info,
    classes: 'bg-sky-50 text-sky-900 border-sky-300',
  },
  APPROVED: {
    label: 'Approuvé',
    icon: CheckCircle2,
    classes: 'bg-emerald-50 text-emerald-900 border-emerald-300',
  },
  DISBURSED: {
    label: 'Décaissé',
    icon: ArrowRightCircle,
    classes: 'bg-bank-royal-blue/10 text-bank-royal-blue border-bank-royal-blue/30',
  },
  REJECTED: {
    label: 'Rejeté',
    icon: XCircle,
    classes: 'bg-rose-50 text-rose-900 border-rose-300',
  },
  PAID: {
    label: 'Payé',
    icon: CheckCircle2,
    classes: 'bg-emerald-50 text-emerald-900 border-emerald-300',
  },
  LATE: {
    label: 'En retard',
    icon: AlertTriangle,
    classes: 'bg-rose-50 text-rose-900 border-rose-300',
  },
  PENDING: {
    label: 'À payer',
    icon: Clock,
    classes: 'bg-bank-light-blue text-bank-primary border-bank-blue/30',
  },
  UNPAID: {
    label: 'Non payé',
    icon: Clock,
    classes: 'bg-blue-50 text-blue-900 border-blue-300',
  },
};

const StatusBadge = ({ status = '', className = '' }) => {
  const statusKey = String(status).toUpperCase();
  const variant = STATUS_VARIANTS[statusKey] || {
    label: statusKey.replace(/_/g, ' '),
    icon: Info,
    classes: 'bg-slate-100 text-slate-700 border-slate-200',
  };
  const Icon = variant.icon;

  return (
    <span className={`inline-flex items-center gap-2 rounded-md border-2 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] ${variant.classes} ${className}`}>
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-white text-current shadow-sm">
        <Icon size={14} />
      </span>
      {variant.label}
    </span>
  );
};

export default StatusBadge;
