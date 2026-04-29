import React, { useState, useEffect } from 'react';
import { Settings, Save, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';
import { getApiBaseUrl } from '../utils/api';

const DGSettings = () => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/settings`);
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (err) {
      console.error('Erreur settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (productName, field, value) => {
    setSettings(prev => prev.map(s => s.productName === productName ? { ...s, [field]: value } : s));
  };

  const saveSettings = async (productName) => {
    const setting = settings.find(s => s.productName === productName);
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/settings/${productName}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rate: parseFloat(setting.rate),
          minAmount: parseFloat(setting.minAmount),
          maxAmount: parseFloat(setting.maxAmount),
          maxDuration: parseInt(setting.maxDuration),
        }),
      });
      if (response.ok) {
        setMessage(`Paramètres pour ${productName} mis à jour.`);
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
    }
  };

  if (loading) return <div className="text-slate-700">Chargement...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h2 className="text-3xl font-black text-slate-950">Configuration Système</h2>
        <p className="text-slate-500 mt-2">Modifier les taux et limites de crédit (Accès DG uniquement).</p>
      </header>

      {message && (
        <div className="bg-green-50 border-2 border-green-300 text-green-700 p-4 rounded-md flex items-center gap-3 font-bold animate-in slide-in-from-top">
          <CheckCircle2 size={20} /> {message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {settings.map((setting) => (
          <div key={setting.id} className="rounded-lg p-4 md:p-8 border-2 border-slate-300 bg-white shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 md:mb-8 gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 border border-blue-200 rounded-md flex items-center justify-center text-bank-primary">
                  <TrendingUp size={20} className="md:w-6 md:h-6" />
                </div>
                <h3 className="text-xl md:text-2xl font-black text-slate-950">{setting.productName}</h3>
              </div>
              <button 
                onClick={() => saveSettings(setting.productName)}
                className="bg-bank-primary text-white flex items-center gap-2 px-6 py-3 rounded-md shadow-sm border border-blue-800"
              >
                <Save size={18} /> Enregistrer
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Taux d'intérêt (%)</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={setting.rate}
                  onChange={(e) => handleUpdate(setting.productName, 'rate', e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-300 rounded-md py-3 px-4 text-slate-950 outline-none focus:ring-2 focus:ring-bank-primary/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Montant Min (FCFA)</label>
                <input 
                  type="number" 
                  value={setting.minAmount}
                  onChange={(e) => handleUpdate(setting.productName, 'minAmount', e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-300 rounded-md py-3 px-4 text-slate-950 outline-none focus:ring-2 focus:ring-bank-primary/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Montant Max (FCFA)</label>
                <input 
                  type="number" 
                  value={setting.maxAmount}
                  onChange={(e) => handleUpdate(setting.productName, 'maxAmount', e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-300 rounded-md py-3 px-4 text-slate-950 outline-none focus:ring-2 focus:ring-bank-primary/50"
                />
              </div>
                            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Durée Max (Mois)</label>
                <input 
                  type="number" 
                  min={1}
                  max="120"
                  value={setting.maxDuration}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (val >= 1) {
                      handleUpdate(setting.productName, 'maxDuration', val);
                    }
                  }}
                  className="w-full bg-slate-50 border-2 border-slate-300 rounded-md py-3 px-4 text-slate-950 outline-none focus:ring-2 focus:ring-bank-primary/50"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg p-4 md:p-6 border-2 border-blue-200 bg-blue-50 flex items-start gap-4">
          <AlertCircle className="text-bank-primary shrink-0" size={24} />
          <div>
            <p className="text-sm font-bold text-bank-primary uppercase mb-1">Avertissement</p>
            <p className="text-xs text-slate-700 leading-relaxed">
              Toute modification de ces paramètres s'appliquera uniquement aux nouvelles demandes de crédit. Les prêts en cours et les demandes déjà soumises conservent leurs conditions initiales.
            </p>
          </div>
        </div>

        <div className="rounded-lg p-4 md:p-6 border-2 border-red-200 bg-red-50 flex flex-col items-start gap-4">
          <AlertCircle className="text-red-500 shrink-0" size={24} />
          <div>
            <p className="text-sm font-bold text-red-600 uppercase mb-1">Zone Dangereuse</p>
            <p className="text-xs text-slate-700 leading-relaxed mb-4">
              Supprimez toutes les données du système. Cette action est irréversible.
            </p>
            <button 
              onClick={() => setShowResetModal(true)}
              className="px-4 py-2 bg-red-500 text-white rounded-md text-[10px] font-black uppercase hover:bg-red-600 transition-all border border-red-600"
            >
              Remise à Zéro Totale
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Réinitialisation */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setShowResetModal(false); setResetReason(''); }}></div>
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border-2 border-slate-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-500 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <AlertCircle size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Remise à Zéro Totale</h3>
                  <p className="text-red-100 text-xs font-medium">Cette action est irréversible</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-red-800">Danger</p>
                    <p className="text-xs text-red-600 mt-1">Toutes les données (prêts, échéances, fichiers) seront définitivement supprimées.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-5 py-2.5 rounded-lg text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={async () => {
                  const res = await fetch(`${getApiBaseUrl()}/api/reset-system`, { method: 'POST' });
                  if (res.ok) {
                    setShowResetModal(false);
                    setMessage('Système remis à zéro avec succès.');
                    setTimeout(() => window.location.reload(), 2000);
                  }
                }}
                className="px-5 py-2.5 rounded-lg text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition-all flex items-center gap-2"
              >
                <AlertCircle size={16} />
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DGSettings;
