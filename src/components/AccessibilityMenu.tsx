import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Accessibility,
  Sun,
  Moon,
  Monitor,
  Type,
  Contrast,
  RotateCcw,
  ChevronDown,
  Volume2,
  VolumeX,
  ArrowLeft,
} from 'lucide-react';
import { ThemeMode, FontSizeScale } from '../hooks/useAccessibility';

interface AccessibilityMenuProps {
  themeMode: ThemeMode;
  onChangeTheme: (mode: ThemeMode) => void;
  fontSize: FontSizeScale;
  onChangeFontSize: (scale: FontSizeScale) => void;
  onIncreaseFont: () => void;
  onDecreaseFont: () => void;
  highContrast: boolean;
  onToggleHighContrast: () => void;
  voiceEnabled?: boolean;
  onToggleVoice?: () => void;
  onReset: () => void;
}

export const AccessibilityMenu: React.FC<AccessibilityMenuProps> = ({
  themeMode,
  onChangeTheme,
  fontSize,
  onChangeFontSize,
  onIncreaseFont,
  onDecreaseFont,
  highContrast,
  onToggleHighContrast,
  voiceEnabled,
  onToggleVoice,
  onReset,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileSheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      const inTrigger = menuRef.current?.contains(target);
      const inMobileSheet = mobileSheetRef.current?.contains(target);
      if (!inTrigger && !inMobileSheet) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const prevOverflow = document.body.style.overflow;
    if (window.innerWidth < 640) {
      document.body.style.overflow = 'hidden';
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown, { passive: true });
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const themeOptions: { id: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { id: 'light', label: 'Claro', icon: <Sun className="w-4 h-4 sm:w-3.5 sm:h-3.5" /> },
    { id: 'dark', label: 'Noturno', icon: <Moon className="w-4 h-4 sm:w-3.5 sm:h-3.5" /> },
    { id: 'system', label: 'Aparelho', icon: <Monitor className="w-4 h-4 sm:w-3.5 sm:h-3.5" /> },
  ];

  const fontOptions: { id: FontSizeScale; label: string }[] = [
    { id: 'sm', label: 'A-' },
    { id: 'md', label: 'A' },
    { id: 'lg', label: 'A+' },
    { id: 'xl', label: 'A++' },
  ];

  const renderPanelContent = (isMobileSheet: boolean) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 flex items-center justify-center">
            <Accessibility className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider block leading-none">
              Acessibilidade &amp; Tema
            </span>
            <span className="text-[10px] text-neutral-500 mt-0.5 block">
              Ajuste visual e sonoro do aplicativo
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onReset}
            className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white flex items-center gap-1 transition-colors px-2.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
            title="Restaurar configurações padrão"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Padrão</span>
          </button>
          {isMobileSheet && (
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 flex items-center gap-1 text-xs font-semibold"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </button>
          )}
        </div>
      </div>

      {/* Theme Mode Selector */}
      <div className="space-y-2">
        <label className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
          Modo de Exibição
        </label>
        <div className="grid grid-cols-3 gap-1.5 bg-neutral-100 dark:bg-neutral-900 p-1 rounded-xl border border-neutral-200 dark:border-neutral-800">
          {themeOptions.map((opt) => {
            const active = themeMode === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChangeTheme(opt.id)}
                className={`min-h-[44px] sm:min-h-0 py-2 px-2 rounded-lg text-[11px] font-semibold flex flex-col items-center justify-center gap-1 transition-all ${
                  active
                    ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {opt.icon}
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Font Size Controls */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5" />
            <span>Tamanho da Fonte</span>
          </label>
          <span className="text-[11px] font-mono font-bold text-neutral-700 dark:text-neutral-300">
            {fontSize === 'sm' ? '14px' : fontSize === 'md' ? '16px' : fontSize === 'lg' ? '18px' : '20px'}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1.5 bg-neutral-100 dark:bg-neutral-900 p-1 rounded-xl border border-neutral-200 dark:border-neutral-800">
          {fontOptions.map((opt) => {
            const active = fontSize === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChangeFontSize(opt.id)}
                className={`min-h-[42px] sm:min-h-0 py-2 rounded-lg text-xs font-bold transition-all ${
                  active
                    ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Toggles: High Contrast + Voice Guidance */}
      <div className="pt-1 border-t border-neutral-100 dark:border-neutral-800 space-y-1.5">
        <button
          type="button"
          role="switch"
          aria-checked={highContrast}
          onClick={onToggleHighContrast}
          className="w-full min-h-[44px] flex items-center justify-between py-2 px-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/70 hover:bg-neutral-100 dark:hover:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800 transition-colors"
        >
          <span className="flex items-center gap-2 text-xs font-semibold">
            <Contrast className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
            <span>Alto Contraste</span>
          </span>
          <span
            className={`w-10 h-5 rounded-full transition-colors p-0.5 flex items-center ${
              highContrast ? 'bg-neutral-950 dark:bg-white justify-end' : 'bg-neutral-300 dark:bg-neutral-700 justify-start'
            }`}
          >
            <span className={`w-4 h-4 rounded-full shadow-xs ${highContrast ? 'bg-white dark:bg-neutral-950' : 'bg-white'}`} />
          </span>
        </button>

        {typeof voiceEnabled === 'boolean' && onToggleVoice && (
          <button
            type="button"
            role="switch"
            aria-checked={voiceEnabled}
            onClick={onToggleVoice}
            className="w-full min-h-[44px] flex items-center justify-between py-2 px-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/70 hover:bg-neutral-100 dark:hover:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800 transition-colors"
          >
            <span className="flex items-center gap-2 text-xs font-semibold">
              {voiceEnabled ? (
                <Volume2 className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
              ) : (
                <VolumeX className="w-4 h-4 text-neutral-500" />
              )}
              <span>Alertas por Voz</span>
            </span>
            <span
              className={`w-10 h-5 rounded-full transition-colors p-0.5 flex items-center ${
                voiceEnabled ? 'bg-neutral-950 dark:bg-white justify-end' : 'bg-neutral-300 dark:bg-neutral-700 justify-start'
              }`}
            >
              <span className={`w-4 h-4 rounded-full shadow-xs ${voiceEnabled ? 'bg-white dark:bg-neutral-950' : 'bg-white'}`} />
            </span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div ref={menuRef} className="relative flex items-center gap-1.5">
      {/* Quick A- / A+ inline buttons on desktop for instant access */}
      <div className="hidden lg:flex items-center rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100/80 dark:bg-neutral-900 p-0.5">
        <button
          type="button"
          onClick={onDecreaseFont}
          disabled={fontSize === 'sm'}
          className="px-2 py-1 rounded-md text-[11px] font-bold text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-800 disabled:opacity-35 transition-colors"
          title="Diminuir tamanho da fonte"
          aria-label="Diminuir tamanho da fonte"
        >
          A-
        </button>
        <button
          type="button"
          onClick={onIncreaseFont}
          disabled={fontSize === 'xl'}
          className="px-2 py-1 rounded-md text-[11px] font-bold text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-800 disabled:opacity-35 transition-colors"
          title="Aumentar tamanho da fonte"
          aria-label="Aumentar tamanho da fonte"
        >
          A+
        </button>
      </div>

      {/* Main Accessibility & Theme Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Opções de acessibilidade e tema"
        className="px-2 sm:px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs font-medium transition-colors flex items-center gap-1.5 shadow-2xs"
      >
        <Accessibility className="w-3.5 h-3.5 text-neutral-950 dark:text-white shrink-0" />
        <span className="sm:hidden text-[11px] font-bold font-mono tracking-tight">Aa</span>
        <span className="hidden sm:inline">Acessibilidade</span>
        <ChevronDown className={`w-3 h-3 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Desktop Popover (>= sm) */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Configurações de Acessibilidade e Aparência"
          className="hidden sm:block absolute right-0 top-full mt-2 w-80 rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 shadow-2xl p-4 z-50 text-neutral-900 dark:text-neutral-100 animate-in fade-in zoom-in-95 duration-150"
        >
          {renderPanelContent(false)}
        </div>
      )}

      {/* Mobile Fullscreen Isolated View via Portal (< sm) - Zero map/text behind */}
      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="sm:hidden fixed inset-0 z-[2000] bg-white dark:bg-neutral-950 flex flex-col">
            <div
              ref={mobileSheetRef}
              role="dialog"
              aria-modal="true"
              aria-label="Configurações de Acessibilidade e Aparência"
              className="w-full h-[100dvh] bg-white dark:bg-neutral-950 p-5 text-neutral-900 dark:text-neutral-100 overflow-y-auto animate-in fade-in duration-150"
            >
              {renderPanelContent(true)}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
