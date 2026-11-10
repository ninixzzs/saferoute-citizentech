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
  ChevronUp,
  ChevronDown,
  Gauge,
  Plus,
  ListChecks,
  AlertCircle,
  Clock,
  Volume2,
  VolumeX,
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

type SheetTab = 'routes' | 'itinerary' | 'alerts';

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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [sheetTab, setSheetTab] = useState<SheetTab>('routes');

  const [originInput, setOriginInput] = useState(originLocation.name);
  const [destInput, setDestInput] = useState(destinationLocation.name);
  const [activeField, setActiveField] = useState<'origin' | 'destination' | null>(null);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>(POPULAR_LOCATIONS.slice(0, 6));
  const [isLocatingGps, setIsLocatingGps] = useState(false);

  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    setOriginInput(originLocation.name);
  }, [originLocation]);

  useEffect(() => {
    setDestInput(destinationLocation.name);
  }, [destinationLocation]);

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

  const openSheetSection = (tab: SheetTab) => {
    if (sheetExpanded && sheetTab === tab) {
      setSheetExpanded(false);
    } else {
      setSheetTab(tab);
      setSheetExpanded(true);
    }
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
    <div className="relative w-full h-[76dvh] min-h-[540px] max-h-[780px] rounded-3xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-2xl bg-neutral-900 select-none">
      {/* 1. Edge-to-Edge Live Interactive Map */}
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
        topControlOffsetClass="top-20"
        className="w-full h-full"
      />

      {/* 2. Top Floating Search Pill / Turn-by-Turn Guidance */}
      <div
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        className="absolute top-3 left-3 right-3 z-[410] space-y-2 pointer-events-auto"
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
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="w-full bg-white/96 dark:bg-neutral-950/95 backdrop-blur-xl rounded-2xl p-3 shadow-xl border border-neutral-200 dark:border-neutral-800 flex items-center gap-3 text-left active:scale-[0.99] transition-transform"
          >
            <div className="w-9 h-9 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 flex items-center justify-center shrink-0">
              {isCalculatingRoute ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Para onde você vai?
              </div>
              <div className="text-xs font-bold text-neutral-950 dark:text-white truncate">
                {originLocation.name} &rarr; {destinationLocation.name}
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[11px] font-bold text-neutral-800 dark:text-neutral-200 shrink-0">
              Alterar
            </span>
          </button>
        )}

        {/* Active Geofence Defesa Civil Alert Card */}
        {activeAlertZone && (
          <div className="rounded-2xl bg-neutral-950 text-white border border-neutral-800 shadow-2xl p-3.5 space-y-2 animate-in slide-in-from-top-4 duration-200">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
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
              <div className="flex items-center gap-2 pt-1">
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

      {/* 3. Quick Report Floating Action Button (Waze-style) */}
      {!isSearchOpen && !sheetExpanded && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className="absolute left-3 bottom-48 z-[400] flex flex-col gap-2 pointer-events-auto"
        >
          <button
            type="button"
            onClick={onOpenReportModal}
            className="px-3 py-2 rounded-full bg-neutral-950/92 dark:bg-white/95 text-white dark:text-neutral-950 border border-white/15 dark:border-neutral-300 shadow-xl flex items-center gap-1.5 text-xs font-bold active:scale-95 transition-transform"
            title="Reportar risco na via"
          >
            <Plus className="w-4 h-4" />
            <span>Alertar</span>
          </button>

          {isNavigating && (
            <div className="w-12 h-12 rounded-full bg-neutral-950/92 border border-white/20 shadow-xl flex flex-col items-center justify-center text-white font-mono">
              <span className="text-xs font-black leading-none">{speedKmH}</span>
              <span className="text-[8px] text-neutral-400 uppercase">km/h</span>
            </div>
          )}
        </div>
      )}

      {/* 4. Uber / Google Maps Slide-Over Route Search Drawer */}
      {isSearchOpen && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className="absolute inset-0 z-[430] bg-white dark:bg-neutral-950 flex flex-col animate-in fade-in slide-in-from-top-4 duration-200"
        >
          <div className="p-3.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-neutral-950 dark:text-white" />
              <span className="text-sm font-bold text-neutral-950 dark:text-white">
                Definir Trajeto
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onResetPresetRoutes();
                  setIsSearchOpen(false);
                }}
                className="text-xs text-neutral-500 hover:text-neutral-950 dark:hover:text-white px-2 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-900"
              >
                Padrão
              </button>
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="p-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300"
                aria-label="Fechar busca"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-3.5 space-y-3 overflow-y-auto flex-1">
            <form onSubmit={handleSubmitSearch} className="space-y-2.5">
              {/* Origin */}
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

              {/* Destination + Swap */}
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
                    <span>Ver rotas seguras no mapa</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick 1-Tap GPS + Popular SP Chips */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                  Destinos rápidos (1 toque)
                </span>
                <button
                  type="button"
                  onClick={handleUseGps}
                  className="text-[11px] font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1"
                >
                  <LocateFixed className="w-3 h-3" />
                  <span>Minha localização</span>
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

            {/* Address Suggestions */}
            {suggestions.length > 0 && (
              <div className="border-t border-neutral-200 dark:border-neutral-800 pt-2 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                  {activeField === 'origin' ? 'Sugestões de partida' : 'Sugestões de endereço'}
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

      {/* 5. Uber / Google Maps Expandable Bottom Sheet */}
      <div
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        className={`absolute bottom-0 left-0 right-0 z-[420] bg-white/96 dark:bg-neutral-950/96 backdrop-blur-xl border-t border-neutral-200 dark:border-neutral-800 rounded-t-3xl shadow-[0_-12px_40px_rgba(0,0,0,0.22)] transition-all duration-300 flex flex-col ${
          sheetExpanded ? 'h-[66%]' : 'h-auto'
        }`}
      >
        {/* Drag Handle + Quick Section Switcher */}
        <div className="px-4 pt-2 pb-2 border-b border-neutral-100 dark:border-neutral-800/80 space-y-2 shrink-0">
          <button
            type="button"
            onClick={() => setSheetExpanded(!sheetExpanded)}
            className="w-full flex items-center justify-center py-0.5 text-neutral-400"
            aria-label={sheetExpanded ? 'Recolher painel' : 'Expandir painel'}
          >
            <span className="w-10 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
          </button>

          {/* 1-Tap Route Switcher Pills (Uber / Google Maps Style) */}
          {!isNavigating && allRoutes.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              {allRoutes.map((route) => {
                const isSelected = route.id === selectedRoute.id;
                return (
                  <button
                    key={route.id}
                    type="button"
                    onClick={() => onSelectRoute(route)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                      isSelected
                        ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 border-neutral-950 dark:border-white shadow-sm'
                        : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800'
                    }`}
                  >
                    {route.type === 'segura' && <ShieldCheck className="w-3.5 h-3.5" />}
                    <span>{shortRouteLabel(route)}</span>
                    <span className="font-mono opacity-80">{route.durationMin}m</span>
                    <span className="font-mono text-[10px] opacity-70">({route.safetyScore})</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* ETA + Primary CTA Row */}
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-baseline gap-2 tabular-nums">
                <span className="text-xl font-extrabold font-mono text-neutral-950 dark:text-white">
                  {remainingMin} min
                </span>
                <span className="text-xs font-mono text-neutral-500">({remainingKm} km)</span>
                <span className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[10px] font-mono font-bold text-neutral-900 dark:text-neutral-100">
                  {selectedRoute.safetyScore}/100
                </span>
              </div>
              <div className="text-[11px] text-neutral-500 flex items-center gap-1.5 truncate">
                <Clock className="w-3 h-3 shrink-0" />
                <span className="truncate">
                  {isNavigating ? `Via: ${currentStreet}` : selectedRoute.name}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => onToggleSimSpeed(simSpeed === '1x' ? '2x' : '1x')}
                className="px-2 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[11px] font-mono font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1"
                title="Velocidade da simulação"
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

          {/* Sheet Quick Sub-Tabs Row */}
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => openSheetSection('routes')}
              className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 border transition-colors ${
                sheetExpanded && sheetTab === 'routes'
                  ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 border-neutral-950 dark:border-white'
                  : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800'
              }`}
            >
              <Navigation className="w-3 h-3" />
              <span>Detalhes</span>
            </button>
            <button
              type="button"
              onClick={() => openSheetSection('itinerary')}
              className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 border transition-colors ${
                sheetExpanded && sheetTab === 'itinerary'
                  ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 border-neutral-950 dark:border-white'
                  : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800'
              }`}
            >
              <ListChecks className="w-3 h-3" />
              <span>Passos</span>
            </button>
            <button
              type="button"
              onClick={() => openSheetSection('alerts')}
              className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 border transition-colors ${
                sheetExpanded && sheetTab === 'alerts'
                  ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 border-neutral-950 dark:border-white'
                  : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800'
              }`}
            >
              <AlertCircle className="w-3 h-3" />
              <span>Alertas ({allIncidentsCount})</span>
            </button>
          </div>
        </div>

        {/* Expanded Bottom Sheet Content */}
        {sheetExpanded && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                {sheetTab === 'routes'
                  ? 'Comparativo de Segurança'
                  : sheetTab === 'itinerary'
                    ? 'Guia Curva a Curva'
                    : 'Ocorrências Monitoradas'}
              </span>
              <button
                type="button"
                onClick={() => setSheetExpanded(false)}
                className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 flex items-center gap-1"
              >
                <span>Ver mapa</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {sheetTab === 'routes' && (
              <div className="space-y-2">
                {allRoutes.map((route) => {
                  const isSelected = route.id === selectedRoute.id;
                  return (
                    <button
                      key={route.id}
                      type="button"
                      disabled={isNavigating}
                      onClick={() => {
                        onSelectRoute(route);
                        setSheetExpanded(false);
                      }}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                        isSelected
                          ? 'bg-neutral-100 dark:bg-neutral-900 border-neutral-900 dark:border-neutral-300 shadow-sm'
                          : 'bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800'
                      } ${isNavigating ? 'opacity-65' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-bold text-xs text-neutral-950 dark:text-white flex items-center gap-1.5">
                          <span>{route.name}</span>
                          {route.type === 'segura' && (
                            <span className="px-1.5 py-0.5 rounded bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-[10px] uppercase">
                              Recomendada
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-mono font-bold text-neutral-950 dark:text-white">
                          {route.safetyScore}/100
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-1">
                        {route.description}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] font-mono text-neutral-500 mt-2">
                        <span>{route.durationMin} min</span>
                        <span>&bull;</span>
                        <span>{route.distanceKm} km</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {sheetTab === 'itinerary' && (
              <RouteItinerary
                selectedRoute={selectedRoute}
                isNavigating={isNavigating}
                progressPercentage={progressPercentage}
              />
            )}

            {sheetTab === 'alerts' && (
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
                  setSheetExpanded(false);
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Expand/Collapse Quick Corner Indicator when Sheet Collapsed */}
      {!sheetExpanded && !isSearchOpen && (
        <button
          type="button"
          onClick={() => setSheetExpanded(true)}
          className="sr-only"
          aria-label="Abrir detalhes"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
