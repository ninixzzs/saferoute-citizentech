import React, { useState, useEffect, useRef } from 'react';
import { NavigationRoute } from '../types';
import {
  LocationSuggestion,
  POPULAR_LOCATIONS,
  searchAddressSuggestions,
  reverseGeocode,
} from '../services/routingService';
import {
  Clock,
  MapPin,
  Search,
  Loader2,
  Navigation,
  ArrowUpDown,
  RotateCcw,
  ShieldCheck,
  Gauge,
  X,
  LocateFixed,
} from 'lucide-react';

interface RouteSelectorProps {
  routes: NavigationRoute[];
  selectedRouteId: string;
  onSelectRoute: (route: NavigationRoute) => void;
  isNavigating: boolean;
  progressPercentage?: number;
  originLocation: LocationSuggestion;
  destinationLocation: LocationSuggestion;
  onCalculateJourney: (originText: string, destinationText: string) => Promise<any> | void;
  onSwapLocations: () => void;
  isCalculatingRoute?: boolean;
  onResetPresetRoutes?: () => void;
  simSpeed: '1x' | '2x';
  onToggleSimSpeed: (speed: '1x' | '2x') => void;
}

export const RouteSelector: React.FC<RouteSelectorProps> = ({
  routes,
  selectedRouteId,
  onSelectRoute,
  isNavigating,
  progressPercentage = 0,
  originLocation,
  destinationLocation,
  onCalculateJourney,
  onSwapLocations,
  isCalculatingRoute = false,
  onResetPresetRoutes,
  simSpeed,
  onToggleSimSpeed,
}) => {
  const [originInput, setOriginInput] = useState(originLocation.name);
  const [destinationInput, setDestinationInput] = useState(destinationLocation.name);
  const [activeField, setActiveField] = useState<'origin' | 'destination' | null>(null);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>(POPULAR_LOCATIONS.slice(0, 5));
  const [isLocatingGps, setIsLocatingGps] = useState(false);

  const debounceRef = useRef<number | null>(null);

  const handleUseCurrentLocation = () => {
    if (isNavigating || isCalculatingRoute || !navigator.geolocation) return;
    setIsLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const loc = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          setOriginInput(loc.name);
          if (destinationInput.trim()) {
            onCalculateJourney(loc.address, destinationInput);
          }
        } finally {
          setIsLocatingGps(false);
        }
      },
      () => {
        setIsLocatingGps(false);
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  useEffect(() => {
    setOriginInput(originLocation.name);
  }, [originLocation]);

  useEffect(() => {
    setDestinationInput(destinationLocation.name);
  }, [destinationLocation]);

  const triggerSuggestions = (query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      const results = await searchAddressSuggestions(query);
      setSuggestions(results);
    }, 250);
  };

  const handleOriginChange = (val: string) => {
    setOriginInput(val);
    setActiveField('origin');
    triggerSuggestions(val);
  };

  const handleDestChange = (val: string) => {
    setDestinationInput(val);
    setActiveField('destination');
    triggerSuggestions(val);
  };

  const handleSelectSuggestion = (loc: LocationSuggestion) => {
    if (activeField === 'origin') {
      setOriginInput(loc.name);
      setActiveField(null);
      if (destinationInput.trim()) {
        onCalculateJourney(loc.address, destinationInput);
      }
    } else {
      setDestinationInput(loc.name);
      setActiveField(null);
      onCalculateJourney(originInput, loc.address);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNavigating || isCalculatingRoute) return;
    setActiveField(null);
    onCalculateJourney(originInput, destinationInput);
  };

  const handleQuickDestination = (dest: LocationSuggestion) => {
    if (isNavigating || isCalculatingRoute) return;
    setDestinationInput(dest.name);
    setActiveField(null);
    onCalculateJourney(originInput, dest.address);
  };

  return (
    <div className="space-y-4">
      {/* 1. Route Planner Card */}
      <div className="bg-neutral-50 dark:bg-neutral-950/90 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-3.5 shadow-xs">
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-blue-600 dark:text-white" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
              Planejamento de Rota
            </h3>
          </div>

          {onResetPresetRoutes && !isNavigating && (
            <button
              type="button"
              onClick={onResetPresetRoutes}
              className="text-[11px] text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 transition-colors"
              title="Restaurar rota padrão"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restaurar</span>
            </button>
          )}
        </div>

        {/* Connected Origin & Destination Inputs */}
        <form onSubmit={handleSubmit} className="space-y-2.5">
          <div className="relative space-y-2">
            <div className="absolute left-3.5 top-6 bottom-6 w-0.5 bg-neutral-300 dark:bg-neutral-700 pointer-events-none"></div>

            {/* Origin Input */}
            <div className="relative flex items-center">
              <div className="absolute left-3 z-10 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-white dark:bg-white ring-2 ring-neutral-400 dark:ring-neutral-700"></div>
              </div>
              <input
                type="text"
                value={originInput}
                onChange={(e) => handleOriginChange(e.target.value)}
                onFocus={() => {
                  setActiveField('origin');
                  triggerSuggestions(originInput);
                }}
                onBlur={() => setTimeout(() => setActiveField(null), 220)}
                placeholder="Partida (rua, bairro ou CEP)..."
                aria-label="Ponto de partida"
                disabled={isNavigating || isCalculatingRoute}
                className="w-full pl-9 pr-14 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-blue-500 dark:focus:border-neutral-400 focus:ring-1 focus:ring-blue-500/30 transition-all font-medium disabled:opacity-50"
              />
              <div className="absolute right-2 flex items-center gap-1">
                {originInput && !isNavigating && (
                  <button
                    type="button"
                    onClick={() => {
                      setOriginInput('');
                      setActiveField('origin');
                      triggerSuggestions('');
                    }}
                    className="p-0.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                    title="Limpar origem"
                    aria-label="Limpar origem"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                {!isNavigating && (
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={isLocatingGps}
                    className="p-1 text-neutral-500 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-white transition-colors"
                    title="Usar minha localização GPS atual"
                    aria-label="Usar minha localização GPS atual"
                  >
                    {isLocatingGps ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <LocateFixed className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Destination Input & Swap Button */}
            <div className="relative flex items-center gap-2">
              <div className="relative flex-1">
                <div className="absolute left-3 z-10 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-neutral-900 dark:bg-neutral-400 ring-2 ring-neutral-300 dark:ring-neutral-700"></div>
                </div>
                <input
                  type="text"
                  value={destinationInput}
                  onChange={(e) => handleDestChange(e.target.value)}
                  onFocus={() => {
                    setActiveField('destination');
                    triggerSuggestions(destinationInput);
                  }}
                  onBlur={() => setTimeout(() => setActiveField(null), 220)}
                  placeholder="Destino final (qualquer endereço)..."
                  aria-label="Destino final"
                  disabled={isNavigating || isCalculatingRoute}
                  className="w-full pl-9 pr-8 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-blue-500 dark:focus:border-neutral-400 focus:ring-1 focus:ring-blue-500/30 transition-all font-medium disabled:opacity-50"
                />
                {destinationInput && !isNavigating && (
                  <button
                    type="button"
                    onClick={() => {
                      setDestinationInput('');
                      setActiveField('destination');
                      triggerSuggestions('');
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                    title="Limpar destino"
                    aria-label="Limpar destino"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={onSwapLocations}
                disabled={isNavigating || isCalculatingRoute}
                className="p-2.5 rounded-xl bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors disabled:opacity-50 shrink-0"
                title="Inverter ponto de partida e destino"
                aria-label="Inverter ponto de partida e destino"
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>
            </div>

            {/* Live Autocomplete Dropdown */}
            {activeField && suggestions.length > 0 && !isNavigating && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-2xl overflow-hidden max-h-52 overflow-y-auto">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-black/40">
                  {activeField === 'origin' ? 'Selecionar Partida' : 'Selecionar Destino'}
                </div>
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {suggestions.map((loc, idx) => (
                    <button
                      key={`${loc.name}-${idx}`}
                      type="button"
                      onMouseDown={() => handleSelectSuggestion(loc)}
                      className="w-full px-3 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2.5 transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-neutral-900 dark:text-white truncate">{loc.name}</div>
                        <div className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">{loc.address}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Controls: Speed & Calculate Button */}
          <div className="pt-1 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-white dark:bg-neutral-900 p-1 rounded-xl border border-neutral-200 dark:border-neutral-800 text-[11px]">
              <Gauge className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400 ml-1" />
              <button
                type="button"
                onClick={() => onToggleSimSpeed('1x')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                  simSpeed === '1x'
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 shadow-xs'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                1x Normal
              </button>
              <button
                type="button"
                onClick={() => onToggleSimSpeed('2x')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                  simSpeed === '2x'
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 shadow-xs'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                2x Rápido
              </button>
            </div>

            <button
              type="submit"
              disabled={!destinationInput.trim() || isNavigating || isCalculatingRoute}
              className="px-4 py-2 bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 font-bold text-xs rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-sm"
            >
              {isCalculatingRoute ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Calculando...</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>Calcular Trajeto</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Active Trip Progress Indicator */}
        {isNavigating && (
          <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-neutral-700 dark:text-neutral-300">
              <span>Progresso do trajeto</span>
              <span>{progressPercentage}%</span>
            </div>
            <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-700 rounded-full"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Quick Location Chips */}
        <div className="pt-1.5 border-t border-neutral-200 dark:border-neutral-800">
          <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold mb-1.5">
            Destinos rápidos em SP:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_LOCATIONS.slice(0, 6).map((loc) => (
              <button
                key={loc.name}
                type="button"
                disabled={isNavigating || isCalculatingRoute}
                onClick={() => handleQuickDestination(loc)}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 text-[11px] text-neutral-700 dark:text-neutral-300 transition-colors disabled:opacity-50"
              >
                {loc.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Route Comparison Cards */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
            Opções de Trajeto Analisadas
          </h3>
          <span className="text-[11px] text-neutral-500 font-mono">
            {routes.length} opções
          </span>
        </div>

        <div className="space-y-2">
          {routes.map((route) => {
            const isSelected = route.id === selectedRouteId;
            const isSafe = route.type === 'segura';

            return (
              <button
                type="button"
                key={route.id}
                onClick={() => !isNavigating && onSelectRoute(route)}
                disabled={isNavigating}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                  isSelected
                    ? 'bg-neutral-100 dark:bg-neutral-900 border-neutral-900 dark:border-neutral-400 ring-1 ring-neutral-900/15 dark:ring-white/15 shadow-md'
                    : 'bg-white dark:bg-neutral-950/80 border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-900/70'
                } ${isNavigating ? 'opacity-65 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-xs text-neutral-950 dark:text-white">
                        {route.name}
                      </span>
                      {isSafe && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral-900 dark:bg-neutral-800 text-white dark:text-neutral-200 border border-neutral-800 dark:border-neutral-700 uppercase tracking-tight flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Recomendado</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-neutral-600 dark:text-neutral-400 font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-neutral-400 dark:text-neutral-500" />
                        {route.durationMin} min
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-neutral-400 dark:text-neutral-500" />
                        {route.distanceKm} km
                      </span>
                    </div>
                  </div>

                  {/* Safety Score */}
                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-bold text-neutral-950 dark:text-white">
                      {route.safetyScore}/100
                    </span>
                    <div className="w-12 h-1 bg-neutral-200 dark:bg-neutral-800 rounded-full mt-1 overflow-hidden ml-auto">
                      <div
                        className="h-full bg-neutral-900 dark:bg-white rounded-full"
                        style={{ width: `${route.safetyScore}%` }}
                      />
                    </div>
                    <span className="block text-[9px] text-neutral-500 font-sans mt-0.5">
                      segurança
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-2 leading-relaxed">
                  {route.description}
                </p>

                {route.highlights && route.highlights.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-neutral-200/70 dark:border-neutral-800/70 flex flex-wrap gap-2 text-[10px] text-neutral-500 dark:text-neutral-400">
                    {route.highlights.map((h, i) => (
                      <span key={i} className="flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-neutral-400 dark:bg-neutral-600"></span>
                        <span>{h}</span>
                      </span>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
