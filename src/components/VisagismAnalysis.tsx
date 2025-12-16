
import React from 'react';
import { Modal } from './Modal';
import { AnalysisResult } from '../types';
import { ScanFace, Palette, Scissors } from 'lucide-react';

interface Props {
  data: AnalysisResult;
  onClose: () => void;
}

export const VisagismAnalysis = ({ data, onClose }: Props) => {
  return (
    <Modal isOpen={true} onClose={onClose} title="Laboratório de Visagismo">
      <div className="space-y-6">
        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
          <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
            <ScanFace className="w-5 h-5 text-indigo-500" />
            Análise Facial
          </h4>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {data.formato_rosto_detalhado}
          </p>
          <div className="mt-2 text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded inline-block">
            Biotipo: {data.biotipo}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
             <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
               <Scissors className="w-4 h-4 text-pink-500" />
               Cabelo
             </h4>
             <p className="text-sm font-medium text-slate-800 dark:text-white">{data.visagismo.cabelo.estilo}</p>
             <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{data.visagismo.cabelo.detalhes}</p>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
             <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
               <Palette className="w-4 h-4 text-amber-500" />
               Make / Barba
             </h4>
             <p className="text-sm font-medium text-slate-800 dark:text-white">{data.visagismo.barba_ou_make.estilo}</p>
             <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{data.visagismo.barba_ou_make.detalhes}</p>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
          <h4 className="font-bold text-slate-900 dark:text-white mb-3">Paleta Recomendada</h4>
          <div className="flex flex-wrap gap-3">
            {data.paleta_cores.map((color, i) => (
              <div key={i} className="flex flex-col items-center">
                <div 
                  className="w-10 h-10 rounded-full shadow-sm border border-slate-200" 
                  style={{ backgroundColor: color.hex }}
                ></div>
                <span className="text-[10px] text-slate-500 mt-1 max-w-[60px] text-center truncate">{color.nome}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};
