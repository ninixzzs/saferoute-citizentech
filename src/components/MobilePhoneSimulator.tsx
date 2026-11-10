import React, { useState } from 'react';
import {
  CornerUpRight,
  Volume2,
  VolumeX,
  Search,
  X,
  ShieldAlert,
  ShieldCheck,
  Play,
  Pause,
  RotateCcw,
  Clock,
  Mic,
  Bell,
  Plus
} from 'lucide-react';
import { DangerZone, NavigationRoute, IncidentReport } from '../types';
import { NavigationMap } from './NavigationMap';

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
  // Test alert state
  const [manualAlert, setManualAlert] = useState<boolean>(false);

  const effectiveAlert = activeAlertZone || (manualAlert ? dangerZones[0] : null);
  const isSafe = selectedRoute.type === 'segura';

  return (
    <div className="flex flex-col items-center justify-center w-full py-4">
      {/* Smartphone Hardware Frame */}
      <div className="relative w-full max-w-[380px] h-[760px] rounded-[48px] bg-black border-[10px] border-[#1f1f1f] shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col select-none ring-1 ring-neutral-800">
        
        {/* Dynamic Island / Speaker Pill */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center w-28 h-5 bg-black rounded-full pointer-events-none">
          <div className="w-2.5 h-2.5 rounded-full bg-[#171717] mr-2"></div>
          <div className="w-10 h-1 rounded-full bg-[#1c1c1c]"></div>
        </div>

        {/* System Status Bar */}
        <div className="relative z-40 w-full px-7 pt-2.5 pb-1 flex items-center justify-between text-[11px] font-semibold text-neutral-800 bg-white/80 backdrop-blur-md border-b border-neutral-200">
          <span className="font-mono">21:30</span>
          <div className="flex items-center gap-1.5 font-mono text-[10px]">
            <span>5G</span>
            <div className="w-4 h-2 rounded-xs border border-neutral-800 p-0.5 flex items-center">
              <div className="w-full h-full bg-neutral-800"></div>
            </div>
          </div>
        </div>

        {/* Screen Viewport */}
        <div className="relative flex-1 w-full h-full overflow-hidden bg-neutral-100">
          
          {/* 1. Map Layer (100% of the screen) */}
          <div className="absolute inset-0 w-full h-full z-0">
            <NavigationMap
              currentPosition={currentPosition}
              selectedRoute={selectedRoute}
              dangerZones={dangerZones}
              incidents={incidents}
              isNavigating={isNavigating}
              className="w-full h-full border-0 rounded-none shadow-none"
            />
          </div>

          {/* 2. Top Google Maps Navigation Header OR Search Bar */}
          <div className="absolute top-0 left-0 right-0 z-30 p-2.5 space-y-2 pointer-events-auto">
            {isNavigating ? (
              /* Navigation maneuver card */
              <div className="bg-[#1b5e20] text-white rounded-xl p-3 shadow-md flex items-center justify-between gap-3 border border-[#2e7d32]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                    <CornerUpRight className="w-5 h-5 text-white stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-bold leading-tight">Em 200 m</span>
                      <span className="text-[11px] text-neutral-200">vire à direita</span>
                    </div>
                    <p className="text-xs font-medium text-white/90 line-clamp-1">
                      {effectiveAlert ? effectiveAlert.neighborhood : 'Rua dos Gusmões &bull; Santa Ifigênia'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={onToggleVoice}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                    title="Voz"
                  >
                    {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-white/50" />}
                  </button>
                  <button
                    onClick={onReset}
                    className="p-1.5 rounded-lg bg-black/20 hover:bg-black/30 text-white transition-colors"
                    title="Encerrar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* Idle Search Bar */
              <div className="bg-white rounded-xl p-2.5 px-3 shadow-md border border-neutral-200 flex items-center justify-between gap-2 text-neutral-800">
                <div className="flex items-center gap-2 flex-1">
                  <Search className="w-4 h-4 text-neutral-600 shrink-0" />
                  <span className="text-xs text-neutral-500 font-medium">
                    Pesquisar destino em São Paulo
                  </span>
                </div>
                <Mic className="w-4 h-4 text-neutral-400" />
              </div>
            )}

            {/* 3. NATIVE MOBILE SYSTEM NOTIFICATION (Simulates push notification message inside the phone) */}
            {effectiveAlert && (
              <div className="animate-in slide-in-from-top-3 duration-200 rounded-2xl bg-neutral-900/95 text-white border border-neutral-700 shadow-2xl p-3.5 space-y-2 backdrop-blur-md">
                {/* Notification App Header */}
                <div className="flex items-center justify-between text-[10px] text-neutral-400 border-b border-neutral-800 pb-1.5">
                  <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-neutral-300">
                    <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                    <span>Defesa Civil SP</span>
                    <span>&bull;</span>
                    <span className="font-normal lowercase">agora</span>
                  </div>
                  <button
                    onClick={() => {
                      if (activeAlertZone) onDismissAlert(activeAlertZone.id);
                      setManualAlert(false);
                    }}
                    className="text-neutral-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Message Title & Body */}
                <div>
                  <h4 className="text-xs font-bold text-white leading-tight">
                    Alerta de Segurança: {effectiveAlert.neighborhood}
                  </h4>
                  <p className="text-[11px] text-neutral-300 mt-1 leading-relaxed">
                    {effectiveAlert.defenseCivilTip}
                  </p>
                </div>

                {/* Action Button inside Message */}
                {!isSafe ? (
                  <div className="pt-1 flex items-center gap-2">
                    <button
                      onClick={() => {
                        onAcceptReroute();
                        setManualAlert(false);
                      }}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-white text-neutral-950 font-bold text-xs hover:bg-neutral-200 transition-colors"
                    >
                      Desviar para Rota Segura (+4 min)
                    </button>
                    <button
                      onClick={() => {
                        if (activeAlertZone) onDismissAlert(activeAlertZone.id);
                        setManualAlert(false);
                      }}
                      className="py-1.5 px-2.5 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white text-xs transition-colors"
                    >
                      Dispensar
                    </button>
                  </div>
                ) : (
                  <div className="text-[11px] text-emerald-400 font-medium">
                    Rota Segura ativa. Você está desviando desta área.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 4. Quick Action Floating Buttons (Right Side) */}
          <div className="absolute right-3 top-24 z-20 flex flex-col gap-2 pointer-events-auto">
            {/* Test Trigger Button */}
            <button
              onClick={() => setManualAlert(!manualAlert)}
              className={`w-9 h-9 rounded-full shadow-md border flex items-center justify-center transition-colors ${
                effectiveAlert
                  ? 'bg-neutral-900 text-red-400 border-neutral-700'
                  : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100'
              }`}
              title="Testar notificação de risco"
            >
              <Bell className="w-4 h-4" />
            </button>

            {/* Report Button */}
            <button
              onClick={onOpenReportModal}
              className="w-9 h-9 rounded-full bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200 shadow-md flex items-center justify-center transition-colors"
              title="Registrar ocorrência"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Speedometer (Bottom-Left) */}
          {isNavigating && (
            <div className="absolute bottom-32 left-3 z-20 flex flex-col items-center pointer-events-none">
              <div className="w-11 h-11 rounded-full bg-white border border-neutral-300 shadow-md flex flex-col items-center justify-center">
                <span className="text-xs font-black font-mono text-neutral-900 leading-none">
                  {speedKmH}
                </span>
                <span className="text-[8px] uppercase font-mono text-neutral-500">km/h</span>
              </div>
            </div>
          )}

          {/* 5. Bottom Navigation Sheet */}
          <div className="absolute bottom-0 left-0 right-0 z-30 bg-white border-t border-neutral-200 p-3.5 px-4 space-y-2.5 shadow-lg text-neutral-900">
            {/* Handle */}
            <div className="w-8 h-1 bg-neutral-300 rounded-full mx-auto -mt-1"></div>

            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold font-mono text-neutral-900">
                    {selectedRoute.durationMin} min
                  </span>
                  <span className="text-xs text-neutral-500 font-mono">
                    ({selectedRoute.distanceKm} km)
                  </span>
                </div>
                <div className="text-[11px] text-neutral-500 flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-3 h-3 text-neutral-400" />
                  <span>Chegada: <strong>19:54</strong></span>
                </div>
              </div>

              {/* Safety Score Tag */}
              <span className={`px-2 py-1 rounded-md text-xs font-mono font-bold ${
                isSafe
                  ? 'bg-neutral-100 text-neutral-900 border border-neutral-300'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                Segurança: {selectedRoute.safetyScore}/100
              </span>
            </div>

            {/* Route Name */}
            <div className="text-xs text-neutral-600 truncate border-t border-neutral-100 pt-1.5">
              {selectedRoute.name}
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center gap-2 pt-0.5">
              {!isNavigating ? (
                <button
                  onClick={onStart}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs shadow transition-colors flex items-center justify-center gap-2"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Iniciar Trajeto</span>
                </button>
              ) : isPaused ? (
                <button
                  onClick={onResume}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Retomar</span>
                </button>
              ) : (
                <button
                  onClick={onPause}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2"
                >
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pausar</span>
                </button>
              )}

              <button
                onClick={onReset}
                className="p-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-300 transition-colors"
                title="Reiniciar rota"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bottom Home Indicator */}
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-28 h-1 bg-neutral-400 rounded-full z-40"></div>
        </div>
      </div>

      {/* Helper text below phone */}
      <div className="mt-3 text-center max-w-sm text-xs text-neutral-400 space-y-0.5">
        <p className="font-medium text-neutral-300">
          Protótipo de Navegação &bull; Defesa Civil SP
        </p>
        <p className="text-[11px] text-neutral-500">
          A notificação de perigo desce na tela automaticamente ao entrar na zona crítica ou via botão de teste.
        </p>
      </div>
    </div>
  );
};
