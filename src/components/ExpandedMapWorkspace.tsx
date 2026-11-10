import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  ShieldCheck,
  X,
  Gauge,
  CornerUpRight,
  CornerUpLeft,
  ArrowUp,
  Navigation,
} from 'lucide-react';
import { DangerZone, IncidentReport, NavigationRoute } from '../types';
import { LocationSuggestion } from '../services/routingService';
import { NavigationMap } from './NavigationMap';

interface ExpandedMapWorkspaceProps {
  currentPosition: [number, number];
  nextPosition?: [number, number];
  selectedRoute: NavigationRoute;
  allRoutes: NavigationRoute[];
  onSelectRoute: (route: NavigationRoute) => void;
  originLocation: LocationSuggestion;
  destinationLocation: LocationSuggestion;
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
  focusPoint?: { coords: [number, number]; ts: number } | null;
  simSpeed: '1x' | '2x';
  onToggleSimSpeed: (speed: '1x' | '2x') => void;
}

export const ExpandedMapWorkspace: React.FC<ExpandedMapWorkspaceProps> = ({
  currentPosition,
  nextPosition,
  selectedRoute,
  allRoutes,
  onSelectRoute,
  originLocation,
  destinationLocation,
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
  focusPoint = null,
  simSpeed,
  onToggleSimSpeed,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isFullscreen]);

  const remainingFactor = Math.max(0, 1 - progressPercentage / 100);
  const remainingMin = isNavigating
    ? Math.max(1, Math.round(selectedRoute.durationMin * remainingFactor))
    : selectedRoute.durationMin;
  const remainingKm = isNavigating
    ? Math.max(0.1, Number((selectedRoute.distanceKm * remainingFactor).toFixed(1)))
    : selectedRoute.distanceKm;

  const steps = selectedRoute.steps || [];
  const stepIdx =
    steps.length > 0
      ? Math.min(steps.length - 1, Math.floor((progressPercentage / 100) * steps.length))
      : 0;
  const activeStep = steps[stepIdx];

  const streetNames = selectedRoute.streetNames || [];
  const streetIdx =
    streetNames.length > 0
      ? Math.min(streetNames.length - 1, Math.floor((progressPercentage / 100) * streetNames.length))
      : 0;
  const currentStreet = activeStep?.street || streetNames[streetIdx] || selectedRoute.name;

  const renderTurnIcon = (modifier?: string) => {
    if (modifier?.includes('left')) return <CornerUpLeft className="w-5 h-5 text-white stroke-[2.5]" />;
    if (modifier?.includes('right')) return <CornerUpRight className="w-5 h-5 text-white stroke-[2.5]" />;
    return <ArrowUp className="w-5 h-5 text-white stroke-[2.5]" />;
  };

  return (
    <div
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 w-screen h-screen bg-neutral-950 select-none'
          : 'relative w-full h-[58vh] min-h-[420px] sm:h-[580px] lg:h-[680px] rounded-2xl sm:rounded-3xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-2xl bg-neutral-900 select-none'
      }
    >
      {/* Main Interactive Map */}
      <NavigationMap
        currentPosition={currentPosition}
        nextPosition={nextPosition}
        selectedRoute={selectedRoute}
        allRoutes={allRoutes}
        onSelectRoute={onSelectRoute}
        dangerZones={dangerZones}
        incidents={incidents}
        isNavigating={isNavigating}
        speedKmH={speedKmH}
        focusPoint={focusPoint}
        topControlOffsetClass="top-4"
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        className="w-full h-full"
      />

      {/* Top-Left Floating Header (Stable height, isolated from map drag) */}
      <div
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        className="select-none pointer-events-auto"
      >
        {isNavigating ? (
          <div className="absolute top-4 left-4 right-28 sm:right-auto sm:w-[360px] z-[400] bg-neutral-950/92 backdrop-blur-xl text-white rounded-2xl p-3 shadow-2xl border border-white/15 flex items-center gap-3 h-[64px]">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-md">
              {renderTurnIcon(activeStep?.modifier)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-bold leading-tight truncate">
                  {activeStep ? activeStep.instruction : 'Siga em frente'}
                </span>
                {activeStep?.distanceMeters ? (
                  <span className="text-[11px] font-mono tabular-nums text-neutral-300 shrink-0">
                    ({activeStep.distanceMeters} m)
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-neutral-300 truncate mt-0.5">{currentStreet}</p>
            </div>
          </div>
        ) : (
          <div className="hidden sm:flex absolute top-4 left-4 z-[400] max-w-[380px] items-center gap-2 bg-white/95 dark:bg-neutral-950/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-lg text-xs text-neutral-800 dark:text-neutral-200">
            <Navigation className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="truncate font-medium">
              {originLocation.name} &rarr; <strong>{destinationLocation.name}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Floating Defesa Civil Alert */}
      {activeAlertZone && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className="absolute top-22 left-4 right-16 sm:right-auto sm:w-96 z-[410] rounded-2xl bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-800 shadow-2xl p-4 space-y-2.5 animate-in slide-in-from-top-4 duration-200 select-none"
        >
          <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Alerta Defesa Civil SP</span>
            </span>
            <button
              type="button"
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
                type="button"
                onClick={onAcceptReroute}
                className="flex-1 py-1.5 px-3 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Desviar para Rota Segura</span>
              </button>
              <button
                type="button"
                onClick={() => onDismissAlert(activeAlertZone.id)}
                className="py-1.5 px-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-semibold"
              >
                Dispensar
              </button>
            </div>
          )}
        </div>
      )}

      {/* Bottom Floating Navigation HUD (Fixed height & tabular-nums so text never jumps) */}
      <div
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        className="absolute bottom-4 left-4 right-4 z-[400] bg-white/95 dark:bg-neutral-950/92 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 rounded-2xl p-3.5 px-4 shadow-2xl text-neutral-900 dark:text-white select-none"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap tabular-nums">
              <span className="text-xl font-extrabold font-mono min-w-[64px]">
                {remainingMin} min
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono min-w-[54px]">
                ({remainingKm} km)
              </span>
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 hidden sm:inline">
                &bull; Chegada{' '}
                <strong className="text-neutral-900 dark:text-white font-mono">
                  {new Date(Date.now() + remainingMin * 60000).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </strong>
              </span>
              <span
                className={`px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-[11px] font-mono font-bold min-w-[66px] text-center transition-opacity ${
                  isNavigating ? 'opacity-100' : 'opacity-0 pointer-events-none hidden sm:inline-block'
                }`}
              >
                {speedKmH} km/h
              </span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 truncate mt-0.5 h-4">
              {isNavigating ? `Via atual: ${currentStreet}` : selectedRoute.name}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
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
                type="button"
                onClick={onStart}
                className="px-4 py-2 rounded-xl bg-neutral-950 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-950 font-bold text-xs shadow-sm flex items-center gap-2 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Iniciar Trajeto</span>
              </button>
            ) : isPaused ? (
              <button
                type="button"
                onClick={onResume}
                className="px-4 py-2 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 font-bold text-xs flex items-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Retomar</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onPause}
                className="px-4 py-2 rounded-xl bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-950 font-bold text-xs flex items-center gap-2"
              >
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pausar</span>
              </button>
            )}

            <button
              type="button"
              onClick={onReset}
              className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
              title="Reiniciar rota"
              aria-label="Reiniciar rota"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Always reserve subtle progress slot so HUD height never shifts when navigating */}
        <div className="w-full h-1 mt-2.5 bg-neutral-200/70 dark:bg-neutral-800/80 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-700 rounded-full"
            style={{ width: `${isNavigating ? progressPercentage : 0}%` }}
          />
        </div>
      </div>
    </div>
  );
};
