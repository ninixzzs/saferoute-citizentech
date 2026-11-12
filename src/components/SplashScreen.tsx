import React, { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';

interface SplashScreenProps {
  onComplete?: () => void;
  onFinish?: () => void;
  minDurationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  onFinish,
  minDurationMs = 1400,
}) => {
  const [phase, setPhase] = useState<'enter' | 'dissolve' | 'hidden'>('enter');

  useEffect(() => {
    // Phase 1: Fade-in and subtle radar pulse in pure black
    const timerDissolve = setTimeout(() => {
      setPhase('dissolve');
    }, minDurationMs);

    // Phase 2: Smooth dissipation to reveal the app
    const timerComplete = setTimeout(() => {
      setPhase('hidden');
      if (onComplete) onComplete();
      if (onFinish) onFinish();
    }, minDurationMs + 650);

    return () => {
      clearTimeout(timerDissolve);
      clearTimeout(timerComplete);
    };
  }, [minDurationMs, onComplete]);

  if (phase === 'hidden') return null;

  return (
    <div
      role="status"
      aria-label="Carregando SafeRoute"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#050505] text-white select-none transition-opacity duration-700 ease-out ${
        phase === 'dissolve' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-radial from-neutral-900/40 via-transparent to-transparent pointer-events-none" />

      {/* Center Radar Logo Container */}
      <div className="relative flex items-center justify-center">
        {/* Radar concentric pulse rings */}
        <div className="absolute w-44 h-44 rounded-full border border-white/10 animate-ping duration-1000 opacity-20 pointer-events-none" />
        <div className="absolute w-32 h-32 rounded-full border border-white/15 animate-pulse duration-700 pointer-events-none" />
        <div className="absolute w-20 h-20 rounded-full border border-white/20 pointer-events-none" />

        {/* Minimalist Pure White Logo Shield */}
        <div className="relative z-10 w-16 h-16 rounded-2xl bg-white text-black flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.25)] transition-transform duration-700 animate-in zoom-in-90">
          <Shield className="w-8 h-8 fill-black stroke-black" />
        </div>
      </div>

      {/* Typography Brand & Slogan */}
      <div className="mt-8 text-center space-y-2 relative z-10 px-4">
        <h1 className="font-display text-2xl font-black tracking-[-0.04em] text-white">
          SafeRoute
        </h1>
        <p className="text-xs font-mono font-medium tracking-wider text-neutral-400 uppercase">
          Vá com segurança. Vá de SafeRoute.
        </p>
      </div>

      {/* Subtle indicator bar */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-28 h-0.5 bg-neutral-900 rounded-full overflow-hidden">
        <div className="w-full h-full bg-white/70 animate-pulse duration-500" />
      </div>
    </div>
  );
};
