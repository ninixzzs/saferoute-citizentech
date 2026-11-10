import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ShieldAlert, PhoneCall } from 'lucide-react';
import { DEFESA_CIVIL_SAFETY_GUIDES } from '../data/mockData';

interface SafetyTipsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SafetyTipsDrawer: React.FC<SafetyTipsDrawerProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Diretrizes Defesa Civil SP"
      onClick={onClose}
      className="fixed inset-0 z-[1000] flex justify-end bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-white dark:bg-neutral-950 border-l border-neutral-200 dark:border-neutral-800 h-full overflow-y-auto p-5 flex flex-col text-neutral-900 dark:text-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
            <h3 className="font-bold text-sm">Diretrizes Defesa Civil SP</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white p-1"
            aria-label="Fechar diretrizes"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Emergency phones */}
        <div className="my-4 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
            <PhoneCall className="w-3 h-3" /> Emergência
          </span>
          <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
            <div className="p-2 rounded bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex justify-between">
              <span>PM</span>
              <strong className="text-neutral-950 dark:text-white">190</strong>
            </div>
            <div className="p-2 rounded bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex justify-between">
              <span>Defesa Civil</span>
              <strong className="text-neutral-950 dark:text-white">199</strong>
            </div>
            <div className="p-2 rounded bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex justify-between">
              <span>GCM</span>
              <strong className="text-neutral-950 dark:text-white">153</strong>
            </div>
            <div className="p-2 rounded bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex justify-between">
              <span>Denúncia</span>
              <strong className="text-neutral-950 dark:text-white">181</strong>
            </div>
          </div>
        </div>

        {/* Guides */}
        <div className="space-y-3 flex-1 text-xs">
          {DEFESA_CIVIL_SAFETY_GUIDES.map((guide) => (
            <div
              key={guide.id}
              className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-2"
            >
              <h4 className="font-bold text-neutral-900 dark:text-neutral-200">{guide.title}</h4>
              <ul className="space-y-1.5 text-[11px] text-neutral-600 dark:text-neutral-400">
                {guide.tips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-neutral-400 dark:text-neutral-500 font-bold">&bull;</span>
                    <span className="leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-600 dark:text-neutral-400">
          Envie o CEP da sua residência por SMS gratuito para <strong>40199</strong> para receber comunicados oficiais da Defesa Civil.
        </div>
      </div>
    </div>,
    document.body
  );
};
