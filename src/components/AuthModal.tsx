
import React, { useState } from 'react';
import { Modal } from './Modal';
import { Mail, Lock, Loader2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: any) => void;
}

export const AuthModal = ({ isOpen, onClose, onLogin }: AuthModalProps) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Mock login
    setTimeout(() => {
      onLogin({ 
        uid: 'user-123', 
        displayName: email.split('@')[0] || 'Usuário', 
        email, 
        photoURL: null 
      });
      setLoading(false);
      onClose();
    }, 1500);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bem-vindo de volta">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
              placeholder="seu@email.com"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Senha</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input 
              type="password" 
              required
              className="w-full pl-10 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg transition-all flex items-center justify-center"
        >
          {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Entrar'}
        </button>
      </form>
    </Modal>
  );
};
