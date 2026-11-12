import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  ShieldCheck,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  ArrowUpRight,
  Navigation,
  Car,
  Bike,
  Footprints,
} from 'lucide-react';

interface PhoneMiniAppSimulationProps {
  className?: string;
  travelMode?: 'carro' | 'moto' | 'a_pe';
  onSelectTravelMode?: (mode: 'carro' | 'moto' | 'a_pe') => void;
}

export const PhoneMiniAppSimulation: React.FC<PhoneMiniAppSimulationProps> = ({
  className = '',
  travelMode = 'carro',
  onSelectTravelMode,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [simSpeed, setSimSpeed] = useState<1 | 2>(1);
  const [progress, setProgress] = useState(0);

  // Trajectory waypoints for smooth SVG interpolation
  const waypoints = [
    { x: 50, y: 390 },
    { x: 75, y: 340 },
    { x: 95, y: 290 },
    { x: 100, y: 240 },
    { x: 135, y: 190 },
    { x: 190, y: 150 },
    { x: 235, y: 125 },
    { x: 270, y: 110 },
  ];

  useEffect(() => {
    if (!isPlaying) return;

    const intervalTime = 50; // 20 updates per second
    const totalDurationMs = 16000 / simSpeed; // 16s loop
    const step = intervalTime / totalDurationMs;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + step;
        return next >= 1 ? 0 : next;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPlaying, simSpeed]);

  // Compute interpolated car position
  const totalSegments = waypoints.length - 1;
  const scaledProgress = progress * totalSegments;
  const segmentIdx = Math.min(totalSegments - 1, Math.floor(scaledProgress));
  const subProgress = scaledProgress - segmentIdx;
  const p0 = waypoints[segmentIdx];
  const p1 = waypoints[segmentIdx + 1] || p0;

  const carX = p0.x + (p1.x - p0.x) * subProgress;
  const carY = p0.y + (p1.y - p0.y) * subProgress;
  const carAngle = Math.atan2(p1.y - p0.y, p1.x - p0.x) * (180 / Math.PI);

  const isMoto = travelMode === 'moto';
  const isWalk = travelMode === 'a_pe';

  // Dynamic phase details
  let phaseText = 'Desvio SafeRoute Ativo';
  let speedKmH = isWalk ? 5 : isMoto ? 52 : 42;
  let turnText = 'Siga na Av. Rebouças';

  // 4-second clean subtle alert notification (exactly 4.0 seconds in 16s loop: 4000ms / 16000ms = 0.25)
  const showAlert = progress >= 0.45 && progress <= 0.70;

  if (progress < 0.22) {
    phaseText = 'Iniciando Desvio';
    speedKmH = isWalk ? 5 : Math.round((isMoto ? 35 : 25) + progress * 70);
    turnText = 'Partida: Av. Faria Lima';
  } else if (progress < 0.55) {
    phaseText = 'Monitoramento SP 24h';
    speedKmH = isWalk ? 5 : Math.round((isMoto ? 54 : 44) + Math.sin(progress * 20) * 5);
    turnText = 'Acesse Av. Rebouças (Segura)';
  } else if (progress < 0.85) {
    phaseText = 'Área Crítica Evitada';
    speedKmH = isWalk ? 5 : Math.round((isMoto ? 48 : 38) + Math.sin(progress * 15) * 4);
    turnText = 'Vire à direita na Av. Paulista';
  } else {
    phaseText = 'Chegada Segura';
    speedKmH = isWalk ? 3 : Math.max(0, Math.round((1 - progress) * 110));
    turnText = 'Destino alcançado com sucesso!';
  }

  // Realistic trip duration based on travel mode in São Paulo
  const baseMinutes = isMoto ? 13 : isWalk ? 89 : 21;
  const remainingMin = Math.max(1, Math.round(baseMinutes * (1 - progress)));
  const remainingKm = Math.max(0.2, +(7.4 * (1 - progress)).toFixed(1)).toFixed(1);

  return (
    <div className={`relative w-full h-[580px] bg-[#050505] text-white flex flex-col justify-between overflow-hidden select-none font-sans ${className}`}>
      {/* 1. Dynamic Vector Map Layer */}
      <div className="absolute inset-0">
        <svg
          viewBox="0 0 320 540"
          className="w-full h-full preserve-3d"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Street grid pattern */}
          <defs>
            <pattern id="city-grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#18181b" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="320" height="540" fill="url(#city-grid)" />

          {/* Secondary City Avenues */}
          <path d="M 20 420 L 300 280" stroke="#27272a" strokeWidth="2.5" />
          <path d="M 10 200 L 310 230" stroke="#27272a" strokeWidth="2.5" />
          <path d="M 160 20 L 140 520" stroke="#27272a" strokeWidth="2.5" />

          {/* Monitored Danger Zone (Brás / Centro SP) */}
          <circle
            cx="215"
            cy="215"
            r="44"
            fill="rgba(255, 255, 255, 0.04)"
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          {/* Animated radar ripple */}
          <circle
            cx="215"
            cy="215"
            r="38"
            fill="none"
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth="1.5"
            className="animate-ping"
            style={{ animationDuration: '3s' }}
          />
          <text
            x="215"
            y="218"
            fill="#a1a1aa"
            fontSize="7"
            fontFamily="monospace"
            fontWeight="bold"
            textAnchor="middle"
          >
            ZONA DE RISCO SP
          </text>

          {/* Danger Route (passes straight through the risk zone - dashed gray) */}
          <path
            d="M 50 390 L 110 300 L 215 215 L 270 110"
            stroke="#52525b"
            strokeWidth="3"
            strokeDasharray="6 4"
          />
          <text x="160" y="278" fill="#71717a" fontSize="6.5" fontFamily="monospace">
            Rota Rápida (com risco)
          </text>

          {/* SafeRoute Detour (100% Monitored Safe Bypass - Glowing Solid White) */}
          <path
            d="M 50 390 Q 75 340, 95 290 T 100 240 T 135 190 T 190 150 T 235 125 T 270 110"
            stroke="#ffffff"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-[0_0_8px_rgba(255,255,255,0.85)]"
          />

          {/* Origin Pin (Faria Lima) */}
          <circle cx="50" cy="390" r="6" fill="#ffffff" />
          <circle cx="50" cy="390" r="2.5" fill="#050505" />

          {/* Destination Pin (Paulista) */}
          <circle cx="270" cy="110" r="8" fill="#ffffff" />
          <circle cx="270" cy="110" r="3.5" fill="#050505" />

          {/* Moving Vehicle Dot with Pulsing Radar Ring */}
          <g transform={`translate(${carX}, ${carY})`}>
            {/* Radar Pulse Ring */}
            <circle
              r="14"
              fill="none"
              stroke="rgba(255, 255, 255, 0.45)"
              strokeWidth="1.5"
              className="animate-ping"
              style={{ animationDuration: '1.6s' }}
            />
            {/* Directional Vehicle Indicator */}
            <g transform={`rotate(${carAngle + 90})`}>
              <circle r="6" fill="#ffffff" className="drop-shadow-[0_0_6px_white]" />
              <polygon points="0,-7 3.5,4 0,1.5 -3.5,4" fill="#050505" />
            </g>
          </g>
        </svg>
      </div>

      {/* 2. Top Status Bar & Dynamic Island */}
      <div className="relative z-10 px-5 pt-3 flex items-center justify-between text-[11px] font-mono text-white/90">
        <span>09:41</span>
        {/* Dynamic Island Capsule */}
        <div className="w-24 h-5 rounded-full bg-black border border-neutral-800 flex items-center justify-center gap-1.5 px-2">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span className="text-[9px] font-bold tracking-tight text-neutral-300">SafeRoute</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px]">
          <span>5G SP</span>
          <div className="w-4 h-2 rounded-2xs border border-white/60 p-0.5 flex items-center">
            <div className="w-2.5 h-full bg-white rounded-3xs" />
          </div>
        </div>
      </div>

      {/* 3. Turn-by-Turn Guidance Card */}
      <div className="relative z-10 px-3.5 pt-2">
        <div className="p-3 rounded-2xl bg-neutral-950/92 backdrop-blur-xl border border-white/20 shadow-xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center shrink-0 shadow-md">
            <Navigation className="w-5 h-5 fill-current rotate-45" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">
              {progress < 0.85 ? 'EM 250 METROS' : 'CHEGADA'}
            </div>
            <div className="text-xs font-black truncate text-white">
              {turnText}
            </div>
            <div className="text-[10px] text-neutral-400 truncate">
              Desvio 100% monitorado &bull; SafeRoute SP
            </div>
          </div>
        </div>
      </div>

      {/* Travel Mode Selector Capsule ('Carro' | 'Moto' | 'A pé') */}
      <div className="relative z-10 px-3.5 pt-1.5 flex justify-center">
        <div className="flex items-center gap-1 p-0.5 rounded-xl bg-neutral-900/90 border border-white/20 backdrop-blur-md shadow-lg select-none">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectTravelMode?.('carro');
            }}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
              travelMode === 'carro'
                ? 'bg-white text-black font-extrabold shadow-sm scale-102'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="Modo Carro"
          >
            <Car className="w-3 h-3" />
            <span>Carro</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectTravelMode?.('moto');
            }}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
              travelMode === 'moto'
                ? 'bg-white text-black font-extrabold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="Modo Moto"
          >
            <Bike className="w-3 h-3" />
            <span>Moto</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectTravelMode?.('a_pe');
            }}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
              travelMode === 'a_pe'
                ? 'bg-white text-black font-extrabold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="Modo A pé"
          >
            <Footprints className="w-3 h-3" />
            <span>A pé</span>
          </button>
        </div>
      </div>

      {/* 4. Sliding SafeRoute Warning Alert - 4 seconds duration toast */}
      {showAlert && (
        <div className="relative z-10 px-3.5 pt-1 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="p-2.5 rounded-xl bg-neutral-900/95 border border-white/30 backdrop-blur-xl flex items-center gap-2.5 shadow-2xl ring-1 ring-white/10">
            <div className="w-6 h-6 rounded-lg bg-white text-black flex items-center justify-center shrink-0 shadow-sm">
              <AlertTriangle className="w-3.5 h-3.5 fill-current" />
            </div>
            <div className="min-w-0 flex-1 text-[11px] leading-tight">
              <div className="font-bold text-white flex items-center justify-between">
                <span>Alerta SafeRoute</span>
                <span className="text-[9px] font-mono text-neutral-400">agora</span>
              </div>
              <div className="text-[10px] text-neutral-300 truncate mt-0.5">
                Área de risco à frente evitada pelo SafeRoute.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Floating Speedometer Widget */}
      <div className="relative z-10 px-4 self-start mt-auto mb-2">
        <div className="w-13 h-13 rounded-2xl bg-neutral-950/90 border border-white/20 backdrop-blur-md flex flex-col items-center justify-center shadow-lg">
          <span className="text-sm font-mono font-black text-white leading-none">
            {speedKmH}
          </span>
          <span className="text-[8px] font-mono font-bold text-neutral-400 tracking-wider mt-0.5">
            KM/H
          </span>
        </div>
      </div>

      {/* 6. Bottom Navigation Sheet */}
      <div className="relative z-10 p-3.5 bg-white text-black rounded-t-[28px] shadow-[0_-10px_30px_rgba(0,0,0,0.5)] space-y-2">
        <div className="w-10 h-1 rounded-full bg-neutral-300 mx-auto -mt-1" />

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black font-mono tracking-tight">
                {remainingMin} min
              </span>
              <span className="text-xs font-mono font-bold text-neutral-500">
                ({remainingKm} km)
              </span>
            </div>
            <div className="text-[11px] font-semibold text-neutral-600 truncate max-w-[170px]">
              Destino: Av. Paulista (Monitorado)
            </div>
          </div>

          <div className="px-2.5 py-1 rounded-full bg-black text-white text-[10px] font-mono font-bold flex items-center gap-1 shadow-sm">
            <ShieldCheck className="w-3 h-3" />
            <span>94/100</span>
          </div>
        </div>

        {/* Video progress & control buttons */}
        <div className="pt-1 border-t border-neutral-200 flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-6 h-6 rounded-lg bg-black text-white flex items-center justify-center transition-transform active:scale-90"
              title={isPlaying ? 'Pausar simulação' : 'Iniciar simulação'}
            >
              {isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
            </button>
            <button
              type="button"
              onClick={() => setProgress(0)}
              className="p-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800"
              title="Reiniciar"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => setSimSpeed(simSpeed === 1 ? 2 : 1)}
              className="px-1.5 py-0.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-[10px]"
            >
              {simSpeed}x
            </button>
          </div>

          <div className="text-[10px] font-bold text-neutral-500 truncate">
            {phaseText}
          </div>
        </div>

        {/* Mini progress bar */}
        <div className="w-full h-1 bg-neutral-200 rounded-full overflow-hidden">
          <div
            style={{ width: `${Math.round(progress * 100)}%` }}
            className="h-full bg-black rounded-full transition-all duration-75"
          />
        </div>

        {/* Home Indicator */}
        <div className="w-24 h-1 rounded-full bg-neutral-300 mx-auto pt-0.5" />
      </div>
    </div>
  );
};
