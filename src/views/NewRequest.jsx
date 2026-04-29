import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, FileText, Upload, AlertCircle, Info, AlertTriangle, TrendingUp } from 'lucide-react';
import { PRODUCTS } from '../constants/products';
import { formatCurrency, generateAmortizationSchedule } from '../utils/calculations';

const NewRequest = ({ selectedProduct, onSelectProduct, onSubmit, user, submitError, onNavigate }) => {
  const [step, setStep] = useState(selectedProduct ? 2 : 1);
  const [amount, setAmount] = useState(0);
  const [duration, setDuration] = useState(0);
  const [simulation, setSimulation] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [globalSettings, setGlobalSettings] = useState([]);

  useEffect(() => {
    // Charger les paramètres globaux au démarrage
    const fetchGlobalSettings = async () => {
      try {
        const apiBase = window.location.hostname === 'localhost' ? 'http://localhost:3001' : `http://${window.location.hostname}:3001`;
        const response = await fetch(`${apiBase}/api/settings`);
        if (response.ok) {
          const settings = await response.json();
          setGlobalSettings(settings);
        }
      } catch (err) {
        console.error('Erreur chargement settings:', err);
      }
    };
    
    fetchGlobalSettings();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      setAmount(selectedProduct.minAmount);
      setDuration(1); // Forcé à 1
      setStep(2);
    }
  }, [selectedProduct]);

  useEffect(() => {
    if (selectedProduct && amount >= selectedProduct.minAmount && amount <= selectedProduct.maxAmount &&
      duration >= 1 && duration <= selectedProduct.maxDuration) {
      const result = generateAmortizationSchedule(
        amount,
        selectedProduct.rate,
        duration,
        selectedProduct.fees,
        selectedProduct.insurance
      );
      setSimulation(result);
    } else {
      setSimulation(null);
    }
  }, [amount, duration, selectedProduct]);

  // Fonction pour obtenir les paramètres réels depuis la base de données
  const getProductSettings = (productName) => {
    const setting = globalSettings.find(s => s.productName === productName);
    if (setting) {
      return {
        ...selectedProduct,
        minAmount: setting.minAmount,
        maxAmount: setting.maxAmount,
        minDuration: 1, // Forcé à 1
        maxDuration: setting.maxDuration,
        rate: setting.rate
      };
    }
    return {
      ...selectedProduct,
      minDuration: 1 // Forcé à 1 par défaut
    };
  };

  const currentProductSettings = getProductSettings(selectedProduct?.name);

  const maxFiles = 5;

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files).slice(0, maxFiles - uploadedFiles.length);
    const newFiles = files.map(file => ({
      file,
      type: getFileType(file.name),
      id: `${Date.now()}-${Math.random()}`
    }));
    setUploadedFiles(prev => [...prev, ...newFiles].slice(0, maxFiles));
  };

  const getFileType = (fileName) => {
    const name = fileName.toLowerCase();
    if (name.includes('identite') || name.includes('id') || name.includes('carte')) return 'identity';
    if (name.includes('photo')) return 'photo';
    if (name.includes('motif')) return 'motif';
    if (name.includes('contrat') || name.includes('travail')) return 'contract';
    if (name.includes('arrete') || name.includes('integration')) return 'decree';
    return 'other';
  };

  const PRODUCT_ACCENTS = {
    CLIENT_PRIVE: 'bg-sky-400',
    CLIENT_PUBLIC: 'bg-emerald-400',
    TOUS: 'bg-blue-500',
  };

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const REQUIRED_DOCUMENTS = ['identity', 'photo', 'motif', 'contract', 'other'];
  const MIN_DOCUMENTS = 5;

  const getDocumentLabel = (type) => {
    const labels = {
      identity: 'Identité',
      photo: 'Photo',
      motif: 'Motif',
      contract: 'Contrat de Travail',
      decree: 'Arrêté d\'Intégration'
    };
    return labels[type] || 'Document';
  };

  const productName = selectedProduct?.name || (user.role === 'CLIENT_PRIVE' ? 'CRÉDIT FLASH' : 'PRÊT CONSO');
  const uploadedTypes = uploadedFiles.map(f => f.type);
  const hasRequiredDocs = uploadedFiles.length >= MIN_DOCUMENTS;
  const isFormValid = hasRequiredDocs && simulation;
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Submit tenté - isFormValid:', isFormValid, 'hasRequiredDocs:', hasRequiredDocs, 'simulation:', simulation, 'uploadedFiles:', uploadedFiles.length);
    if (!isFormValid || isSubmitting) {
      console.log('Submit bloqué - isFormValid:', isFormValid, 'isSubmitting:', isSubmitting);
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('userId', user.id);
      formData.append('productName', productName);
      formData.append('amount', Number(amount));
      formData.append('duration', Number(duration));
      formData.append('motif', '');
      formData.append('income', '0');
      formData.append('charges', '0');

      uploadedFiles.forEach(({ file }) => {
        formData.append('documents', file);
      });

      await onSubmit(formData);
      // Si on arrive ici, c'est que la soumission a réussi
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    onNavigate('dashboard');
  };

  if (step === 1) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="max-w-6xl mx-auto space-y-8">
          <header className="bg-white border-2 border-slate-300 rounded-lg p-4 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg bg-bank-primary text-white flex items-center justify-center shadow-sm border border-blue-800">
                <TrendingUp size={22} className="md:w-[26px] md:h-[26px]" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.4em] text-slate-500">Sélection du produit</p>
                <h1 className="text-2xl md:text-4xl font-bold text-slate-950">Nos offres de crédit</h1>
              </div>
            </div>
            <p className="text-sm text-slate-500 max-w-2xl">Choisissez l'offre la plus adaptée à votre besoin. Chaque produit affiche son taux d'intérêt, sa description et son montant de base.</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {PRODUCTS.map((product) => (
              <div
                key={product.id}
                onClick={() => onSelectProduct(product)}
                className={`relative overflow-hidden bg-white border-2 border-slate-300 rounded-lg p-6 md:p-8 shadow-sm cursor-pointer transition duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-md`}
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-bank-primary"></div>
                <div className="flex justify-between items-start mb-6 md:mb-8 relative">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-md bg-blue-50 text-bank-primary flex items-center justify-center shadow-sm border border-blue-200">
                    <TrendingUp size={20} className="md:w-6 md:h-6" />
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-white bg-bank-primary border border-blue-800 rounded-md px-3 py-1">
                    Taux {product.rate}%
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-950 mb-3">{product.name}</h3>
                <p className="text-sm text-slate-500 mb-8 leading-relaxed">{product.description}</p>
                <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-bold">Montant minimum</span>
                    <p className="text-xl font-bold text-slate-950">{formatCurrency(product.minAmount)}</p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-md bg-bank-primary px-4 py-2 text-sm font-bold text-white transition duration-300 hover:bg-blue-800 border border-blue-800">
                    Sélectionner <ArrowRight size={16} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Calculer mensualité estimée
  const getEstimatedMonthlyPayment = () => {
    const product = currentProductSettings || selectedProduct;
    if (!product || !amount || !duration) return null;
    const rate = product.rate / 100 / 12;
    const monthlyPayment = (amount * rate) / (1 - Math.pow(1 + rate, -duration));
    return Math.round(monthlyPayment);
  };

  // Validations
  const amountError = currentProductSettings && (amount < currentProductSettings.minAmount || amount > currentProductSettings.maxAmount);
  const durationError = currentProductSettings && (duration < 1 || duration > currentProductSettings.maxDuration);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Colonne principale - Formulaire */}
          <div className="lg:col-span-2 space-y-8">
          <button onClick={() => { setStep(1); onSelectProduct(null); }} className="flex items-center gap-2 text-slate-700 hover:text-slate-900 transition-all duration-300 group mb-6 hover:bg-white px-3 py-2 rounded-lg border border-transparent hover:border-slate-200">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform duration-300" />
            <span className="font-bold text-xs uppercase tracking-[0.3em]">Retour aux offres</span>
          </button>

          <header className="bg-white border-2 border-slate-300 rounded-lg p-4 md:p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-md bg-bank-primary text-white flex items-center justify-center shadow-sm border border-blue-800">
                <Upload size={18} className="md:w-5 md:h-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Dossier de crédit</p>
                <h2 className="text-2xl font-bold text-slate-900">{selectedProduct.name}</h2>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-700 bg-slate-100 border border-slate-300 rounded-md px-3 py-1">Étape Finale</span>
          </header>

          <form onSubmit={handleSubmit} className="bg-white border-2 border-slate-300 rounded-lg shadow-sm overflow-hidden p-4 md:p-8 space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-400 [animation-delay:150ms]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 mb-2">Montant du crédit (FCFA)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full rounded-md border-2 border-slate-300 bg-slate-50 px-4 py-4 text-lg font-semibold text-slate-900 outline-none transition focus:border-bank-primary focus:ring-1 focus:ring-bank-primary/20"
                  min={currentProductSettings?.minAmount || selectedProduct.minAmount}
                  max={currentProductSettings?.maxAmount || selectedProduct.maxAmount}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 mb-2">Durée (mois)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full rounded-md border-2 border-slate-300 bg-slate-50 px-4 py-4 text-lg font-semibold text-slate-900 outline-none transition focus:border-bank-primary focus:ring-1 focus:ring-bank-primary/20"
                  min={1}
                  max={currentProductSettings?.maxDuration || selectedProduct.maxDuration}
                />
              </div>
            </div>

            <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg transition-all ${submitError && (submitError.toLowerCase().includes('document') || submitError.toLowerCase().includes('fichier')) ? 'bg-rose-50 border-2 border-rose-300' : ''}`}>
              <div className={`flex items-center gap-2 font-bold uppercase tracking-[0.3em] text-[10px] ${submitError && (submitError.toLowerCase().includes('document') || submitError.toLowerCase().includes('fichier')) ? 'text-rose-700' : 'text-slate-700'}`}>
                <span>📄</span>
                Justificatifs obligatoires ({MIN_DOCUMENTS} documents):
                {submitError && (submitError.toLowerCase().includes('document') || submitError.toLowerCase().includes('fichier')) && <span className="ml-2 text-rose-600 animate-pulse">← ERREUR</span>}
              </div>
              <div className={`text-[10px] font-bold ${uploadedFiles.length < MIN_DOCUMENTS ? 'text-rose-600' : 'text-slate-500'}`}>{uploadedFiles.length}/{MIN_DOCUMENTS} fichiers</div>
            </div>
            <p className="text-[13px] text-slate-700 font-bold leading-relaxed">
              1. Demande de prêt • 2. Pièce d'identité ou Passeport • 3. Photo récente • 4. Motif du prêt • 5. {user.role === 'CLIENT_PRIVE' ? 'Contrat de travail' : 'Arrêté d\'intégration'}
            </p>

            <div className={`relative rounded-lg border-2 border-dashed p-6 md:p-10 text-center transition-all duration-300 ease-out cursor-pointer hover:shadow-md hover:-translate-y-0.5 ${submitError && (submitError.toLowerCase().includes('document') || submitError.toLowerCase().includes('fichier')) ? 'border-rose-400 bg-rose-50 hover:border-rose-500 hover:bg-rose-100' : 'border-slate-300 bg-slate-50 hover:border-bank-primary hover:bg-blue-50'}`} onClick={() => document.getElementById('loan-documents')?.click()}>
              <input
                type="file"
                id="loan-documents"
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                multiple
              />
              <div className="flex flex-col items-center justify-center gap-3">
                <Upload size={28} className={submitError && (submitError.toLowerCase().includes('document') || submitError.toLowerCase().includes('fichier')) ? 'text-rose-500' : 'text-bank-primary'} />
                <div className="text-sm font-bold text-slate-900 uppercase tracking-[0.2em]">Joindre des documents</div>
                <div className="text-xs text-slate-500 uppercase tracking-[0.2em]">PDF, JPG, PNG (max 10MB par fichier)</div>
              </div>
            </div>

            {uploadedFiles.length > 0 && (
              <div className={`border-2 rounded-lg divide-y divide-slate-200 overflow-hidden ${submitError && (submitError.toLowerCase().includes('document') || submitError.toLowerCase().includes('fichier')) ? 'border-rose-400' : 'border-slate-300'}`}>
                {uploadedFiles.map(({ file, type, id }) => (
                  <div key={id} className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-md bg-blue-50 text-bank-primary flex items-center justify-center border border-blue-200">
                        <FileText size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{file.name}</p>
                        <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">{getDocumentLabel(type)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(id)}
                      className="text-sm font-bold uppercase tracking-[0.3em] text-bank-primary hover:text-blue-800"
                    >
                      Supprimer
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-4">
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className="w-full rounded-md bg-bank-primary py-4 text-sm font-bold uppercase tracking-[0.2em] text-white transition hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm border border-blue-800"
              >
                {isSubmitting ? 'Traitement...' : 'SOUMMETTRE LA DEMANDE'}
              </button>
            </div>
          </form>
          </div>

          {/* Sidebar - Simulation et détails */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Erreur de soumission */}
              {submitError && (
                <div className={`border-2 rounded-lg p-4 shadow-sm animate-pulse ${submitError.toLowerCase().includes('document') || submitError.toLowerCase().includes('fichier') ? 'bg-amber-50 border-amber-400' : 'bg-rose-50 border-rose-300'}`}>
                  <div className="flex items-start gap-3">
                    <AlertCircle size={18} className={`mt-0.5 ${submitError.toLowerCase().includes('document') || submitError.toLowerCase().includes('fichier') ? 'text-amber-600' : 'text-rose-600'}`} />
                    <div>
                      <p className={`text-sm font-bold ${submitError.toLowerCase().includes('document') || submitError.toLowerCase().includes('fichier') ? 'text-amber-900' : 'text-rose-900'}`}>
                        Erreur de soumission
                        {submitError.toLowerCase().includes('document') || submitError.toLowerCase().includes('fichier') && ' → Section Documents'}
                      </p>
                      <p className={`text-xs mt-1 leading-relaxed ${submitError.toLowerCase().includes('document') || submitError.toLowerCase().includes('fichier') ? 'text-amber-700' : 'text-rose-700'}`}>{submitError}</p>
                      {(submitError.toLowerCase().includes('document') || submitError.toLowerCase().includes('fichier')) && (
                        <p className="text-[10px] text-amber-600 mt-2 font-semibold">⚠️ Vérifiez la section Documents ci-dessus (bordure rouge)</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Carte produit sélectionné */}
              <div className="bg-white border-2 border-slate-300 rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-md bg-bank-primary text-white flex items-center justify-center border border-blue-800">
                    <TrendingUp size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">Produit sélectionné</p>
                    <h3 className="text-lg font-bold text-slate-950">{selectedProduct?.name}</h3>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Taux d'intérêt</span>
                    <span className="font-bold text-bank-primary">{selectedProduct?.rate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Montant</span>
                    <span className="font-bold text-slate-900">{formatCurrency(selectedProduct?.minAmount)} - {formatCurrency(selectedProduct?.maxAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Durée</span>
                    <span className="font-bold text-slate-900">1 - {selectedProduct?.maxDuration} mois</span>
                  </div>
                </div>
              </div>

              {/* Simulation prévisionnelle */}
              {amount > 0 && duration > 0 && !amountError && !durationError && (
                <div className="bg-bank-primary border-2 border-blue-800 rounded-lg p-6 shadow-lg">
                  <div className="flex items-center gap-2 mb-4 text-white/80">
                    <Info size={16} />
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em]">Simulation prévisionnelle</p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] text-white/70 uppercase tracking-[0.2em]">Mensualité estimée</p>
                      <p className="text-3xl font-black text-white">{formatCurrency(getEstimatedMonthlyPayment())}</p>
                    </div>
                    <div className="pt-4 border-t border-white/20">
                      <p className="text-xs text-white/80 leading-relaxed">
                        Montant demandé : {formatCurrency(amount)}<br/>
                        Durée : {duration} mois<br/>
                        Coût total estimé : {formatCurrency(getEstimatedMonthlyPayment() * duration)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-white/10 rounded-md border border-white/20">
                    <p className="text-[10px] text-white/80 italic">
                      * Cette simulation est indicative. Les montants définitifs seront confirmés lors de l'approbation.
                    </p>
                  </div>
                </div>
              )}

              {/* Alertes institutionnelles */}
              {amountError && (
                <div className="bg-rose-50 border-2 border-rose-300 rounded-lg p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={18} className="text-rose-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-rose-900">Montant hors limites</p>
                      <p className="text-xs text-rose-700 mt-1">
                        Le montant doit être compris entre {formatCurrency(selectedProduct?.minAmount)} et {formatCurrency(selectedProduct?.maxAmount)} pour ce produit.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {durationError && (
                <div className="bg-rose-50 border-2 border-rose-300 rounded-lg p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={18} className="text-rose-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-rose-900">Durée non valide</p>
                      <p className="text-xs text-rose-700 mt-1">
                        La durée doit être comprise entre 1 et {currentProductSettings?.maxDuration} mois pour ce produit.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* État de validation */}
              <div className={`border-2 rounded-lg p-4 shadow-sm ${isFormValid ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-300'}`}>
                <div className="flex items-start gap-3">
                  {isFormValid ? (
                    <CheckCircle2 size={18} className="text-emerald-600 mt-0.5" />
                  ) : (
                    <Info size={18} className="text-slate-500 mt-0.5" />
                  )}
                  <div>
                    <p className={`text-sm font-bold ${isFormValid ? 'text-emerald-900' : 'text-slate-700'}`}>
                      {isFormValid ? 'Formulaire prêt à être soumis' : 'État de la demande'}
                    </p>
                    <div className="text-xs mt-1 space-y-1">
                      <p className={hasRequiredDocs ? 'text-emerald-700' : 'text-slate-500'}>
                      {hasRequiredDocs ? '✓' : '○'} Documents: {uploadedFiles.length}/{MIN_DOCUMENTS}
                      </p>
                      <p className={simulation ? 'text-emerald-700' : 'text-slate-500'}>
                        {simulation ? '✓' : '○'} Simulation calculée
                      </p>
                      <p className={!amountError && !durationError ? 'text-emerald-700' : 'text-slate-500'}>
                        {!amountError && !durationError ? '✓' : '○'} Montant/Durée valides
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Alerte documents */}
              {uploadedFiles.length < MIN_DOCUMENTS && (
                <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={18} className="text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-amber-900">Documents incomplets</p>
                      <p className="text-xs text-amber-700 mt-1">
                        Vous devez joindre obligatoirement {MIN_DOCUMENTS} documents pour finaliser votre demande. Actuellement : {uploadedFiles.length}/{MIN_DOCUMENTS} fichier(s).
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Info institutionnelle */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <Info size={16} className="text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-blue-900">Information institutionnelle</p>
                    <p className="text-[11px] text-blue-700 mt-1 leading-relaxed">
                      Les demandes sont soumises à validation par notre comité de crédit. 
                      Le délai de traitement est de 48 à 72 heures ouvrées.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de succès */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border-2 border-emerald-400 rounded-lg shadow-2xl max-w-md w-full p-6 md:p-8 animate-in zoom-in-95 duration-300">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 border-2 border-emerald-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-emerald-600" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Demande Soumise !</h3>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Votre demande de prêt a été enregistrée avec succès. 
                Elle sera traitée par notre comité de crédit dans les 48 à 72 heures ouvrées.
              </p>
              <div className="bg-emerald-50 border border-emerald-200 rounded-md p-3 mb-6">
                <p className="text-xs text-emerald-800">
                  <span className="font-bold">Produit :</span> {productName}<br />
                  <span className="font-bold">Montant :</span> {formatCurrency(amount)}<br />
                  <span className="font-bold">Durée :</span> {duration} mois
                </p>
              </div>
              <button
                onClick={handleSuccessClose}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-md border-2 border-emerald-700 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <ArrowLeft size={18} />
                Retour au Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewRequest;
