import React, { useState } from 'react';
import {
  CornerUpRight,
  Volume2,
  VolumeX,
  Search,
  X,
  ShieldAlert,
  ShieldCheck,
  Navigation,
  Compass,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Layers,
  ChevronUp,
  MapPin,
  Clock,
  ArrowRight
} from 'lucide-react';
import { DangerZone, NavigationRoute, IncidentReport } from '../types';
import { NavigationMap } from './NavigationMap';
import { SafetyScoreBadge } from './SafetyScoreBadge';

interface MobilePhoneSimulatorProps {
  currentPosition: [number, number];
  selectedRoute: NavigationRoute;
  dangerZones: DangerZone[];
  incidents: IncidentReport[];
  isNavigating: boolean;
  isPaused: boolean;
  speedKmH: number;
  progressPercentage: number;
  activeAlertZone: DangerZone | null;
  nearestZone: { zone: DangerZone; distance: number } | null;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onAcceptReroute: () => void;
  onDismissAlert: (id: string) => void;
  onOpenReportModal: () => void;
}

export const MobilePhoneSimulator: React.FC<MobilePhoneSimulatorProps> = ({
  currentPosition,
  selectedRoute,
  dangerZones,
  incidents,
  isNavigating,
  isPaused,
  speedKmH,
  progressPercentage,
  activeAlertZone,
  nearestZone,
  voiceEnabled,
  onToggleVoice,
  onStart,
  onPause,
  onResume,
  onReset,
  onAcceptReroute,
  onDismissAlert,
  onOpenReportModal,
}) => {
  const [showNotification, setShowNotification] = useState<boolean>(true);
  const [bottomSheetExpanded, setBottomSheetExpanded] = useState<boolean>(false);

  const isSafeRoute = selectedRoute.type === 'segura';

  return (
    <div className="flex flex-col items-center justify-center w-full py-4">
      {/* Smartphone Outer Chassis Frame */}
      <div className="relative w-full max-w-[390px] sm:max-w-[410px] h-[780px] sm:h-[820px] rounded-[50px] bg-slate-900 border-[8px] border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.1)] overflow-hidden flex flex-col select-none ring-1 ring-slate-700/60">
        
        {/* Top Speaker / Dynamic Island / Front Camera */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center w-28 h-5 bg-black rounded-full shadow-inner">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800 mr-2"></div>
          <div className="w-10 h-1.5 rounded-full bg-slate-950"></div>
        </div>

        {/* System Status Bar */}
        <div className="relative z-40 w-full px-7 pt-3 pb-1 flex items-center justify-between text-[11px] font-semibold text-slate-200 bg-slate-950/80 backdrop-blur-md">
          <span>21:30</span>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[10px] tracking-wider uppercase font-mono font-bold">5G</span>
            {/* Battery Icon */}
            <div className="w-5 h-2.5 rounded-sm border border-current p-0.5 flex items-center">
              <div className="w-full h-full bg-current rounded-2xs"></div>
            </div>
          </div>
        </div>

        {/* Screen Content Wrapper */}
        <div className="relative flex-1 w-full h-full overflow-hidden flex flex-col bg-slate-950">

          {/* GOOGLE MAPS NAVIGATION HEADER (Turn by Turn Maneuver Card) */}
          <div className="absolute top-0 left-0 right-0 z-30 p-2.5 space-y-2 pointer-events-auto">
            <div className="bg-[#0f5132] border border-[#146c43] text-white rounded-2xl p-3 shadow-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <CornerUpRight className="w-6 h-6 text-white stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-black tracking-tight">Em 200 m</span>
                    <span className="text-xs text-emerald-200 font-medium">depois siga em frente</span>
                  </div>
                  <p className="text-xs font-semibold text-white/90 line-clamp-1">
                    {activeAlertZone ? activeAlertZone.neighborhood : 'Av. Rio Branco x Rua dos Gusmões'}
                  </p>
                </div>
              </div>

              {/* Navigation Header Controls */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={onToggleVoice}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  title="Som"
                >
                  {voiceEnabled ? (
                    <Volume2 className="w-4 h-4 text-white" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-white/60" />
                  )}
                </button>
                <button
                  onClick={onReset}
                  className="p-2 rounded-full bg-black/20 hover:bg-black/30 transition-colors"
                  title="Encerrar navegação"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* CRITICAL GEOFENCE ALERT NOTIFICATION (Drops down when inside danger area) */}
            {activeAlertZone && showNotification && (
              <div className="animate-in slide-in-from-top-4 duration-300 rounded-2xl bg-slate-900 border-2 border-red-500 shadow-2xl p-3.5 space-y-2.5 text-slate-100">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30">
                      <ShieldAlert className="w-4 h-4 animate-pulse" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 block font-mono">
                        ALERTA DEFESA CIVIL SP &bull; AGORA
                      </span>
                      <h4 className="text-xs font-bold text-white">
                        {activeAlertZone.title}
                      </h4>
                    </div>
                  </div>
                  <button
                    onClick={() => onDismissAlert(activeAlertZone.id)}
                    className="p-1 rounded text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200">
                  <strong className="text-amber-300">Instrução:</strong> {activeAlertZone.defenseCivilTip}
                </div>

                {!isSafeRoute && (
                  <button
                    onClick={onAcceptReroute}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Desviar para Rota Segura (+4 min)</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* INTERACTIVE MAP CONTAINER */}
          <div className="relative flex-1 w-full h-full">
            <NavigationMap
              currentPosition={currentPosition}
              selectedRoute={selectedRoute}
              dangerZones={dangerZones}
              incidents={incidents}
              isNavigating={isNavigating}
            />

            {/* Google Maps floating speed indicator (Bottom-Left) */}
            <div className="absolute bottom-32 left-3 z-[400] flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-slate-950/90 border border-slate-700 shadow-xl flex flex-col items-center justify-center backdrop-blur-md">
                <span className="text-sm font-black font-mono text-white leading-none">
                  {speedKmH}
                </span>
                <span className="text-[9px] uppercase font-mono text-slate-400">km/h</span>
              </div>
              <div className="mt-1 w-8 h-4 rounded-full bg-red-600 text-white font-black text-[9px] flex items-center justify-center shadow">
                50
              </div>
            </div>

            {/* Floating Quick Action Buttons (Bottom-Right) */}
            <div className="absolute bottom-32 right-3 z-[400] flex flex-col gap-2">
              <button
                onClick={onOpenReportModal}
                className="w-10 h-10 rounded-full bg-slate-900/90 border border-slate-700 shadow-lg flex items-center justify-center text-amber-400 hover:text-amber-300 transition-colors"
                title="Reportar ocorrência"
              >
                <AlertTriangle className="w-5 h-5" />
              </button>
              <button
                onClick={isSafeRoute ? undefined : onAcceptReroute}
                className={`w-10 h-10 rounded-full border shadow-lg flex items-center justify-center transition-colors ${
                  isSafeRoute
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                    : 'bg-slate-900/90 text-emerald-400 border-slate-700 hover:bg-slate-800'
                }`}
                title="Alternar para rota segura"
              >
                <ShieldCheck className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* GOOGLE MAPS BOTTOM NAVIGATION SHEET */}
          <div className="relative z-30 bg-slate-900 border-t border-slate-800 p-4 space-y-3 shadow-2xl">
            {/* Drag Handle */}
            <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto -mt-1"></div>

            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black font-mono text-emerald-400">
                    {selectedRoute.durationMin} min
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    ({selectedRoute.distanceKm} km)
                  </span>
                </div>
                <div className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Chegada prevista às <strong>19:52</strong></span>
                </div>
              </div>

              <SafetyScoreBadge score={selectedRoute.safetyScore} size="sm" />
            </div>

            {/* Route Status Strip */}
            <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isSafeRoute ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`}></span>
                <span className="font-semibold text-slate-200">
                  {selectedRoute.name}
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {progressPercentage}% concluído
              </span>
            </div>

            {/* Primary Navigation Actions */}
            <div className="flex items-center gap-2 pt-1">
              {!isNavigating ? (
                <button
                  onClick={onStart}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Iniciar Trajeto</span>
                </button>
              ) : isPaused ? (
                <button
                  onClick={onResume}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Retomar</span>
                </button>
              ) : (
                <button
                  onClick={onPause}
                  className="flex-1 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pausar</span>
                </button>
              )}

              <button
                onClick={onReset}
                className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                title="Reiniciar rota"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bottom Home Indicator Bar */}
          <div className="w-full pb-1.5 pt-0.5 bg-slate-900 flex justify-center">
            <div className="w-32 h-1 bg-slate-600 rounded-full"></div>
          </div>

        </div>
      </div>

      {/* External Subtitle / Simulator Instructions */}
      <div className="mt-4 text-center max-w-sm text-xs text-slate-400 space-y-1">
        <p className="font-semibold text-slate-200">
          Protótipo Mobile &bull; Interface Google Maps com Alertas Defesa Civil SP
        </p>
        <p className="text-[11px] text-slate-500">
          Ao clicar em &ldquo;Iniciar Trajeto&rdquo;, o veículo se desloca no mapa e aciona a notificação de emergência ao ingressar no raio da área crítica.
        </p>
      </div>
    </div>
  );
};
