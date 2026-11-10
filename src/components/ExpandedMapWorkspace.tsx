import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Navigation,
  MapPin,
  MousePointer,
  AlertTriangle,
  ShieldCheck,
  X,
  Gauge,
} from 'lucide-react';
import { DangerZone, IncidentReport, NavigationRoute } from '../types';
import { NavigationMap } from './NavigationMap';

interface ExpandedMapWorkspaceProps {
  currentPosition: [number, number];
  nextPosition?: [number, number];
  selectedRoute: NavigationRoute;
  dangerZones: DangerZone[];
  incidents: IncidentReport[];
  isNavigating: boolean;
  isPaused: boolean;
  speedKmH: number;
  progressPercentage: number;
  activeAlertZone: DangerZone | null;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onAcceptReroute: () => void;
  onDismissAlert: (id: string) => void;
  onPickPointFromMap: (role: 'origin' | 'destination', coords: [number, number]) => void;
  focusPoint?: { coords: [number, number]; ts: number } | null;
  simSpeed: '1x' | '2x';
  onToggleSimSpeed: (speed: '1x' | '2x') => void;
}

export const ExpandedMapWorkspace: React.FC<ExpandedMapWorkspaceProps> = ({
  currentPosition,
  nextPosition,
  selectedRoute,
  dangerZones,
  incidents,
  isNavigating,
  isPaused,
  speedKmH,
  progressPercentage,
  activeAlertZone,
  onStart,
  onPause,
  onResume,
  onReset,
  onAcceptReroute,
  onDismissAlert,
  onPickPointFromMap,
  focusPoint = null,
  simSpeed,
  onToggleSimSpeed,
}) => {
  const [pickMode, setPickMode] = useState<'none' | 'origin' | 'destination'>('none');

  const handleMapPick = (coords: [number, number]) => {
    if (pickMode === 'none') return;
    onPickPointFromMap(pickMode, coords);
    setPickMode('none');
  };

  const remainingFactor = Math.max(0, 1 - progressPercentage / 100);
  const remainingMin = isNavigating
    ? Math.max(1, Math.round(selectedRoute.durationMin * remainingFactor))
    : selectedRoute.durationMin;
  const remainingKm = isNavigating
    ? Math.max(0.1, Number((selectedRoute.distanceKm * remainingFactor).toFixed(1)))
    : selectedRoute.distanceKm;

  const streetNames = selectedRoute.streetNames || [];
  const streetIdx =
    streetNames.length > 0
      ? Math.min(streetNames.length - 1, Math.floor((progressPercentage / 100) * streetNames.length))
      : 0;
  const currentStreet = streetNames[streetIdx] || selectedRoute.name;

  return (
    <div className="relative w-full h-[600px] sm:h-[680px] rounded-3xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-2xl bg-neutral-900">
      {/* Main Interactive Map */}
      <NavigationMap
        currentPosition={currentPosition}
        nextPosition={nextPosition}
        selectedRoute={selectedRoute}
        dangerZones={dangerZones}
        incidents={incidents}
        isNavigating={isNavigating}
        mapPickMode={pickMode}
        onMapPick={handleMapPick}
        focusPoint={focusPoint}
        topControlOffsetClass="top-4"
        className="w-full h-full"
      />

      {/* Top-left Interactive Map Pin Tools */}
      {!isNavigating && (
        <div className="absolute top-4 left-4 z-[400] flex flex-wrap items-center gap-1.5 bg-white/95 dark:bg-neutral-950/90 backdrop-blur-md p-1.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-lg">
          <button
            type="button"
            onClick={() => setPickMode('none')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              pickMode === 'none'
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span>Explorar</span>
          </button>

          <button
            type="button"
            onClick={() => setPickMode(pickMode === 'origin' ? 'none' : 'origin')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              pickMode === 'origin'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Marcar Partida no Mapa</span>
          </button>

          <button
            type="button"
            onClick={() => setPickMode(pickMode === 'destination' ? 'none' : 'destination')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              pickMode === 'destination'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Marcar Destino no Mapa</span>
          </button>
        </div>
      )}

      {/* Pick Mode Helper Hint */}
      {pickMode !== 'none' && !isNavigating && (
        <div className="absolute top-16 left-4 z-[400] px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold shadow-lg animate-in fade-in duration-150">
          Clique em qualquer ponto do mapa para definir {pickMode === 'origin' ? 'a partida' : 'o destino'}
        </div>
      )}

      {/* Floating Defesa Civil Alert */}
      {activeAlertZone && (
        <div className="absolute top-4 left-4 right-16 sm:right-auto sm:w-96 z-[410] rounded-2xl bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-800 shadow-2xl p-4 space-y-2.5 animate-in slide-in-from-top-4 duration-200">
          <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Alerta Defesa Civil SP</span>
            </span>
            <button
              onClick={() => onDismissAlert(activeAlertZone.id)}
              className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              aria-label="Fechar alerta"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div>
            <h4 className="text-xs font-bold">{activeAlertZone.neighborhood}</h4>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5 leading-relaxed">
              {activeAlertZone.defenseCivilTip}
            </p>
          </div>
          {selectedRoute.type !== 'segura' && (
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={onAcceptReroute}
                className="flex-1 py-1.5 px-3 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Desviar para Rota Segura</span>
              </button>
              <button
                onClick={() => onDismissAlert(activeAlertZone.id)}
                className="py-1.5 px-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-semibold"
              >
                Dispensar
              </button>
            </div>
          )}
        </div>
      )}

      {/* Bottom Floating Navigation HUD */}
      <div className="absolute bottom-4 left-4 right-4 z-[400] bg-white/95 dark:bg-neutral-950/92 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-2xl text-neutral-900 dark:text-white space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2.5">
              <span className="text-xl font-extrabold font-mono">{remainingMin} min</span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                ({remainingKm} km)
              </span>
              {isNavigating && (
                <span className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-[11px] font-mono font-bold">
                  {speedKmH} km/h
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 truncate mt-0.5">
              {isNavigating ? `Via atual: ${currentStreet}` : selectedRoute.name}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleSimSpeed(simSpeed === '1x' ? '2x' : '1x')}
              className="px-2.5 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[11px] font-mono font-bold flex items-center gap-1 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
              title="Alternar velocidade de simulação"
            >
              <Gauge className="w-3.5 h-3.5" />
              <span>{simSpeed === '1x' ? '1x' : '2x'}</span>
            </button>

            {!isNavigating ? (
              <button
                onClick={onStart}
                className="px-4 py-2 rounded-xl bg-neutral-950 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-950 font-bold text-xs shadow-sm flex items-center gap-2 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Iniciar Trajeto</span>
              </button>
            ) : isPaused ? (
              <button
                onClick={onResume}
                className="px-4 py-2 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 font-bold text-xs flex items-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Retomar</span>
              </button>
            ) : (
              <button
                onClick={onPause}
                className="px-4 py-2 rounded-xl bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-950 font-bold text-xs flex items-center gap-2"
              >
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pausar</span>
              </button>
            )}

            <button
              onClick={onReset}
              className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
              title="Reiniciar rota"
              aria-label="Reiniciar rota"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isNavigating && (
          <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-700 rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
