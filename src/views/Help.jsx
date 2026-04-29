import React, { useState } from 'react';
import { 
  BookOpen, Users, ShieldCheck, Settings, 
  FileText, CreditCard, TrendingUp, AlertCircle,
  ChevronDown, ChevronUp, ArrowLeft, CheckCircle2,
  Info, Calendar, Wallet, Send, Lock, Mail
} from 'lucide-react';

const Help = ({ user, onNavigate }) => {
  const [expandedSection, setExpandedSection] = useState(null);
  const [activeTab, setActiveTab] = useState('general');

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const isClient = user.role === 'CLIENT_PRIVE' || user.role === 'CLIENT_PUBLIC';
  const isGestionnaire = user.role === 'GESTIONNAIRE';
  const isDG = user.role === 'DG';

  const generalSections = [
    {
      id: 'overview',
      title: 'Vue d\'ensemble du système',
      icon: BookOpen,
      content: `
        <p class="mb-4">PretBank est une plateforme complète de gestion de prêts bancaires qui permet :</p>
        <ul class="list-disc pl-6 mb-4 space-y-2">
          <li>Dépôt de demandes de prêt en ligne</li>
          <li>Suivi des dossiers en temps réel</li>
          <li>Gestion des remboursements et échéances</li>
          <li>Administration des paramètres bancaires</li>
        </ul>
        <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p class="text-sm"><strong>Point clé :</strong> Le système utilise un workflow à 3 niveaux pour garantir la sécurité des transactions.</p>
        </div>
      `
    },
    {
      id: 'workflow',
      title: 'Workflow de validation',
      icon: Settings,
      content: `
        <div class="space-y-4">
          <div class="border-l-4 border-blue-500 pl-4">
            <h4 class="font-bold text-blue-700">1. Dépôt de demande</h4>
            <p class="text-sm">Le client soumet sa demande avec documents justificatifs</p>
          </div>
          <div class="border-l-4 border-yellow-500 pl-4">
            <h4 class="font-bold text-yellow-700">2. Validation Gestionnaire</h4>
            <p class="text-sm">Le gestionnaire vérifie les documents et peut approuver/rejeter</p>
          </div>
          <div class="border-l-4 border-green-500 pl-4">
            <h4 class="font-bold text-green-700">3. Approbation DG</h4>
            <p class="text-sm">Le DG donne l'approbation finale pour le décaissement</p>
          </div>
          <div class="border-l-4 border-purple-500 pl-4">
            <h4 class="font-bold text-purple-700">4. Décaissement</h4>
            <p class="text-sm">Les fonds sont transférés au client</p>
          </div>
        </div>
      `
    },
    {
      id: 'products',
      title: 'Types de prêts disponibles',
      icon: CreditCard,
      content: `
        <div class="grid gap-4">
          <div class="border rounded-lg p-4">
            <h4 class="font-bold text-blue-600">CRÉDIT FLASH</h4>
            <ul class="text-sm space-y-1 mt-2">
              <li>• Montant : 100 000 - 3 000 000 FCFA</li>
              <li>• Durée : 1 - 24 mois</li>
              <li>• Taux : 11%</li>
              <li>• Public : Client privé</li>
            </ul>
          </div>
          <div class="border rounded-lg p-4">
            <h4 class="font-bold text-green-600">PRÊT CONSO</h4>
            <ul class="text-sm space-y-1 mt-2">
              <li>• Montant : 500 000 - 10 000 000 FCFA</li>
              <li>• Durée : 1 - 60 mois</li>
              <li>• Taux : 9%</li>
              <li>• Public : Client public</li>
            </ul>
          </div>
          <div class="border rounded-lg p-4">
            <h4 class="font-bold text-purple-600">PRÊT SCOLAIRE</h4>
            <ul class="text-sm space-y-1 mt-2">
              <li>• Montant : 100 000 - 5 000 000 FCFA</li>
              <li>• Durée : 1 - 12 mois</li>
              <li>• Taux : 7.5%</li>
              <li>• Public : Tous les clients</li>
            </ul>
          </div>
        </div>
      `
    }
  ];

  const clientSections = [
    {
      id: 'new-request',
      title: 'Comment faire une demande de prêt',
      icon: FileText,
      content: `
        <div class="space-y-4">
          <div class="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 class="font-bold text-green-700">Étape 1 : Remplir le formulaire</h4>
            <ol class="list-decimal pl-6 mt-2 space-y-2 text-sm">
              <li>Choisissez le type de prêt qui vous convient</li>
              <li>Remplissez le montant souhaité (dans les limites)</li>
              <li>Sélectionnez la durée de remboursement</li>
              <li>Téléchargez les documents justificatifs (minimum 3)</li>
            </ol>
          </div>
          <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 class="font-bold text-blue-700">Étape 2 : Documents requis</h4>
            <ul class="list-disc pl-6 mt-2 space-y-1 text-sm">
              <li>Pièce d'identité valide</li>
              <li>Justificatif de domicile</li>
              <li>Justificatif de revenus</li>
              <li>Relevé bancaire (3 derniers mois)</li>
              <li>Autres documents spécifiques au prêt</li>
            </ul>
          </div>
          <div class="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h4 class="font-bold text-yellow-700">Étape 3 : Simulation</h4>
            <p class="text-sm mt-2">Le système calcule automatiquement vos mensualités et affiche un tableau d'amortissement prévisionnel.</p>
          </div>
        </div>
      `
    },
    {
      id: 'tracking',
      title: 'Suivre ma demande',
      icon: Calendar,
      content: `
        <div class="space-y-4">
          <h4 class="font-bold">Statuts possibles de votre demande :</h4>
          <div class="space-y-3">
            <div class="flex items-center gap-3">
              <div class="w-4 h-4 bg-blue-500 rounded-full"></div>
              <div>
                <strong>PENDING_GESTIONNAIRE</strong>
                <p class="text-sm text-gray-600">En attente de validation par le gestionnaire</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-4 h-4 bg-yellow-500 rounded-full"></div>
              <div>
                <strong>PENDING_DG</strong>
                <p class="text-sm text-gray-600">Validé par le gestionnaire, en attente d'approbation DG</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-4 h-4 bg-green-500 rounded-full"></div>
              <div>
                <strong>APPROVED</strong>
                <p class="text-sm text-gray-600">Approuvé, en attente de décaissement</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-4 h-4 bg-purple-500 rounded-full"></div>
              <div>
                <strong>DISBURSED</strong>
                <p class="text-sm text-gray-600">Fonds décaissés, prêt actif</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-4 h-4 bg-red-500 rounded-full"></div>
              <div>
                <strong>REJECTED</strong>
                <p class="text-sm text-gray-600">Demande rejetée (voir motif)</p>
              </div>
            </div>
          </div>
        </div>
      `
    },
    {
      id: 'repayments',
      title: 'Gérer les remboursements',
      icon: Wallet,
      content: `
        <div class="space-y-4">
          <h4 class="font-bold">Comment fonctionnent les remboursements :</h4>
          <div class="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h5 class="font-bold text-purple-700">Échéances mensuelles</h5>
            <ul class="list-disc pl-6 mt-2 space-y-2 text-sm">
              <li>Chaque mensualité inclut : capital + intérêts + pénalités éventuelles</li>
              <li>Les échéances sont générées automatiquement à la date de décaissement</li>
              <li>Vous recevez des notifications 7 jours avant chaque échéance</li>
            </ul>
          </div>
          <div class="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <h5 class="font-bold text-orange-700">En cas de retard</h5>
            <p class="text-sm mt-2">Des pénalités de retard sont appliquées automatiquement et le gestionnaire en est notifié.</p>
          </div>
          <div class="bg-green-50 p-4 rounded-lg border border-green-200">
            <h5 class="font-bold text-green-700">Remboursement anticipé</h5>
            <p class="text-sm mt-2">Vous pouvez rembourser votre prêt en totalité à tout moment sans pénalités.</p>
          </div>
        </div>
      `
    },
    {
      id: 'limits',
      title: 'Limites et quotas',
      icon: AlertCircle,
      content: `
        <div class="space-y-4">
          <h4 class="font-bold">Règles importantes à connaître :</h4>
          <div class="space-y-3">
            <div class="border-l-4 border-red-500 pl-4">
              <h5 class="font-bold text-red-700">Maximum 2 prêts simultanés</h5>
              <p class="text-sm">Vous ne pouvez avoir que 2 prêts actifs en même temps</p>
            </div>
            <div class="border-l-4 border-yellow-500 pl-4">
              <h5 class="font-bold text-yellow-700">1 remplacement après rejet</h5>
              <p class="text-sm">Si votre demande est rejetée, vous pouvez faire 1 seule nouvelle demande</p>
            </div>
            <div class="border-l-4 border-green-500 pl-4">
              <h5 class="font-bold text-green-700">Libération du quota</h5>
              <p class="text-sm">Un prêt totalement remboursé libère automatiquement votre quota</p>
            </div>
          </div>
          <div class="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-4">
            <p class="text-sm"><strong>Conseil :</strong> Suivez régulièrement l'évolution de vos prêts dans votre tableau de bord.</p>
          </div>
        </div>
      `
    }
  ];

  const gestionnaireSections = [
    {
      id: 'validation',
      title: 'Processus de validation des demandes',
      icon: CheckCircle2,
      content: `
        <div class="space-y-4">
          <h4 class="font-bold">Votre rôle dans le workflow :</h4>
          <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h5 class="font-bold text-blue-700">Étape 1 : Vérification documents</h5>
            <ul class="list-decimal pl-6 mt-2 space-y-2 text-sm">
              <li>Ouvrir le dossier du client</li>
              <li>Vérifier l'authenticité des documents</li>
              <li>Contrôler la cohérence des informations</li>
              <li>Valider la capacité de remboursement</li>
            </ul>
          </div>
          <div class="bg-green-50 p-4 rounded-lg border border-green-200">
            <h5 class="font-bold text-green-700">Étape 2 : Décision</h5>
            <div class="space-y-2 mt-2">
              <p class="text-sm"><strong>Approbation :</strong> Transmet au DG pour validation finale</p>
              <p class="text-sm"><strong>Rejet :</strong> Indiquez le motif précis pour information client</p>
            </div>
          </div>
          <div class="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h5 class="font-bold text-yellow-700">Notifications</h5>
            <p class="text-sm mt-2">Vous recevez des alertes pour :</p>
            <ul class="list-disc pl-6 mt-2 text-sm">
              <li>Nouvelles demandes en attente</li>
              <li>Prêts en retard de paiement</li>
              <li>Prêts totalement remboursés</li>
            </ul>
          </div>
        </div>
      `
    },
    {
      id: 'documents',
      title: 'Vérification des documents',
      icon: FileText,
      content: `
        <div class="space-y-4">
          <h4 class="font-bold">Documents à vérifier systématiquement :</h4>
          <div class="grid gap-3">
            <div class="border rounded p-3">
              <h5 class="font-bold text-blue-600">Pièce d'identité</h5>
              <ul class="text-sm mt-1">
                <li>• Validité non expirée</li>
                <li>• Photo claire et reconnaissable</li>
                <li>• Conformité avec informations fournies</li>
              </ul>
            </div>
            <div class="border rounded p-3">
              <h5 class="font-bold text-green-600">Justificatif de domicile</h5>
              <ul class="text-sm mt-1">
                <li>• Date récente (&lt; 3 mois)</li>
                <li>• Nom et adresse visibles</li>
                <li>• Facture officielle (eau, électricité, etc.)</li>
              </ul>
            </div>
            <div class="border rounded p-3">
              <h5 class="font-bold text-purple-600">Justificatifs de revenus</h5>
              <ul class="text-sm mt-1">
                <li>• Bulletins de salaire (3 derniers)</li>
                <li>• Attestation d'emploi</li>
                <li>• Relevés bancaires</li>
              </ul>
            </div>
          </div>
          <div class="bg-red-50 p-4 rounded-lg border border-red-200 mt-4">
            <p class="text-sm"><strong>Important :</strong> En cas de doute, demandez des documents complémentaires avant de rejeter.</p>
          </div>
        </div>
      `
    },
    {
      id: 'monitoring',
      title: 'Suivi des prêts actifs',
      icon: TrendingUp,
      content: `
        <div class="space-y-4">
          <h4 class="font-bold">Tableau de bord du gestionnaire :</h4>
          <div class="space-y-3">
            <div class="bg-blue-50 p-3 rounded">
              <h5 class="font-bold text-blue-700">Encours total</h5>
              <p class="text-sm">Montant total des prêts en cours de remboursement</p>
            </div>
            <div class="bg-yellow-50 p-3 rounded">
              <h5 class="font-bold text-yellow-700">Prochaine échéance</h5>
              <p class="text-sm">Date du prochain paiement prévu</p>
            </div>
            <div class="bg-green-50 p-3 rounded">
              <h5 class="font-bold text-green-700">Volume actif</h5>
              <p class="text-sm">Nombre de prêts actuellement actifs (exclus les remboursés)</p>
            </div>
          </div>
          <div class="bg-purple-50 p-4 rounded-lg border border-purple-200 mt-4">
            <h5 class="font-bold text-purple-700">Alertes automatiques</h5>
            <ul class="list-disc pl-6 mt-2 text-sm">
              <li>Retards de paiement (&gt; date d'échéance)</li>
              <li>Remboursements complets (mise à jour des statistiques)</li>
              <li>Nouvelles demandes en attente</li>
            </ul>
          </div>
        </div>
      `
    }
  ];

  const dgSections = [
    {
      id: 'approvals',
      title: 'Approbations finales',
      icon: ShieldCheck,
      content: `
        <div class="space-y-4">
          <h4 class="font-bold">Pouvoirs du Directeur Général :</h4>
          <div class="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h5 class="font-bold text-purple-700">Validation finale</h5>
            <ul class="list-decimal pl-6 mt-2 space-y-2 text-sm">
              <li>Revue des demandes validées par le gestionnaire</li>
              <li>Vérification de la conformité politique de crédit</li>
              <li>Approbation finale pour décaissement</li>
              <li>Rejet avec motif en dernier recours</li>
            </ul>
          </div>
          <div class="bg-green-50 p-4 rounded-lg border border-green-200">
            <h5 class="font-bold text-green-700">Décision DG</h5>
            <p class="text-sm mt-2">Votre décision est finale et déclenche immédiatement le décaissement ou le rejet.</p>
          </div>
        </div>
      `
    },
    {
      id: 'settings',
      title: 'Gestion des paramètres',
      icon: Settings,
      content: `
        <div class="space-y-4">
          <h4 class="font-bold">Paramètres configurables par produit :</h4>
          <div class="grid gap-3">
            <div class="border rounded p-3">
              <h5 class="font-bold text-blue-600">Taux d'intérêt</h5>
              <p class="text-sm">Modifiable selon la politique commerciale</p>
            </div>
            <div class="border rounded p-3">
              <h5 class="font-bold text-green-600">Montant max</h5>
              <p class="text-sm">Plafond maximum par type de prêt</p>
            </div>
            <div class="border rounded p-3">
              <h5 class="font-bold text-purple-600">Durée max</h5>
              <p class="text-sm">Période maximale de remboursement</p>
            </div>
          </div>
          <div class="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mt-4">
            <h5 class="font-bold text-yellow-700">Remise à zéro</h5>
            <p class="text-sm mt-2">Fonction de secours pour réinitialiser complètement le système (supprime toutes les données).</p>
            <div class="bg-red-100 p-2 rounded mt-2">
              <p class="text-xs text-red-700"><strong>ATTENTION :</strong> Action irréversible !</p>
            </div>
          </div>
        </div>
      `
    },
    {
      id: 'oversight',
      title: 'Contrôle et supervision',
      icon: TrendingUp,
      content: `
        <div class="space-y-4">
          <h4 class="font-bold">Tableau de bord DG :</h4>
          <div class="space-y-3">
            <div class="bg-blue-50 p-3 rounded">
              <h5 class="font-bold text-blue-700">Volume global</h5>
              <p class="text-sm">Vue d'ensemble de tous les prêts actifs</p>
            </div>
            <div class="bg-green-50 p-3 rounded">
              <h5 class="font-bold text-green-700">Performance</h5>
              <p class="text-sm">Statistiques de remboursement et défauts</p>
            </div>
            <div class="bg-purple-50 p-3 rounded">
              <h5 class="font-bold text-purple-700">Risques</h5>
              <p class="text-sm">Suivi des prêts en retard et criticité</p>
            </div>
          </div>
          <div class="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-4">
            <h5 class="font-bold text-blue-700">Notifications DG</h5>
            <ul class="list-disc pl-6 mt-2 text-sm">
              <li>Demandes en attente d'approbation finale</li>
              <li>Prêts totalement remboursés</li>
              <li>Alertes de risque élevé</li>
            </ul>
          </div>
        </div>
      `
    }
  ];

  const getSections = () => {
    switch (activeTab) {
      case 'general': return generalSections;
      case 'client': return clientSections;
      case 'gestionnaire': return gestionnaireSections;
      case 'dg': return dgSections;
      default: return generalSections;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors mb-6"
          >
            <ArrowLeft size={20} />
            <span className="font-semibold">Retour au tableau de bord</span>
          </button>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-bank-primary rounded-lg flex items-center justify-center text-white mx-auto mb-4">
              <BookOpen size={32} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-2">Centre d'Aide</h1>
            <p class="text-slate-600">Guide complet du système PretBank</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              activeTab === 'general' 
                ? 'bg-bank-primary text-white' 
                : 'bg-white border-2 border-slate-300 text-slate-700 hover:border-blue-300'
            }`}
          >
            Général
          </button>
          {(isClient) && (
            <button
              onClick={() => setActiveTab('client')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                activeTab === 'client' 
                  ? 'bg-bank-primary text-white' 
                  : 'bg-white border-2 border-slate-300 text-slate-700 hover:border-blue-300'
              }`}
            >
              Client
            </button>
          )}
          {(isGestionnaire) && (
            <button
              onClick={() => setActiveTab('gestionnaire')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                activeTab === 'gestionnaire' 
                  ? 'bg-bank-primary text-white' 
                  : 'bg-white border-2 border-slate-300 text-slate-700 hover:border-blue-300'
              }`}
            >
              Gestionnaire
            </button>
          )}
          {(isDG) && (
            <button
              onClick={() => setActiveTab('dg')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                activeTab === 'dg' 
                  ? 'bg-bank-primary text-white' 
                  : 'bg-white border-2 border-slate-300 text-slate-700 hover:border-blue-300'
              }`}
            >
              DG
            </button>
          )}
        </div>

        {/* Content */}
        <div className="space-y-4">
          {getSections().map((section) => (
            <div key={section.id} className="bg-white rounded-lg border-2 border-slate-200 overflow-hidden">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-bank-primary">
                    <section.icon size={20} />
                  </div>
                  <h3 className="font-bold text-slate-900 text-left">{section.title}</h3>
                </div>
                {expandedSection === section.id ? (
                  <ChevronUp size={20} className="text-slate-400" />
                ) : (
                  <ChevronDown size={20} className="text-slate-400" />
                )}
              </button>
              
              {expandedSection === section.id && (
                <div className="px-6 pb-6 border-t border-slate-100">
                  <div 
                    className="prose prose-sm max-w-none text-slate-700"
                    dangerouslySetInnerHTML={{ __html: section.content }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
            <h3 className="font-bold text-blue-900 mb-2">Besoin d'aide supplémentaire ?</h3>
            <p className="text-sm text-blue-700 mb-4">
              Contactez l'équipe de support pour toute question technique ou problème d'utilisation.
            </p>
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Mail size={16} />
                support@pretbank.com
              </div>
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Send size={16} />
                Support technique
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;
