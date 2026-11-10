import React from 'react';
import { AlertOctagon, ShieldCheck, ChevronRight, X, AlertTriangle, Radio } from 'lucide-react';
import { DangerZone } from '../types';

interface DefesaCivilModalProps {
  zone: DangerZone | null;
  isOpen: boolean;
  onClose: () => void;
  onAcceptReroute: () => void;
}

export const DefesaCivilModal: React.FC<DefesaCivilModalProps> = ({
  zone,
  isOpen,
  onClose,
  onAcceptReroute,
}) => {
  if (!isOpen || !zone) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border-2 border-red-500 shadow-2xl shadow-red-500/20 overflow-hidden text-slate-100">
        {/* Emergency header */}
        <div className="bg-gradient-to-r from-red-600 to-amber-600 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <AlertOctagon className="w-7 h-7 text-white animate-pulse" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-widest bg-black/30 px-2 py-0.5 rounded">
                  DEFESA CIVIL ALERTA
                </span>
                <span className="flex items-center gap-1 text-[11px] font-medium text-amber-200">
                  <Radio className="w-3 h-3 animate-ping" />
                  Transmissão Emergencial
                </span>
              </div>
              <h3 className="font-extrabold text-lg tracking-tight mt-0.5">
                Área de Risco Detectada na Rota
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-black/20 hover:bg-black/40 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-red-950/40 border border-red-500/30">
            <div>
              <p className="text-xs text-red-400 font-semibold uppercase tracking-wider">
                Localidade Crítica
              </p>
              <h4 className="text-base font-bold text-white">
                {zone.neighborhood} ({zone.name})
              </h4>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-red-500/20 text-red-300 border border-red-500/40">
              Nível {zone.riskLevel.toUpperCase()}
            </span>
          </div>

          <div>
            <h5 className="text-sm font-semibold text-slate-200">
              {zone.title}
            </h5>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {zone.description}
            </p>
          </div>

          {/* Practical Tips Box */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Instruções Práticas de Sobrevivência Urbana:</span>
            </div>
            <p className="text-xs sm:text-sm font-medium leading-relaxed pl-6">
              {zone.defenseCivilTip}
            </p>
          </div>

          {/* Alternative suggestion advice */}
          <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300">
            <strong className="text-emerald-400">Desvio Sugerido: </strong>
            {zone.safeAlternativeAdvice}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 pt-0 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onAcceptReroute}
            className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>Desviar p/ Rota Segura (+4 min)</span>
          </button>

          <button
            onClick={onClose}
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs sm:text-sm border border-slate-700 transition-colors"
          >
            Continuar nesta Rota
          </button>
        </div>
      </div>
    </div>
  );
};
