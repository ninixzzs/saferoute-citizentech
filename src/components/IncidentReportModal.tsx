import React, { useState } from 'react';
import { X, PlusCircle, AlertTriangle, MapPin, Send } from 'lucide-react';
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
  'Liberdade': [-23.5562, -46.6278],
  'Mooca': [-23.5540, -46.5980],
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
  const [reportedBy, setReportedBy] = useState('Cidadão SafeRoute');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !address.trim() || !description.trim()) {
      setErrorMsg('Por favor preencha todos os campos obrigatórios.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const coords = NEIGHBORHOOD_COORDS[neighborhood] || [-23.5505, -46.6333];
      // Add slight jitter so multiple reports don't land at identical coordinates
      const randomizedCoords: [number, number] = [
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
        coordinates: randomizedCoords,
        reportedBy: reportedBy || 'Cidadão Anônimo',
      });

      // Reset form & close
      setTitle('');
      setAddress('');
      setDescription('');
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Falha ao registrar ocorrência.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden text-slate-100 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                Reportar Alerta de Segurança
              </h3>
              <p className="text-xs text-slate-400">
                Alimente a rede colaborativa CitizenTech de São Paulo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Título do Alerta *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Puxão de celular no semáforo com moto"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Categoria da Ocorrência
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as IncidentCategory)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500/60"
              >
                <option value="furto_celular">📱 Furto de Smartphone</option>
                <option value="assalto">⚠️ Assalto / Abordagem</option>
                <option value="arrastao">🚨 Arrastão em Trânsito</option>
                <option value="alagamento">🌊 Ponto de Alagamento</option>
                <option value="iluminacao_precaria">💡 Iluminação Precária</option>
                <option value="outro">Outro Risco</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Gravidade do Risco
              </label>
              <select
                value={riskLevel}
                onChange={(e) => setRiskLevel(e.target.value as RiskLevel)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500/60"
              >
                <option value="moderado">Moderado (Atenção redobrada)</option>
                <option value="alto">Alto (Vidros fechados obrigatório)</option>
                <option value="critico">Crítico (Evitar passar pelo local)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Bairro / Região
              </label>
              <select
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500/60"
              >
                {Object.keys(NEIGHBORHOOD_COORDS).map((nb) => (
                  <option key={nb} value={nb}>
                    {nb}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Endereço ou Cruzamento *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Av. Rio Branco x Rua Aurora"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Descrição Detalhada do Fato *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Descreva como ocorreu a abordagem, horários de maior frequência, se havia veículos ou comparsas em fuga..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Identificação do Relator (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Motorista Uber / Camila (Moradora)"
              value={reportedBy}
              onChange={(e) => setReportedBy(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Transmitindo...' : 'Publicar Alerta'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
