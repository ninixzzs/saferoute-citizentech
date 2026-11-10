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
  Clock,
  MapPin,
  Mic,
  Crosshair,
  Bell
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
  const [simulatedAlertActive, setSimulatedAlertActive] = useState<boolean>(false);
  const isSafeRoute = selectedRoute.type === 'segura';

  // Active danger zone: either from real geofence or user manual test trigger
  const effectiveAlert = activeAlertZone || (simulatedAlertActive ? dangerZones[0] : null);

  return (
    <div className="flex flex-col items-center justify-center w-full py-2">
      {/* Smartphone Chassis Frame */}
      <div className="relative w-full max-w-[390px] h-[780px] rounded-[52px] bg-[#101318] border-[10px] border-[#222834] shadow-[0_30px_70px_-15px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.08)] overflow-hidden flex flex-col select-none ring-1 ring-slate-800">
        
        {/* Dynamic Island / Top Camera & Speaker Pill */}
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center w-28 h-6 bg-black rounded-full shadow-md pointer-events-none">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800 mr-2.5"></div>
          <div className="w-9 h-1.5 rounded-full bg-slate-950"></div>
        </div>

        {/* System Status Bar */}
        <div className="relative z-40 w-full px-8 pt-3 pb-1 flex items-center justify-between text-[11px] font-semibold text-slate-800 bg-white/70 backdrop-blur-md">
          <span className="font-mono">21:30</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono font-bold tracking-tight">5G</span>
            {/* Battery outline */}
            <div className="w-5 h-2.5 rounded-xs border border-slate-700 p-0.5 flex items-center">
              <div className="w-full h-full bg-slate-800 rounded-2xs"></div>
            </div>
          </div>
        </div>

        {/* SCREEN INNER VIEWPORT */}
        <div className="relative flex-1 w-full h-full overflow-hidden bg-[#e8eaed]">

          {/* 1. MAP BACKGROUND LAYER (Fills 100% of phone screen) */}
          <div className="absolute inset-0 w-full h-full z-0">
            <NavigationMap
              currentPosition={currentPosition}
              selectedRoute={selectedRoute}
              dangerZones={dangerZones}
              incidents={incidents}
              isNavigating={isNavigating}
              className="w-full h-full min-h-full border-0 rounded-none shadow-none"
              defaultTheme="google-light"
              showLegend={false}
            />
          </div>

          {/* 2. TOP OVERLAY LAYER (Google Maps Navigation Header OR Search Bar) */}
          <div className="absolute top-0 left-0 right-0 z-30 p-2.5 space-y-2 pointer-events-auto">
            {isNavigating ? (
              /* Turn-by-Turn Maneuver Green Card */
              <div className="bg-[#0f5132] border border-[#146c43] text-white rounded-2xl p-3 shadow-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                    <CornerUpRight className="w-6 h-6 text-white stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-black tracking-tight">Em 200 m</span>
                      <span className="text-xs text-emerald-200 font-medium">vire à direita</span>
                    </div>
                    <p className="text-xs font-semibold text-white/95 line-clamp-1">
                      {effectiveAlert ? effectiveAlert.neighborhood : 'Rua dos Gusmões x Av. Rio Branco'}
                    </p>
                  </div>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={onToggleVoice}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                    title="Voz"
                  >
                    {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-white/60" />}
                  </button>
                  <button
                    onClick={onReset}
                    className="p-2 rounded-full bg-black/25 hover:bg-black/40 text-white transition-colors"
                    title="Encerrar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* Google Maps Idle Search Bar */
              <div className="bg-white/95 backdrop-blur-md rounded-2xl p-2.5 px-3.5 shadow-lg border border-slate-200 flex items-center justify-between gap-2 text-slate-700">
                <div className="flex items-center gap-2.5 flex-1">
                  <Search className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="text-xs font-medium text-slate-500">
                    Para onde você quer ir? (São Paulo)
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Mic className="w-4 h-4 text-slate-400" />
                  <div className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center shadow-xs">
                    N
                  </div>
                </div>
              </div>
            )}

            {/* 3. DYNAMIC HAZARD HEADS-UP NOTIFICATION (Alert Dropdown on Phone Screen) */}
            {effectiveAlert && (
              <div className="animate-in slide-in-from-top-4 duration-300 rounded-2xl bg-white border-2 border-red-600 shadow-2xl p-3.5 space-y-2 text-slate-900">
                <div className="flex items-start justify-between gap-2 border-b border-red-100 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-red-100 text-red-600">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 block font-mono">
                        ALERTA DEFESA CIVIL SP &bull; ATENÇÃO
                      </span>
                      <h4 className="text-xs font-extrabold text-slate-900 leading-tight">
                        {effectiveAlert.title}
                      </h4>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (activeAlertZone) onDismissAlert(activeAlertZone.id);
                      setSimulatedAlertActive(false);
                    }}
                    className="p-1 rounded text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-slate-800 leading-relaxed">
                  <strong className="text-amber-800">Dica prática:</strong> {effectiveAlert.defenseCivilTip}
                </div>

                {!isSafeRoute && (
                  <button
                    onClick={() => {
                      onAcceptReroute();
                      setSimulatedAlertActive(false);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Desviar para Rota Segura (+4 min)</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 4. GOOGLE MAPS FLOATING CONTROLS (Middle Screen) */}
          <div className="absolute right-3 top-28 z-20 flex flex-col gap-2">
            <button
              onClick={() => setSimulatedAlertActive(!simulatedAlertActive)}
              className={`w-10 h-10 rounded-full shadow-lg border flex items-center justify-center transition-all ${
                effectiveAlert
                  ? 'bg-red-600 text-white border-red-700 ring-2 ring-red-400/50'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              title="Disparar teste de alerta de risco"
            >
              <Bell className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenReportModal}
              className="w-10 h-10 rounded-full bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-lg flex items-center justify-center transition-colors"
              title="Reportar ocorrência"
            >
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </button>
          </div>

          {/* Speedometer (Bottom-Left above sheet) */}
          {isNavigating && (
            <div className="absolute bottom-36 left-3 z-20 flex flex-col items-center pointer-events-none">
              <div className="w-12 h-12 rounded-full bg-white/95 border border-slate-300 shadow-xl flex flex-col items-center justify-center backdrop-blur-md">
                <span className="text-sm font-black font-mono text-slate-900 leading-none">
                  {speedKmH}
                </span>
                <span className="text-[9px] uppercase font-mono text-slate-500">km/h</span>
              </div>
              <div className="mt-1 w-8 h-4 rounded-full bg-red-600 text-white font-black text-[9px] flex items-center justify-center shadow">
                50
              </div>
            </div>
          )}

          {/* 5. BOTTOM NAVIGATION SHEET (Signature Google Maps Navigation Footer) */}
          <div className="absolute bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 p-3.5 px-4 space-y-2.5 shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.15)] text-slate-900">
            {/* Grab handle */}
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto -mt-1"></div>

            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black font-mono text-[#0f9d58]">
                    {selectedRoute.durationMin} min
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    ({selectedRoute.distanceKm} km)
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Chegada prevista às <strong>19:54</strong></span>
                </div>
              </div>

              <SafetyScoreBadge score={selectedRoute.safetyScore} size="sm" />
            </div>

            {/* Trajeto label strip */}
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800 line-clamp-1">
                {selectedRoute.name}
              </span>
              <span className="text-[11px] font-mono text-slate-500 shrink-0">
                {progressPercentage}%
              </span>
            </div>

            {/* Main Action buttons */}
            <div className="flex items-center gap-2 pt-0.5">
              {!isNavigating ? (
                <button
                  onClick={onStart}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white font-extrabold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Iniciar Trajeto</span>
                </button>
              ) : isPaused ? (
                <button
                  onClick={onResume}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#0f9d58] hover:bg-[#0c8046] text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Retomar</span>
                </button>
              ) : (
                <button
                  onClick={onPause}
                  className="flex-1 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pausar</span>
                </button>
              )}

              <button
                onClick={onReset}
                className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors"
                title="Reiniciar rota"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Home indicator bar at bottom */}
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-400 rounded-full z-40"></div>
        </div>
      </div>

      {/* Helper text */}
      <div className="mt-3 text-center max-w-sm text-xs text-slate-400 space-y-1">
        <p className="font-semibold text-slate-200">
          Interface Google Maps com Alertas da Defesa Civil SP
        </p>
        <p className="text-[11px] text-slate-500">
          Clique no botão de sino no celular ou em &ldquo;Iniciar Trajeto&rdquo; para simular o alerta de perigo em tempo real.
        </p>
      </div>
    </div>
  );
};
