import React from 'react';
import { IncidentReport, IncidentCategory, RiskLevel } from '../types';
import {
  AlertCircle,
  ThumbsUp,
  Trash2,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  RefreshCw,
  MapPin,
} from 'lucide-react';

interface IncidentListProps {
  incidents: IncidentReport[];
  loading: boolean;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  selectedCategory: IncidentCategory | 'todos';
  onCategoryChange: (val: IncidentCategory | 'todos') => void;
  selectedRisk: RiskLevel | 'todos';
  onRiskChange: (val: RiskLevel | 'todos') => void;
  onConfirm: (id: string) => void;
  onUpdateStatus: (id: string, status: 'ativo' | 'em_verificacao' | 'resolvido') => void;
  onDelete: (id: string) => void;
  onResetData: () => void;
}

export const IncidentList: React.FC<IncidentListProps> = ({
  incidents,
  loading,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedRisk,
  onRiskChange,
  onConfirm,
  onUpdateStatus,
  onDelete,
  onResetData,
}) => {
  const categories: { key: IncidentCategory | 'todos'; label: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'furto_celular', label: 'Furto de Celular' },
    { key: 'assalto', label: 'Assalto' },
    { key: 'arrastao', label: 'Arrastão' },
    { key: 'alagamento', label: 'Alagamento' },
    { key: 'iluminacao_precaria', label: 'Iluminação Precária' },
  ];

  return (
    <div className="space-y-4">
      {/* Header and Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>Rede CitizenTech de Ocorrências</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
              CRUD Ativo
            </span>
          </h3>
          <p className="text-xs text-slate-400">
            Relatos da comunidade e alertas verificados em São Paulo
          </p>
        </div>

        <button
          onClick={onResetData}
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors self-end sm:self-auto"
          title="Restaurar dados originais de demonstração"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Restaurar Mock</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Pesquisar por rua, bairro ou tipo de alerta (ex: Sé, Santa Ifigênia)..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40 transition-all"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => onCategoryChange(cat.key)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === cat.key
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Incidents Feed */}
      {loading ? (
        <div className="py-8 text-center text-xs text-slate-400">
          Carregando alertas da comunidade...
        </div>
      ) : incidents.length === 0 ? (
        <div className="py-8 text-center bg-slate-900/40 rounded-xl border border-slate-800 p-6 space-y-2">
          <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">
            Nenhuma ocorrência encontrada com estes filtros.
          </p>
          <p className="text-xs text-slate-500">
            Experimente buscar outro termo ou registrar um novo alerta.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map((inc) => {
            const isResolved = inc.status === 'resolvido';

            return (
              <div
                key={inc.id}
                className={`p-4 rounded-xl border transition-all ${
                  isResolved
                    ? 'bg-slate-900/40 border-slate-800/60 opacity-75'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-100">
                        {inc.title}
                      </h4>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          inc.status === 'ativo'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                            : inc.status === 'em_verificacao'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}
                      >
                        {inc.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1 text-amber-400">
                        <MapPin className="w-3.5 h-3.5" />
                        {inc.neighborhood} &bull; {inc.address}
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <Clock className="w-3 h-3" />
                        {inc.timestamp}
                      </span>
                    </div>
                  </div>

                  {/* Delete button (CRUD Delete) */}
                  <button
                    onClick={() => onDelete(inc.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                    title="Excluir alerta (CRUD Delete)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-300 mt-2.5 leading-relaxed bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
                  {inc.description}
                </p>

                {/* Footer and Interactive CRUD Actions */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500">
                    Fonte: <strong className="text-slate-400">{inc.reportedBy}</strong>
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Confirm Button */}
                    <button
                      onClick={() => onConfirm(inc.id)}
                      className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      title="Confirmar veracidade deste alerta"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{inc.confirmationsCount} Confirmar</span>
                    </button>

                    {/* Toggle Status */}
                    {inc.status !== 'resolvido' ? (
                      <button
                        onClick={() => onUpdateStatus(inc.id, 'resolvido')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 transition-colors"
                        title="Marcar como resolvido"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Resolver</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onUpdateStatus(inc.id, 'ativo')}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-colors"
                      >
                        Reabrir
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
