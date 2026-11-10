import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowLeft, MapPin, ChevronDown } from 'lucide-react';
import { IncidentCategory, RiskLevel, IncidentReport } from '../types';
import { SAO_PAULO_LOCATIONS, SaoPauloZone } from '../data/saoPauloLocations';
import { geocodeAddress } from '../services/routingService';

interface IncidentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    data: Omit<IncidentReport, 'id' | 'timestamp' | 'confirmationsCount' | 'status'>
  ) => Promise<any>;
}

const ZONE_FILTERS: ('Todas' | SaoPauloZone)[] = [
  'Todas',
  'Centro',
  'Zona Sul',
  'Zona Oeste',
  'Zona Leste',
  'Zona Norte',
  'Marginais e Pontes',
];

export const IncidentReportModal: React.FC<IncidentReportModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<IncidentCategory>('furto_celular');
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('alto');
  const [neighborhood, setNeighborhood] = useState('Capão Redondo');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<'Todas' | SaoPauloZone>('Todas');
  const [showNeighborhoodList, setShowNeighborhoodList] = useState(false);
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  const filteredLocations = useMemo(() => {
    const query = neighborhood.trim().toLowerCase();
    return SAO_PAULO_LOCATIONS.filter((entry) => {
      const zoneOk = selectedZoneFilter === 'Todas' || entry.zone === selectedZoneFilter;
      const textOk =
        !query ||
        entry.name.toLowerCase().includes(query) ||
        entry.zone.toLowerCase().includes(query);
      return zoneOk && textOk;
    });
  }, [neighborhood, selectedZoneFilter]);

  if (!isOpen || typeof document === 'undefined') return null;

  const resolveReportCoordinates = async (nbInput: string, addrInput: string): Promise<[number, number]> => {
    const cleanNb = nbInput.trim().toLowerCase();
    const curated = SAO_PAULO_LOCATIONS.find(
      (item) => item.name.toLowerCase() === cleanNb
    );

    if (curated) {
      return [
        curated.coordinates[0] + (Math.random() - 0.5) * 0.0025,
        curated.coordinates[1] + (Math.random() - 0.5) * 0.0025,
      ];
    }

    // Free-text neighborhood / street anywhere in São Paulo: geocode live
    try {
      const queryText = addrInput.trim()
        ? `${addrInput.trim()}, ${nbInput.trim()}, São Paulo - SP`
        : `${nbInput.trim()}, São Paulo - SP`;
      const geocoded = await geocodeAddress(queryText);
      return geocoded.coordinates;
    } catch {
      return [-23.5505, -46.6333];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !neighborhood.trim() || !address.trim() || !description.trim()) return;

    setIsSubmitting(true);
    try {
      const coordinates = await resolveReportCoordinates(neighborhood, address);

      await onSubmit({
        title,
        category,
        riskLevel,
        neighborhood: neighborhood.trim(),
        address: address.trim(),
        description: description.trim(),
        coordinates,
        reportedBy: 'Cidadão SafeRoute',
      });

      setTitle('');
      setAddress('');
      setDescription('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Registrar ocorrência urbana"
      onClick={onClose}
      className="fixed inset-0 z-[2000] flex flex-col sm:items-center sm:justify-center sm:p-4 bg-white dark:bg-neutral-950 sm:bg-black/75 sm:backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full h-[100dvh] sm:h-auto sm:max-w-lg sm:max-h-[92dvh] flex flex-col sm:rounded-2xl bg-white dark:bg-neutral-950 sm:border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white shadow-2xl overflow-hidden"
      >
        <div className="px-4 py-3.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between shrink-0 bg-white dark:bg-neutral-950">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="sm:hidden p-1.5 -ml-1 rounded-xl bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h3 className="font-bold text-sm tracking-tight">Registrar Ocorrência Urbana</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-900"
            aria-label="Fechar janela"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-xs">
          <div>
            <label className="block text-neutral-700 dark:text-neutral-300 mb-1 font-medium">
              Título *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Furto de celular no semáforo"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-neutral-700 dark:text-neutral-300 mb-1 font-medium">
                Tipo
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as IncidentCategory)}
                className="w-full px-2.5 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-400"
              >
                <option value="furto_celular">Furto de Celular</option>
                <option value="assalto">Assalto</option>
                <option value="arrastao">Arrastão</option>
                <option value="alagamento">Alagamento</option>
              </select>
            </div>

            <div>
              <label className="block text-neutral-700 dark:text-neutral-300 mb-1 font-medium">
                Nível de Risco
              </label>
              <select
                value={riskLevel}
                onChange={(e) => setRiskLevel(e.target.value as RiskLevel)}
                className="w-full px-2.5 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-400"
              >
                <option value="moderado">Moderado</option>
                <option value="alto">Alto</option>
                <option value="critico">Crítico</option>
              </select>
            </div>
          </div>

          {/* Free-text Bairro / Via Input + Filterable 70+ SP Catalog */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="block text-neutral-700 dark:text-neutral-300 font-medium">
                Bairro ou Via em São Paulo * (digite qualquer local)
              </label>
              <span className="text-[10px] font-mono text-neutral-500">
                {SAO_PAULO_LOCATIONS.length}+ locais
              </span>
            </div>

            {/* Zone Quick Filter Chips */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
              {ZONE_FILTERS.map((zone) => {
                const active = selectedZoneFilter === zone;
                return (
                  <button
                    key={zone}
                    type="button"
                    onClick={() => {
                      setSelectedZoneFilter(zone);
                      setShowNeighborhoodList(true);
                    }}
                    className={`px-2 py-1 rounded-lg border text-[10px] font-semibold whitespace-nowrap transition-colors shrink-0 ${
                      active
                        ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 border-neutral-950 dark:border-white'
                        : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800'
                    }`}
                  >
                    {zone}
                  </button>
                );
              })}
            </div>

            <div className="relative">
              <MapPin className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                required
                value={neighborhood}
                onChange={(e) => {
                  setNeighborhood(e.target.value);
                  setShowNeighborhoodList(true);
                }}
                onFocus={() => setShowNeighborhoodList(true)}
                onBlur={() => setTimeout(() => setShowNeighborhoodList(false), 180)}
                placeholder="Digite qualquer bairro ou avenida (ex: Capão Redondo, Grajaú, Pirituba...)"
                className="w-full pl-8 pr-8 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-400 font-medium"
              />
              <button
                type="button"
                onClick={() => setShowNeighborhoodList(!showNeighborhoodList)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white p-0.5"
                title="Abrir lista de bairros e vias"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${showNeighborhoodList ? 'rotate-180' : ''}`} />
              </button>

              {showNeighborhoodList && (
                <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800">
                  {filteredLocations.length > 0 ? (
                    filteredLocations.map((entry) => (
                      <button
                        key={`${entry.zone}-${entry.name}`}
                        type="button"
                        onMouseDown={() => {
                          setNeighborhood(entry.name);
                          setShowNeighborhoodList(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-between gap-2 transition-colors"
                      >
                        <span className="font-semibold text-neutral-950 dark:text-white truncate">
                          {entry.name}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-500 shrink-0">
                          {entry.zone}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2.5 text-[11px] text-neutral-600 dark:text-neutral-300">
                      Bairro personalizado: <strong>"{neighborhood}"</strong> será localizado automaticamente em São Paulo ao publicar.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-neutral-700 dark:text-neutral-300 mb-1 font-medium">
              Endereço / Referência *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Estrada de Itapecerica x Av. Carlos Caldeira Filho"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-400"
            />
          </div>

          <div>
            <label className="block text-neutral-700 dark:text-neutral-300 mb-1 font-medium">
              Descrição *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Descreva o que aconteceu (ex: abordagem no semáforo, quebra de vidro, alagamento)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-400 resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 font-bold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
            >
              {isSubmitting ? 'Localizando e enviando...' : 'Publicar Alerta'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
