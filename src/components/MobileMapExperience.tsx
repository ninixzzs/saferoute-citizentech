import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Navigation,
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
  ListChecks,
  AlertCircle,
  Clock,
  Volume2,
  VolumeX,
  Map as MapIcon,
} from 'lucide-react';
import {
  DangerZone,
  IncidentCategory,
  IncidentReport,
  NavigationRoute,
  RiskLevel,
} from '../types';
import {
  LocationSuggestion,
  POPULAR_LOCATIONS,
  searchAddressSuggestions,
  reverseGeocode,
} from '../services/routingService';
import { NavigationMap } from './NavigationMap';
import { RouteItinerary } from './RouteItinerary';
import { IncidentList } from './IncidentList';

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
  allIncidentsCount: number;
  loadingIncidents: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: IncidentCategory | 'todos';
  onCategoryChange: (c: IncidentCategory | 'todos') => void;
  selectedRisk: RiskLevel | 'todos';
  onRiskChange: (r: RiskLevel | 'todos') => void;
  onConfirmIncident: (id: string) => void;
  onUpdateIncidentStatus: (id: string, status: IncidentReport['status']) => void;
  onDeleteIncident: (id: string) => void;
  onResetIncidents: () => void;
  onFocusIncident: (coords: [number, number]) => void;
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
}

type MobileScreen = 'map' | 'search' | 'routes' | 'steps' | 'alerts';

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
  allIncidentsCount,
  loadingIncidents,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedRisk,
  onRiskChange,
  onConfirmIncident,
  onUpdateIncidentStatus,
  onDeleteIncident,
  onResetIncidents,
  onFocusIncident,
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
}) => {
  // Single exclusive screen state so nothing ever overlaps or clutters another section
  const [activeScreen, setActiveScreen] = useState<MobileScreen>('map');
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

  // Smart mobile automation: auto-reroute onto the safe detour when approaching risk
  useEffect(() => {
    if (
      activeAlertZone &&
      isNavigating &&
      autoReroute &&
      selectedRoute.type !== 'segura'
    ) {
      onAcceptReroute();
      setAutoRerouteNotice(`Desvio seguro ativado (${activeAlertZone.neighborhood})`);
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
      noticeTimerRef.current = window.setTimeout(() => {
        setAutoRerouteNotice(null);
      }, 4500);
    }
  }, [activeAlertZone, isNavigating, autoReroute, selectedRoute.type, onAcceptReroute]);

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
            setActiveScreen('map');
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
    setActiveScreen('map');
  };

  const handleSelectSuggestion = async (loc: LocationSuggestion) => {
    if (activeField === 'origin') {
      setOriginInput(loc.name);
      setActiveField(null);
      if (destInput.trim()) {
        await onCalculateJourney(loc.address, destInput);
        setActiveScreen('map');
      }
    } else {
      setDestInput(loc.name);
      setActiveField(null);
      await onCalculateJourney(originInput, loc.address);
      setActiveScreen('map');
    }
  };

  const handleQuickDestination = async (loc: LocationSuggestion) => {
    if (isNavigating || isCalculatingRoute) return;
    setDestInput(loc.name);
    setActiveField(null);
    await onCalculateJourney(originInput, loc.address);
    setActiveScreen('map');
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

  const renderScreenHeader = (title: string, subtitle?: string) => (
    <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-white dark:bg-neutral-950 shrink-0">
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          type="button"
          onClick={() => setActiveScreen('map')}
          className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white shrink-0 active:scale-95 transition-transform"
          aria-label="Voltar para o mapa"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-neutral-950 dark:text-white truncate">{title}</h3>
          {subtitle && (
            <p className="text-[11px] text-neutral-500 truncate">{subtitle}</p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setActiveScreen('map')}
        className="px-2.5 py-1.5 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-[11px] font-bold flex items-center gap-1 shrink-0"
      >
        <MapIcon className="w-3.5 h-3.5" />
        <span>Ver Mapa</span>
      </button>
    </div>
  );

  return (
    <div className="relative w-full h-[78dvh] min-h-[550px] max-h-[820px] rounded-[28px] overflow-hidden border border-neutral-200/90 dark:border-neutral-800/90 shadow-[0_18px_50px_rgba(0,0,0,0.16)] dark:shadow-[0_22px_60px_rgba(0,0,0,0.65)] bg-neutral-950 select-none flex flex-col">
      {/* =====================================================================
          SCREEN 1: LIVE INTERACTIVE MAP (Clean, Focused Map View)
         ===================================================================== */}
      {activeScreen === 'map' && (
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
                  onClick={() => setActiveScreen('search')}
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
            <div className="flex items-center gap-1.5">
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
              className="absolute bottom-[174px] left-3 right-3 z-[425] space-y-2 pointer-events-auto"
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
                      <span>Alerta Defesa Civil SP</span>
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

          {/* Compact Bottom Action Bar inside Map View */}
          <div
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className="absolute bottom-0 left-0 right-0 z-[420] bg-white/96 dark:bg-neutral-950/96 backdrop-blur-xl border-t border-neutral-200 dark:border-neutral-800 rounded-t-[24px] p-3.5 pt-2.5 space-y-2.5 shadow-[0_-10px_30px_rgba(0,0,0,0.2)]"
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
                          : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800'
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

            {/* ETA + Primary Drive Action */}
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-baseline gap-2 tabular-nums">
                  <span className="font-display text-2xl font-extrabold tracking-tight text-neutral-950 dark:text-white">
                    {remainingMin} min
                  </span>
                  <span className="text-xs font-mono text-neutral-500">({remainingKm} km)</span>
                  <span className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[10px] font-mono font-bold text-neutral-900 dark:text-neutral-100">
                    {selectedRoute.safetyScore}/100
                  </span>
                </div>
                <div className="text-[11px] text-neutral-500 flex items-center gap-1 truncate">
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
                  className="px-2 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[11px] font-mono font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1"
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

            {/* Clean Exclusive Section Buttons */}
            <div className="grid grid-cols-3 gap-1.5 pt-0.5">
              <button
                type="button"
                onClick={() => setActiveScreen('routes')}
                className="py-2 px-2 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 bg-neutral-100 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-800"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Rotas</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveScreen('steps')}
                className="py-2 px-2 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 bg-neutral-100 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-800"
              >
                <ListChecks className="w-3.5 h-3.5" />
                <span>Passos</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveScreen('alerts')}
                className="py-2 px-2 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 bg-neutral-100 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-800"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Alertas ({allIncidentsCount})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SCREEN 2: FULL SEARCH SCREEN (100% Opaque - Zero Map / Minutes visible)
         ===================================================================== */}
      {activeScreen === 'search' && (
        <div className="w-full h-full bg-white dark:bg-neutral-950 flex flex-col">
          {renderScreenHeader('Definir Trajeto', 'Digite partida e destino ou toque em um local')}

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
                    setActiveScreen('map');
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

      {/* =====================================================================
          SCREEN 3: EXCLUSIVE ROUTE COMPARISON SCREEN (100% Opaque)
         ===================================================================== */}
      {activeScreen === 'routes' && (
        <div className="w-full h-full bg-white dark:bg-neutral-950 flex flex-col">
          {renderScreenHeader('Opções de Rota', 'Toque em uma opção para aplicar no mapa')}

          <div className="p-4 space-y-3 overflow-y-auto flex-1">
            {allRoutes.map((route) => {
              const isSelected = route.id === selectedRoute.id;
              return (
                <button
                  key={route.id}
                  type="button"
                  disabled={isNavigating}
                  onClick={() => {
                    onSelectRoute(route);
                    setActiveScreen('map');
                  }}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-neutral-100 dark:bg-neutral-900 border-neutral-900 dark:border-white shadow-sm'
                      : 'bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800'
                  } ${isNavigating ? 'opacity-65' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-bold text-xs text-neutral-950 dark:text-white flex items-center gap-1.5">
                      <span>{route.name}</span>
                      {route.type === 'segura' && (
                        <span className="px-2 py-0.5 rounded bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-[10px] uppercase">
                          Recomendada
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono font-bold text-neutral-950 dark:text-white">
                      {route.safetyScore}/100
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-1.5 leading-relaxed">
                    {route.description}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] font-mono text-neutral-500 mt-2.5">
                    <span>{route.durationMin} min</span>
                    <span>&bull;</span>
                    <span>{route.distanceKm} km</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
          SCREEN 4: EXCLUSIVE STEP-BY-STEP ITINERARY SCREEN (100% Opaque)
         ===================================================================== */}
      {activeScreen === 'steps' && (
        <div className="w-full h-full bg-white dark:bg-neutral-950 flex flex-col">
          {renderScreenHeader('Passo a Passo', selectedRoute.name)}

          <div className="p-4 overflow-y-auto flex-1">
            <RouteItinerary
              selectedRoute={selectedRoute}
              isNavigating={isNavigating}
              progressPercentage={progressPercentage}
            />
          </div>
        </div>
      )}

      {/* =====================================================================
          SCREEN 5: EXCLUSIVE ALERTS SCREEN (100% Opaque)
         ===================================================================== */}
      {activeScreen === 'alerts' && (
        <div className="w-full h-full bg-white dark:bg-neutral-950 flex flex-col">
          {renderScreenHeader('Ocorrências em São Paulo', `${allIncidentsCount} registros ativos`)}

          <div className="p-4 overflow-y-auto flex-1">
            <IncidentList
              incidents={incidents}
              loading={loadingIncidents}
              searchQuery={searchQuery}
              onSearchChange={onSearchChange}
              selectedCategory={selectedCategory}
              onCategoryChange={onCategoryChange}
              selectedRisk={selectedRisk}
              onRiskChange={onRiskChange}
              onConfirm={onConfirmIncident}
              onUpdateStatus={onUpdateIncidentStatus}
              onDelete={onDeleteIncident}
              onResetData={onResetIncidents}
              onFocusIncident={(coords) => {
                onFocusIncident(coords);
                setActiveScreen('map');
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
