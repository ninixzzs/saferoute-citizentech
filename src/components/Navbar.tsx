import React from 'react';
import { ShieldAlert, Volume2, VolumeX, PlusCircle, BookOpen, Radio, Sparkles } from 'lucide-react';

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
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-inner">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                SafeRoute
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                CitizenTech SP
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Alertas estilo Defesa Civil integrados à Navegação Urbana
            </p>
          </div>
        </div>

        {/* Live Status indicator */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Radar SSP / Defesa Civil: <strong className="text-emerald-400">Ativo</strong></span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-950/50 border border-red-800/40 text-xs text-red-300">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span>{activeIncidentsCount} alertas em SP</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Voice Alerts Toggle */}
          <button
            onClick={onToggleVoice}
            className={`p-2 rounded-lg border text-sm font-medium transition-colors flex items-center gap-1.5 ${
              voiceEnabled
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title={voiceEnabled ? 'Alertas por voz ativados (Clique para silenciar)' : 'Alertas por voz silenciados'}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="text-xs hidden lg:inline">
              {voiceEnabled ? 'Voz Ativa' : 'Mudo'}
            </span>
          </button>

          {/* Dicas Defesa Civil */}
          <button
            onClick={onOpenTipsDrawer}
            className="px-3 py-2 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5"
          >
            <BookOpen className="w-4 h-4 text-blue-400" />
            <span className="hidden sm:inline">Dicas & Protocolos</span>
          </button>

          {/* Report Alert Button */}
          <button
            onClick={onOpenReportModal}
            className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-semibold text-xs sm:text-sm shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Reportar Alerta</span>
          </button>
        </div>
      </div>
    </header>
  );
};
