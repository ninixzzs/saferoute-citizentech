import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  MapPin,
  LocateFixed,
  ArrowUpDown,
  X,
  Loader2,
  Play,
  Pause,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  CornerUpLeft,
  CornerUpRight,
  ArrowUp,
  ArrowLeft,
  Gauge,
  Plus,
  Clock,
  Volume2,
  VolumeX,
  Map as MapIcon,
  Car,
  Bike,
  Footprints,
} from 'lucide-react';
import { DangerZone, IncidentReport, NavigationRoute, TravelMode } from '../types';
import {
  LocationSuggestion,
  POPULAR_LOCATIONS,
  searchAddressSuggestions,
  reverseGeocode,
} from '../services/routingService';
import { NavigationMap } from './NavigationMap';

interface MobileMapExperienceProps {
  currentPosition: [number, number];
  nextPosition?: [number, number];
  selectedRoute: NavigationRoute;
  allRoutes: NavigationRoute[];
  onSelectRoute: (route: NavigationRoute) => void;
  originLocation: LocationSuggestion;
  destinationLocation: LocationSuggestion;
  onCalculateJourney: (originText: string, destinationText: string) => Promise<any> | void;
  onSwapLocations: () => void;
  onResetPresetRoutes: () => void;
  isCalculatingRoute: boolean;
  dangerZones: DangerZone[];
  incidents: IncidentReport[];
  onOpenReportModal: () => void;
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
  focusPoint?: { coords: [number, number]; ts: number } | null;
  simSpeed: '1x' | '2x';
  onToggleSimSpeed: (speed: '1x' | '2x') => void;
  travelMode?: TravelMode;
  onSelectTravelMode?: (mode: TravelMode) => void;
}

export const MobileMapExperience: React.FC<MobileMapExperienceProps> = ({
  currentPosition,
  nextPosition,
  selectedRoute,
  allRoutes,
  onSelectRoute,
  originLocation,
  destinationLocation,
  onCalculateJourney,
  onSwapLocations,
  onResetPresetRoutes,
  isCalculatingRoute,
  dangerZones,
  incidents,
  onOpenReportModal,
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
  focusPoint = null,
  simSpeed,
  onToggleSimSpeed,
  travelMode = 'carro',
  onSelectTravelMode,
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [autoReroute, setAutoReroute] = useState(true);
  const [autoRerouteNotice, setAutoRerouteNotice] = useState<string | null>(null);

  const [originInput, setOriginInput] = useState(originLocation.name);
  const [destInput, setDestInput] = useState(destinationLocation.name);
  const [activeField, setActiveField] = useState<'origin' | 'destination' | null>(null);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>(POPULAR_LOCATIONS.slice(0, 6));
  const [isLocatingGps, setIsLocatingGps] = useState(false);

  const debounceRef = useRef<number | null>(null);
  const noticeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setOriginInput(originLocation.name);
  }, [originLocation]);

  useEffect(() => {
    setDestInput(destinationLocation.name);
  }, [destinationLocation]);

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    };
  }, []);

  const triggerSuggestions = (query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      const results = await searchAddressSuggestions(query);
      setSuggestions(results);
    }, 220);
  };

  const handleUseGps = () => {
    if (isNavigating || isCalculatingRoute || !navigator.geolocation) return;
    setIsLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const loc = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          setOriginInput(loc.name);
          if (destInput.trim()) {
            await onCalculateJourney(loc.address, destInput);
            setIsSearchOpen(false);
          }
        } finally {
          setIsLocatingGps(false);
        }
      },
      () => setIsLocatingGps(false),
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  const handleSubmitSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destInput.trim() || isNavigating || isCalculatingRoute) return;
    setActiveField(null);
    await onCalculateJourney(originInput, destInput);
    setIsSearchOpen(false);
  };

  const handleSelectSuggestion = async (loc: LocationSuggestion) => {
    if (activeField === 'origin') {
      setOriginInput(loc.name);
      setActiveField(null);
      if (destInput.trim()) {
        await onCalculateJourney(loc.address, destInput);
        setIsSearchOpen(false);
      }
    } else {
      setDestInput(loc.name);
      setActiveField(null);
      await onCalculateJourney(originInput, loc.address);
      setIsSearchOpen(false);
    }
  };

  const handleQuickDestination = async (loc: LocationSuggestion) => {
    if (isNavigating || isCalculatingRoute) return;
    setDestInput(loc.name);
    setActiveField(null);
    await onCalculateJourney(originInput, loc.address);
    setIsSearchOpen(false);
  };

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
    if (modifier?.includes('left')) return <CornerUpLeft className="w-5 h-5 text-neutral-950 stroke-[2.5]" />;
    if (modifier?.includes('right')) return <CornerUpRight className="w-5 h-5 text-neutral-950 stroke-[2.5]" />;
    return <ArrowUp className="w-5 h-5 text-neutral-950 stroke-[2.5]" />;
  };

  const shortRouteLabel = (route: NavigationRoute) => {
    if (route.type === 'segura') return 'Segura';
    if (route.type === 'rapida') return 'Rápida';
    return 'Alternativa';
  };

  return (
    <div className="relative w-full h-[68dvh] min-h-[30rem] max-h-[46rem] rounded-[28px] overflow-hidden border border-neutral-200/90 dark:border-neutral-800/90 shadow-[0_18px_50px_rgba(0,0,0,0.16)] dark:shadow-[0_22px_60px_rgba(0,0,0,0.65)] bg-neutral-950 select-none flex flex-col">
      {!isSearchOpen ? (
        <div className="relative w-full h-full flex-1">
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
            topControlOffsetClass="top-[82px]"
            className="w-full h-full"
          />

          {/* Top Bar: Search Pill OR Active Turn Guidance */}
          <div
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className="absolute top-3 left-3 right-3 z-[410] pointer-events-auto"
          >
            {isNavigating ? (
              <div className="bg-neutral-950/95 backdrop-blur-xl text-white rounded-2xl p-3 shadow-2xl border border-white/15 flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-md">
                    {renderTurnIcon(activeStep?.modifier)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-1.5">
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

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={onToggleVoice}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                    aria-label={voiceEnabled ? 'Desativar voz' : 'Ativar voz'}
                  >
                    {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-neutral-400" />}
                  </button>
                  <button
                    type="button"
                    onClick={onReset}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                    aria-label="Encerrar navegação"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full bg-white/96 dark:bg-neutral-950/95 backdrop-blur-xl rounded-2xl p-2 pl-2.5 shadow-xl border border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  className="flex-1 min-w-0 flex items-center gap-2.5 text-left active:scale-[0.99] transition-transform py-0.5"
                >
                  <div className="w-9 h-9 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 flex items-center justify-center shrink-0">
                    {isCalculatingRoute ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      Para onde você vai?
                    </div>
                    <div className="text-xs font-bold text-neutral-950 dark:text-white truncate">
                      {originLocation.name} &rarr; {destinationLocation.name}
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleUseGps}
                  disabled={isLocatingGps || isCalculatingRoute}
                  className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white shrink-0 transition-colors"
                  title="Atualizar partida com GPS atual"
                  aria-label="Usar minha localização GPS atual"
                >
                  {isLocatingGps ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LocateFixed className="w-4 h-4" />
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Top-Left Quick Map Tools */}
          <div
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className="absolute top-[82px] left-3 z-[400] flex flex-col items-start gap-2 pointer-events-auto"
          >
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Travel Mode Pills on Mobile Map */}
              <div className="flex items-center p-0.5 rounded-xl bg-white/95 dark:bg-neutral-950/90 border border-neutral-200 dark:border-white/15 shadow-lg backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => onSelectTravelMode?.('carro')}
                  className={`h-7 px-2 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                    travelMode === 'carro'
                      ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400'
                  }`}
                  title="Carro"
                >
                  <Car className="w-3 h-3" />
                  <span>Carro</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectTravelMode?.('moto')}
                  className={`h-7 px-2 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                    travelMode === 'moto'
                      ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400'
                  }`}
                  title="Moto"
                >
                  <Bike className="w-3 h-3" />
                  <span>Moto</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectTravelMode?.('a_pe')}
                  className={`h-7 px-2 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                    travelMode === 'a_pe'
                      ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400'
                  }`}
                  title="A pé"
                >
                  <Footprints className="w-3 h-3" />
                  <span>A pé</span>
                </button>
              </div>

              <button
                type="button"
                onClick={onOpenReportModal}
                className="h-8 px-2.5 rounded-xl bg-white/95 dark:bg-neutral-950/90 text-neutral-950 dark:text-white border border-neutral-200 dark:border-white/15 shadow-lg flex items-center gap-1 text-[11px] font-bold active:scale-95 transition-transform backdrop-blur-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Alertar</span>
              </button>

              <button
                type="button"
                onClick={() => setAutoReroute(!autoReroute)}
                aria-pressed={autoReroute}
                className={`h-8 px-2.5 rounded-xl border shadow-lg flex items-center gap-1 text-[11px] font-bold active:scale-95 transition-all backdrop-blur-md ${
                  autoReroute
                    ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 border-neutral-950 dark:border-white'
                    : 'bg-white/95 dark:bg-neutral-950/90 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-white/15'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{autoReroute ? 'Auto ON' : 'Auto OFF'}</span>
              </button>
            </div>

            {isNavigating && (
              <div className="w-11 h-11 rounded-full bg-neutral-950/92 border border-white/20 shadow-xl flex flex-col items-center justify-center text-white font-mono">
                <span className="text-xs font-black leading-none">{speedKmH}</span>
                <span className="text-[7px] text-neutral-400 uppercase">km/h</span>
              </div>
            )}
          </div>

          {/* Floating Notification / Risk Alert (Anchored cleanly above bottom bar) */}
          {(autoRerouteNotice || activeAlertZone) && (
            <div
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className="absolute bottom-[132px] left-3 right-3 z-[425] space-y-2 pointer-events-auto"
            >
              {autoRerouteNotice && (
                <div className="rounded-2xl bg-neutral-950 text-white border border-white/15 shadow-2xl px-3.5 py-2.5 flex items-center justify-between gap-2 animate-in slide-in-from-bottom-2 duration-200">
                  <div className="flex items-center gap-2 min-w-0">
                    <ShieldCheck className="w-4 h-4 text-white shrink-0" />
                    <span className="text-xs font-bold truncate">{autoRerouteNotice}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoRerouteNotice(null)}
                    className="text-neutral-400 hover:text-white p-0.5 shrink-0"
                    aria-label="Fechar aviso"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {activeAlertZone && (
                <div className="rounded-2xl bg-neutral-950 text-white border border-neutral-800 shadow-2xl p-3.5 space-y-2 animate-in slide-in-from-bottom-3 duration-200">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
                    <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                      <AlertTriangle className="w-4 h-4 text-white" />
                      <span>Alerta SafeRoute</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => onDismissAlert(activeAlertZone.id)}
                      className="text-neutral-400 hover:text-white p-0.5"
                      aria-label="Fechar alerta"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold">{activeAlertZone.neighborhood}</h4>
                    <p className="text-xs text-neutral-300 mt-0.5 leading-relaxed">
                      {activeAlertZone.defenseCivilTip}
                    </p>
                  </div>
                  {selectedRoute.type !== 'segura' && (
                    <div className="flex items-center gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={onAcceptReroute}
                        className="flex-1 py-2 px-3 rounded-xl bg-white text-neutral-950 font-bold text-xs flex items-center justify-center gap-1.5"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Desviar para Rota Segura</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDismissAlert(activeAlertZone.id)}
                        className="py-2 px-3 rounded-xl bg-neutral-900 text-neutral-300 border border-neutral-800 text-xs font-semibold"
                      >
                        Dispensar
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Compact Bottom Telemetry + Drive Action Bar ONLY (Details/Steps/Alerts cleanly separated below the map) */}
          <div
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className="absolute bottom-0 left-0 right-0 z-[420] bg-white/96 dark:bg-neutral-950/96 backdrop-blur-xl border-t border-neutral-200 dark:border-neutral-800 rounded-t-[24px] p-3.5 pt-2.5 space-y-2 shadow-[0_-10px_30px_rgba(0,0,0,0.2)]"
          >
            {isNavigating && (
              <div className="w-full h-1 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-neutral-950 dark:bg-white transition-all duration-700 rounded-full"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            )}

            {/* 1-Tap Route Switcher Pills */}
            {!isNavigating && allRoutes.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                {allRoutes.map((route) => {
                  const isSelected = route.id === selectedRoute.id;
                  return (
                    <button
                      key={route.id}
                      type="button"
                      onClick={() => onSelectRoute(route)}
                      className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1 shrink-0 ${
                        isSelected
                          ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 border-neutral-950 dark:border-white'
                          : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-neutral-800'
                      }`}
                    >
                      {route.type === 'segura' && <ShieldCheck className="w-3 h-3" />}
                      <span>{shortRouteLabel(route)}</span>
                      <span className="font-mono opacity-80">{route.durationMin}m</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* ETA + Primary Drive Action (wraps gracefully at 20px accessibility font scale) */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 tabular-nums">
                  <span className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-neutral-950 dark:text-white">
                    {remainingMin} min
                  </span>
                  <span className="text-xs font-mono text-neutral-600 dark:text-neutral-400">
                    ({remainingKm} km)
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[10px] font-mono font-bold text-neutral-950 dark:text-white">
                    {selectedRoute.safetyScore}/100
                  </span>
                </div>
                <div className="text-[11px] text-neutral-600 dark:text-neutral-400 flex items-center gap-1 truncate">
                  <Clock className="w-3 h-3 shrink-0" />
                  <span className="truncate">
                    {isNavigating ? currentStreet : selectedRoute.name}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onToggleSimSpeed(simSpeed === '1x' ? '2x' : '1x')}
                  className="px-2 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[11px] font-mono font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1"
                >
                  <Gauge className="w-3.5 h-3.5" />
                  <span>{simSpeed}</span>
                </button>

                {!isNavigating ? (
                  <button
                    type="button"
                    onClick={onStart}
                    className="px-4 py-2.5 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 font-bold text-xs shadow-md flex items-center gap-1.5 active:scale-95 transition-transform"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Iniciar</span>
                  </button>
                ) : isPaused ? (
                  <button
                    type="button"
                    onClick={onResume}
                    className="px-4 py-2.5 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 font-bold text-xs flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Retomar</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onPause}
                    className="px-4 py-2.5 rounded-xl bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-950 font-bold text-xs flex items-center gap-1.5"
                  >
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>Pausar</span>
                  </button>
                )}

                {isNavigating && (
                  <button
                    type="button"
                    onClick={onReset}
                    className="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300"
                    aria-label="Reiniciar trajeto"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Exclusive Full Search Screen */
        <div className="w-full h-full bg-white dark:bg-neutral-950 flex flex-col">
          <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-white dark:bg-neutral-950 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white shrink-0"
                aria-label="Voltar para o mapa"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-neutral-950 dark:text-white truncate">
                  Definir Trajeto
                </h3>
                <p className="text-[11px] text-neutral-500 truncate">
                  Digite partida e destino ou toque em um local
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsSearchOpen(false)}
              className="px-2.5 py-1.5 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-[11px] font-bold flex items-center gap-1 shrink-0"
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Mapa</span>
            </button>
          </div>

          <div className="p-4 space-y-3.5 overflow-y-auto flex-1">
            <form onSubmit={handleSubmitSearch} className="space-y-2.5">
              <div className="relative flex items-center">
                <span className="absolute left-3 w-2.5 h-2.5 rounded-full border-2 border-neutral-500 bg-white"></span>
                <input
                  type="text"
                  value={originInput}
                  onChange={(e) => {
                    setOriginInput(e.target.value);
                    setActiveField('origin');
                    triggerSuggestions(e.target.value);
                  }}
                  onFocus={() => {
                    setActiveField('origin');
                    triggerSuggestions(originInput);
                  }}
                  placeholder="Partida (rua, bairro ou CEP)..."
                  className="w-full pl-9 pr-16 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-medium text-neutral-950 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-400"
                />
                <div className="absolute right-2 flex items-center gap-1">
                  {originInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setOriginInput('');
                        setActiveField('origin');
                        triggerSuggestions('');
                      }}
                      className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleUseGps}
                    disabled={isLocatingGps}
                    className="p-1 text-neutral-700 dark:text-neutral-300"
                    title="Usar minha localização GPS"
                  >
                    {isLocatingGps ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <LocateFixed className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1 flex items-center">
                  <span className="absolute left-3 w-2.5 h-2.5 rounded-full bg-neutral-950 dark:bg-white"></span>
                  <input
                    type="text"
                    value={destInput}
                    onChange={(e) => {
                      setDestInput(e.target.value);
                      setActiveField('destination');
                      triggerSuggestions(e.target.value);
                    }}
                    onFocus={() => {
                      setActiveField('destination');
                      triggerSuggestions(destInput);
                    }}
                    placeholder="Para onde vamos?"
                    className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-medium text-neutral-950 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-400"
                  />
                  {destInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setDestInput('');
                        setActiveField('destination');
                        triggerSuggestions('');
                      }}
                      className="absolute right-2 p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={onSwapLocations}
                  className="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300"
                  title="Inverter origem e destino"
                >
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              </div>

              <button
                type="submit"
                disabled={!destInput.trim() || isCalculatingRoute}
                className="w-full py-3 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {isCalculatingRoute ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Calculando rotas...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Traçar Rota Segura</span>
                  </>
                )}
              </button>
            </form>

            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                  Destinos rápidos (1 toque)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onResetPresetRoutes();
                    setIsSearchOpen(false);
                  }}
                  className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 underline"
                >
                  Restaurar padrão
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_LOCATIONS.slice(0, 6).map((loc) => (
                  <button
                    key={loc.name}
                    type="button"
                    onClick={() => handleQuickDestination(loc)}
                    className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-medium text-neutral-800 dark:text-neutral-200 active:scale-95 transition-transform"
                  >
                    {loc.name}
                  </button>
                ))}
              </div>
            </div>

            {suggestions.length > 0 && (
              <div className="border-t border-neutral-200 dark:border-neutral-800 pt-2 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                  {activeField === 'origin' ? 'Sugestões de partida' : 'Sugestões de destino'}
                </div>
                {suggestions.map((loc, idx) => (
                  <button
                    key={`${loc.name}-${idx}`}
                    type="button"
                    onClick={() => handleSelectSuggestion(loc)}
                    className="w-full p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-900 flex items-center gap-2.5 text-left transition-colors"
                  >
                    <MapPin className="w-4 h-4 text-neutral-500 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-neutral-950 dark:text-white truncate">
                        {loc.name}
                      </div>
                      <div className="text-[11px] text-neutral-500 truncate">{loc.address}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
