import React, { useState } from 'react';
import { 
  Calendar, Wallet, CreditCard, ArrowRight, 
  AlertCircle, Clock, Info, FileText, PlusCircle,
  ShieldCheck, Send, TrendingUp
} from 'lucide-react';
import { formatCurrency } from '../utils/calculations';

import NewRequest from './NewRequest';
import { PRODUCTS } from '../constants/products';
import StatusBadge from '../components/StatusBadge';
import FinanceCard from '../components/FinanceCard';

const Dashboard = ({ loans, user, onNavigate, onSelectProduct, onSubmit }) => {
  const [filter, setFilter] = useState('PENDING');
  const isClient = user.role === 'CLIENT_PRIVE' || user.role === 'CLIENT_PUBLIC';
  
  // Client Stats
  const activeLoans = loans.filter(l => {
    if (l.status !== 'DISBURSED') return false;
    // Exclure les prêts totalement remboursés
    const allPaid = l.installments?.length > 0 && l.installments.every(inst => inst.status === 'PAID');
    return !allPaid;
  });
  const totalDebt = activeLoans.reduce((sum, loan) => {
    const unpaid = loan.installments?.filter(i => i.status !== 'PAID') || [];
    return sum + unpaid.reduce((s, i) => s + i.amount + i.penalty, 0);
  }, 0);
  
  const nextPayment = activeLoans.length > 0 
    ? activeLoans[0].installments?.find(i => i.status !== 'PAID')?.amount || 0
    : 0;

  // Management Stats - Corriger pour exclure les prêts totalement remboursés
  const disbursedLoans = loans.filter(l => {
    if (l.status !== 'DISBURSED') return false;
    // Exclure les prêts totalement remboursés
    const allPaid = l.installments?.length > 0 && l.installments.every(inst => inst.status === 'PAID');
    return !allPaid;
  });
  const totalEncours = disbursedLoans.reduce((sum, loan) => {
    const unpaid = loan.installments?.filter(i => i.status !== 'PAID') || [];
    return sum + unpaid.reduce((s, i) => s + i.amount + i.penalty, 0);
  }, 0);

  const allUnpaidInstallments = disbursedLoans
    .flatMap(l => l.installments || [])
    .filter(i => i.status !== 'PAID')
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  const nextMgmtPaymentDate = allUnpaidInstallments.length > 0
    ? new Date(allUnpaidInstallments[0].dueDate).toLocaleDateString()
    : 'Aucune';

  const pendingGestionnaire = loans.filter(l => l.status === 'PENDING_GESTIONNAIRE').length;
  const pendingDG = loans.filter(l => l.status === 'PENDING_DG').length;

  const stats = isClient ? [
    { label: 'Total à rembourser', value: formatCurrency(totalDebt), metric: 'Somme restante à régler', icon: Wallet, tone: 'critical' },
    { label: 'Prochaine échéance', value: formatCurrency(nextPayment), metric: 'Montant à régler bientôt', icon: Calendar, tone: 'warning' },
    { label: 'Prêts actifs', value: activeLoans.length, metric: 'Nombre de dossiers ouverts', icon: CreditCard, tone: 'positive' },
  ] : [
    { label: 'Encours total', value: formatCurrency(totalEncours), metric: 'Montant sous gestion active', icon: Wallet, tone: 'critical' },
    { label: 'Prochaine échéance', value: nextMgmtPaymentDate, metric: 'Prochaine date de versement', icon: Calendar, tone: 'warning' },
    { label: 'Volume actif', value: disbursedLoans.length, metric: 'Dossiers en décaissement', icon: TrendingUp, tone: 'positive' },
  ];

  const filteredLoans = loans.filter(l => {
    if (filter === 'PENDING') return l.status.startsWith('PENDING');
    if (filter === 'APPROVED') return l.status === 'APPROVED';
    if (filter === 'DISBURSED') return l.status === 'DISBURSED';
    if (filter === 'REJECTED') return l.status === 'REJECTED';
    return true;
  });

  const getAboutContent = () => {
    if (user.role === 'DG') return {
      title: "Espace Direction Générale",
      desc: "Supervision stratégique et approbation finale.",
      items: [
        { icon: ShieldCheck, title: "Approbation", text: "Vous validez les dossiers après vérification par le Gestionnaire." },
        { icon: TrendingUp, title: "Paramètres", text: "Ajustez les taux et plafonds pour chaque produit bancaire." },
        { icon: AlertCircle, title: "Contrôle", text: "L'ouverture du dossier est obligatoire avant toute décision d'approbation." }
      ]
    };
    if (user.role === 'GESTIONNAIRE') return {
      title: "Espace Gestionnaire PrêtBank",
      desc: "Gestion opérationnelle et vérification de premier niveau.",
      items: [
        { icon: FileText, title: "Vérification", text: "Examinez les pièces jointes (ID, contrat) pour valider le dossier." },
        { icon: Send, title: "Transmission", text: "Envoyez les dossiers conformes au DG pour signature finale." },
        { icon: Wallet, title: "Décaissement", text: "Procédez au virement virtuel des fonds pour les dossiers approuvés." }
      ]
    };
    return {
      title: "Votre Espace Client Sécurisé",
      desc: "Demandez et gérez vos remboursements en toute simplicité.",
      items: [
        { icon: PlusCircle, title: "Demande", text: "Utilisez le simulateur en bas de page pour vos nouveaux projets." },
        { icon: CreditCard, title: "Paiement", text: "Réglez vos mensualités directement depuis l'onglet Remboursements." },
        { icon: Clock, title: "Suivi", text: "Suivez l'état d'avancement de vos demandes en temps réel (Switch buttons)." }
      ]
    };
  };

  const about = getAboutContent();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {isClient ? (
        <div className="space-y-6">
          <section className="rounded-lg border-2 border-sky-200 bg-sky-50/80 p-6 shadow-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-sky-600 text-white shadow-sm border border-sky-700">
                <Info size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-700">Espace Sécurisé</p>
                <p className="mt-2 text-slate-600 text-sm">Gérez vos remboursements en toute simplicité.</p>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="rounded-lg border-2 border-slate-300 bg-white p-4 md:p-5 shadow-sm flex items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Total à rembourser</p>
                <p className="mt-4 text-2xl md:text-3xl font-black text-rose-600">{formatCurrency(totalDebt)}</p>
              </div>
              <div className="h-12 w-12 md:h-14 md:w-14 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 shadow-sm border border-rose-200">
                <Wallet size={22} className="md:w-6 md:h-6" />
              </div>
            </div>
            <div className="rounded-lg border-2 border-slate-300 bg-white p-4 md:p-5 shadow-sm flex items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300 [animation-delay:100ms]">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Prochaine échéance</p>
                <p className="mt-4 text-2xl md:text-3xl font-black text-blue-700">{formatCurrency(nextPayment)}</p>
              </div>
              <div className="h-12 w-12 md:h-14 md:w-14 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700 shadow-sm border border-blue-200">
                <Calendar size={22} className="md:w-6 md:h-6" />
              </div>
            </div>
            <div className="rounded-lg border-2 border-slate-300 bg-white p-4 md:p-5 shadow-sm flex items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300 [animation-delay:200ms]">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Prêts actifs</p>
                <p className="mt-4 text-2xl md:text-3xl font-black text-emerald-700">{activeLoans.length}</p>
              </div>
              <div className="h-12 w-12 md:h-14 md:w-14 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700 shadow-sm border border-emerald-200">
                <CreditCard size={22} className="md:w-6 md:h-6" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-950">Bonjour, {user.name}</h2>
            <p className="text-slate-500 mt-1">
              {isClient ? "Aperçu de votre situation financière." : "Espace de gestion administrative."}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-slate-100 border-2 border-slate-300 px-4 py-2 rounded-md text-bank-primary text-xs font-black">
            <Clock size={16} /> {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </header>
      )}

      {!isClient && (
        <section className="rounded-lg p-8 border-2 border-slate-300 bg-white shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-bank-royal-blue rounded-md flex items-center justify-center shadow-sm border border-blue-500">
              <Info size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-950">{about.title}</h3>
              <p className="text-slate-500 text-sm">{about.desc}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {about.items.map((item, i) => (
              <div key={i} className="bg-slate-50 border-2 border-slate-300 rounded-lg p-6 hover:bg-slate-100 transition-colors">
                <item.icon size={20} className="text-bank-primary mb-4" />
                <h4 className="text-slate-950 font-bold mb-2">{item.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {!isClient && stats.map((stat, i) => (
          <FinanceCard
            key={i}
            title={stat.label}
            value={stat.value}
            metric={stat.metric}
            icon={stat.icon}
            tone={stat.tone}
          />
        ))}
      </div>

      {isClient && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h3 className="text-xl font-black text-slate-950">Suivi de vos demandes</h3>
            <div className="flex flex-wrap md:flex-nowrap bg-slate-100 p-1 rounded-lg border-2 border-slate-300 overflow-x-auto max-w-full">
              {[
                { id: 'PENDING', label: 'En attente' },
                { id: 'APPROVED', label: 'Approuvés' },
                { id: 'DISBURSED', label: 'Décaissés' },
                { id: 'REJECTED', label: 'Rejetés' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setFilter(item.id)}
                  className={`px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap border ${
                    filter === item.id ? 'bg-bank-primary text-white shadow-sm border-blue-800' : 'text-slate-500 hover:text-slate-700 border-transparent'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg overflow-hidden border-2 border-slate-300 bg-white shadow-sm overflow-x-auto">
            <table className="w-full min-w-[300px] text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-50">
                  <th className="px-4 md:px-8 py-4">Produit</th>
                  <th className="px-4 md:px-8 py-4">Montant</th>
                  <th className="px-4 md:px-8 py-4">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredLoans.length > 0 ? (
                  filteredLoans.map((loan) => (
                    <tr key={loan.id} className="text-xs hover:bg-slate-50 transition-colors">
                      <td className="px-4 md:px-8 py-4 font-bold text-slate-900">{loan.productName}</td>
                      <td className="px-4 md:px-8 py-4 font-black text-bank-primary">{formatCurrency(loan.amount)}</td>
                      <td className="px-4 md:px-8 py-4">
                        <StatusBadge status={loan.status} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 md:px-8 py-10 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-4 py-8">
                        <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-slate-100 text-slate-400 border border-slate-200">
                          <FileText size={28} />
                        </div>
                        <p className="text-sm font-semibold">Aucun dossier trouvé pour cette catégorie.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!isClient && (
        <div className="rounded-lg p-8 border-2 border-slate-300 bg-white shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-bank-primary rounded-lg flex items-center justify-center text-white shadow-sm border border-blue-800">
              <AlertCircle size={32} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-950">Actions requises</h3>
              <p className="text-slate-600">Vous avez {pendingGestionnaire + pendingDG} dossier(s) en attente de traitement.</p>
            </div>
          </div>
          <button 
            onClick={() => onNavigate('history')}
            className="bg-bank-primary text-white px-5 py-3 rounded-md font-bold inline-flex items-center gap-2 shadow-sm border border-blue-800"
          >
            Gérer les dossiers <ArrowRight size={18} />
          </button>
        </div>
      )}

      {isClient && (
        <div className="pt-8 border-t border-slate-200">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-bank-primary rounded-md flex items-center justify-center shadow-sm border border-blue-800">
              <TrendingUp size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-950">Constituer un Dossier de Crédit</h3>
              <p className="text-slate-500 text-sm">Sélectionnez une offre pour initialiser votre plan de financement.</p>
            </div>
          </div>
          <NewRequest 
            user={user} 
            onSubmit={onSubmit} 
            selectedProduct={null} 
            onSelectProduct={onSelectProduct} 
          />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
