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
} from 'lucide-react';
import { DangerZone, NavigationRoute, IncidentReport } from '../types';
import {
  LocationSuggestion,
  POPULAR_LOCATIONS,
  searchAddressSuggestions,
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
  onOpenReportModal: () => void;
  originLocation: LocationSuggestion;
  destinationLocation: LocationSuggestion;
  onCalculateJourney: (originText: string, destinationText: string) => Promise<any> | void;
  onSwapLocations: () => void;
  isCalculatingRoute?: boolean;
  onResetPresetRoutes?: () => void;
  simSpeed: '1x' | '2x';
  onToggleSimSpeed: (speed: '1x' | '2x') => void;
  focusPoint?: { coords: [number, number]; ts: number } | null;
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
  onOpenReportModal,
  originLocation,
  destinationLocation,
  onCalculateJourney,
  onSwapLocations,
  isCalculatingRoute = false,
  simSpeed,
  onToggleSimSpeed,
  focusPoint = null,
}) => {
  const [originInput, setOriginInput] = useState<string>(originLocation.name);
  const [destInput, setDestInput] = useState<string>(destinationLocation.name);
  const [isExpandedPlanner, setIsExpandedPlanner] = useState<boolean>(false);
  const [activeField, setActiveField] = useState<'origin' | 'destination' | null>(null);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>(POPULAR_LOCATIONS.slice(0, 5));
  const [visibleAlert, setVisibleAlert] = useState<DangerZone | null>(null);
  const [phoneClock, setPhoneClock] = useState<string>(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );

  const autoDismissTimerRef = useRef<number | null>(null);
  const debounceRef = useRef<number | null>(null);

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
  const remainingMin = isNavigating
    ? Math.max(1, Math.round(selectedRoute.durationMin * remainingFactor))
    : selectedRoute.durationMin;
  const remainingKm = isNavigating
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
    if (modifier?.includes('left')) return <CornerUpLeft className="w-5 h-5 text-white stroke-[2.5]" />;
    if (modifier?.includes('right')) return <CornerUpRight className="w-5 h-5 text-white stroke-[2.5]" />;
    return <ArrowUp className="w-5 h-5 text-white stroke-[2.5]" />;
  };

  return (
    <div className="flex flex-col items-center justify-center w-full py-2">
      {/* Smartphone Hardware Frame */}
      <div className="relative w-full max-w-[390px] h-[750px] rounded-[50px] bg-black border-[10px] border-neutral-900 shadow-[0_30px_80px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col select-none ring-1 ring-white/15">
        
        {/* Dynamic Island Pill */}
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center w-28 h-6 bg-black pointer-events-none rounded-full">
          <div className="w-2.5 h-2.5 rounded-full bg-neutral-900 border border-neutral-800 mr-2.5"></div>
          <div className="w-9 h-1 rounded-full bg-neutral-950"></div>
        </div>

        {/* Status Bar */}
        <div className="relative z-40 w-full px-7 pt-3 pb-1 flex items-center justify-between text-[11px] font-semibold text-neutral-800 bg-white/95 backdrop-blur-md border-b border-neutral-200">
          <span className="font-mono">{phoneClock}</span>
          <div className="flex items-center gap-1.5 font-mono text-[10px]">
            <span>5G</span>
            <div className="w-4 h-2 rounded-xs border border-neutral-800 p-0.5 flex items-center">
              <div className="w-full h-full bg-neutral-800"></div>
            </div>
          </div>
        </div>

        {/* Viewport Screen */}
        <div className="relative flex-1 w-full h-full overflow-hidden bg-neutral-950">

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
              focusPoint={focusPoint}
              className="w-full h-full border-0 rounded-none shadow-none"
            />
          </div>

          {/* 2. Top Header Overlay */}
          <div className="absolute top-0 left-0 right-0 z-30 p-2.5 space-y-2 pointer-events-auto">
            {isNavigating ? (
              /* Turn-by-Turn Guidance Header */
              <div className="bg-neutral-900/95 backdrop-blur-md text-white rounded-2xl p-3 shadow-xl flex items-center justify-between gap-3 border border-neutral-800">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-inner">
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
                        className="w-full pl-8 pr-7 py-1.5 bg-neutral-100 rounded-xl text-xs text-neutral-900 placeholder-neutral-400 border border-neutral-200 outline-none focus:border-neutral-400 font-medium"
                      />
                      {originInput && (
                        <button
                          type="button"
                          onClick={() => {
                            setOriginInput('');
                            setActiveField('origin');
                            triggerSuggestions('');
                          }}
                          className="absolute right-2 text-neutral-400 hover:text-neutral-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
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

            {/* 3. DEFESA CIVIL NOTIFICATION BANNER */}
            {visibleAlert && (
              <div className="animate-in slide-in-from-top-4 duration-300 rounded-2xl bg-neutral-950 text-white border border-neutral-800 shadow-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-neutral-400 border-b border-neutral-800 pb-1.5">
                  <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-neutral-200">
                    <AlertTriangle className="w-3.5 h-3.5 text-neutral-400" />
                    <span>DEFESA CIVIL SP &bull; ALERTA</span>
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

                {selectedRoute.type !== 'segura' ? (
                  <div className="pt-1 flex items-center gap-2">
                    <button
                      onClick={handleAcceptRerouteAndClose}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-white text-neutral-950 font-bold text-xs hover:bg-neutral-200 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-neutral-900" />
                      <span>Desviar Rota</span>
                    </button>
                    <button
                      onClick={handleDismiss}
                      className="py-1.5 px-3 rounded-xl bg-neutral-900 text-neutral-300 hover:bg-neutral-800 text-xs font-semibold transition-colors border border-neutral-800"
                    >
                      Dispensar
                    </button>
                  </div>
                ) : (
                  <div className="text-[11px] text-neutral-200 font-semibold bg-neutral-900 border border-neutral-800 p-2 rounded-xl text-center">
                    Desvio Seguro Ativo: trajeto monitorado sem zonas críticas.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 4. Floating Add Report Button */}
          <div className="absolute right-3 top-36 z-20 flex flex-col gap-2 pointer-events-auto">
            <button
              onClick={onOpenReportModal}
              className="w-8 h-8 rounded-full bg-neutral-900/90 backdrop-blur-md text-white hover:bg-neutral-800 border border-white/20 shadow-lg flex items-center justify-center transition-transform active:scale-90"
              title="Registrar ocorrência no mapa"
            >
              <Plus className="w-4 h-4" />
            </button>
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
          <div className="absolute bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-neutral-200 p-3.5 px-4 space-y-2 shadow-2xl text-neutral-900">
            <div className="w-8 h-1 bg-neutral-300 rounded-full mx-auto -mt-1"></div>

            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-baseline gap-2">
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

          {/* Home Indicator */}
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-28 h-1 bg-neutral-400 rounded-full z-40"></div>
        </div>
      </div>
    </div>
  );
};
