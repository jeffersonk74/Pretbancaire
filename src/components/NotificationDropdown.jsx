import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, CheckCircle2, AlertCircle, Info, FileText, CreditCard, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const NotificationDropdown = ({ user, loans, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);

  // Récupérer les notifications stockées
  const getStoredNotifications = () => {
    try {
      const stored = localStorage.getItem(`pretbank_notifications_${user.id}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  // Sauvegarder les notifications
  const saveNotifications = (notifs) => {
    try {
      localStorage.setItem(`pretbank_notifications_${user.id}`, JSON.stringify(notifs));
    } catch (error) {
      console.error('Erreur sauvegarde notifications:', error);
    }
  };

  // Générer notifications selon le rôle et les données
  useEffect(() => {
    const generateNotifications = () => {
      const notifs = [];
      const isClient = user.role === 'CLIENT_PRIVE' || user.role === 'CLIENT_PUBLIC';
      const isGestionnaire = user.role === 'GESTIONNAIRE';
      const isDG = user.role === 'DG';

      // Récupérer les notifications existantes
      const existingNotifs = getStoredNotifications();
      const now = new Date();

      if (isClient) {
        // Notifications pour clients
        const pendingLoans = loans.filter(l => l.status === 'PENDING_GESTIONNAIRE' || l.status === 'PENDING_DG');
        const approvedLoans = loans.filter(l => l.status === 'APPROVED');
        const rejectedLoans = loans.filter(l => l.status === 'REJECTED');
        const disbursedLoans = loans.filter(l => l.status === 'DISBURSED');

        if (pendingLoans.length > 0) {
          const loanIds = pendingLoans.map(l => l.id).sort().join(',');
          const existingNotif = existingNotifs.find(n => n.id === `pending-${loanIds}`);
          
          if (!existingNotif) {
            notifs.push({
              id: `pending-${loanIds}`,
              type: 'info',
              title: `${pendingLoans.length} demande(s) en attente`,
              message: 'Vos demandes sont en cours de traitement',
              date: now,
              read: false,
              action: { tab: 'history', label: 'Voir' }
            });
          } else {
            notifs.push(existingNotif);
          }
        }

        if (approvedLoans.length > 0) {
          const loanIds = approvedLoans.map(l => l.id).sort().join(',');
          const existingNotif = existingNotifs.find(n => n.id === `approved-${loanIds}`);
          
          if (!existingNotif) {
            notifs.push({
              id: `approved-${loanIds}`,
              type: 'success',
              title: `${approvedLoans.length} prêt(s) approuvé(s)`,
              message: 'Vos demandes ont été approuvées. En attente de décaissement.',
              date: now,
              read: false,
              action: { tab: 'history', label: 'Voir' }
            });
          } else {
            notifs.push(existingNotif);
          }
        }

        if (rejectedLoans.length > 0) {
          const loanIds = rejectedLoans.map(l => l.id).sort().join(',');
          const existingNotif = existingNotifs.find(n => n.id === `rejected-${loanIds}`);
          
          if (!existingNotif) {
            notifs.push({
              id: `rejected-${loanIds}`,
              type: 'warning',
              title: `${rejectedLoans.length} demande(s) rejetée(s)`,
              message: 'Certaines demandes ont été rejetées. Vous pouvez faire une nouvelle demande.',
              date: now,
              read: false,
              action: { tab: 'new-request', label: 'Nouvelle demande' }
            });
          } else {
            notifs.push(existingNotif);
          }
        }

        // Alertes échéances
        const disbursedWithInstallments = disbursedLoans.filter(l => l.installments && l.installments.length > 0);
        disbursedWithInstallments.forEach(loan => {
          const unpaidInstallments = loan.installments.filter(i => i.status === 'UNPAID');
          const upcomingInstallments = unpaidInstallments.filter(i => {
            const dueDate = new Date(i.dueDate);
            const today = new Date();
            const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
            return diffDays > 0 && diffDays <= 7;
          });

          if (upcomingInstallments.length > 0) {
            const dueDate = upcomingInstallments[0].dueDate;
            const existingNotif = existingNotifs.find(n => n.id === `due-${loan.id}-${dueDate}`);
            
            if (!existingNotif) {
              notifs.push({
                id: `due-${loan.id}-${dueDate}`,
                type: 'warning',
                title: 'Échéance proche',
                message: `Votre échéance du ${format(new Date(dueDate), 'dd/MM/yyyy')} arrive bientôt`,
                date: now,
                read: false,
                action: { tab: 'my-repayments', label: 'Voir' }
              });
            } else {
              notifs.push(existingNotif);
            }
          }
        });
      }

      if (isGestionnaire) {
        // Notifications pour gestionnaire
        const pendingValidation = loans.filter(l => l.status === 'PENDING_GESTIONNAIRE');
        
        if (pendingValidation.length > 0) {
          const loanIds = pendingValidation.map(l => l.id).sort().join(',');
          const existingNotif = existingNotifs.find(n => n.id === `pending-validation-${loanIds}`);
          
          if (!existingNotif) {
            notifs.push({
              id: `pending-validation-${loanIds}`,
              type: 'info',
              title: `${pendingValidation.length} demande(s) à valider`,
              message: 'Des demandes nécessitent votre validation',
              date: now,
              read: false,
              action: { tab: 'history', label: 'Traiter' }
            });
          } else {
            notifs.push(existingNotif);
          }
        }

        // Prêts en retard
        const lateLoans = loans.filter(l => 
          l.status === 'DISBURSED' && 
          l.installments?.some(i => i.status === 'UNPAID' && new Date(i.dueDate) < new Date())
        );

        if (lateLoans.length > 0) {
          const loanIds = lateLoans.map(l => l.id).sort().join(',');
          const existingNotif = existingNotifs.find(n => n.id === `late-payments-${loanIds}`);
          
          if (!existingNotif) {
            notifs.push({
              id: `late-payments-${loanIds}`,
              type: 'error',
              title: `${lateLoans.length} prêt(s) en retard`,
              message: 'Des échéances sont impayées et en retard',
              date: now,
              read: false,
              action: { tab: 'my-repayments', label: 'Voir' }
            });
          } else {
            notifs.push(existingNotif);
          }
        }

        // Prêts totalement remboursés
        const fullyPaidLoans = loans.filter(l => {
          if (l.status !== 'DISBURSED') return false;
          const allPaid = l.installments?.length > 0 && 
                         l.installments.every(inst => inst.status === 'PAID');
          return allPaid;
        });

        if (fullyPaidLoans.length > 0) {
          const loanIds = fullyPaidLoans.map(l => l.id).sort().join(',');
          const existingNotif = existingNotifs.find(n => n.id === `fully-paid-${loanIds}`);
          
          if (!existingNotif) {
            notifs.push({
              id: `fully-paid-${loanIds}`,
              type: 'success',
              title: `${fullyPaidLoans.length} prêt(s) remboursé(s)`,
              message: 'Des prêts ont été totalement remboursés par les clients',
              date: now,
              read: false,
              action: { tab: 'history', label: 'Voir' }
            });
          } else {
            notifs.push(existingNotif);
          }
        }
      }

      if (isDG) {
        // Notifications pour DG
        const pendingDG = loans.filter(l => l.status === 'PENDING_DG');
        
        if (pendingDG.length > 0) {
          const loanIds = pendingDG.map(l => l.id).sort().join(',');
          const existingNotif = existingNotifs.find(n => n.id === `pending-dg-${loanIds}`);
          
          if (!existingNotif) {
            notifs.push({
              id: `pending-dg-${loanIds}`,
              type: 'info',
              title: `${pendingDG.length} demande(s) pour DG`,
              message: 'Des demandes nécessitent votre approbation finale',
              date: now,
              read: false,
              action: { tab: 'history', label: 'Approuver' }
            });
          } else {
            notifs.push(existingNotif);
          }
        }

        // Prêts totalement remboursés
        const fullyPaidLoansDG = loans.filter(l => {
          if (l.status !== 'DISBURSED') return false;
          const allPaid = l.installments?.length > 0 && 
                         l.installments.every(inst => inst.status === 'PAID');
          return allPaid;
        });

        if (fullyPaidLoansDG.length > 0) {
          const loanIds = fullyPaidLoansDG.map(l => l.id).sort().join(',');
          const existingNotif = existingNotifs.find(n => n.id === `fully-paid-dg-${loanIds}`);
          
          if (!existingNotif) {
            notifs.push({
              id: `fully-paid-dg-${loanIds}`,
              type: 'success',
              title: `${fullyPaidLoansDG.length} prêt(s) remboursé(s)`,
              message: 'Des prêts ont été totalement remboursés par les clients',
              date: now,
              read: false,
              action: { tab: 'history', label: 'Voir' }
            });
          } else {
            notifs.push(existingNotif);
          }
        }
      }

      return notifs;
    };

    const newNotifications = generateNotifications();
    setNotifications(newNotifications);
    saveNotifications(newNotifications);
  }, [user, loans]);

  // Fermer au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id) => {
    const updated = notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updated);
    saveNotifications(updated);
  };

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    saveNotifications(updated);
  };

  const deleteNotification = (id) => {
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    saveNotifications(updated);
  };

  const handleAction = (action) => {
    if (action?.tab) {
      onNavigate(action.tab);
      setIsOpen(false);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle2 size={18} className="text-emerald-500" />;
      case 'warning': return <AlertCircle size={18} className="text-amber-500" />;
      case 'error': return <AlertCircle size={18} className="text-rose-500" />;
      case 'info': return <Info size={18} className="text-blue-500" />;
      default: return <FileText size={18} className="text-slate-500" />;
    }
  };

  const getBgColor = (type) => {
    switch (type) {
      case 'success': return 'bg-emerald-50 border-emerald-200';
      case 'warning': return 'bg-amber-50 border-amber-200';
      case 'error': return 'bg-rose-50 border-rose-200';
      case 'info': return 'bg-blue-50 border-blue-200';
      default: return 'bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Icône cloche */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg border-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
      >
        <Bell size={20} className={unreadCount > 0 ? 'text-bank-primary' : 'text-slate-600'} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white border-2 border-slate-300 rounded-lg shadow-xl z-50 max-h-[400px] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
            <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
              >
                Tout marquer lu
              </button>
            )}
          </div>

          {/* Liste */}
          <div className="overflow-y-auto max-h-[300px]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell size={32} className="text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">Aucune notification</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 hover:bg-slate-50 transition-colors ${!notif.read ? 'bg-slate-50/50' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 border ${getBgColor(notif.type)}`}>
                        {getIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-semibold ${!notif.read ? 'text-slate-900' : 'text-slate-600'}`}>
                            {notif.title}
                          </p>
                          {!notif.read && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{notif.message}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] text-slate-400">
                            {format(notif.date, 'dd/MM HH:mm', { locale: fr })}
                          </span>
                          <div className="flex items-center gap-2">
                            {notif.action && (
                              <button
                                onClick={() => handleAction(notif.action)}
                                className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                              >
                                {notif.action.label}
                              </button>
                            )}
                            {!notif.read && (
                              <button
                                onClick={() => markAsRead(notif.id)}
                                className="text-xs text-slate-400 hover:text-slate-600"
                              >
                                Marquer lu
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notif.id)}
                              className="text-slate-400 hover:text-rose-500"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-slate-200 bg-slate-50 text-center">
              <p className="text-xs text-slate-500">{notifications.length} notification(s)</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
