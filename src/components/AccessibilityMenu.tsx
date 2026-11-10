import React, { useState, useRef, useEffect } from 'react';
import {
  Accessibility,
  Sun,
  Moon,
  Monitor,
  Type,
  Contrast,
  RotateCcw,
  ChevronDown,
  X,
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
  onReset,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const themeOptions: { id: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { id: 'light', label: 'Claro', icon: <Sun className="w-3.5 h-3.5" /> },
    { id: 'dark', label: 'Noturno', icon: <Moon className="w-3.5 h-3.5" /> },
    { id: 'system', label: 'Aparelho', icon: <Monitor className="w-3.5 h-3.5" /> },
  ];

  const fontOptions: { id: FontSizeScale; label: string }[] = [
    { id: 'sm', label: 'A-' },
    { id: 'md', label: 'A' },
    { id: 'lg', label: 'A+' },
    { id: 'xl', label: 'A++' },
  ];

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

      {/* Dropdown / Mobile Responsive Sheet */}
      {isOpen && (
        <>
          {/* Mobile tap-away backdrop */}
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-40 sm:hidden"
            aria-hidden="true"
          />

          <div
            role="dialog"
            aria-label="Configurações de Acessibilidade e Aparência"
            className="fixed inset-x-3 top-16 sm:inset-auto sm:absolute sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-80 max-w-md mx-auto rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 shadow-2xl p-4 space-y-4 z-50 text-neutral-900 dark:text-neutral-100 animate-in fade-in zoom-in-95 duration-150 max-h-[calc(100dvh-5rem)] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Accessibility className="w-4 h-4 text-neutral-900 dark:text-white" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Acessibilidade & Tema
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onReset}
                  className="text-[11px] text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 transition-colors px-1.5 py-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-900"
                  title="Restaurar configurações padrão"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Padrão</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="sm:hidden p-1 rounded-lg bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300"
                  aria-label="Fechar acessibilidade"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
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
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold flex flex-col items-center justify-center gap-1 transition-all ${
                      active
                        ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-700'
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
              <span className="text-[10px] font-mono text-neutral-500">
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
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                      active
                        ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-700'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* High Contrast Toggle */}
          <div className="pt-1 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              role="switch"
              aria-checked={highContrast}
              onClick={onToggleHighContrast}
              className="w-full flex items-center justify-between py-2 px-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
            >
              <span className="flex items-center gap-2 text-xs font-semibold">
                <Contrast className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                <span>Alto Contraste</span>
              </span>
              <span
                className={`w-9 h-5 rounded-full transition-colors p-0.5 flex items-center ${
                  highContrast ? 'bg-neutral-950 dark:bg-white justify-end' : 'bg-neutral-300 dark:bg-neutral-700 justify-start'
                }`}
              >
                <span className={`w-4 h-4 rounded-full shadow-xs ${highContrast ? 'bg-white dark:bg-neutral-950' : 'bg-white'}`} />
              </span>
            </button>
          </div>
          </div>
        </>
      )}
    </div>
  );
};
