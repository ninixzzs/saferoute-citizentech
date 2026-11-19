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
    <div className="w-full bg-neutral-950/95 backdrop-blur-xl border-y sm:border sm:rounded-2xl border-red-500/50 shadow-[0_10px_35px_rgba(239,68,68,0.25)] p-4 my-2 transition-all duration-300 emergency-broadcast select-none">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Warning Icon and Message */}
        <div className="flex items-start gap-3.5 flex-1">
          <div className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
            <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-mono">
                ALERTA SAFEROUTE &bull; DEFESA CIVIL
              </span>
              <span className="text-xs font-bold text-red-300">
                {zone.neighborhood} &bull; {zone.name}
              </span>
            </div>
            <h4 className="text-sm sm:text-base font-black text-white mt-1 leading-snug">
              {zone.title}
            </h4>
            <p className="text-xs sm:text-sm text-neutral-300 font-normal mt-1 flex items-center gap-1.5">
              <span className="font-bold text-amber-400">Instrução Oficial:</span> {zone.defenseCivilTip}
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
            className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs border border-neutral-700 transition-colors"
            title="Ouvir alerta por voz"
          >
            <Volume2 className="w-4 h-4" />
          </button>

          <button
            onClick={onReroute}
            className="flex-1 md:flex-initial px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <ShieldCheck className="w-4 h-4 text-neutral-950 stroke-[2.5]" />
            <span>Sugerir Desvio Seguro</span>
          </button>

          <button
            onClick={() => onDismiss(zone.id)}
            className="p-2.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors border border-neutral-800"
            title="Dispensar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
