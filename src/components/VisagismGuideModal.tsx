
import React from 'react';
import { Modal } from './Modal';
import { Scan, Smile, User } from 'lucide-react';

export const VisagismGuideModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Guia de Visagismo">
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-xl text-indigo-600 dark:text-indigo-400">
            <Scan className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white">O que é?</h4>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              Visagismo é a arte de harmonizar a imagem pessoal com a identidade do indivíduo, analisando traços faciais e corporais.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-900 rounded-xl text-amber-600 dark:text-amber-400">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white">Formatos de Rosto</h4>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              Identificamos se seu rosto é Oval, Quadrado, Redondo, Coração ou Diamante para sugerir os melhores cortes de cabelo e acessórios.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="p-3 bg-rose-100 dark:bg-rose-900 rounded-xl text-rose-600 dark:text-rose-400">
            <Smile className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white">Harmonia</h4>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              O objetivo não é apenas estética, mas alinhar sua imagem externa com quem você é e o que deseja comunicar.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
