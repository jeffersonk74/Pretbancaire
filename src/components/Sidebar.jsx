import React, { useState } from 'react';
import { LayoutDashboard, PlusCircle, Table, History as HistoryIcon, LogOut, TrendingUp, Settings, Menu, X, BookOpen } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const Sidebar = ({ activeTab, onTabChange, user, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isClient = user.role === 'CLIENT_PRIVE' || user.role === 'CLIENT_PUBLIC';
  const isDG = user.role === 'DG';
  
  const menuItems = [
    { id: 'dashboard', label: 'Tableau de Bord', icon: LayoutDashboard },
    ...(isClient ? [{ id: 'new-request', label: 'Nouvelle Demande', icon: PlusCircle }] : []),
    { id: 'my-repayments', label: isClient ? 'Mes Remboursements' : 'Suivi des Prêts', icon: Table },
    { id: 'history', label: isClient ? 'Historique' : 'Gestion des Dossiers', icon: HistoryIcon },
    { id: 'help', label: 'Aide', icon: BookOpen },
    ...(isDG ? [{ id: 'settings', label: 'Paramètres DG', icon: Settings }] : []),
  ];

  const handleNavClick = (tabId) => {
    onTabChange(tabId);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Bouton Hamburger Mobile */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white border-2 border-slate-300 rounded-md shadow-sm"
      >
        <Menu size={24} className="text-slate-700" />
      </button>

      {/* Overlay Mobile */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Desktop (sticky) + Drawer Mobile */}
      <aside className={cn(
        "bg-white border-r border-slate-200 flex flex-col shadow-sm transition-transform duration-300 ease-in-out h-screen",
        "fixed md:sticky md:top-0 inset-y-0 left-0 z-50 w-64",
        "md:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header Sidebar avec bouton fermeture mobile */}
        <div className="p-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-bank-primary rounded-md flex items-center justify-center shadow-sm shadow-blue-900/30 border border-blue-800">
              <TrendingUp className="text-white" size={24} />
            </div>
            <h1 className="text-2xl font-black tracking-tighter text-slate-950">
              PRÊT<span className="text-bank-primary">BANK</span>
            </h1>
            {/* Bouton fermeture mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden ml-auto p-1 text-slate-500 hover:text-slate-700"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={cn(
                "w-full flex items-center gap-4 px-4 py-3 rounded-md transition-all duration-300 group border",
                activeTab === item.id 
                  ? "bg-bank-primary text-white shadow-sm border-blue-800" 
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-transparent"
              )}
            >
              <item.icon size={20} className={cn(
                "transition-transform duration-300",
                activeTab === item.id ? "scale-110" : "group-hover:scale-110"
              )} />
              <span className="font-semibold">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
