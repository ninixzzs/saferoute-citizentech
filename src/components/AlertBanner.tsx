import React from 'react';
import { AlertTriangle, ShieldCheck, Shield, X, Navigation, Volume2 } from 'lucide-react';
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
    <div className="w-full bg-neutral-950 text-white border-y sm:border sm:rounded-2xl border-neutral-800 shadow-2xl p-4 my-2 transition-all duration-200 select-none">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Warning Icon and Message */}
        <div className="flex items-start gap-3.5 flex-1">
          <div className="w-9 h-9 rounded-xl bg-white text-neutral-950 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
            <Shield className="w-5 h-5 fill-neutral-950 stroke-neutral-950" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-400">
                SafeRoute
              </span>
              <span className="text-neutral-600">&bull;</span>
              <span className="text-xs font-semibold text-neutral-300">
                {zone.neighborhood} &bull; {zone.name}
              </span>
            </div>
            <h4 className="text-sm sm:text-base font-bold text-white mt-0.5 leading-snug">
              {zone.title}
            </h4>
            <p className="text-xs sm:text-sm text-neutral-400 font-normal mt-1 flex items-center gap-1.5">
              <span>{zone.defenseCivilTip}</span>
            </p>
          </div>
        </div>

        {/* Action Controls (Clean Black & White) */}
        <div className="flex items-center gap-2 self-end md:self-center shrink-0 w-full md:w-auto">
          <button
            onClick={() =>
              onSpeak(
                `Atenção: Você está em ${zone.neighborhood}. ${zone.defenseCivilTip}`
              )
            }
            className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs border border-neutral-800 transition-colors"
            title="Ouvir alerta por voz"
          >
            <Volume2 className="w-4 h-4" />
          </button>

          <button
            onClick={onReroute}
            className="flex-1 md:flex-initial px-5 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-neutral-950 font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <ShieldCheck className="w-4 h-4 text-neutral-950" />
            <span>Desviar para Rota Segura</span>
          </button>

          <button
            onClick={() => onDismiss(zone.id)}
            className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors border border-neutral-800"
            title="Dispensar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
