import React, { useState, useEffect } from 'react';
import { Shield, Sparkles, ArrowRight, ShieldCheck, Radar } from 'lucide-react';

interface SplashScreenProps {
  onComplete?: () => void;
  onFinish?: () => void;
  minDurationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  onFinish,
  minDurationMs = 2800,
}) => {
  const [phase, setPhase] = useState<'enter' | 'dissolve' | 'hidden'>('enter');
  const [stepIndex, setStepIndex] = useState(0);

  const telemetrySteps = [
    'Conectando à malha urbana de São Paulo...',
    'Varrendo perímetros da Defesa Civil e SSP-SP...',
    'Algoritmo de desvio preventivo calibrado.',
    'Pronto para navegar com segurança.',
  ];

  useEffect(() => {
    // Telemetry text progression
    const stepInterval = setInterval(() => {
      setStepIndex((prev) => (prev < telemetrySteps.length - 1 ? prev + 1 : prev));
    }, 700);

    // Auto-dissolve transition after minDuration
    const timerDissolve = setTimeout(() => {
      setPhase('dissolve');
    }, minDurationMs);

    // Completely unmount after dissolution curtain
    const timerComplete = setTimeout(() => {
      setPhase('hidden');
      if (onComplete) onComplete();
      if (onFinish) onFinish();
    }, minDurationMs + 700);

    return () => {
      clearInterval(stepInterval);
      clearTimeout(timerDissolve);
      clearTimeout(timerComplete);
    };
  }, [minDurationMs, onComplete, onFinish, telemetrySteps.length]);

  const handleSkipOrEnter = () => {
    setPhase('dissolve');
    setTimeout(() => {
      setPhase('hidden');
      if (onComplete) onComplete();
      if (onFinish) onFinish();
    }, 450);
  };

  if (phase === 'hidden') return null;

  return (
    <div
      role="status"
      aria-label="Experiência de Entrada SafeRoute"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between p-6 sm:p-10 bg-[#050505] text-white select-none transition-all duration-700 ease-out ${
        phase === 'dissolve'
          ? 'opacity-0 scale-102 pointer-events-none filter blur-sm'
          : 'opacity-100 scale-100'
      }`}
    >
      {/* 1. Animated Atmospheric Background: Dot Grid & Radar Sweep */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Architectural Dot Grid */}
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.22) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Dynamic Radar Beam Sweep */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-white/10 pointer-events-none animate-radar-sweep opacity-30">
          <div className="w-1/2 h-1/2 origin-bottom-right bg-gradient-to-br from-white/15 to-transparent rounded-tl-full" />
        </div>

        {/* Concentric Radar Rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full border border-white/10 opacity-40 animate-pulse duration-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] rounded-full border border-white/15 opacity-60" />
      </div>

      {/* Top Header Tag */}
      <div className="relative z-10 w-full flex items-center justify-between">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono tracking-widest uppercase text-neutral-400">
          <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
          <span>SISTEMA DE SEGURANÇA URBANA &bull; SP 2026</span>
        </div>

        <button
          type="button"
          onClick={handleSkipOrEnter}
          className="text-xs font-mono text-neutral-400 hover:text-white px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-1 active:scale-95"
        >
          <span>Pular</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Centerpiece: Monumental Monogram & Slogan */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center max-w-lg space-y-6">
        {/* Pulsing Luminous Monogram Shield */}
        <div className="relative flex items-center justify-center">
          {/* Neon back aura */}
          <div className="absolute w-36 h-36 rounded-full bg-white/20 blur-2xl animate-ambient-breathe pointer-events-none" />

          <div className="relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white text-black flex items-center justify-center shadow-[0_0_60px_rgba(255,255,255,0.45)] border border-white transition-transform duration-700 animate-in zoom-in-75">
            <Shield className="w-10 h-10 sm:w-12 sm:h-12 fill-black stroke-black" />
          </div>
        </div>

        {/* Brand & Slogan */}
        <div className="space-y-3">
          <h1 className="font-display text-4xl sm:text-5xl font-black tracking-[-0.04em] text-white">
            SafeRoute
          </h1>
          <p className="text-base sm:text-lg font-bold tracking-tight text-neutral-200">
            &ldquo;Vá com segurança. Vá de SafeRoute.&rdquo;
          </p>
        </div>

        {/* Live System Telemetry Line */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-xs font-mono text-neutral-300 shadow-md">
          <Sparkles className="w-3.5 h-3.5 text-white animate-spin shrink-0" style={{ animationDuration: '4s' }} />
          <span className="truncate">{telemetrySteps[stepIndex]}</span>
        </div>
      </div>

      {/* Bottom CTA / Enter Button */}
      <div className="relative z-10 w-full flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={handleSkipOrEnter}
          className="px-8 py-3.5 rounded-full bg-white text-black hover:bg-neutral-200 text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all active:scale-95 group"
        >
          <span>Entrar no SafeRoute</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>

        <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
          Toque para acessar a plataforma interativa
        </span>
      </div>
    </div>
  );
};
