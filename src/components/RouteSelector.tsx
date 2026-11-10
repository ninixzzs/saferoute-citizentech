import React, { useState, useEffect } from 'react';
import { NavigationRoute } from '../types';
import { LocationSuggestion, POPULAR_LOCATIONS } from '../services/routingService';
import {
  Clock,
  MapPin,
  Search,
  Loader2,
  Navigation,
  ArrowUpDown,
  RotateCcw,
  ShieldCheck,
  Gauge
} from 'lucide-react';

interface RouteSelectorProps {
  routes: NavigationRoute[];
  selectedRouteId: string;
  onSelectRoute: (route: NavigationRoute) => void;
  isNavigating: boolean;
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

  // Sync inputs when props change
  useEffect(() => {
    setOriginInput(originLocation.name);
  }, [originLocation]);

  useEffect(() => {
    setDestinationInput(destinationLocation.name);
  }, [destinationLocation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNavigating || isCalculatingRoute) return;
    onCalculateJourney(originInput, destinationInput);
  };

  const handleQuickDestination = (dest: LocationSuggestion) => {
    if (isNavigating || isCalculatingRoute) return;
    setDestinationInput(dest.name);
    onCalculateJourney(originInput, dest.name);
  };

  return (
    <div className="space-y-4">
      {/* 1. Professional Route Planner Card (Origin & Destination) */}
      <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 space-y-3.5 shadow-sm">
        <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2.5">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Planejamento de Trajeto
            </h3>
          </div>

          {onResetPresetRoutes && !isNavigating && (
            <button
              onClick={() => {
                onResetPresetRoutes();
              }}
              className="text-[11px] text-neutral-400 hover:text-neutral-200 flex items-center gap-1 transition-colors"
              title="Restaurar rota padrão"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restaurar</span>
            </button>
          )}
        </div>

        {/* Inputs Form with Connected Connector Line */}
        <form onSubmit={handleSubmit} className="space-y-2.5">
          <div className="relative space-y-2">
            {/* Visual connector line between origin and destination */}
            <div className="absolute left-3.5 top-6 bottom-6 w-0.5 bg-neutral-700/60 pointer-events-none"></div>

            {/* Origin Input */}
            <div className="relative flex items-center">
              <div className="absolute left-3 z-10 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-950"></div>
              </div>
              <input
                type="text"
                value={originInput}
                onChange={(e) => setOriginInput(e.target.value)}
                placeholder="Ponto de partida (ex: Av. Paulista)..."
                disabled={isNavigating || isCalculatingRoute}
                className="w-full pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-700/80 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 transition-all font-medium disabled:opacity-50"
              />
            </div>

            {/* Destination Input & Swap Button */}
            <div className="relative flex items-center gap-2">
              <div className="relative flex-1">
                <div className="absolute left-3 z-10 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-red-950"></div>
                </div>
                <input
                  type="text"
                  value={destinationInput}
                  onChange={(e) => setDestinationInput(e.target.value)}
                  placeholder="Destino final (ex: Brás, Faria Lima, Ibirapuera)..."
                  disabled={isNavigating || isCalculatingRoute}
                  className="w-full pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-700/80 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 transition-all font-medium disabled:opacity-50"
                />
              </div>

              {/* Invert button */}
              <button
                type="button"
                onClick={onSwapLocations}
                disabled={isNavigating || isCalculatingRoute}
                className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white transition-colors disabled:opacity-50 shrink-0"
                title="Inverter ponto de partida e destino"
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action Row: Simulation Speed & Calculate Button */}
          <div className="pt-1 flex items-center justify-between gap-2">
            {/* Speed selection */}
            <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-lg border border-neutral-800 text-[11px]">
              <Gauge className="w-3.5 h-3.5 text-neutral-400 ml-1" />
              <button
                type="button"
                onClick={() => onToggleSimSpeed('1x')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                  simSpeed === '1x'
                    ? 'bg-neutral-800 text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                1x Normal
              </button>
              <button
                type="button"
                onClick={() => onToggleSimSpeed('2x')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                  simSpeed === '2x'
                    ? 'bg-neutral-800 text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                2x Rápido
              </button>
            </div>

            {/* Calculate Button */}
            <button
              type="submit"
              disabled={!destinationInput.trim() || isNavigating || isCalculatingRoute}
              className="px-4 py-2 bg-white text-neutral-950 font-bold text-xs rounded-xl hover:bg-neutral-200 transition-all active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-sm"
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

        {/* Quick Location Chips */}
        <div className="pt-1 border-t border-neutral-900">
          <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold mb-1.5">
            Destinos frequentes:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_LOCATIONS.slice(0, 6).map((loc) => (
              <button
                key={loc.name}
                type="button"
                disabled={isNavigating || isCalculatingRoute}
                onClick={() => handleQuickDestination(loc)}
                className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-[11px] text-neutral-300 transition-colors disabled:opacity-50"
              >
                {loc.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Routes Options List */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            Opções de Trajeto Analisadas
          </h3>
          <span className="text-[11px] text-neutral-500 font-mono">
            {routes.length} opções disponíveis
          </span>
        </div>

        <div className="space-y-2">
          {routes.map((route) => {
            const isSelected = route.id === selectedRouteId;
            const isSafe = route.type === 'segura';

            return (
              <div
                key={route.id}
                onClick={() => !isNavigating && onSelectRoute(route)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-neutral-900 border-neutral-300 ring-1 ring-neutral-400/20 shadow-md'
                    : 'bg-neutral-950 border-neutral-800/80 hover:border-neutral-700 hover:bg-neutral-900/50'
                } ${isNavigating ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-white">
                        {route.name}
                      </span>
                      {isSafe && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase tracking-tight flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Recomendado</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-neutral-400 font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-neutral-500" />
                        {route.durationMin} min
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-neutral-500" />
                        {route.distanceKm} km
                      </span>
                    </div>
                  </div>

                  {/* Safety Score */}
                  <div className="text-right">
                    <span className={`text-xs font-mono font-bold ${
                      route.safetyScore >= 85 ? 'text-emerald-400' : route.safetyScore >= 65 ? 'text-amber-400' : 'text-neutral-300'
                    }`}>
                      {route.safetyScore}/100
                    </span>
                    <span className="block text-[10px] text-neutral-500 font-sans">segurança</span>
                  </div>
                </div>

                <p className="text-[11px] text-neutral-400 mt-2 leading-relaxed">
                  {route.description}
                </p>

                {route.highlights && route.highlights.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-neutral-800/60 flex flex-wrap gap-2 text-[10px] text-neutral-400">
                    {route.highlights.map((h, i) => (
                      <span key={i} className="flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-neutral-600"></span>
                        <span>{h}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
