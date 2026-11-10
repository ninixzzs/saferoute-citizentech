import React from 'react';
import { NavigationRoute } from '../types';
import { Clock, MapPin, Check } from 'lucide-react';

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
    <div className="space-y-2.5">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
          Trajetos Disponíveis (SP)
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
  );
};
