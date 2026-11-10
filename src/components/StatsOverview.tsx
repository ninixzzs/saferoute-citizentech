import React from 'react';
import { ShieldCheck, AlertTriangle, Users, Activity } from 'lucide-react';

interface StatsOverviewProps {
  totalIncidents: number;
  totalDangerZones: number;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  totalIncidents,
  totalDangerZones,
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">
            Zonas Críticas SP
          </span>
          <AlertTriangle className="w-4 h-4 text-amber-400" />
        </div>
        <div className="text-2xl font-black font-mono text-white">
          {totalDangerZones}
        </div>
        <p className="text-[11px] text-amber-400/90 mt-1 font-medium">
          Mapeadas via SSP / Defesa Civil
        </p>
      </div>

      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">
            Ocorrências Ativas
          </span>
          <Activity className="w-4 h-4 text-red-400" />
        </div>
        <div className="text-2xl font-black font-mono text-white">
          {totalIncidents}
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          Últimas 24h na Grande SP
        </p>
      </div>

      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">
            Eficácia de Desvio
          </span>
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="text-2xl font-black font-mono text-emerald-400">
          98.2%
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          Rotas sem incidentes reportados
        </p>
      </div>

      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">
            Rede CitizenTech
          </span>
          <Users className="w-4 h-4 text-blue-400" />
        </div>
        <div className="text-2xl font-black font-mono text-white">
          14.8k
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          Cidadãos e motoristas ativos
        </p>
      </div>
    </div>
  );
};
