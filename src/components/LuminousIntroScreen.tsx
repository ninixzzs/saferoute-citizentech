import React, { useState } from 'react';
import { Shield, Sparkles, ArrowRight, MessageSquare, Compass, ShieldAlert, Radio } from 'lucide-react';
import { LuminousDotMatrixCanvas } from './LuminousDotMatrixCanvas';

interface LuminousIntroScreenProps {
  onEnterApp: () => void;
  onOpenAiChat?: () => void;
}

export const LuminousIntroScreen: React.FC<LuminousIntroScreenProps> = ({
  onEnterApp,
  onOpenAiChat,
}) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleStartTransition = (callback?: () => void) => {
    setIsExiting(true);
    setTimeout(() => {
      if (callback) callback();
      onEnterApp();
    }, 600);
  };

  return (
    <div
      role="region"
      aria-label="Tela Inicial Interativa SafeRoute"
      className={`fixed inset-0 z-[9999] flex flex-col justify-between bg-[#050505] text-white select-none transition-all duration-700 ease-out overflow-hidden ${
        isExiting
          ? 'opacity-0 scale-105 pointer-events-none filter blur-md'
          : 'opacity-100 scale-100'
      }`}
    >
      {/* 1. Interactive 3D Luminous Light Matrix Background */}
      <LuminousDotMatrixCanvas className="z-0" glowRadius={220} />

      {/* 2. Radial vignette to emphasize center typography */}
      <div
        className="absolute inset-0 pointer-events-none z-1 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(5,5,5,0.75)_80%,#050505_100%)]"
      />

      {/* 3. Top Luxury Navigation Bar (matching Pinterest style) */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 pt-6 sm:pt-8 flex items-center justify-between pointer-events-auto">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center shadow-[0_0_25px_rgba(255,255,255,0.4)] transition-transform duration-300 hover:scale-105">
            <Shield className="w-5 h-5 fill-black stroke-black" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-black text-lg tracking-tight text-white leading-none">
              SafeRoute
            </span>
            <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase mt-0.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              SP &bull; Monitoramento Ativo
            </span>
          </div>
        </div>

        {/* Center Quick Nav Links (Desktop) */}
        <nav
          aria-label="Navegação rápida da introdução"
          className="hidden md:flex items-center gap-1 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl text-xs font-medium text-neutral-300"
        >
          <span className="px-3 py-1 text-white hover:text-white transition-colors cursor-default">
            Rotas Seguras
          </span>
          <span className="text-neutral-600">&bull;</span>
          <span className="px-3 py-1 text-neutral-400 hover:text-white transition-colors cursor-default">
            Perímetros Críticos
          </span>
          <span className="text-neutral-600">&bull;</span>
          <span className="px-3 py-1 text-neutral-400 hover:text-white transition-colors cursor-default">
            Assistente IA
          </span>
          <span className="text-neutral-600">&bull;</span>
          <span className="px-3 py-1 text-neutral-400 hover:text-white transition-colors cursor-default">
            Defesa Civil SP
          </span>
        </nav>

        {/* Right CTA */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleStartTransition()}
            className="px-5 py-2 rounded-full bg-white text-black hover:bg-neutral-200 text-xs font-bold transition-all shadow-[0_0_20px_rgba(255,255,255,0.25)] flex items-center gap-1.5 active:scale-95 group"
          >
            <span>Acessar Plataforma</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </header>

      {/* 4. Center Hero Typography (Monumental SafeRoute Title + 3D Light Model) */}
      <main className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 text-center flex flex-col items-center justify-center my-auto pointer-events-auto">
        {/* Top Feature Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/15 backdrop-blur-md mb-6 shadow-sm animate-in fade-in duration-700">
          <Radio className="w-3.5 h-3.5 text-white animate-pulse" />
          <span className="text-[11px] font-mono tracking-widest uppercase text-neutral-300 font-bold">
            SISTEMA INTELIGENTE DE ROTAS &bull; SÃO PAULO 2026
          </span>
        </div>

        {/* Title */}
        <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl font-black tracking-[-0.04em] text-white leading-[1.02] drop-shadow-[0_10px_35px_rgba(0,0,0,0.8)]">
          SafeRoute
        </h1>

        {/* Official Slogan */}
        <p className="mt-4 text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-neutral-100 max-w-2xl">
          &ldquo;Vá com segurança. Vá de SafeRoute.&rdquo;
        </p>

        {/* Subtitle / Value Proposition */}
        <p className="mt-4 text-sm sm:text-base text-neutral-400 font-normal max-w-xl leading-relaxed">
          Inteligência urbana e rotas preventivas em tempo real para São Paulo. Saiba dos riscos antes mesmo de chegar até eles com monitoramento georreferenciado e assistência inteligente.
        </p>

        {/* High-End Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
          {/* Primary CTA */}
          <button
            type="button"
            onClick={() => handleStartTransition()}
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-black hover:bg-neutral-200 text-sm font-extrabold flex items-center justify-center gap-2.5 shadow-[0_0_35px_rgba(255,255,255,0.4)] transition-all active:scale-95 group"
          >
            <Compass className="w-4 h-4" />
            <span>Iniciar Navegação Segura</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Secondary CTA */}
          <button
            type="button"
            onClick={() => {
              if (onOpenAiChat) {
                handleStartTransition(onOpenAiChat);
              } else {
                handleStartTransition();
              }
            }}
            className="w-full sm:w-auto px-6 py-4 rounded-full bg-white/5 hover:bg-white/10 text-white text-sm font-semibold border border-white/20 hover:border-white/40 backdrop-blur-xl flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Falar com Assistente IA</span>
          </button>
        </div>

        {/* Interactive Lighting Hint */}
        <div className="mt-8 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-neutral-400">
          <Sparkles className="w-3.5 h-3.5 text-white animate-spin" style={{ animationDuration: '6s' }} />
          <span>Passe o mouse ou toque no fundo preto para acender as luzes 3D</span>
        </div>
      </main>

      {/* 5. Bottom Status Bar */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 pb-6 sm:pb-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono text-neutral-500 uppercase tracking-wider pointer-events-auto">
        <div className="flex items-center gap-2">
          <span>MONITORAMENTO OFICIAL DEFESA CIVIL SP &bull; CITIZENTECH</span>
        </div>

        <button
          type="button"
          onClick={() => handleStartTransition()}
          className="hover:text-white transition-colors flex items-center gap-1 underline underline-offset-4 active:scale-95"
        >
          <span>Pular introdução e ir direto para o mapa</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </footer>
    </div>
  );
};
