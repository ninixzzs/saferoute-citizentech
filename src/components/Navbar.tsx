import React from 'react';
import { Shield, Volume2, VolumeX, Plus, BookOpen } from 'lucide-react';
import { AccessibilityMenu } from './AccessibilityMenu';
import { ThemeMode, FontSizeScale } from '../hooks/useAccessibility';

interface NavbarProps {
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  onOpenReportModal: () => void;
  onOpenTipsDrawer: () => void;
  activeIncidentsCount: number;
  themeMode: ThemeMode;
  onChangeTheme: (mode: ThemeMode) => void;
  fontSize: FontSizeScale;
  onChangeFontSize: (scale: FontSizeScale) => void;
  onIncreaseFont: () => void;
  onDecreaseFont: () => void;
  highContrast: boolean;
  onToggleHighContrast: () => void;
  onResetAccessibility: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  voiceEnabled,
  onToggleVoice,
  onOpenReportModal,
  onOpenTipsDrawer,
  themeMode,
  onChangeTheme,
  fontSize,
  onChangeFontSize,
  onIncreaseFont,
  onDecreaseFont,
  highContrast,
  onToggleHighContrast,
  onResetAccessibility,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200 dark:border-neutral-800 bg-white/85 dark:bg-neutral-950/85 backdrop-blur-xl transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 min-h-14 py-1.5 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        {/* Brand */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 shadow-xs">
            <Shield className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-tight text-neutral-950 dark:text-white">
              SafeRoute
            </span>
            <span className="hidden sm:inline-block text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800">
              São Paulo
            </span>
          </div>
        </div>

        {/* Center Slogan & Status */}
        <div className="hidden lg:flex items-center gap-3 text-xs font-mono">
          <span className="font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">
            &ldquo;Vá com segurança. Vá de SafeRoute.&rdquo;
          </span>
          <span className="text-neutral-300 dark:text-neutral-700">&bull;</span>
          <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 dark:bg-white animate-pulse"></span>
            <span>Defesa Civil SP &bull; Monitoramento Ativo</span>
          </div>
        </div>

        {/* Right Controls + Accessibility */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <AccessibilityMenu
            themeMode={themeMode}
            onChangeTheme={onChangeTheme}
            fontSize={fontSize}
            onChangeFontSize={onChangeFontSize}
            onIncreaseFont={onIncreaseFont}
            onDecreaseFont={onDecreaseFont}
            highContrast={highContrast}
            onToggleHighContrast={onToggleHighContrast}
            voiceEnabled={voiceEnabled}
            onToggleVoice={onToggleVoice}
            onReset={onResetAccessibility}
          />

          <button
            type="button"
            onClick={onToggleVoice}
            className={`hidden sm:flex p-2 rounded-lg border text-xs font-medium transition-colors items-center gap-1.5 ${
              voiceEnabled
                ? 'bg-neutral-100 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white'
                : 'bg-transparent border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300'
            }`}
            title={voiceEnabled ? 'Áudio ativado' : 'Áudio silenciado'}
            aria-label={voiceEnabled ? 'Desativar orientação por voz' : 'Ativar orientação por voz'}
          >
            {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden xl:inline">{voiceEnabled ? 'Voz' : 'Mudo'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenTipsDrawer}
            className="p-2 sm:px-2.5 sm:py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5"
            aria-label="Abrir diretrizes da Defesa Civil"
            title="Diretrizes da Defesa Civil"
          >
            <BookOpen className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
            <span className="hidden sm:inline">Diretrizes</span>
          </button>

          <button
            type="button"
            onClick={onOpenReportModal}
            className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-neutral-950 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-950 font-semibold text-xs transition-colors flex items-center gap-1 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Reportar</span>
          </button>
        </div>
      </div>
    </header>
  );
};
