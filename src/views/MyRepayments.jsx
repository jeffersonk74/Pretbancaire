import React, { useState } from 'react';
import { ChevronDown, TrendingUp, CreditCard, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { formatCurrency } from '../utils/calculations';
import { getApiBaseUrl } from '../utils/api';
import StatusBadge from '../components/StatusBadge';

const MyRepayments = ({ loans, onUpdateLoan, user }) => {
  const [expandedLoan, setExpandedLoan] = useState(null);
  const [loading, setLoading] = useState(false);
  const isClient = user?.role === 'CLIENT_PRIVE' || user?.role === 'CLIENT_PUBLIC';
  const isGestionnaire = user?.role === 'GESTIONNAIRE';
  const isDG = user?.role === 'DG';

  const handlePay = async (installmentId) => {
    setLoading(true);
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/installments/${installmentId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: user?.role }),
      });
      if (response.ok) {
        onUpdateLoan();
      } else {
        const error = await response.json();
        alert(error.error || 'Erreur lors du paiement');
      }
    } catch (err) {
      console.error('Erreur lors du paiement:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckDelays = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/check-delays`, { method: 'POST' });
      const data = await res.json();
      alert(`${data.updated} échéance(s) marquée(s) en retard.`);
      onUpdateLoan();
    } catch (err) {
      console.error('Erreur vérification retards:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-950">
            {isClient ? 'Mes Remboursements' : 'Suivi des Échéances Clients'}
          </h2>
          <p className="text-slate-500 mt-2">
            {isClient 
              ? 'Suivez vos échéances et payez vos mensualités.' 
              : 'Consultez les mensualités et gérez les paiements des clients.'}
          </p>
        </div>
        {isGestionnaire && (
          <button 
            onClick={handleCheckDelays}
            disabled={loading}
            className="px-4 py-2.5 bg-blue-500 text-white rounded-md text-xs font-black uppercase hover:bg-blue-600 transition-all border border-blue-600 disabled:opacity-50 flex items-center gap-2"
          >
            <AlertCircle size={16} />
            Vérifier les Retards
          </button>
        )}
      </header>

      <div className="space-y-6">
        {loans.length > 0 ? (
          loans.map((loan) => (
            <div key={loan.id} className="rounded-lg overflow-hidden border-2 border-slate-300 bg-white shadow-sm">
              <div 
                className="p-4 md:p-6 cursor-pointer flex items-center justify-between hover:bg-slate-50 transition-colors"
                onClick={() => {
                  console.log('Click sur prêt:', loan.id, 'expandedLoan actuel:', expandedLoan);
                  setExpandedLoan(expandedLoan === loan.id ? null : loan.id);
                }}
              >
                <div className="flex items-center gap-4 md:gap-6">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 border border-blue-300 rounded-md flex items-center justify-center text-bank-primary">
                    <TrendingUp size={20} className="md:w-6 md:h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-950">{loan.productName}</h3>
                    <p className="text-xs text-slate-500">
                      Montant : {formatCurrency(loan.amount)}
                      {!isClient && loan.user && (
                        <span className="ml-2 text-bank-primary font-bold">• {loan.user.name}</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-md bg-slate-100 text-slate-500 transition-transform border border-slate-200 ${expandedLoan === loan.id ? 'rotate-180' : ''}`}>
                    <ChevronDown size={20} />
                  </div>
                </div>
              </div>

              {expandedLoan === loan.id && (
                <div className="border-t-2 border-slate-300 bg-slate-50 overflow-x-auto animate-in slide-in-from-top duration-300">
                  {!loan.installments || loan.installments.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-sm">
                      Aucune échéance disponible pour ce prêt.
                    </div>
                  ) : (
                  <table className="w-full min-w-[600px] text-left">
                    <thead>
                      <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-100 border-b border-slate-300">
                        <th className="px-4 md:px-6 py-4">Mois</th>
                        <th className="px-4 md:px-6 py-4">Échéance</th>
                        <th className="px-4 md:px-6 py-4">Date Limite</th>
                        <th className="px-4 md:px-6 py-4">Pénalités</th>
                        <th className="px-4 md:px-6 py-4">Statut</th>
                        <th className="px-4 md:px-6 py-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {loan.installments.sort((a,b) => a.month - b.month).map((inst) => (
                        <tr key={inst.id} className="text-sm hover:bg-blue-50/60 transition-all duration-300 ease-out cursor-pointer">
                          <td className="px-4 md:px-6 py-4 font-bold text-slate-700">{inst.month}</td>
                          <td className="px-4 md:px-6 py-4 font-black text-bank-primary">{formatCurrency(inst.amount + inst.penalty)}</td>
                          <td className="px-4 md:px-6 py-4 text-slate-500">{new Date(inst.dueDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })}</td>
                          <td className="px-4 md:px-6 py-4 text-red-500 font-bold">{inst.penalty > 0 ? formatCurrency(inst.penalty) : '-'}</td>
                          <td className="px-4 md:px-6 py-4">
                            {isClient ? (
                              inst.status === 'PAID' ? (
                                <StatusBadge status={inst.status} />
                              ) : (
                                <span className="inline-flex items-center gap-2 rounded-md border-2 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] bg-blue-50 text-blue-900 border-blue-300">
                                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-white text-current shadow-sm">
                                    <Clock size={14} />
                                  </span>
                                  En attente
                                </span>
                              )
                            ) : (
                              <StatusBadge status={inst.status} />
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {inst.status !== 'PAID' && isGestionnaire && (
                              <button 
                                onClick={() => handlePay(inst.id)}
                                disabled={loading}
                                className="flex items-center gap-2 px-4 py-2 rounded-md bg-bank-primary text-white font-black text-[10px] uppercase hover:bg-blue-800 transition-all disabled:opacity-50 border border-blue-800"
                              >
                                <CheckCircle2 size={14} /> Marquer payé
                              </button>
                            )}
                            {inst.status !== 'PAID' && !isGestionnaire && (
                              <span className="text-slate-400">-</span>
                            )}
                            {inst.status === 'PAID' && (
                              <div className="text-green-600 flex items-center gap-1 text-[10px] font-bold uppercase">
                                <CheckCircle2 size={14} /> Payé le {new Date(inst.paymentDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="rounded-lg p-10 md:p-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-300 bg-white shadow-sm">
            <AlertCircle size={40} className="text-slate-400 mb-6" />
            <h3 className="text-xl font-bold text-slate-700">Aucun prêt actif</h3>
            <p className="text-sm text-slate-500 mt-2">Une fois vos fonds décaissés, l'échéancier apparaîtra ici.</p>
          </div>
        )}
      </div>
    </div>
  );
};


export default MyRepayments;
