import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ShieldAlert, PhoneCall, ArrowLeft } from 'lucide-react';
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
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Diretrizes Defesa Civil SP"
      onClick={onClose}
      className="fixed inset-0 z-[2000] flex justify-end bg-white dark:bg-neutral-950 sm:bg-black/75 sm:backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-[30rem] bg-white dark:bg-neutral-950 sm:border-l border-neutral-200 dark:border-neutral-800 h-[100dvh] flex flex-col text-neutral-900 dark:text-white shadow-2xl"
      >
        {/* Fixed Clean Header */}
        <div className="px-4 py-3.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-2 shrink-0 bg-white dark:bg-neutral-950">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="sm:hidden p-1.5 -ml-1 rounded-xl bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white shrink-0"
              aria-label="Voltar ao mapa"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <ShieldAlert className="w-4 h-4 text-neutral-900 dark:text-white shrink-0" />
            <h3 className="font-bold text-sm sm:text-base tracking-tight">Diretrizes Defesa Civil SP</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors shrink-0"
            aria-label="Fechar diretrizes"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Only (Scales cleanly from 14px up to 20px root accessibility) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Emergency phones */}
          <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5" /> Telefones de Emergência
            </span>
            <div className="grid grid-cols-2 gap-2 text-sm font-mono">
              <a
                href="tel:190"
                className="p-3 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex justify-between items-center gap-1 hover:border-neutral-400 transition-colors"
              >
                <span>PM</span>
                <strong className="text-neutral-950 dark:text-white">190</strong>
              </a>
              <a
                href="tel:199"
                className="p-3 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex justify-between items-center gap-1 hover:border-neutral-400 transition-colors"
              >
                <span>Defesa Civil</span>
                <strong className="text-neutral-950 dark:text-white">199</strong>
              </a>
              <a
                href="tel:153"
                className="p-3 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex justify-between items-center gap-1 hover:border-neutral-400 transition-colors"
              >
                <span>GCM</span>
                <strong className="text-neutral-950 dark:text-white">153</strong>
              </a>
              <a
                href="tel:181"
                className="p-3 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex justify-between items-center gap-1 hover:border-neutral-400 transition-colors"
              >
                <span>Denúncia</span>
                <strong className="text-neutral-950 dark:text-white">181</strong>
              </a>
            </div>
          </div>

          {/* Guides */}
          <div className="space-y-3.5">
            {DEFESA_CIVIL_SAFETY_GUIDES.map((guide) => (
              <div
                key={guide.id}
                className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-2.5"
              >
                <h4 className="font-bold text-sm sm:text-base text-neutral-950 dark:text-white leading-snug">
                  {guide.title}
                </h4>
                <ul className="space-y-2.5 text-sm text-neutral-700 dark:text-neutral-200">
                  {guide.tips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="text-neutral-500 dark:text-neutral-400 font-bold leading-relaxed">&bull;</span>
                      <span className="leading-relaxed">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed">
            Envie o CEP da sua residência por SMS gratuito para{' '}
            <strong className="text-neutral-950 dark:text-white font-mono">40199</strong> para receber
            comunicados oficiais da Defesa Civil.
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
