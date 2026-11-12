import React from 'react';
import { AlertTriangle, ShieldCheck, X, Navigation, Volume2 } from 'lucide-react';
import { DangerZone } from '../types';

interface AlertBannerProps {
  zone: DangerZone | null;
  onDismiss: (zoneId: string) => void;
  onReroute: () => void;
  onSpeak: (text: string) => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  zone,
  onDismiss,
  onReroute,
  onSpeak,
}) => {
  if (!zone) return null;

  return (
    <div className="w-full bg-gradient-to-r from-red-950 via-slate-900 to-amber-950 border-y sm:border sm:rounded-xl border-red-500/50 shadow-2xl p-4 my-2 transition-all duration-300 emergency-broadcast">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Warning Icon and Message */}
        <div className="flex items-start gap-3 flex-1">
          <div className="p-2.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/40 shrink-0">
            <AlertTriangle className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-500 text-white font-mono">
                ALERTA SAFEROUTE
              </span>
              <span className="text-xs font-semibold text-red-300">
                {zone.neighborhood} - {zone.name}
              </span>
            </div>
            <h4 className="text-sm sm:text-base font-bold text-white mt-1">
              {zone.title}
            </h4>
            <p className="text-xs sm:text-sm text-amber-200/90 font-medium mt-1 flex items-center gap-1.5">
              <span className="font-semibold text-amber-400">Instrução:</span> {zone.defenseCivilTip}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end md:self-center shrink-0 w-full md:w-auto">
          <button
            onClick={() =>
              onSpeak(
                `Atenção: Você está em ${zone.neighborhood}. ${zone.defenseCivilTip}`
              )
            }
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 transition-colors"
            title="Ouvir alerta por voz"
          >
            <Volume2 className="w-4 h-4" />
          </button>

          <button
            onClick={onReroute}
            className="flex-1 md:flex-initial px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Sugerir Desvio Mais Seguro</span>
          </button>

          <button
            onClick={() => onDismiss(zone.id)}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Dispensar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
