import React, { useState } from 'react';
import { NavigationRoute } from '../types';
import { LocationSuggestion, POPULAR_DESTINATIONS } from '../services/routingService';
import { Clock, MapPin, Search, Loader2, Navigation, RotateCcw, Sparkles } from 'lucide-react';

interface RouteSelectorProps {
  routes: NavigationRoute[];
  selectedRouteId: string;
  onSelectRoute: (route: NavigationRoute) => void;
  isNavigating: boolean;
  onSearchDestination?: (address: string) => Promise<any> | void;
  isCalculatingRoute?: boolean;
  currentDestination?: LocationSuggestion | null;
  onResetPresetRoutes?: () => void;
}

export const RouteSelector: React.FC<RouteSelectorProps> = ({
  routes,
  selectedRouteId,
  onSelectRoute,
  isNavigating,
  onSearchDestination,
  isCalculatingRoute = false,
  currentDestination = null,
  onResetPresetRoutes,
}) => {
  const [addressInput, setAddressInput] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressInput.trim() || isNavigating || !onSearchDestination) return;
    onSearchDestination(addressInput.trim());
  };

  const handleQuickDestinationClick = (dest: LocationSuggestion) => {
    if (isNavigating || !onSearchDestination) return;
    setAddressInput(dest.name);
    onSearchDestination(dest.address);
  };

  return (
    <div className="space-y-4">
      {/* 1. Address Search Bar for custom route tracing */}
      <div className="space-y-2.5 bg-neutral-950 p-3.5 rounded-xl border border-neutral-800">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-neutral-400" />
            <span>Traçar Rota para Qualquer Endereço</span>
          </label>
          {currentDestination && onResetPresetRoutes && !isNavigating && (
            <button
              onClick={() => {
                setAddressInput('');
                onResetPresetRoutes();
              }}
              className="text-[11px] text-neutral-400 hover:text-neutral-200 flex items-center gap-1 transition-colors"
              title="Restaurar rotas padrão de demonstração"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Rotas padrão</span>
            </button>
          )}
        </div>

        {/* Input & Submit Form */}
        <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              placeholder="Digite qualquer endereço, rua ou bairro (SP)..."
              disabled={isNavigating || isCalculatingRoute}
              className="w-full pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-700 focus:border-neutral-400 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-400 transition-all disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={!addressInput.trim() || isNavigating || isCalculatingRoute}
            className="px-3.5 py-2 bg-white text-neutral-950 font-bold text-xs rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0 shadow-sm"
          >
            {isCalculatingRoute ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Calculando...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Traçar Rota</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Suggestion Chips */}
        <div className="pt-1">
          <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold mb-1.5">
            Sugestões rápidas:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_DESTINATIONS.slice(0, 6).map((dest) => (
              <button
                key={dest.name}
                type="button"
                disabled={isNavigating || isCalculatingRoute}
                onClick={() => handleQuickDestinationClick(dest)}
                className="px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-[11px] text-neutral-300 transition-colors disabled:opacity-50"
              >
                {dest.name}
              </button>
            ))}
          </div>
        </div>

        {/* Active custom destination banner */}
        {currentDestination && (
          <div className="mt-2 p-2 bg-neutral-900/80 border border-neutral-700/60 rounded-lg text-[11px] flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-neutral-300">
              <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span className="font-semibold text-white truncate max-w-[240px]">
                {currentDestination.name}
              </span>
            </div>
            <span className="text-[10px] font-mono text-neutral-400">Personalizado</span>
          </div>
        )}
      </div>

      {/* 2. Routes List */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            {currentDestination ? 'Opções de Rota Calculadas' : 'Trajetos Disponíveis (SP)'}
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
              <div
                key={route.id}
                onClick={() => !isNavigating && onSelectRoute(route)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-neutral-900 border-neutral-300 ring-1 ring-neutral-400/20'
                    : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/50'
                } ${isNavigating ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-white">
                        {route.name}
                      </span>
                      {isSafe && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-950 uppercase tracking-tight">
                          Recomendado
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

                  {/* Score tag */}
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-neutral-200">
                      {route.safetyScore}/100
                    </span>
                    <span className="block text-[10px] text-neutral-500">segurança</span>
                  </div>
                </div>

                <p className="text-[11px] text-neutral-400 mt-2 leading-relaxed">
                  {route.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
