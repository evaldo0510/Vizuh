
import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface OnboardingProps {
  onStart: () => void;
  onLogin: () => void;
}

export const Onboarding = ({ onStart, onLogin }: OnboardingProps) => {
  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070')] bg-cover bg-center opacity-10"></div>
      <div className="relative z-10 max-w-md w-full space-y-8 animate-in slide-in-from-bottom duration-700">
        <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-indigo-500/30">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        
        <div>
          <h1 className="text-4xl font-serif font-bold text-slate-900 dark:text-white mb-4">
            Vizu <span className="text-indigo-600">Halizando</span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            Sua consultoria de imagem pessoal potencializada por Inteligência Artificial.
          </p>
        </div>

        <div className="space-y-4 pt-8">
          <button 
            onClick={onStart}
            className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-lg shadow-lg transition-all hover:scale-[1.02] flex items-center justify-center"
          >
            Começar Agora <ArrowRight className="w-5 h-5 ml-2" />
          </button>
          
          <button 
            onClick={onLogin}
            className="w-full py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
          >
            Já tenho conta
          </button>
        </div>
        
        <p className="text-xs text-slate-400">
          Powered by Gemini 2.5 Flash & Pro
        </p>
      </div>
    </div>
  );
};
