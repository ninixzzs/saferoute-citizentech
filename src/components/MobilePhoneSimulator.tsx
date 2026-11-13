import React, { useState, useEffect, useRef } from 'react';
import {
  CornerUpRight,
  CornerUpLeft,
  ArrowUp,
  Volume2,
  VolumeX,
  Search,
  X,
  ShieldCheck,
  Play,
  Pause,
  RotateCcw,
  Clock,
  ArrowRight,
  Plus,
  Loader2,
  MapPin,
  AlertTriangle,
  ArrowUpDown,
  Gauge,
  LocateFixed,
  Sparkles,
  Shield,
  Lock,
  Unlock,
  HelpCircle,
  Car,
  Bike,
  Footprints,
} from 'lucide-react';
import { DangerZone, NavigationRoute, IncidentReport } from '../types';
import {
  LocationSuggestion,
  POPULAR_LOCATIONS,
  searchAddressSuggestions,
  reverseGeocode,
} from '../services/routingService';
import { NavigationMap } from './NavigationMap';

interface MobilePhoneSimulatorProps {
  currentPosition: [number, number];
  nextPosition?: [number, number];
  selectedRoute: NavigationRoute;
  allRoutes?: NavigationRoute[];
  onSelectRoute?: (route: NavigationRoute) => void;
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
  onFocusZone?: (zone: DangerZone) => void;
  onOpenReportModal: () => void;
  originLocation: LocationSuggestion;
  destinationLocation: LocationSuggestion;
  onCalculateJourney: (originText: string, destinationText: string) => Promise<any> | void;
  onSwapLocations: () => void;
  isCalculatingRoute?: boolean;
  onResetPresetRoutes?: () => void;
  simSpeed: '1x' | '2x';
  onToggleSimSpeed: (speed: '1x' | '2x') => void;
  focusPoint?: { coords: [number, number]; ts: number; title?: string; neighborhood?: string } | null;
  onOpenAssistant?: () => void;
  isStandbyLocked?: boolean;
  onToggleLock?: (locked: boolean) => void;
  onOpenOnboarding?: () => void;
  travelMode?: 'carro' | 'moto' | 'a_pe';
  onSelectTravelMode?: (mode: 'carro' | 'moto' | 'a_pe') => void;
  hasArrived?: boolean;
}

export const MobilePhoneSimulator: React.FC<MobilePhoneSimulatorProps> = ({
  currentPosition,
  nextPosition,
  selectedRoute,
  allRoutes = [],
  onSelectRoute,
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
  onFocusZone,
  onOpenReportModal,
  originLocation,
  destinationLocation,
  onCalculateJourney,
  onSwapLocations,
  isCalculatingRoute = false,
  simSpeed,
  onToggleSimSpeed,
  focusPoint = null,
  onOpenAssistant,
  isStandbyLocked = false,
  onToggleLock,
  onOpenOnboarding,
  travelMode = 'carro',
  onSelectTravelMode,
  hasArrived = false,
}) => {
  const [originInput, setOriginInput] = useState<string>(originLocation.name);
  const [destInput, setDestInput] = useState<string>(destinationLocation.name);
  const [isExpandedPlanner, setIsExpandedPlanner] = useState<boolean>(false);
  const [activeField, setActiveField] = useState<'origin' | 'destination' | null>(null);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>(POPULAR_LOCATIONS.slice(0, 5));
  const [visibleAlert, setVisibleAlert] = useState<DangerZone | null>(null);
  const [isLocatingGps, setIsLocatingGps] = useState<boolean>(false);
  const [phoneClock, setPhoneClock] = useState<string>(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );

  const autoDismissTimerRef = useRef<number | null>(null);
  const debounceRef = useRef<number | null>(null);

  const handleUseGpsInPhone = () => {
    if (isNavigating || isCalculatingRoute || !navigator.geolocation) return;
    setIsLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const loc = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          setOriginInput(loc.name);
          if (destInput.trim()) {
            onCalculateJourney(loc.address, destInput);
            setIsExpandedPlanner(false);
          }
        } finally {
          setIsLocatingGps(false);
        }
      },
      () => setIsLocatingGps(false),
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  // Live phone status clock
  useEffect(() => {
    const t = setInterval(() => {
      setPhoneClock(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setOriginInput(originLocation.name);
  }, [originLocation]);

  useEffect(() => {
    setDestInput(destinationLocation.name);
  }, [destinationLocation]);

  useEffect(() => {
    if (activeAlertZone) {
      setVisibleAlert(activeAlertZone);
      if (autoDismissTimerRef.current) clearTimeout(autoDismissTimerRef.current);
      autoDismissTimerRef.current = window.setTimeout(() => {
        setVisibleAlert(null);
      }, 7000);
    } else {
      setVisibleAlert(null);
    }

    return () => {
      if (autoDismissTimerRef.current) clearTimeout(autoDismissTimerRef.current);
    };
  }, [activeAlertZone]);

  const triggerSuggestions = (query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      const results = await searchAddressSuggestions(query);
      setSuggestions(results);
    }, 250);
  };

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

  const handleFormSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!destInput.trim() || isNavigating || isCalculatingRoute) return;
    setActiveField(null);
    setIsExpandedPlanner(false);
    onCalculateJourney(originInput, destInput);
  };

  const handleSelectSuggestion = (loc: LocationSuggestion) => {
    if (activeField === 'origin') {
      setOriginInput(loc.name);
      setActiveField(null);
      if (destInput.trim()) {
        onCalculateJourney(loc.address, destInput);
      }
    } else {
      setDestInput(loc.name);
      setActiveField(null);
      setIsExpandedPlanner(false);
      onCalculateJourney(originInput, loc.address);
    }
  };

  // Dynamic remaining distance & duration during trip
  const remainingFactor = Math.max(0, 1 - progressPercentage / 100);
  const remainingMin = hasArrived
    ? 0
    : isNavigating
    ? Math.max(1, Math.round(selectedRoute.durationMin * remainingFactor))
    : selectedRoute.durationMin;
  const remainingKm = hasArrived
    ? 0.0
    : isNavigating
    ? Math.max(0.1, Number((selectedRoute.distanceKm * remainingFactor).toFixed(1)))
    : selectedRoute.distanceKm;

  // Dynamic street & maneuver instruction during trip
  const steps = selectedRoute.steps || [];
  const stepIdx =
    steps.length > 0
      ? Math.min(steps.length - 1, Math.floor((progressPercentage / 100) * steps.length))
      : 0;
  const activeStep = steps[stepIdx];

  const streetNames = selectedRoute.streetNames || [];
  const currentStreetIndex =
    streetNames.length > 0
      ? Math.min(streetNames.length - 1, Math.floor((progressPercentage / 100) * streetNames.length))
      : 0;
  const upcomingStreet = activeStep?.street || streetNames[currentStreetIndex] || selectedRoute.name;

  const renderTurnIcon = (modifier?: string) => {
    if (modifier?.includes('left')) return <CornerUpLeft className="w-5 h-5 text-neutral-950 stroke-[2.5]" />;
    if (modifier?.includes('right')) return <CornerUpRight className="w-5 h-5 text-neutral-950 stroke-[2.5]" />;
    return <ArrowUp className="w-5 h-5 text-neutral-950 stroke-[2.5]" />;
  };

  return (
    <div className="flex flex-col items-center justify-center w-full py-1 sm:py-2">
      {/* Titanium Executive Smartphone Frame (Responsive for Mobile + Desktop preview) */}
      <div className="relative w-full max-w-[390px] h-[640px] sm:h-[750px] rounded-[40px] sm:rounded-[52px] bg-gradient-to-b from-neutral-900 via-black to-neutral-950 border-[7px] sm:border-[10px] border-neutral-800 shadow-[0_32px_95px_rgba(0,0,0,0.92)] overflow-hidden flex flex-col select-none ring-2 ring-neutral-700/60">
        
        {/* Sleek Dynamic Island Pill */}
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center gap-2 w-28 h-6 bg-black pointer-events-none rounded-full shadow-inner ring-1 ring-white/10">
          <div className="w-2 h-2 rounded-full bg-neutral-800 border border-neutral-700"></div>
          <div className="w-8 h-1 rounded-full bg-neutral-900"></div>
        </div>

        {/* Status Bar with Standby Lock & Onboarding Controls */}
        <div className="relative z-40 w-full px-5 pt-3 pb-1 flex items-center justify-between text-[11px] font-semibold text-neutral-800 bg-white/95 backdrop-blur-md border-b border-neutral-200">
          <div className="flex items-center gap-2">
            <span className="font-mono">{phoneClock}</span>
            <div className="flex items-center gap-0.5 bg-neutral-200/90 rounded-md p-0.5">
              <button
                type="button"
                onClick={() => onSelectTravelMode?.('carro')}
                className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-all ${
                  travelMode === 'carro' ? 'bg-neutral-950 text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-950'
                }`}
                title="Modo Carro"
              >
                Carro
              </button>
              <button
                type="button"
                onClick={() => onSelectTravelMode?.('moto')}
                className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-all ${
                  travelMode === 'moto' ? 'bg-neutral-950 text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-950'
                }`}
                title="Modo Moto"
              >
                Moto
              </button>
              <button
                type="button"
                onClick={() => onSelectTravelMode?.('a_pe')}
                className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-all ${
                  travelMode === 'a_pe' ? 'bg-neutral-950 text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-950'
                }`}
                title="Modo A pé"
              >
                A pé
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-[10px]">
            {onOpenOnboarding && (
              <button
                type="button"
                onClick={onOpenOnboarding}
                className="p-1 rounded hover:bg-neutral-200 text-neutral-700 transition-colors"
                title="Abrir introdução (3 passos)"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            )}
            {onToggleLock && (
              <button
                type="button"
                onClick={() => onToggleLock(!isStandbyLocked)}
                className="p-1 rounded hover:bg-neutral-200 text-neutral-700 transition-colors"
                title={isStandbyLocked ? 'Destravar tela' : 'Bloquear tela (Standby)'}
              >
                {isStandbyLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              </button>
            )}
            <span>5G</span>
            <div className="w-4 h-2 rounded-xs border border-neutral-800 p-0.5 flex items-center">
              <div className="w-full h-full bg-neutral-800"></div>
            </div>
          </div>
        </div>

        {/* Viewport Screen */}
        <div className="relative flex-1 w-full h-full overflow-hidden bg-neutral-950">
          {isStandbyLocked ? (
            /* =========================================================================
               STANDBY / LOCK SCREEN (Apresentação Curiosa & Slogan de Impacto)
               ========================================================================= */
            <div
              onClick={() => onToggleLock && onToggleLock(false)}
              className="absolute inset-0 z-40 bg-[#050505] text-white flex flex-col justify-between p-6 select-none cursor-pointer transition-opacity duration-500 animate-in fade-in"
            >
              {/* Background Ambient Radial Glow */}
              <div className="absolute inset-0 bg-radial from-neutral-900/60 via-black to-black pointer-events-none" />

              {/* Top Lock Header */}
              <div className="relative z-10 flex items-center justify-between pt-3">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-[10px] font-mono text-neutral-300">
                  <Shield className="w-3 h-3 text-white" />
                  <span>Radar SafeRoute Ativo</span>
                </div>
                <div className="p-1 rounded-full bg-white/10 text-neutral-400">
                  <Lock className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Center Clock & Slogan */}
              <div className="relative z-10 text-center space-y-4 my-auto">
                <div className="space-y-1">
                  <div className="text-5xl font-mono font-extrabold tracking-tight text-white drop-shadow-md">
                    {phoneClock}
                  </div>
                  <p className="text-xs font-medium text-neutral-400">
                    São Paulo &bull; Monitoramento Ativo
                  </p>
                </div>

                {/* Minimalist Watermark Logo Shield */}
                <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto shadow-[0_0_35px_rgba(255,255,255,0.15)] animate-pulse">
                  <Shield className="w-8 h-8 fill-white/80 text-white" />
                </div>

                {/* Slogan de Impacto */}
                <div className="space-y-1 max-w-[260px] mx-auto">
                  <h3 className="font-display text-base font-extrabold tracking-tight text-white leading-snug">
                    SafeRoute
                  </h3>
                  <p className="text-xs font-mono text-neutral-300 font-semibold tracking-wider uppercase">
                    &ldquo;Vá com segurança. Vá de SafeRoute.&rdquo;
                  </p>
                </div>

                {/* Simulated Notification on Lock Screen */}
                <div className="p-3 rounded-2xl bg-neutral-900/90 border border-neutral-800 backdrop-blur-md text-left space-y-1 shadow-lg max-w-[280px] mx-auto">
                  <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                    <span className="flex items-center gap-1 font-bold text-white">
                      <Shield className="w-3 h-3" />
                      SafeRoute Alerta
                    </span>
                    <span>agora</span>
                  </div>
                  <p className="text-[11px] text-neutral-300 leading-tight">
                    Zonas de atenção monitoradas. Toque para destravar e ver o mapa em tempo real.
                  </p>
                </div>
              </div>

              {/* Bottom Unlock Prompt / Home Swipe Bar */}
              <div className="relative z-10 text-center space-y-2 pb-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onToggleLock) onToggleLock(false);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-white text-black font-bold text-xs shadow-lg hover:bg-neutral-200 active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Deslize ou toque para destravar</span>
                </button>
                <p className="text-[10px] font-mono text-neutral-500">
                  Modo Standby &bull; Toque para mapa ao vivo
                </p>
              </div>
            </div>
          ) : (
            <>
          {/* 1. Real Satellite & Vector Map */}
          <div className="absolute inset-0 w-full h-full z-0">
            <NavigationMap
              currentPosition={currentPosition}
              nextPosition={nextPosition}
              selectedRoute={selectedRoute}
              allRoutes={allRoutes}
              onSelectRoute={onSelectRoute}
              dangerZones={dangerZones}
              incidents={incidents}
              isNavigating={isNavigating}
              hasArrived={hasArrived}
              speedKmH={speedKmH}
              focusPoint={focusPoint}
              className="w-full h-full border-0 rounded-none shadow-none"
            />
          </div>

          {/* 2. Top Header Overlay */}
          <div
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className="absolute top-0 left-0 right-0 z-30 p-2.5 space-y-2 pointer-events-auto select-none"
          >
            {isNavigating ? (
              /* Turn-by-Turn Guidance Header */
              <div className="bg-neutral-900/95 backdrop-blur-md text-white rounded-2xl p-3 shadow-xl flex items-center justify-between gap-3 border border-neutral-800">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-inner">
                    {renderTurnIcon(activeStep?.modifier)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-bold leading-tight">
                        {activeStep ? activeStep.instruction : 'Siga em frente'}
                      </span>
                      {activeStep?.distanceMeters ? (
                        <span className="text-[11px] font-mono text-neutral-400">
                          {activeStep.distanceMeters} m
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs font-medium text-white/95 truncate">
                      {upcomingStreet}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={onToggleVoice}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                    title="Orientação por voz"
                  >
                    {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-white/50" />}
                  </button>
                  <button
                    onClick={onReset}
                    className="p-1.5 rounded-lg bg-black/40 hover:bg-black/60 text-white transition-colors"
                    title="Encerrar trajeto"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* Interactive Origin & Destination Route Planner */
              <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-neutral-300 p-2.5 space-y-2 text-neutral-800">
                {!isExpandedPlanner ? (
                  <form onSubmit={handleFormSubmit} className="flex items-center justify-between gap-2">
                    <div
                      onClick={() => setIsExpandedPlanner(true)}
                      className="flex items-center gap-2 flex-1 cursor-pointer min-w-0"
                    >
                      <Search className="w-4 h-4 text-neutral-600 shrink-0" />
                      <div className="truncate text-xs font-medium text-neutral-800">
                        {destInput ? (
                          <span>
                            <span className="text-neutral-500">{originInput} &rarr; </span>
                            <strong>{destInput}</strong>
                          </span>
                        ) : (
                          <span className="text-neutral-400">Definir origem e destino...</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsExpandedPlanner(true)}
                        className="px-2 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-[10px] font-bold text-neutral-700 transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        type="submit"
                        disabled={isCalculatingRoute || !destInput.trim()}
                        className="p-1.5 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-40 transition-colors shadow-sm"
                        title="Calcular Trajeto"
                      >
                        {isCalculatingRoute ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                        ) : (
                          <ArrowRight className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleFormSubmit} className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-neutral-600 border-b border-neutral-100 pb-1">
                      <span>Planejar Trajeto</span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsExpandedPlanner(false);
                          setActiveField(null);
                        }}
                        className="text-neutral-400 hover:text-neutral-700 p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Origin Field */}
                    <div className="relative flex items-center">
                      <div className="absolute left-2.5 z-10 flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-white ring-2 ring-neutral-400"></div>
                      </div>
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
                        onBlur={() => setTimeout(() => setActiveField(null), 220)}
                        placeholder="Ponto de partida..."
                        className="w-full pl-8 pr-14 py-1.5 bg-neutral-100 rounded-xl text-xs text-neutral-900 placeholder-neutral-400 border border-neutral-200 outline-none focus:border-neutral-400 font-medium"
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
                            className="text-neutral-400 hover:text-neutral-700"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleUseGpsInPhone}
                          disabled={isLocatingGps}
                          className="text-neutral-600 hover:text-neutral-950"
                          title="Usar minha localização GPS"
                        >
                          {isLocatingGps ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <LocateFixed className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Destination Field & Swap */}
                    <div className="relative flex items-center gap-1.5">
                      <div className="relative flex-1">
                        <div className="absolute left-2.5 z-10 flex items-center justify-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-neutral-500 ring-2 ring-neutral-300"></div>
                        </div>
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
                          onBlur={() => setTimeout(() => setActiveField(null), 220)}
                          placeholder="Destino final..."
                          className="w-full pl-8 pr-7 py-1.5 bg-neutral-100 rounded-xl text-xs text-neutral-900 placeholder-neutral-400 border border-neutral-200 outline-none focus:border-neutral-400 font-medium"
                        />
                        {destInput && (
                          <button
                            type="button"
                            onClick={() => {
                              setDestInput('');
                              setActiveField('destination');
                              triggerSuggestions('');
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={onSwapLocations}
                        className="p-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-600 border border-neutral-200 transition-colors shrink-0"
                        title="Inverter origem e destino"
                      >
                        <ArrowUpDown className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="submit"
                        disabled={isCalculatingRoute || !destInput.trim()}
                        className="px-3 py-1.5 rounded-xl bg-neutral-900 text-white font-bold text-xs hover:bg-neutral-800 transition-colors shadow-xs shrink-0 flex items-center gap-1"
                      >
                        {isCalculatingRoute ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <span>Traçar</span>
                        )}
                      </button>
                    </div>

                    {/* Live Autocomplete Dropdown */}
                    {activeField && suggestions.length > 0 && (
                      <div className="border-t border-neutral-100 pt-1.5 max-h-36 overflow-y-auto space-y-1">
                        <div className="text-[10px] text-neutral-400 uppercase font-semibold">
                          {activeField === 'origin' ? 'Sugestões de partida:' : 'Sugestões de destino:'}
                        </div>
                        {suggestions.map((loc, idx) => (
                          <div
                            key={`${loc.name}-${idx}`}
                            onMouseDown={() => handleSelectSuggestion(loc)}
                            className="p-1.5 hover:bg-neutral-100 rounded-lg cursor-pointer flex items-center gap-2 text-xs text-neutral-800"
                          >
                            <MapPin className="w-3 h-3 text-neutral-500 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold truncate">{loc.name}</div>
                              <div className="text-[10px] text-neutral-500 truncate">{loc.address}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </form>
                )}
              </div>
            )}

            {/* Travel Mode Selector Capsule ('Carro' | 'Moto' | 'A pé') */}
            {!isExpandedPlanner && (
              <div className="flex items-center justify-center gap-1 p-1 mx-auto w-fit rounded-2xl bg-neutral-950/92 backdrop-blur-xl border border-neutral-700/80 shadow-2xl select-none animate-in fade-in duration-200">
                <button
                  type="button"
                  onClick={() => onSelectTravelMode?.('carro')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    travelMode === 'carro'
                      ? 'bg-white text-neutral-950 shadow-md font-extrabold scale-102'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                  title="Modo Carro (Trânsito Convencional)"
                >
                  <Car className="w-3.5 h-3.5" />
                  <span>Carro</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectTravelMode?.('moto')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    travelMode === 'moto'
                      ? 'bg-white text-neutral-950 shadow-md font-extrabold scale-102'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                  title="Modo Moto (Corredores Ágeis)"
                >
                  <Bike className="w-3.5 h-3.5" />
                  <span>Moto</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectTravelMode?.('a_pe')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    travelMode === 'a_pe'
                      ? 'bg-white text-neutral-950 shadow-md font-extrabold scale-102'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                  title="Modo A pé (Vias Iluminadas e Calçadas Monitoradas)"
                >
                  <Footprints className="w-3.5 h-3.5" />
                  <span>A pé</span>
                </button>
              </div>
            )}

            {/* 3. DEFESA CIVIL NOTIFICATION BANNER */}
            {visibleAlert && (
              <div className="animate-in slide-in-from-top-4 duration-300 rounded-2xl bg-neutral-950 text-white border border-neutral-800 shadow-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-neutral-400 border-b border-neutral-800 pb-1.5">
                  <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-neutral-200">
                    <AlertTriangle className="w-3.5 h-3.5 text-neutral-400" />
                    <span>ALERTA SAFEROUTE</span>
                  </div>
                  <button
                    onClick={handleDismiss}
                    className="text-neutral-400 hover:text-white p-0.5 rounded-full"
                    title="Fechar alerta"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-tight">
                    {visibleAlert.neighborhood} &bull; {visibleAlert.name}
                  </h4>
                  <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed font-medium">
                    {visibleAlert.defenseCivilTip}
                  </p>
                </div>

                <div className="pt-1 flex items-center gap-2 flex-wrap">
                  {onFocusZone && (
                    <button
                      onClick={() => onFocusZone(visibleAlert)}
                      className="py-1.5 px-3 rounded-xl bg-neutral-900 text-white border border-neutral-800 text-xs font-semibold hover:bg-neutral-800 transition-colors flex items-center gap-1 active:scale-95"
                      title="Ver localização desta área no mapa"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Ver no Mapa</span>
                    </button>
                  )}
                  {selectedRoute.type !== 'segura' ? (
                    <button
                      onClick={handleAcceptRerouteAndClose}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-white text-neutral-950 font-bold text-xs hover:bg-neutral-200 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-neutral-900" />
                      <span>Desviar Rota</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleDismiss}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-neutral-900 text-neutral-300 hover:bg-neutral-800 text-xs font-semibold transition-colors border border-neutral-800"
                    >
                      Fechar
                    </button>
                  )}
                  <button
                    onClick={handleDismiss}
                    className="py-1.5 px-2.5 rounded-xl bg-neutral-900 text-neutral-400 hover:text-white text-xs font-semibold transition-colors border border-neutral-800"
                  >
                    Dispensar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Speedometer */}
          {isNavigating && (
            <div className="absolute bottom-32 left-3 z-20 flex flex-col items-center pointer-events-none animate-in fade-in duration-200">
              <div className="w-12 h-12 rounded-full bg-neutral-950/90 backdrop-blur-md border border-white/20 shadow-xl flex flex-col items-center justify-center text-white">
                <span className="text-xs font-black font-mono leading-none text-white">
                  {speedKmH}
                </span>
                <span className="text-[7px] uppercase font-mono text-neutral-400">km/h</span>
              </div>
            </div>
          )}

          {/* 5. Bottom Navigation Sheet */}
          <div
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className="absolute bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-neutral-200 p-3.5 px-4 space-y-2 shadow-2xl text-neutral-900 select-none"
          >
            <div className="w-8 h-1 bg-neutral-300 rounded-full mx-auto -mt-1"></div>

            {/* 1-Tap Route Switcher Pills inside Phone Simulator */}
            {!isNavigating && allRoutes.length > 0 && onSelectRoute && (
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                {allRoutes.map((route) => {
                  const isSelected = route.id === selectedRoute.id;
                  const label =
                    route.type === 'segura'
                      ? 'Segura'
                      : route.type === 'rapida'
                        ? 'Rápida'
                        : 'Alternativa';
                  return (
                    <button
                      key={route.id}
                      type="button"
                      onClick={() => onSelectRoute(route)}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1 shrink-0 ${
                        isSelected
                          ? 'bg-neutral-950 text-white border-neutral-950'
                          : 'bg-neutral-100 text-neutral-700 border-neutral-200 hover:bg-neutral-200'
                      }`}
                    >
                      {route.type === 'segura' && <ShieldCheck className="w-3 h-3" />}
                      <span>{label}</span>
                      <span className="font-mono opacity-80">{route.durationMin}m</span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-baseline gap-2 tabular-nums">
                  <span className="text-xl font-bold font-mono text-neutral-950">
                    {remainingMin} min
                  </span>
                  <span className="text-xs text-neutral-500 font-mono">
                    ({remainingKm} km)
                  </span>
                </div>
                <div className="text-[11px] text-neutral-500 flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-3 h-3 text-neutral-400" />
                  <span>
                    Chegada:{' '}
                    <strong>
                      {new Date(Date.now() + remainingMin * 60000).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </strong>
                  </span>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold border bg-neutral-900 text-neutral-100 border-neutral-800">
                Segurança: {selectedRoute.safetyScore}/100
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-neutral-600 border-t border-neutral-100 pt-1 font-medium">
              <span className="truncate max-w-[200px]">{selectedRoute.name}</span>
              <div className="flex items-center gap-1 text-[10px] text-neutral-500 font-mono">
                <Gauge className="w-3 h-3" />
                <button
                  type="button"
                  onClick={() => onToggleSimSpeed(simSpeed === '1x' ? '2x' : '1x')}
                  className="px-1.5 py-0.5 rounded bg-neutral-100 border border-neutral-200 hover:bg-neutral-200 text-neutral-700 font-bold"
                >
                  {simSpeed === '1x' ? '1x Normal' : '2x Rápido'}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-0.5">
              {hasArrived ? (
                <button
                  onClick={onStart}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs shadow-md transition-all active:scale-98 flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Refazer Trajeto</span>
                </button>
              ) : !isNavigating ? (
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
          </>
          )}

          {/* Home Indicator */}
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-28 h-1 bg-neutral-400 rounded-full z-40"></div>
        </div>
      </div>
    </div>
  );
};
