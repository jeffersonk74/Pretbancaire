import React, { useState } from 'react';
import { 
  TrendingUp, CheckCircle2, XCircle, Send, Wallet, 
  Eye, FileText, ArrowLeft, Clock, ShieldCheck, User as UserIcon,
  ZoomIn, ZoomOut, RotateCw, AlertCircle
} from 'lucide-react';
import { formatCurrency } from '../utils/calculations';
import { getApiBaseUrl } from '../utils/api';
import StatusBadge from '../components/StatusBadge';

const History = ({ loans, user, onUpdateLoan }) => {
  const [filter, setFilter] = useState('PENDING');
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewDocIndex, setPreviewDocIndex] = useState(0);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionNote, setRejectionNote] = useState('');

  const getDocumentUrls = (loan) => {
    if (!loan) return [];
    if (Array.isArray(loan.documents)) return loan.documents;
    if (!loan.documents) return [];
    try {
      return JSON.parse(loan.documents);
    } catch {
      return [];
    }
  };

  const isClient = user.role === 'CLIENT_PRIVE' || user.role === 'CLIENT_PUBLIC';

  const handleAction = async (loanId, status, note = '') => {
    if (status === 'REJECTED') {
      setShowRejectModal(true);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/loans/${loanId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, rejectionNote: note }),
      });
      if (response.ok) {
        onUpdateLoan();
        setSelectedLoan(null);
        setIsDossierOpen(false);
      }
    } catch (err) {
      console.error('Erreur action:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectionNote.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/loans/${selectedLoan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED', rejectionNote }),
      });
      if (response.ok) {
        onUpdateLoan();
        setSelectedLoan(null);
        setIsDossierOpen(false);
        setShowRejectModal(false);
        setRejectionNote('');
      }
    } catch (err) {
      console.error('Erreur rejet:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDossier = async (loan) => {
    setSelectedLoan(loan);
    setPreviewDocIndex(0);
    setIsDossierOpen(true);
    
    // Mark as read if not already read by this role
    const needsMarkRead = (user.role === 'GESTIONNAIRE' && !loan.isReadByGestionnaire) || 
                         (user.role === 'DG' && !loan.isReadByDG);
    
    if (needsMarkRead) {
      try {
        const response = await fetch(`${getApiBaseUrl()}/api/loans/${loan.id}/read`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: user.role }),
        });
        if (response.ok) {
          const updatedLoan = await response.json();
          setSelectedLoan(prev => ({ ...prev, ...updatedLoan }));
          onUpdateLoan();
        }
      } catch (err) {
        console.error('Erreur marquage lu:', err);
      }
    }
  };

  const filteredLoans = loans.filter(l => {
    if (filter === 'PENDING') return l.status.startsWith('PENDING');
    if (filter === 'APPROVED') return l.status === 'APPROVED';
    if (filter === 'DISBURSED') return l.status === 'DISBURSED';
    if (filter === 'REJECTED') return l.status === 'REJECTED';
    return true;
  });

  // Split View Modal
  if (isDossierOpen && selectedLoan) {
    const isRead = (user.role === 'GESTIONNAIRE' && selectedLoan.isReadByGestionnaire) || 
                  (user.role === 'DG' && selectedLoan.isReadByDG);

    return (
      <div className="fixed inset-0 z-50 bg-slate-50/95 backdrop-blur-xl animate-in fade-in duration-300">
        <div className="h-full flex flex-col">
          <header className="p-6 border-b border-slate-200 flex justify-between items-center bg-white shadow-sm">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsDossierOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-700 transition-colors">
                <ArrowLeft size={24} />
              </button>
              <h2 className="text-xl font-black text-slate-950">Examen du Dossier #{selectedLoan.id}</h2>
            </div>
            <div className="flex gap-4 flex-wrap">
              {user.role === 'GESTIONNAIRE' && selectedLoan.status === 'PENDING_GESTIONNAIRE' && (
                <>
                  <button 
                    disabled={!isRead || loading}
                    onClick={() => handleAction(selectedLoan.id, 'PENDING_DG')}
                    className="bg-bank-primary text-white px-6 py-3 rounded-md flex items-center gap-2 disabled:opacity-30 border border-blue-800"
                  >
                    <Send size={18} /> Transmettre au DG
                  </button>
                  <button 
                    disabled={!isRead || loading}
                    onClick={() => handleAction(selectedLoan.id, 'REJECTED')}
                    className="px-6 py-3 rounded-md bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all disabled:opacity-30"
                  >
                    <XCircle size={18} /> Rejeter
                  </button>
                </>
              )}
              {user.role === 'DG' && selectedLoan.status === 'PENDING_DG' && (
                <>
                  <button 
                    disabled={!isRead || loading}
                    onClick={() => handleAction(selectedLoan.id, 'APPROVED')}
                    className="bg-bank-primary text-white px-6 py-3 rounded-md flex items-center gap-2 disabled:opacity-30 border border-blue-800"
                  >
                    <CheckCircle2 size={18} /> Approuver
                  </button>
                  <button 
                    disabled={!isRead || loading}
                    onClick={() => handleAction(selectedLoan.id, 'REJECTED')}
                    className="px-6 py-3 rounded-md bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all disabled:opacity-30"
                  >
                    <XCircle size={18} /> Rejeter
                  </button>
                </>
              )}
              {user.role === 'GESTIONNAIRE' && selectedLoan.status === 'APPROVED' && (
                <button 
                  onClick={() => handleAction(selectedLoan.id, 'DISBURSED')}
                  className="bg-bank-primary text-white px-6 py-3 rounded-md flex items-center gap-2 border border-blue-800"
                >
                  <Wallet size={18} /> Décaisser les fonds
                </button>
              )}
            </div>
          </header>

          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Left: Document Viewer (Mock) */}
            <div className="w-full md:w-1/2 border-b md:border-b-0 md:border-r border-slate-200 bg-white p-4 md:p-8 overflow-y-auto">
              <div className="max-w-2xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">Documents Justificatifs</h3>
                  <span className="text-[10px] font-bold text-green-700 flex items-center gap-1 bg-green-100 px-2 py-1 rounded-full">
                    <ShieldCheck size={12} /> Vérifié
                  </span>
                </div>

                <div className="grid gap-4 mb-6">
                  {getDocumentUrls(selectedLoan).length > 0 ? (
                    getDocumentUrls(selectedLoan).map((url, index) => (
                      <button
                        key={url}
                        onClick={() => setPreviewDocIndex(index)}
                        className={`w-full text-left rounded-lg border-2 px-4 py-4 transition-all ${previewDocIndex === index ? 'border-blue-300 bg-blue-50 shadow-sm' : 'border-slate-300 bg-slate-50 hover:border-blue-300'}`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-black text-slate-950">Document {index + 1}</p>
                            <p className="text-[11px] text-slate-500 truncate">{url.split('/').pop()}</p>
                          </div>
                          <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500">Voir</span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="rounded-lg border-2 border-slate-300 bg-slate-50 p-8 text-center">
                      <div className="mx-auto mb-4 h-16 w-16 rounded-lg bg-blue-50 flex items-center justify-center text-bank-primary border border-blue-200">
                        <FileText size={30} />
                      </div>
                      <p className="font-black text-slate-950">Aucun document disponible</p>
                      <p className="text-sm text-slate-500 mt-2">Ce dossier n’a pas encore de fichiers chargés ou accessibles.</p>
                    </div>
                  )}
                </div>

                <div className="aspect-[1/1.414] bg-slate-100 border-2 border-slate-300 rounded-lg flex flex-col items-center justify-center p-4 text-center group hover:border-blue-400 transition-all relative overflow-hidden">
                  {(() => {
                    const urls = getDocumentUrls(selectedLoan);
                    const previewUrl = urls[previewDocIndex] || selectedLoan.documentUrl || selectedLoan.contractUrl;
                    if (!previewUrl) return null;
                    return (
                      <div className="w-full h-full">
                        {previewUrl.toLowerCase().endsWith('.pdf') ? (
                          <iframe 
                            src={previewUrl} 
                            className="w-full h-full rounded-2xl"
                            title="Document PDF"
                          />
                        ) : (
                          <img 
                            src={previewUrl} 
                            alt="Document" 
                            className="w-full h-full object-contain rounded-2xl"
                          />
                        )}
                      </div>
                    );
                  })()}
                  <div className="absolute top-4 right-4 flex flex-col gap-2">
                    <button className="p-2 bg-white rounded-md hover:bg-bank-primary hover:text-white transition-all border border-slate-200"><ZoomIn size={18} /></button>
                    <button className="p-2 bg-white rounded-md hover:bg-bank-primary hover:text-white transition-all border border-slate-200"><ZoomOut size={18} /></button>
                    <button className="p-2 bg-white rounded-md hover:bg-bank-primary hover:text-white transition-all border border-slate-200"><RotateCw size={18} /></button>
                  </div>
                </div>

                {/* Audit Trail Timeline */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">Historique d'audit</h3>
                  <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-blue-300">
                    <div className="relative pl-10">
                      <div className="absolute left-0 top-1 w-6 h-6 bg-blue-100 border border-blue-300 rounded-md flex items-center justify-center text-bank-primary">
                        <CheckCircle2 size={12} />
                      </div>
                      <p className="text-xs font-bold text-slate-950">Client a soumis le dossier</p>
                      <p className="text-[10px] text-slate-500">{new Date(selectedLoan.requestDate).toLocaleString()}</p>
                    </div>
                    {selectedLoan.isReadByGestionnaire && (
                      <div className="relative pl-10">
                        <div className="absolute left-0 top-1 w-6 h-6 bg-sky-100 border border-sky-300 rounded-md flex items-center justify-center text-bank-royal-blue">
                          <Eye size={12} />
                        </div>
                        <p className="text-xs font-bold text-slate-950">Gestionnaire a ouvert le contenu</p>
                        <p className="text-[10px] text-slate-500">{new Date(selectedLoan.readAtGestionnaire).toLocaleString()}</p>
                      </div>
                    )}
                    {selectedLoan.isReadByDG && (
                      <div className="relative pl-10">
                        <div className="absolute left-0 top-1 w-6 h-6 bg-blue-100 border border-blue-300 rounded-md flex items-center justify-center text-bank-primary">
                          <Eye size={12} />
                        </div>
                        <p className="text-xs font-bold text-slate-950">DG a consulté le dossier</p>
                        <p className="text-[10px] text-slate-500">{new Date(selectedLoan.readAtDG).toLocaleString()}</p>
                      </div>
                    )}
                    {selectedLoan.contractUrl && (
                      <div className="relative pl-10">
                        <div className="absolute left-0 top-1 w-6 h-6 bg-blue-100 border border-blue-300 rounded-md flex items-center justify-center text-bank-primary">
                          <FileText size={12} />
                        </div>
                        <p className="text-xs font-bold text-slate-950">{selectedLoan.user?.role === 'CLIENT_PRIVE' ? 'Contrat de travail' : 'Arrêté d\'intégration'} uploadé</p>
                        <button 
                          onClick={() => window.open(selectedLoan.contractUrl, '_blank')}
                          className="text-[8px] text-bank-primary font-black uppercase hover:underline"
                        >
                          Voir le document
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Form Data */}
            <div className="w-full md:w-1/2 p-6 md:p-12 overflow-y-auto bg-slate-50">
              <div className="max-w-xl mx-auto space-y-6 md:space-y-10">
                <section>
                  <h3 className="text-sm font-black text-bank-primary uppercase tracking-widest mb-4 md:mb-6">Informations Client</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Nom complet</p>
                      <p className="text-lg font-black text-slate-950">{selectedLoan.user?.name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Email</p>
                      <p className="text-lg font-black text-slate-950">{selectedLoan.user?.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8 mt-4 md:mt-6">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Revenu Mensuel</p>
                      <p className="text-lg font-black text-slate-950">{formatCurrency(selectedLoan.income || 0)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Charges Mensuelles</p>
                      <p className="text-lg font-black text-slate-950">{formatCurrency(selectedLoan.charges || 0)}</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-black text-bank-primary uppercase tracking-widest mb-4 md:mb-6">Détails du Prêt</h3>
                  <div className="rounded-lg p-4 md:p-8 space-y-4 md:space-y-6 bg-white border-2 border-slate-300 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2">
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Produit</p>
                        <p className="text-xl md:text-2xl font-black text-slate-950">{selectedLoan.productName}</p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Montant Demandé</p>
                        <p className="text-2xl md:text-3xl font-black text-bank-primary">{formatCurrency(selectedLoan.amount)}</p>
                      </div>
                    </div>
                    <div className="pt-4 md:pt-6 border-t border-slate-200 grid grid-cols-2 gap-4 md:gap-8">
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Durée</p>
                        <p className="text-lg font-black text-slate-950">{selectedLoan.duration} Mois</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Statut Actuel</p>
                        <StatusBadge status={selectedLoan.status} />
                      </div>
                    </div>
                    <div className="pt-6 border-t border-slate-200">
                      <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Motif du projet</p>
                      <p className="text-slate-700 leading-relaxed italic">"{selectedLoan.motif || 'Aucun motif renseigné'}"</p>
                    </div>
                  </div>
                </section>

                {selectedLoan.rejectionNote && (
                  <section className="bg-red-50 border border-red-100 p-4 md:p-6 rounded-lg">
                    <h3 className="text-xs font-black text-red-700 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <AlertCircle size={14} /> Note de Rejet Précédente
                    </h3>
                    <p className="text-red-600 text-sm italic">"{selectedLoan.rejectionNote}"</p>
                  </section>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal de Rejet Moderne */}
        {showRejectModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setShowRejectModal(false); setRejectionNote(''); }}></div>
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border-2 border-slate-200">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-700 to-blue-600 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <XCircle size={22} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">Rejeter la demande</h3>
                    <p className="text-blue-100 text-xs font-medium">Cette action est irréversible</p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-blue-800">Information</p>
                      <p className="text-xs text-blue-600 mt-1">Le client sera notifié du rejet avec le motif que vous sélectionnez.</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-black text-slate-700 uppercase tracking-widest mb-3">
                    Motif du rejet <span className="text-blue-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {[
                      'Documents incomplets ou illisibles',
                      'Revenus insuffisants pour le montant demandé',
                      'Informations incohérentes dans le dossier',
                      'Antécédents de crédit défavorables',
                      'Durée demandée non conforme',
                      'Non-éligibilité au produit sélectionné',
                      'Garanties insuffisantes',
                      'Autre motif'
                    ].map((motif) => (
                      <button
                        key={motif}
                        onClick={() => setRejectionNote(motif)}
                        className={`w-full text-left px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                          rejectionNote === motif
                            ? 'border-blue-400 bg-blue-50 text-blue-800 shadow-sm'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            rejectionNote === motif ? 'border-blue-500 bg-blue-500' : 'border-slate-300'
                          }`}>
                            {rejectionNote === motif && (
                              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                            )}
                          </div>
                          {motif}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  onClick={() => { setShowRejectModal(false); setRejectionNote(''); }}
                  className="px-5 py-2.5 rounded-lg text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-all"
                  disabled={loading}
                >
                  Annuler
                </button>
                <button
                  onClick={handleRejectConfirm}
                  disabled={!rejectionNote.trim() || loading}
                  className="px-5 py-2.5 rounded-lg text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 border border-blue-800"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Traitement...
                    </>
                  ) : (
                    <>
                      <XCircle size={16} />
                      Confirmer le rejet
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-950">Gestion des Dossiers</h2>
          <p className="text-slate-500 mt-2">Examinez et approuvez les demandes de crédit.</p>
        </div>
        
        {/* Segmented Filter */}
        <div className="flex flex-wrap md:flex-nowrap bg-slate-100 p-1.5 rounded-lg border-2 border-slate-300">
          {[
            { id: 'PENDING', label: 'En attente', count: loans.filter(l => l.status.startsWith('PENDING')).length },
            { id: 'APPROVED', label: 'Approuvés' },
            { id: 'DISBURSED', label: 'Décaissés' },
            { id: 'REJECTED', label: 'Rejetés' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={`px-6 py-2.5 rounded-md text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 border ${
                filter === item.id ? 'bg-bank-primary text-white shadow-sm border-blue-800' : 'text-slate-500 hover:text-slate-900 border-transparent'
              }`}
            >
              {item.label}
              {item.count > 0 && (
                <span className={`px-2 py-0.5 rounded-md text-[10px] ${filter === item.id ? 'bg-slate-950 text-white' : 'bg-bank-primary text-white border border-blue-800'}`}>
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      <div className="rounded-lg overflow-hidden border-2 border-slate-300 bg-white shadow-sm overflow-x-auto">
        <table className="w-full min-w-[700px] text-left">
          <thead>
            <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-100">
              <th className="px-4 md:px-8 py-4 md:py-6">ID / Client</th>
              <th className="px-4 md:px-8 py-4 md:py-6">Produit</th>
              <th className="px-4 md:px-8 py-4 md:py-6">Montant</th>
              <th className="px-4 md:px-8 py-4 md:py-6">Date</th>
              <th className="px-4 md:px-8 py-4 md:py-6">Statut</th>
              <th className="px-4 md:px-8 py-4 md:py-6">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredLoans.length > 0 ? (
              filteredLoans.map((loan) => {
                const isRead = (user.role === 'GESTIONNAIRE' && loan.isReadByGestionnaire) || 
                              (user.role === 'DG' && loan.isReadByDG);

                return (
                  <tr key={loan.id} className="text-sm hover:bg-blue-50/60 transition-all duration-300 ease-out group cursor-pointer">
                    <td className="px-4 md:px-8 py-4 md:py-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-md flex items-center justify-center ${isRead ? 'bg-slate-100 text-slate-700 border border-slate-200' : 'bg-blue-50 text-bank-primary border-2 border-blue-300'}`}>
                          <UserIcon size={18} />
                        </div>
                        <div>
                          <p className="font-black text-slate-950">{loan.user?.name || 'Client'}</p>
                          <p className="text-[10px] text-slate-500 font-bold">#{loan.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 md:px-8 py-4 md:py-6">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-slate-500" />
                        <span className="font-bold text-slate-700">{loan.productName}</span>
                      </div>
                    </td>
                    <td className="px-4 md:px-8 py-4 md:py-6 font-black text-slate-950">{formatCurrency(loan.amount)}</td>
                    <td className="px-4 md:px-8 py-4 md:py-6 text-slate-500 text-xs">{new Date(loan.requestDate).toLocaleDateString()}</td>
                    <td className="px-4 md:px-8 py-4 md:py-6">
                      <StatusBadge status={loan.status} />
                    </td>
                    <td className="px-4 md:px-8 py-4 md:py-6">
                      <button 
                        onClick={() => handleOpenDossier(loan)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-[10px] font-black uppercase transition-all border ${
                          isRead ? 'bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-200' : 'bg-bank-primary text-white hover:bg-blue-800 shadow-sm border-blue-800'
                        }`}
                      >
                        <Eye size={14} /> {isRead ? 'Revoir' : 'Ouvrir'}
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-4 md:px-8 py-20 text-center text-slate-500 font-bold italic">
                  Aucun dossier dans cette catégorie.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default History;
