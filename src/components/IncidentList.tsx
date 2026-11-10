import React from 'react';
import { IncidentReport, IncidentCategory, RiskLevel } from '../types';
import { Search, Trash2, CheckCircle2, MapPin, ThumbsUp, RefreshCw, Crosshair } from 'lucide-react';

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
  onFocusIncident?: (coords: [number, number]) => void;
}

export const IncidentList: React.FC<IncidentListProps> = ({
  incidents,
  loading,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  onConfirm,
  onUpdateStatus,
  onDelete,
  onResetData,
  onFocusIncident,
}) => {
  const categories: { key: IncidentCategory | 'todos'; label: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'furto_celular', label: 'Furto de Celular' },
    { key: 'assalto', label: 'Assalto' },
    { key: 'arrastao', label: 'Arrastão' },
    { key: 'alagamento', label: 'Alagamento' },
  ];

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-200">
            Ocorrências e Alertas Comunitários
          </h3>
          <p className="text-[11px] text-neutral-500">
            Relatos verificados na cidade de São Paulo
          </p>
        </div>

        <button
          type="button"
          onClick={onResetData}
          className="text-[11px] text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 flex items-center gap-1 transition-colors"
          title="Restaurar dados"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Restaurar</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filtrar por bairro ou rua..."
            aria-label="Filtrar ocorrências por bairro ou rua"
            className="w-full pl-9 pr-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-blue-500 dark:focus:border-neutral-600"
          />
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {categories.map((cat) => (
            <button
              type="button"
              key={cat.key}
              onClick={() => onCategoryChange(cat.key)}
              className={`px-2.5 py-1 rounded-lg text-[11px] transition-colors whitespace-nowrap ${
                selectedCategory === cat.key
                  ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 font-bold'
                  : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white border border-neutral-200 dark:border-neutral-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="py-6 text-center text-xs text-neutral-500">
          Carregando ocorrências...
        </div>
      ) : incidents.length === 0 ? (
        <div className="py-6 text-center text-xs text-neutral-500 border border-dashed border-neutral-300 dark:border-neutral-800 rounded-xl">
          Nenhuma ocorrência encontrada.
        </div>
      ) : (
        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
          {incidents.map((inc) => (
            <div
              key={inc.id}
              className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-2 text-xs transition-colors hover:border-neutral-300 dark:hover:border-neutral-700"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-neutral-950 dark:text-white">
                      {inc.title}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-neutral-200/70 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700">
                      {inc.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-neutral-500 mt-0.5">
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{inc.neighborhood} &bull; {inc.address}</span>
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onDelete(inc.id)}
                  className="text-neutral-400 hover:text-neutral-900 dark:text-neutral-600 dark:hover:text-neutral-200 p-1 shrink-0 transition-colors"
                  title="Excluir ocorrência"
                  aria-label="Excluir ocorrência"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed bg-white dark:bg-neutral-900/60 p-2 rounded-lg border border-neutral-100 dark:border-neutral-800/70">
                {inc.description}
              </p>

              <div className="flex items-center justify-between text-[10px] text-neutral-500 pt-1 border-t border-neutral-200/70 dark:border-neutral-900">
                <span>{inc.timestamp}</span>
                <div className="flex items-center gap-1.5">
                  {onFocusIncident && (
                    <button
                      type="button"
                      onClick={() => onFocusIncident(inc.coordinates)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white border border-neutral-200 dark:border-neutral-800 transition-colors"
                      title="Centralizar ocorrência no mapa"
                    >
                      <Crosshair className="w-3 h-3" />
                      <span>Ver no mapa</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onConfirm(inc.id)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white border border-neutral-200 dark:border-neutral-800 transition-colors"
                    title="Confirmar ocorrência"
                  >
                    <ThumbsUp className="w-3 h-3" />
                    <span>{inc.confirmationsCount}</span>
                  </button>
                  {inc.status !== 'resolvido' && (
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(inc.id, 'resolvido')}
                      className="flex items-center gap-1 px-2 py-0.5 rounded bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white border border-neutral-200 dark:border-neutral-800 transition-colors"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Resolver</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
