import React from 'react';
import {
  CornerUpRight,
  CornerUpLeft,
  ArrowUp,
  Flag,
  MapPin,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { NavigationRoute } from '../types';

interface RouteItineraryProps {
  selectedRoute: NavigationRoute;
  isNavigating: boolean;
  progressPercentage: number;
}

export const RouteItinerary: React.FC<RouteItineraryProps> = ({
  selectedRoute,
  isNavigating,
  progressPercentage,
}) => {
  const steps = selectedRoute.steps || [];
  const streetNames = selectedRoute.streetNames || [];

  const activeStepIndex =
    isNavigating && steps.length > 0
      ? Math.min(steps.length - 1, Math.floor((progressPercentage / 100) * steps.length))
      : -1;

  const renderIcon = (instruction: string, modifier?: string, isActive?: boolean) => {
    const cls = `w-4 h-4 ${isActive ? 'text-white dark:text-neutral-950' : 'text-neutral-600 dark:text-neutral-300'}`;
    if (instruction.toLowerCase().includes('chegada')) return <Flag className={cls} />;
    if (modifier?.includes('left')) return <CornerUpLeft className={cls} />;
    if (modifier?.includes('right')) return <CornerUpRight className={cls} />;
    return <ArrowUp className={cls} />;
  };

  return (
    <div className="space-y-3">
      {/* Route Summary Header */}
      <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-neutral-950 dark:text-white truncate">
              {selectedRoute.name}
            </h3>
            <p className="text-[11px] text-neutral-700 dark:text-neutral-300 mt-0.5 leading-relaxed">
              {selectedRoute.description}
            </p>
          </div>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 shrink-0">
            {selectedRoute.safetyScore}/100
          </span>
        </div>

        <div className="flex items-center gap-4 pt-1 border-t border-neutral-200 dark:border-neutral-800 text-[11px] font-mono text-neutral-700 dark:text-neutral-300">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {selectedRoute.durationMin} min
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {selectedRoute.distanceKm} km
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            {selectedRoute.dangerZoneIds.length === 0
              ? 'Sem zonas críticas'
              : `${selectedRoute.dangerZoneIds.length} zona(s) de atenção`}
          </span>
        </div>
      </div>

      {/* Turn-by-Turn Steps List */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-200">
            Instruções Passo a Passo
          </span>
          <span className="text-[10px] font-mono font-semibold text-neutral-600 dark:text-neutral-300">
            {steps.length > 0 ? `${steps.length} etapas` : `${streetNames.length || 1} vias`}
          </span>
        </div>

        <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
          {steps.length > 0 ? (
            steps.map((step, idx) => {
              const isActive = idx === activeStepIndex;
              const isPassed = isNavigating && idx < activeStepIndex;

              return (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border flex items-center gap-3 transition-all ${
                    isActive
                      ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 border-neutral-950 dark:border-white shadow-md'
                      : isPassed
                      ? 'bg-neutral-100/60 dark:bg-neutral-900/40 border-neutral-200/60 dark:border-neutral-800/50 opacity-55'
                      : 'bg-white dark:bg-neutral-950/70 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive
                        ? 'bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-950'
                        : 'bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800'
                    }`}
                  >
                    {renderIcon(step.instruction, step.modifier, isActive)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold truncate">{step.instruction}</div>
                    <div
                      className={`text-[11px] truncate ${
                        isActive ? 'text-neutral-300 dark:text-neutral-600' : 'text-neutral-500 dark:text-neutral-400'
                      }`}
                    >
                      {step.street}
                    </div>
                  </div>

                  <span
                    className={`text-[11px] font-mono tabular-nums shrink-0 ${
                      isActive ? 'text-neutral-200 dark:text-neutral-700 font-bold' : 'text-neutral-500'
                    }`}
                  >
                    {step.distanceMeters >= 1000
                      ? `${(step.distanceMeters / 1000).toFixed(1)} km`
                      : `${step.distanceMeters} m`}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 text-center">
              Calcule um trajeto personalizado ou selecione uma rota para ver todas as curvas e vias detalhadas.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
