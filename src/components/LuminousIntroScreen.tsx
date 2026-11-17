import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Shield,
  ArrowRight,
  MessageSquare,
  Compass,
  Radio,
  TrendingUp,
  Sparkles,
  ExternalLink,
  Navigation,
  Car,
  Bike,
  Footprints,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { LuminousDotMatrixCanvas } from './LuminousDotMatrixCanvas';

interface LuminousIntroScreenProps {
  onEnterApp: () => void;
  onOpenAiChat?: () => void;
}

type ShowcaseTab = 'rotas' | 'como_funciona' | 'alertas' | 'defesa_civil';

export const LuminousIntroScreen: React.FC<LuminousIntroScreenProps> = ({
  onEnterApp,
  onOpenAiChat,
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const [activeTab, setActiveTab] = useState<ShowcaseTab>('rotas');
  const [travelMode, setTravelMode] = useState<'carro' | 'moto' | 'a_pe'>('carro');
  const [isHovered, setIsHovered] = useState(false);

  // 3D Parallax Tilt state
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [targetTilt, setTargetTilt] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Smooth lerp interpolation for 3D physics
  useEffect(() => {
    const updatePhysics = () => {
      setTilt((prev) => {
        const ease = 0.08;
        const newX = prev.x + (targetTilt.x - prev.x) * ease;
        const newY = prev.y + (targetTilt.y - prev.y) * ease;
        return { x: newX, y: newY };
      });
      animFrameRef.current = requestAnimationFrame(updatePhysics);
    };

    animFrameRef.current = requestAnimationFrame(updatePhysics);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [targetTilt]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const xRatio = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const yRatio = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5

    // Max rotation angles: +/- 16deg Y, +/- 12deg X
    setTargetTilt({
      x: -yRatio * 16,
      y: xRatio * 22,
    });
  }, []);

  const handlePointerLeave = useCallback(() => {
    setIsHovered(false);
    setTargetTilt({ x: 0, y: 0 });
  }, []);

  const handlePointerEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

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
      aria-label="Apresentação Interativa 3D SafeRoute"
      className={`fixed inset-0 z-[9999] flex flex-col justify-between bg-[#04010a] text-white select-none transition-all duration-700 ease-out overflow-x-hidden overflow-y-auto ${
        isExiting
          ? 'opacity-0 scale-105 pointer-events-none filter blur-md'
          : 'opacity-100 scale-100'
      }`}
    >
      {/* 1. Interactive Luminous Dot Matrix Canvas Background */}
      <LuminousDotMatrixCanvas className="z-0 opacity-40" glowRadius={240} />

      {/* 2. Deep Royal Indigo/Violet Gradient & Vignette (matching Pinterest aesthetic) */}
      <div className="absolute inset-0 pointer-events-none z-1 bg-[radial-gradient(ellipse_at_50%_40%,rgba(67,24,124,0.35)_0%,rgba(21,7,48,0.75)_55%,#04010a_90%)]" />

      {/* 3. Outer Luxury Rounded Showcase Frame */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        className="relative z-10 w-full max-w-7xl mx-auto my-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-between min-h-[92vh]"
      >
        {/* Top Floating Glass Capsule Navigation Bar */}
        <header className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 pb-4">
          {/* Brand Icon & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-400 to-indigo-600 text-white flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.6)] border border-violet-300/30">
              <Shield className="w-5 h-5 fill-white stroke-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-xl tracking-tight text-white leading-none">
                  SafeRoute
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  SP &bull; ATIVO
                </span>
              </div>
              <span className="text-[10px] font-mono text-neutral-400 tracking-wider uppercase mt-1">
                CitizenTech &bull; Defesa Civil SP
              </span>
            </div>
          </div>

          {/* Centered Floating Glass Pill Menu (Pinterest style) */}
          <nav
            aria-label="Menu interativo do showcase"
            className="flex items-center gap-1 p-1.5 rounded-full bg-white/[0.06] border border-white/15 backdrop-blur-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] text-xs font-semibold text-neutral-300"
          >
            <button
              type="button"
              onClick={() => setActiveTab('rotas')}
              className={`px-3.5 py-1.5 rounded-full transition-all duration-300 ${
                activeTab === 'rotas'
                  ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)] font-bold'
                  : 'hover:text-white hover:bg-white/5 text-neutral-300'
              }`}
            >
              Rotas Inteligentes
            </button>
            <span className="text-white/20">&bull;</span>
            <button
              type="button"
              onClick={() => setActiveTab('como_funciona')}
              className={`px-3.5 py-1.5 rounded-full transition-all duration-300 ${
                activeTab === 'como_funciona'
                  ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)] font-bold'
                  : 'hover:text-white hover:bg-white/5 text-neutral-300'
              }`}
            >
              Como Funciona
            </button>
            <span className="text-white/20">&bull;</span>
            <button
              type="button"
              onClick={() => setActiveTab('alertas')}
              className={`px-3.5 py-1.5 rounded-full transition-all duration-300 ${
                activeTab === 'alertas'
                  ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)] font-bold'
                  : 'hover:text-white hover:bg-white/5 text-neutral-300'
              }`}
            >
              Áreas Críticas
            </button>
            <span className="text-white/20">&bull;</span>
            <button
              type="button"
              onClick={() => setActiveTab('defesa_civil')}
              className={`px-3.5 py-1.5 rounded-full transition-all duration-300 ${
                activeTab === 'defesa_civil'
                  ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)] font-bold'
                  : 'hover:text-white hover:bg-white/5 text-neutral-300'
              }`}
            >
              Defesa Civil
            </button>
          </nav>

          {/* Quick Access Action */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleStartTransition()}
              className="px-5 py-2 rounded-full bg-white text-black hover:bg-neutral-200 text-xs font-black transition-all shadow-[0_0_25px_rgba(255,255,255,0.3)] flex items-center gap-1.5 active:scale-95 group"
            >
              <span>Acessar Plataforma</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </header>

        {/* Monumental Hero Headline (Exact Pinterest Typography: Lowercase, Bold, Clean) */}
        <div className="text-center my-3 sm:my-5 flex flex-col items-center">
          <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl font-black tracking-[-0.04em] text-white leading-none drop-shadow-[0_15px_40px_rgba(0,0,0,0.8)]">
            saferoute
          </h1>
          <p className="mt-2 text-sm sm:text-base lg:text-lg font-medium text-violet-200/90 tracking-tight">
            Navegação Preventiva &bull; Inteligência Urbana em São Paulo
          </p>
        </div>

        {/* Center 3D Interactive Showcase (Organic Mesh Pod + Tilted Smartphone) */}
        <div
          className="relative w-full max-w-4xl flex items-center justify-center my-auto py-6 sm:py-10"
          style={{ perspective: '1400px' }}
        >
          {/* Interactive 3D Transform Container (Reacts to cursor/touch with spring physics) */}
          <div
            className="relative flex items-center justify-center transition-transform duration-100 ease-out"
            style={{
              transform: `rotateX(${tilt.x + 10}deg) rotateY(${tilt.y - 14}deg) rotateZ(-2deg)`,
              transformStyle: 'preserve-3d',
            }}
          >
            {/* --- BACK LAYER: The Organic 3D Textured Mesh Cushion / Pod --- */}
            <div
              className="absolute -inset-10 sm:-inset-16 flex items-center justify-center pointer-events-none select-none transition-transform duration-300"
              style={{
                transform: `translateZ(-60px) scale(${isHovered ? 1.05 : 1})`,
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Outer Radiant Glow */}
              <div className="absolute w-[340px] sm:w-[480px] h-[340px] sm:h-[480px] rounded-full bg-gradient-to-tr from-violet-600/40 via-purple-500/30 to-indigo-500/20 blur-[80px] animate-pulse" style={{ animationDuration: '4s' }} />

              {/* Organic 3D Woven Mesh Capsule Graphic (Exact match of the Pinterest mesh pod) */}
              <svg
                viewBox="0 0 500 500"
                className="w-[360px] sm:w-[500px] h-[360px] sm:h-[500px] drop-shadow-[0_0_60px_rgba(147,51,234,0.55)] opacity-95"
                fill="none"
              >
                <defs>
                  <radialGradient id="meshGrad" cx="50%" cy="40%" r="60%">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity="0.85" />
                    <stop offset="35%" stopColor="#6366f1" stopOpacity="0.75" />
                    <stop offset="70%" stopColor="#311068" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#0a0319" stopOpacity="1" />
                  </radialGradient>
                  <filter id="bloom">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Base organic sphere */}
                <ellipse cx="250" cy="250" rx="205" ry="195" fill="url(#meshGrad)" />

                {/* Concentric curved latitude grid lines */}
                {[-130, -95, -60, -25, 10, 45, 80, 115, 150].map((offset, i) => (
                  <ellipse
                    key={`lat-${i}`}
                    cx="250"
                    cy={250 + offset}
                    rx={Math.max(40, Math.sqrt(Math.max(0, 195 * 195 - offset * offset)) * 1.05)}
                    ry={Math.max(15, 45 - Math.abs(offset) * 0.15)}
                    stroke="rgba(233, 213, 255, 0.35)"
                    strokeWidth="1.2"
                    strokeDasharray="3 4"
                  />
                ))}

                {/* Curved longitude meridian arcs */}
                {[-140, -100, -60, -20, 20, 60, 100, 140].map((offset, i) => (
                  <path
                    key={`long-${i}`}
                    d={`M ${250 + offset * 1.25} 55 Q ${250 + offset * 1.4} 250 ${250 + offset * 1.25} 445`}
                    stroke="rgba(216, 180, 254, 0.4)"
                    strokeWidth="1.2"
                    strokeDasharray="2 3"
                  />
                ))}

                {/* Glowing neon rim accent */}
                <ellipse
                  cx="250"
                  cy="250"
                  rx="205"
                  ry="195"
                  stroke="rgba(192, 132, 252, 0.7)"
                  strokeWidth="2"
                  filter="url(#bloom)"
                />
              </svg>
            </div>

            {/* --- FRONT LAYER: Sleek Tilted 3D Smartphone Mockup --- */}
            <div
              className="relative w-[290px] sm:w-[320px] rounded-[48px] p-3 sm:p-3.5 bg-gradient-to-b from-neutral-800/90 via-neutral-900 to-black border-[3px] border-neutral-700/80 shadow-[0_30px_90px_rgba(0,0,0,0.9),0_0_50px_rgba(139,92,246,0.35)] transition-all duration-200"
              style={{
                transform: 'translateZ(45px)',
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Dynamic glass gloss sheen reflecting mouse angle */}
              <div
                className="absolute inset-0 rounded-[48px] pointer-events-none z-30 transition-opacity duration-300"
                style={{
                  background: `linear-gradient(${125 + tilt.y * 2}deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.03) 40%, transparent 65%)`,
                }}
              />

              {/* Hardware Bezel & Glass Screen */}
              <div className="relative rounded-[40px] bg-[#0c0517] overflow-hidden border border-white/10 p-4 sm:p-5 flex flex-col justify-between min-h-[490px] sm:min-h-[520px] text-left">
                {/* Dynamic Island / Top Camera Pill */}
                <div className="w-full flex items-center justify-between text-[11px] font-mono text-neutral-400 mb-2">
                  <span className="font-bold text-white">19:42</span>
                  <div className="w-20 h-4 rounded-full bg-black border border-white/10 flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-emerald-400">5G</span>
                    <span className="text-white">100%</span>
                  </div>
                </div>

                {/* Screen Header: Greeting & Quick Location */}
                <div className="mt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-mono uppercase tracking-wider text-violet-300 font-semibold">
                        {activeTab === 'rotas' && 'Navegação Ativa'}
                        {activeTab === 'como_funciona' && 'Metodologia SafeRoute'}
                        {activeTab === 'alertas' && 'Monitoramento de Risco'}
                        {activeTab === 'defesa_civil' && 'Integração Oficial'}
                      </div>
                      <h2 className="text-lg font-bold text-white tracking-tight">
                        São Paulo Segura
                      </h2>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-violet-500/20 border border-violet-400/30 flex items-center justify-center text-violet-300">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Travel Mode Switcher inside the Phone */}
                  <div className="flex items-center gap-1.5 mt-3 p-1 rounded-xl bg-white/5 border border-white/10">
                    <button
                      type="button"
                      onClick={() => setTravelMode('carro')}
                      className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${
                        travelMode === 'carro'
                          ? 'bg-violet-600 text-white shadow-sm'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Car className="w-3 h-3" />
                      <span>Carro</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTravelMode('moto')}
                      className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${
                        travelMode === 'moto'
                          ? 'bg-violet-600 text-white shadow-sm'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Bike className="w-3 h-3" />
                      <span>Moto</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTravelMode('a_pe')}
                      className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${
                        travelMode === 'a_pe'
                          ? 'bg-violet-600 text-white shadow-sm'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Footprints className="w-3 h-3" />
                      <span>A Pé</span>
                    </button>
                  </div>
                </div>

                {/* Big Metric Card (Identical to Pinterest 89% / 98% Pill Showcase) */}
                <div className="my-3 p-4 rounded-3xl bg-gradient-to-br from-violet-600/20 via-purple-900/20 to-black/60 border border-violet-400/30 backdrop-blur-md relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/20 rounded-full blur-xl pointer-events-none" />

                  <div className="flex items-baseline justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[11px] font-mono text-emerald-300 font-bold uppercase tracking-wider">
                        Índice de Rota
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-violet-300 flex items-center gap-0.5">
                      <TrendingUp className="w-3 h-3 text-emerald-400" />
                      Tempo Real
                    </span>
                  </div>

                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                      98%
                    </span>
                    <span className="text-xs text-neutral-300 font-medium">
                      Segurança confirmada
                    </span>
                  </div>

                  <p className="mt-2 text-[11px] text-neutral-300 leading-snug">
                    {activeTab === 'rotas' &&
                      'Desvio preventivo traçado contornando áreas de inundação e alagamento.'}
                    {activeTab === 'como_funciona' &&
                      'Algoritmo OSRM integrado com raio geofencing de 400m em perímetros críticos.'}
                    {activeTab === 'alertas' &&
                      '12 incidentes catalogados. 0 áreas de risco no seu trajeto atual.'}
                    {activeTab === 'defesa_civil' &&
                      'Alertas oficiais transmitidos automaticamente com narração de voz.'}
                  </p>
                </div>

                {/* Interactive Dynamic Feature List inside Phone */}
                <div className="space-y-2">
                  <div className="p-2.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white truncate">
                        Desvio SafeRoute Ativo
                      </div>
                      <div className="text-[10px] text-neutral-400 truncate">
                        Av. Rebouças &rarr; Av. Paulista (Livre)
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white truncate">
                        Área Crítica Evitada
                      </div>
                      <div className="text-[10px] text-neutral-400 truncate">
                        Alagamento evitado com 2.4 km de folga
                      </div>
                    </div>
                  </div>
                </div>

                {/* Direct Launch Button on Phone Screen */}
                <button
                  type="button"
                  onClick={() => handleStartTransition()}
                  className="mt-3 w-full py-2.5 rounded-2xl bg-white text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-transform hover:scale-[1.02] active:scale-98"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Navegar Agora</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Floating Waitlist / Official Presentation Capsule (Identical to Pinterest Card at bottom right) */}
        <footer className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 pb-2">
          {/* Founder Credit & LinkedIn Pill */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-neutral-400">Idealizado e Fundado por:</span>
            <span className="font-bold text-white">Nicolly Vilela</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              ★ Fundadora da SafeRoute
            </span>
            <a
              href="https://www.linkedin.com/in/nicollyvilela"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#0A66C2] text-white hover:bg-[#004182] transition-transform active:scale-95 shadow-sm"
            >
              <span>LinkedIn</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>

          {/* Floating Pill: Apresentação Oficial + CTA */}
          <div className="flex items-center gap-3 p-2 pl-4 rounded-full bg-white/[0.06] border border-white/15 backdrop-blur-2xl shadow-[0_10px_35px_rgba(0,0,0,0.6)]">
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-bold text-white leading-none">
                Apresentação Oficial 2026
              </span>
              <span className="text-[10px] text-neutral-400">
                Protótipo Funcional &bull; Banca Acadêmica
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleStartTransition()}
              className="px-5 py-2.5 rounded-full bg-white text-black hover:bg-neutral-200 text-xs font-black transition-all shadow-[0_0_20px_rgba(255,255,255,0.35)] flex items-center gap-1.5 active:scale-95"
            >
              <span>Explorar Mapa</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};