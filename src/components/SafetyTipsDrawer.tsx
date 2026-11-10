import React from 'react';
import { X, ShieldAlert, PhoneCall, AlertTriangle, CloudRain, Smartphone, Lock } from 'lucide-react';
import { DEFESA_CIVIL_SAFETY_GUIDES } from '../data/mockData';

interface SafetyTipsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SafetyTipsDrawer: React.FC<SafetyTipsDrawerProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full overflow-y-auto p-6 flex flex-col shadow-2xl">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">
                Protocolos Defesa Civil SP
              </h3>
              <p className="text-xs text-slate-400">
                Guia prático de prevenção & autoproteção urbana
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

        {/* Emergency Contacts Direct Dial */}
        <div className="my-5 p-4 rounded-xl bg-red-950/40 border border-red-500/30 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-red-300 flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5" /> Telefones de Emergência SP
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <a
              href="tel:190"
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 flex items-center justify-between"
            >
              <span>Polícia Militar</span>
              <strong className="text-amber-400">190</strong>
            </a>
            <a
              href="tel:199"
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 flex items-center justify-between"
            >
              <span>Defesa Civil SP</span>
              <strong className="text-blue-400">199</strong>
            </a>
            <a
              href="tel:153"
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 flex items-center justify-between"
            >
              <span>Guarda Civil (GCM)</span>
              <strong className="text-emerald-400">153</strong>
            </a>
            <a
              href="tel:181"
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 flex items-center justify-between"
            >
              <span>Disque Denúncia</span>
              <strong className="text-purple-400">181</strong>
            </a>
          </div>
        </div>

        {/* Safety Protocol Guides */}
        <div className="space-y-4 flex-1">
          {DEFESA_CIVIL_SAFETY_GUIDES.map((guide) => (
            <div
              key={guide.id}
              className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                  {guide.category === 'furto_celular' ? (
                    <Smartphone className="w-4 h-4 text-amber-400" />
                  ) : guide.category === 'assalto' ? (
                    <Lock className="w-4 h-4 text-red-400" />
                  ) : (
                    <CloudRain className="w-4 h-4 text-blue-400" />
                  )}
                  <span>{guide.title}</span>
                </h4>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  {guide.badge}
                </span>
              </div>

              <ul className="space-y-2 text-xs text-slate-300">
                {guide.tips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold shrink-0">&bull;</span>
                    <span className="leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* SMS 40199 Card */}
        <div className="mt-6 p-4 rounded-xl bg-blue-950/30 border border-blue-500/30 text-xs text-blue-200 space-y-1">
          <p className="font-bold text-blue-300">
            Cadastre-se nos alertas SMS oficiais 40199:
          </p>
          <p className="text-[11px] text-slate-400">
            Envie o CEP da sua residência por SMS gratuito para o número <strong>40199</strong> para receber comunicados de tempestades e deslizamentos da Defesa Civil Estadual.
          </p>
        </div>
      </div>
    </div>
  );
};
