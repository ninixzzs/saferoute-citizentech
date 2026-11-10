import React from 'react';
import { NavigationRoute } from '../types';
import { SafetyScoreBadge } from './SafetyScoreBadge';
import { Clock, MapPin, ShieldCheck, AlertTriangle } from 'lucide-react';

interface RouteSelectorProps {
  routes: NavigationRoute[];
  selectedRouteId: string;
  onSelectRoute: (route: NavigationRoute) => void;
  isNavigating: boolean;
}

export const RouteSelector: React.FC<RouteSelectorProps> = ({
  routes,
  selectedRouteId,
  onSelectRoute,
  isNavigating,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
          Opções de Trajeto (São Paulo)
        </h3>
        <span className="text-xs text-slate-400">
          {routes.length} rotas analisadas
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {routes.map((route) => {
          const isSelected = route.id === selectedRouteId;
          const isSafe = route.type === 'segura';

          return (
            <div
              key={route.id}
              onClick={() => !isNavigating && onSelectRoute(route)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? isSafe
                    ? 'bg-emerald-950/30 border-emerald-500/60 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                    : 'bg-amber-950/20 border-amber-500/60 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              } ${isNavigating ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-100">
                      {route.name}
                    </span>
                    {isSafe && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-slate-950 uppercase tracking-wider">
                        Recomendado
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {route.durationMin} min
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {route.distanceKm} km
                    </span>
                  </div>
                </div>

                <SafetyScoreBadge score={route.safetyScore} size="sm" />
              </div>

              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                {route.description}
              </p>

              {/* Highlights */}
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex flex-wrap gap-1.5">
                {route.highlights.map((h, i) => (
                  <span
                    key={i}
                    className={`text-[11px] px-2 py-0.5 rounded-md ${
                      h.includes('⚠️')
                        ? 'bg-red-500/10 text-red-300 border border-red-500/20'
                        : isSafe
                        ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {h}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
