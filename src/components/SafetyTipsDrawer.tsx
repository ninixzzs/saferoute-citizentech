import React from 'react';
import { X, ShieldAlert, PhoneCall } from 'lucide-react';
import { DEFESA_CIVIL_SAFETY_GUIDES } from '../data/mockData';

interface SafetyTipsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SafetyTipsDrawer: React.FC<SafetyTipsDrawerProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-neutral-900 border-l border-neutral-800 h-full overflow-y-auto p-5 flex flex-col text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-neutral-300" />
            <h3 className="font-bold text-sm">Diretrizes Defesa Civil SP</h3>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Emergency phones */}
        <div className="my-4 p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
            <PhoneCall className="w-3 h-3" /> Emergência
          </span>
          <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
            <div className="p-2 rounded bg-neutral-900 flex justify-between">
              <span>PM</span>
              <strong className="text-white">190</strong>
            </div>
            <div className="p-2 rounded bg-neutral-900 flex justify-between">
              <span>Defesa Civil</span>
              <strong className="text-white">199</strong>
            </div>
            <div className="p-2 rounded bg-neutral-900 flex justify-between">
              <span>GCM</span>
              <strong className="text-white">153</strong>
            </div>
            <div className="p-2 rounded bg-neutral-900 flex justify-between">
              <span>Disque Denúncia</span>
              <strong className="text-white">181</strong>
            </div>
          </div>
        </div>

        {/* Guides */}
        <div className="space-y-3 flex-1 text-xs">
          {DEFESA_CIVIL_SAFETY_GUIDES.map((guide) => (
            <div key={guide.id} className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
              <h4 className="font-bold text-neutral-200">{guide.title}</h4>
              <ul className="space-y-1.5 text-[11px] text-neutral-400">
                {guide.tips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-neutral-500 font-bold">&bull;</span>
                    <span className="leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-400">
          Envie o CEP da sua residência por SMS gratuito para <strong>40199</strong> para receber comunicados oficiais da Defesa Civil.
        </div>
      </div>
    </div>
  );
};
