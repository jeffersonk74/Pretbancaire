import React, { useState } from 'react';
import { TrendingUp, Lock, Mail, Loader2 } from 'lucide-react';
import { getApiBaseUrl } from '../utils/api';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const user = await response.json();
        onLogin(user);
      } else {
        const err = await response.json();
        setError(err.error || 'Identifiants invalides');
      }
    } catch (err) {
      setError('Impossible de se connecter au serveur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundImage: 'url(/assets/login-bg.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="w-full max-w-md bg-white rounded-lg p-10 relative overflow-hidden border-2 border-slate-300 shadow-sm shadow-slate-200/20 z-10">
        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100 rounded-full blur-3xl"></div>
        
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-bank-primary rounded-md flex items-center justify-center shadow-sm border border-blue-800 mb-6">
            <TrendingUp size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
            PRÊT<span className="text-bank-primary">BANK</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Connectez-vous à votre espace sécurisé</p>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-300 text-red-700 p-4 rounded-md text-sm font-bold mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Email</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-bank-primary transition-colors" size={18} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nom@pretbank.com"
                className="w-full bg-slate-50 border-2 border-slate-300 rounded-md py-4 pl-12 pr-6 text-slate-900 outline-none focus:ring-2 focus:ring-bank-primary/50 focus:border-bank-primary transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Mot de passe</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-bank-primary transition-colors" size={18} />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border-2 border-slate-300 rounded-md py-4 pl-12 pr-6 text-slate-900 outline-none focus:ring-2 focus:ring-bank-primary/50 focus:border-bank-primary transition-all"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-bank-primary text-white py-5 rounded-md flex items-center justify-center gap-3 shadow-sm shadow-blue-900/20 active:scale-[0.98] transition-all disabled:opacity-50 border border-blue-800"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Se Connecter'}
          </button>
        </form>

        <div className="mt-10 text-center">
          <p className="text-slate-500 text-xs">
            © 2026 PRÊTBANK. Système Bancaire Sécurisé.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
