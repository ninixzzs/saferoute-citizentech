import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowLeft } from 'lucide-react';
import { IncidentCategory, RiskLevel, IncidentReport } from '../types';

interface IncidentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    data: Omit<IncidentReport, 'id' | 'timestamp' | 'confirmationsCount' | 'status'>
  ) => Promise<any>;
}

const NEIGHBORHOOD_COORDS: Record<string, [number, number]> = {
  'Sé / Centro': [-23.5505, -46.6333],
  'Santa Ifigênia': [-23.5375, -46.6372],
  'República': [-23.5435, -46.6433],
  'Brás': [-23.5432, -46.6087],
  'Bela Vista / Paulista': [-23.5587, -46.6601],
  'Pinheiros': [-23.5673, -46.6934],
  'Vila Madalena': [-23.5574, -46.6865],
  'Moema': [-23.6045, -46.6662],
  'Liberdade': [-23.5552, -46.6358],
  'Tatuapé': [-23.5404, -46.5768],
  'Santana': [-23.5042, -46.6264],
  'Morumbi': [-23.6000, -46.7201],
};

export const IncidentReportModal: React.FC<IncidentReportModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<IncidentCategory>('furto_celular');
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('alto');
  const [neighborhood, setNeighborhood] = useState('Santa Ifigênia');
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

  if (!isOpen || typeof document === 'undefined') return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !address.trim() || !description.trim()) return;

    setIsSubmitting(true);
    try {
      const coords = NEIGHBORHOOD_COORDS[neighborhood] || [-23.5505, -46.6333];
      const randomized: [number, number] = [
        coords[0] + (Math.random() - 0.5) * 0.003,
        coords[1] + (Math.random() - 0.5) * 0.003,
      ];

      await onSubmit({
        title,
        category,
        riskLevel,
        neighborhood,
        address,
        description,
        coordinates: randomized,
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
        className="w-full h-[100dvh] sm:h-auto sm:max-w-md sm:max-h-[90dvh] flex flex-col sm:rounded-2xl bg-white dark:bg-neutral-950 sm:border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white shadow-2xl overflow-hidden"
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
            <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-medium">Título *</label>
            <input
              type="text"
              required
              placeholder="Ex: Furto de celular no semáforo"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-medium">Tipo</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as IncidentCategory)}
                className="w-full px-2.5 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-400"
              >
                <option value="furto_celular">Furto de Celular</option>
                <option value="assalto">Assalto</option>
                <option value="arrastao">Arrastão</option>
                <option value="alagamento">Alagamento</option>
              </select>
            </div>

            <div>
              <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-medium">Bairro</label>
              <select
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                className="w-full px-2.5 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-400"
              >
                {Object.keys(NEIGHBORHOOD_COORDS).map((nb) => (
                  <option key={nb} value={nb}>{nb}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-medium">Nível de Risco</label>
            <select
              value={riskLevel}
              onChange={(e) => setRiskLevel(e.target.value as RiskLevel)}
              className="w-full px-2.5 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-400"
            >
              <option value="moderado">Moderado</option>
              <option value="alto">Alto</option>
              <option value="critico">Crítico</option>
            </select>
          </div>

          <div>
            <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-medium">Endereço / Referência *</label>
            <input
              type="text"
              required
              placeholder="Ex: Av. Rio Branco x Rua Aurora"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-400"
            />
          </div>

          <div>
            <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-medium">Descrição *</label>
            <textarea
              required
              rows={3}
              placeholder="Descreva a ocorrência..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-400 resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-lg bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 font-bold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
            >
              {isSubmitting ? 'Enviando...' : 'Publicar Alerta'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
