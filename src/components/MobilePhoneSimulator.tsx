import React, { useState, useEffect, useRef } from 'react';
import {
  CornerUpRight,
  Volume2,
  VolumeX,
  Search,
  X,
  ShieldCheck,
  Play,
  Pause,
  RotateCcw,
  Clock,
  MessageSquare,
  ArrowRight,
  Plus,
  Loader2,
  MapPin,
  AlertTriangle
} from 'lucide-react';
import { DangerZone, NavigationRoute, IncidentReport } from '../types';
import { LocationSuggestion, POPULAR_DESTINATIONS } from '../services/routingService';
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
  onSearchDestination?: (address: string) => Promise<any> | void;
  isCalculatingRoute?: boolean;
  currentDestination?: LocationSuggestion | null;
  onResetPresetRoutes?: () => void;
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
  onSearchDestination,
  isCalculatingRoute = false,
  currentDestination = null,
  onResetPresetRoutes,
}) => {
  const [phoneSearchInput, setPhoneSearchInput] = useState<string>('');
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [visibleAlert, setVisibleAlert] = useState<DangerZone | null>(null);

  const autoDismissTimerRef = useRef<number | null>(null);

  // Sync phone input when current destination changes
  useEffect(() => {
    if (currentDestination) {
      setPhoneSearchInput(currentDestination.name);
    }
  }, [currentDestination]);

  // Handle new incoming alert zone
  useEffect(() => {
    if (activeAlertZone) {
      setVisibleAlert(activeAlertZone);

      if (autoDismissTimerRef.current) clearTimeout(autoDismissTimerRef.current);
      // Auto dismiss notification after 8 seconds so it never blocks the map
      autoDismissTimerRef.current = window.setTimeout(() => {
        setVisibleAlert(null);
      }, 8000);
    } else {
      setVisibleAlert(null);
    }

    return () => {
      if (autoDismissTimerRef.current) clearTimeout(autoDismissTimerRef.current);
    };
  }, [activeAlertZone]);

  const handleDismiss = () => {
    if (visibleAlert) {
      onDismissAlert(visibleAlert.id);
    }
    setVisibleAlert(null);
    if (autoDismissTimerRef.current) clearTimeout(autoDismissTimerRef.current);
  };

  const handleAcceptRerouteAndClose = () => {
    onAcceptReroute();
    handleDismiss();
  };

  const handlePhoneSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!phoneSearchInput.trim() || isNavigating || !onSearchDestination) return;
    setIsSearchFocused(false);
    onSearchDestination(phoneSearchInput.trim());
  };

  const handleSelectSuggestion = (suggestion: LocationSuggestion) => {
    setPhoneSearchInput(suggestion.name);
    setIsSearchFocused(false);
    if (onSearchDestination) {
      onSearchDestination(suggestion.address);
    }
  };

  const isSafe = selectedRoute.type === 'segura';

  return (
    <div className="flex flex-col items-center justify-center w-full py-2">
      {/* Smartphone Hardware Mockup */}
      <div className="relative w-full max-w-[390px] h-[750px] rounded-[50px] bg-black border-[10px] border-neutral-900 shadow-[0_25px_60px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col select-none ring-1 ring-neutral-800">
        
        {/* Dynamic Island / Speaker Pill */}
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center w-28 h-6 bg-black pointer-events-none rounded-full">
          <div className="w-2.5 h-2.5 rounded-full bg-neutral-900 border border-neutral-800 mr-2.5"></div>
          <div className="w-9 h-1 rounded-full bg-neutral-950"></div>
        </div>

        {/* Status Bar */}
        <div className="relative z-40 w-full px-7 pt-3 pb-1 flex items-center justify-between text-[11px] font-semibold text-neutral-800 bg-white/90 backdrop-blur-md border-b border-neutral-200">
          <span className="font-mono">21:30</span>
          <div className="flex items-center gap-1.5 font-mono text-[10px]">
            <span>5G</span>
            <div className="w-4 h-2 rounded-xs border border-neutral-800 p-0.5 flex items-center">
              <div className="w-full h-full bg-neutral-800"></div>
            </div>
          </div>
        </div>

        {/* Viewport Screen */}
        <div className="relative flex-1 w-full h-full overflow-hidden bg-neutral-950">

          {/* 1. Real Working Satellite & Vector Map (Interactive, Non-frozen) */}
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

          {/* 2. Top Header Overlay (Navigation or Search Bar) */}
          <div className="absolute top-0 left-0 right-0 z-30 p-2.5 space-y-2 pointer-events-auto">
            {isNavigating ? (
              /* Turn-by-Turn Header */
              <div className="bg-[#1b5e20]/95 backdrop-blur-md text-white rounded-2xl p-3 shadow-xl flex items-center justify-between gap-3 border border-[#2e7d32]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0 shadow-inner">
                    <CornerUpRight className="w-5 h-5 text-white stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-bold leading-tight">Em 200 m</span>
                      <span className="text-[11px] text-emerald-200">vire à direita</span>
                    </div>
                    <p className="text-xs font-medium text-white/95 line-clamp-1">
                      {selectedRoute.name}
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
                    className="p-1.5 rounded-lg bg-black/30 hover:bg-black/50 text-white transition-colors"
                    title="Encerrar navegação"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* Address Search & Route Bar */
              <div className="relative">
                <form
                  onSubmit={handlePhoneSearchSubmit}
                  className="bg-white/95 backdrop-blur-md rounded-2xl p-2.5 px-3.5 shadow-2xl border border-neutral-300 flex items-center justify-between gap-2 text-neutral-800 transition-all focus-within:ring-2 focus-within:ring-blue-500/40"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {isCalculatingRoute ? (
                      <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
                    ) : (
                      <Search className="w-4 h-4 text-neutral-600 shrink-0" />
                    )}
                    <input
                      type="text"
                      value={phoneSearchInput}
                      onChange={(e) => setPhoneSearchInput(e.target.value)}
                      onFocus={() => setIsSearchFocused(true)}
                      onBlur={() => setTimeout(() => setIsSearchFocused(false), 250)}
                      placeholder="Para onde vamos? Digite qualquer endereço..."
                      disabled={isNavigating || isCalculatingRoute}
                      className="w-full text-xs text-neutral-900 placeholder-neutral-500 bg-transparent outline-none truncate font-medium"
                    />
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {phoneSearchInput && (
                      <button
                        type="button"
                        onClick={() => {
                          setPhoneSearchInput('');
                          if (currentDestination && onResetPresetRoutes) {
                            onResetPresetRoutes();
                          }
                        }}
                        className="p-1 text-neutral-400 hover:text-neutral-700 rounded-full"
                        title="Limpar endereço"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={!phoneSearchInput.trim() || isCalculatingRoute}
                      className="p-1.5 rounded-xl bg-neutral-900 text-white disabled:opacity-40 hover:bg-neutral-800 transition-colors shadow-sm"
                      title="Traçar Rota"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>

                {/* Autocomplete Dropdown */}
                {isSearchFocused && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden z-50 max-h-56 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-2 border-b border-neutral-100 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-neutral-500 bg-neutral-50">
                      <span>Destinos populares</span>
                      <span className="text-[9px] lowercase font-normal">toque para traçar</span>
                    </div>
                    <div className="divide-y divide-neutral-100">
                      {POPULAR_DESTINATIONS.filter((d) =>
                        !phoneSearchInput.trim() ||
                        d.name.toLowerCase().includes(phoneSearchInput.toLowerCase()) ||
                        d.address.toLowerCase().includes(phoneSearchInput.toLowerCase())
                      ).map((dest) => (
                        <div
                          key={dest.name}
                          onMouseDown={() => handleSelectSuggestion(dest)}
                          className="p-2.5 hover:bg-neutral-50 cursor-pointer flex items-center gap-2 transition-colors"
                        >
                          <div className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center shrink-0 text-neutral-600">
                            <MapPin className="w-3.5 h-3.5 text-neutral-700" />
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <div className="text-xs font-semibold text-neutral-900 truncate">
                              {dest.name}
                            </div>
                            <div className="text-[10px] text-neutral-500 truncate">
                              {dest.address}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. DEFESA CIVIL PUSH NOTIFICATION BANNER (Clean, Non-Blocking, Auto-Dismiss) */}
            {visibleAlert && (
              <div className="animate-in slide-in-from-top-4 duration-300 rounded-2xl bg-white text-neutral-950 border-2 border-neutral-950 shadow-2xl p-3.5 space-y-2">
                {/* Header */}
                <div className="flex items-center justify-between text-[11px] text-neutral-500 border-b border-neutral-100 pb-1.5">
                  <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-red-600">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>DEFESA CIVIL SP &bull; ALERTA</span>
                  </div>
                  <button
                    onClick={handleDismiss}
                    className="text-neutral-400 hover:text-neutral-900 p-0.5 rounded-full"
                    title="Fechar alerta"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Content */}
                <div>
                  <h4 className="text-xs font-bold text-neutral-950 uppercase tracking-tight">
                    {visibleAlert.neighborhood} &bull; {visibleAlert.name}
                  </h4>
                  <p className="text-xs text-neutral-700 mt-0.5 leading-relaxed font-medium">
                    {visibleAlert.defenseCivilTip}
                  </p>
                </div>

                {/* Actions */}
                {!isSafe ? (
                  <div className="pt-1 flex items-center gap-2">
                    <button
                      onClick={handleAcceptRerouteAndClose}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-neutral-950 text-white font-bold text-xs hover:bg-neutral-800 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Desviar Rota (+4 min)</span>
                    </button>
                    <button
                      onClick={handleDismiss}
                      className="py-1.5 px-3 rounded-xl bg-neutral-100 text-neutral-700 hover:bg-neutral-200 text-xs font-semibold transition-colors border border-neutral-300"
                    >
                      Dispensar
                    </button>
                  </div>
                ) : (
                  <div className="text-[11px] text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 p-2 rounded-xl text-center">
                    ✓ Desvio Seguro Ativo: você está contornando áreas de risco.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 4. Quick Action Floating Buttons (Add Report & Voice) */}
          <div className="absolute right-3 top-28 z-20 flex flex-col gap-2 pointer-events-auto">
            {/* Quick Add Report Button */}
            <button
              onClick={onOpenReportModal}
              className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-md text-neutral-900 hover:bg-white border border-neutral-300 shadow-lg flex items-center justify-center transition-transform active:scale-90"
              title="Registrar ocorrência no mapa"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Speedometer (Bottom-Left) */}
          {isNavigating && (
            <div className="absolute bottom-32 left-3 z-20 flex flex-col items-center pointer-events-none animate-in fade-in duration-200">
              <div className="w-12 h-12 rounded-full bg-black/85 backdrop-blur-md border border-white/20 shadow-xl flex flex-col items-center justify-center text-white">
                <span className="text-xs font-black font-mono leading-none text-emerald-400">
                  {speedKmH}
                </span>
                <span className="text-[7px] uppercase font-mono text-neutral-400">km/h</span>
              </div>
            </div>
          )}

          {/* 5. Bottom Navigation Sheet */}
          <div className="absolute bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-neutral-200 p-3.5 px-4 space-y-2 shadow-2xl text-neutral-900">
            {/* Grab handle */}
            <div className="w-8 h-1 bg-neutral-300 rounded-full mx-auto -mt-1"></div>

            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold font-mono text-[#0f9d58]">
                    {selectedRoute.durationMin} min
                  </span>
                  <span className="text-xs text-neutral-500 font-mono">
                    ({selectedRoute.distanceKm} km)
                  </span>
                </div>
                <div className="text-[11px] text-neutral-500 flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-3 h-3 text-neutral-400" />
                  <span>Chegada estimada: <strong>{new Date(Date.now() + selectedRoute.durationMin * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
                </div>
              </div>

              {/* Safety badge */}
              <span className={`px-2 py-1 rounded-lg text-xs font-mono font-bold border ${
                isSafe
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-neutral-100 text-neutral-900 border-neutral-300'
              }`}>
                Segurança: {selectedRoute.safetyScore}/100
              </span>
            </div>

            {/* Current route label */}
            <div className="text-xs text-neutral-600 truncate border-t border-neutral-100 pt-1 font-medium">
              {selectedRoute.name}
            </div>

            {/* Navigation Actions */}
            <div className="flex items-center gap-2 pt-0.5">
              {!isNavigating ? (
                <button
                  onClick={onStart}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs shadow-md transition-all active:scale-98 flex items-center justify-center gap-2"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Iniciar Trajeto</span>
                </button>
              ) : isPaused ? (
                <button
                  onClick={onResume}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs transition-all active:scale-98 flex items-center justify-center gap-2"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Retomar</span>
                </button>
              ) : (
                <button
                  onClick={onPause}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs transition-all active:scale-98 flex items-center justify-center gap-2"
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
    </div>
  );
};
