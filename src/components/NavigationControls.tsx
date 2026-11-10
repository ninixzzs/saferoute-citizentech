import React from 'react';
import { Play, Pause, RotateCcw, ShieldCheck, Gauge, Compass } from 'lucide-react';
import { NavigationRoute, DangerZone } from '../types';

interface NavigationControlsProps {
  isNavigating: boolean;
  isPaused: boolean;
  speedKmH: number;
  progressPercentage: number;
  selectedRoute: NavigationRoute;
  nearestDangerZone: { zone: DangerZone; distance: number } | null;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onInstantReroute: () => void;
}

export const NavigationControls: React.FC<NavigationControlsProps> = ({
  isNavigating,
  isPaused,
  speedKmH,
  progressPercentage,
  selectedRoute,
  nearestDangerZone,
  onStart,
  onPause,
  onResume,
  onReset,
  onInstantReroute,
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md space-y-4">
      {/* Cockpit Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 font-mono">
            <Gauge className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black font-mono text-white">
                {speedKmH}
              </span>
              <span className="text-xs text-slate-400 font-mono uppercase">km/h</span>
            </div>
            <p className="text-xs text-slate-400">
              {isNavigating ? (isPaused ? 'Pausado' : 'Em deslocamento') : 'Veículo parado'}
            </p>
          </div>
        </div>

        {/* Hazard Radar Distance Pill */}
        {nearestDangerZone && (
          <div className="px-3 py-1.5 rounded-xl bg-red-950/40 border border-red-500/30 text-xs">
            <span className="text-slate-400">Radar à frente:</span>{' '}
            <strong className="text-red-400 font-mono">
              {nearestDangerZone.distance}m
            </strong>{' '}
            <span className="text-slate-300">({nearestDangerZone.zone.neighborhood})</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>Progresso do Trajeto</span>
          <span className="text-white font-bold">{progressPercentage}%</span>
        </div>
        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              selectedRoute.type === 'segura'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm shadow-emerald-500/50'
                : 'bg-gradient-to-r from-amber-500 to-red-500 shadow-sm shadow-red-500/50'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Simulation Action Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {!isNavigating ? (
          <button
            onClick={onStart}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Iniciar Simulação GPS</span>
          </button>
        ) : isPaused ? (
          <button
            onClick={onResume}
            className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Retomar Trajeto</span>
          </button>
        ) : (
          <button
            onClick={onPause}
            className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-lg shadow-amber-600/20 transition-all flex items-center justify-center gap-2"
          >
            <Pause className="w-4 h-4 fill-current" />
            <span>Pausar</span>
          </button>
        )}

        <button
          onClick={onReset}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
          title="Reiniciar rota"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {selectedRoute.type !== 'segura' && (
          <button
            onClick={onInstantReroute}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5"
            title="Ativar desvio seguro imediato"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Desvio Seguro</span>
          </button>
        )}
      </div>
    </div>
  );
};
