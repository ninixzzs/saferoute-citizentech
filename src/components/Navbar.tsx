import React from 'react';
import { Shield, Volume2, VolumeX, Plus, BookOpen } from 'lucide-react';

interface NavbarProps {
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  onOpenReportModal: () => void;
  onOpenTipsDrawer: () => void;
  activeIncidentsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  voiceEnabled,
  onToggleVoice,
  onOpenReportModal,
  onOpenTipsDrawer,
  activeIncidentsCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-800 bg-neutral-950/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 text-white">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-white">
                SafeRoute
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-neutral-900 text-neutral-400 border border-neutral-800">
                São Paulo
              </span>
            </div>
          </div>
        </div>

        {/* Center Status */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-400 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
          <span>Defesa Civil SP &bull; Monitoramento Ativo</span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Voice Audio Toggle */}
          <button
            onClick={onToggleVoice}
            className={`p-2 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 ${
              voiceEnabled
                ? 'bg-neutral-900 border-neutral-700 text-white'
                : 'bg-transparent border-neutral-800 text-neutral-500 hover:text-neutral-300'
            }`}
            title={voiceEnabled ? 'Áudio ativado' : 'Áudio silenciado'}
          >
            {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{voiceEnabled ? 'Voz Ativa' : 'Mudo'}</span>
          </button>

          {/* Guidelines */}
          <button
            onClick={onOpenTipsDrawer}
            className="px-2.5 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-neutral-400" />
            <span className="hidden sm:inline">Diretrizes</span>
          </button>

          {/* Report Alert Button */}
          <button
            onClick={onOpenReportModal}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-neutral-200 text-neutral-950 font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Reportar</span>
          </button>
        </div>
      </div>
    </header>
  );
};
