import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import NotificationDropdown from './components/NotificationDropdown';
import Dashboard from './views/Dashboard';
import NewRequest from './views/NewRequest';
import MyRepayments from './views/MyRepayments';
import History from './views/History';
import Login from './views/Login';
import DGSettings from './views/DGSettings';
import Help from './views/Help';

const App = () => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('pretbank_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loans, setLoans] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    if (user) {
      localStorage.setItem('pretbank_user', JSON.stringify(user));
      fetchLoans();
    } else {
      localStorage.removeItem('pretbank_user');
    }
  }, [user]);

  const fetchLoans = async () => {
    if (!user) return;
    try {
      const apiBase = window.location.hostname === 'localhost' ? 'http://localhost:3001' : `http://${window.location.hostname}:3001`;
      const response = await fetch(`${apiBase}/api/loans?userId=${user.id}&role=${user.role}`);
      if (response.ok) {
        const data = await response.json();
        setLoans(data);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des prêts:', err);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    setActiveTab('dashboard');
    setLoans([]);
  };

  const [submitError, setSubmitError] = useState(null);

  const handleAddLoan = async (formData) => {
    try {
      setSubmitError(null);
      const apiBase = window.location.hostname === 'localhost' ? 'http://localhost:3001' : `http://${window.location.hostname}:3001`;
      const response = await fetch(`${apiBase}/api/loans`, {
        method: 'POST',
        body: formData,
        // Ne pas spécifier Content-Type pour FormData - le navigateur le fait automatiquement avec le bon boundary
      });

      if (response.ok) {
        await fetchLoans();
        setSubmitError(null);
        // Ne pas rediriger ici - le modal dans NewRequest gère la navigation
      } else {
        const errorData = await response.json();
        setSubmitError(errorData.error || 'Une erreur est survenue lors de la soumission.');
        throw new Error(errorData.error || 'Erreur de soumission');
      }
    } catch (err) {
      console.error('Erreur lors de la création du prêt:', err);
      throw err;
    }
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return (
        <Dashboard 
          loans={loans} 
          user={user} 
          selectedProduct={selectedProduct}
          onNavigate={setActiveTab} 
          onSelectProduct={(p) => { setSelectedProduct(p); setActiveTab('new-request'); }}
          onSubmit={handleAddLoan}
        />
      );
      case 'new-request':
        return (user.role === 'CLIENT_PRIVE' || user.role === 'CLIENT_PUBLIC')
          ? <NewRequest selectedProduct={selectedProduct} onSelectProduct={setSelectedProduct} onSubmit={handleAddLoan} user={user} submitError={submitError} onNavigate={setActiveTab} />
          : <Dashboard loans={loans} user={user} onNavigate={setActiveTab} />;
      case 'my-repayments': return <MyRepayments loans={loans.filter(l => l.status === 'DISBURSED')} onUpdateLoan={fetchLoans} user={user} />;
      case 'history': return <History loans={loans} user={user} onUpdateLoan={fetchLoans} />;
      case 'help': return <Help user={user} onNavigate={setActiveTab} />;
      case 'settings': return user.role === 'DG' ? <DGSettings /> : <Dashboard loans={loans} user={user} />;
      default: return <Dashboard loans={loans} user={user} />;
    }
  };

  const roleLabels = {
    CLIENT_PRIVE: 'Client Privé',
    CLIENT_PUBLIC: 'Client Public',
    GESTIONNAIRE: 'Gestionnaire',
    DG: 'Direction Générale',
  };

  const currentRoleLabel = roleLabels[user.role] || user.role;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar fixe */}
      <div className="h-screen flex-shrink-0">
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            if (tab !== 'new-request') setSelectedProduct(null);
          }}
          user={user}
          onLogout={handleLogout}
        />
      </div>

      {/* Zone principale */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header fixe en haut */}
        <header className="flex-shrink-0 z-30 border-b-2 border-slate-300 bg-white px-4 md:px-6 py-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between max-w-6xl mx-auto">
            <div className="flex items-center gap-3 text-slate-600">
              <span className="text-sm font-semibold truncate max-w-[150px] md:max-w-none">{user.email || user.name}</span>
              <div className="hidden md:inline-flex h-2.5 w-2.5 rounded-sm bg-blue-700" />
              <span className="hidden md:inline text-xs uppercase tracking-[0.24em] text-blue-700 font-semibold">Espace sécurisé</span>
            </div>

            {/* Centre - Notifications Desktop */}
            <div className="hidden md:flex items-center justify-center flex-1">
              <NotificationDropdown
                user={user}
                loans={loans}
                onNavigate={(tab) => {
                  setActiveTab(tab);
                  if (tab !== 'new-request') setSelectedProduct(null);
                }}
              />
            </div>

            {/* Notifications Mobile */}
            <div className="flex md:hidden">
              <NotificationDropdown
                user={user}
                loans={loans}
                onNavigate={(tab) => {
                  setActiveTab(tab);
                  if (tab !== 'new-request') setSelectedProduct(null);
                }}
              />
            </div>

            <div className="flex items-center gap-3 text-slate-700">
              <div className="rounded-md border-2 border-slate-300 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">
                {currentRoleLabel}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-slate-100 border-2 border-slate-300 px-3 md:px-4 py-2 rounded-md text-blue-700 text-xs font-black hover:bg-slate-200 transition-colors"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </header>

        {/* Contenu scrollable */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto min-h-full">{renderContent()}</div>
        </main>
      </div>
    </div>
  );
};

export default App;
