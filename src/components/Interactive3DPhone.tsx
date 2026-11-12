import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  RotateCcw,
  Sparkles,
  Move,
  Maximize2,
  Lock,
  Unlock,
  Sliders,
  Compass,
} from 'lucide-react';

interface Interactive3DPhoneProps {
  children: React.ReactNode;
  isStandbyLocked?: boolean;
  onToggleLock?: (locked: boolean) => void;
  className?: string;
}

export const Interactive3DPhone: React.FC<Interactive3DPhoneProps> = ({
  children,
  isStandbyLocked = false,
  onToggleLock,
  className = '',
}) => {
  // 3D Angles
  const [rotation, setRotation] = useState<{ x: number; y: number }>({ x: 8, y: -12 });
  const [isDragging, setIsDragging] = useState(false);
  const [interactMode, setInteractMode] = useState<'3d' | 'screen'>('3d');
  const [autoSway, setAutoSway] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startRotX: number; startRotY: number }>({
    mouseX: 0,
    mouseY: 0,
    startRotX: 8,
    startRotY: -12,
  });

  // Auto idle subtle floating sway when user is not dragging
  useEffect(() => {
    if (!autoSway || isDragging) return;

    let frameId: number;
    let t = 0;

    const loop = () => {
      t += 0.02;
      setRotation((prev) => ({
        x: 8 + Math.sin(t) * 3,
        y: -12 + Math.cos(t * 0.8) * 4,
      }));
      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [autoSway, isDragging]);

  // Drag handlers for 3D rotation
  const handlePointerDown = (e: React.PointerEvent) => {
    // If in screen mode and clicked on the screen, don't drag
    if (interactMode === 'screen' && (e.target as HTMLElement).closest('.phone-screen-target')) {
      return;
    }

    setAutoSway(false);
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startRotX: rotation.x,
      startRotY: rotation.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) {
      // Gentle hover parallax tilt when not dragging
      if (containerRef.current && !autoSway) {
        const rect = containerRef.current.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        setRotation({
          x: -py * 16,
          y: px * 20,
        });
      }
      return;
    }

    const deltaX = e.clientX - dragStartRef.current.mouseX;
    const deltaY = e.clientY - dragStartRef.current.mouseY;

    // Dampened 3D rotation delta
    const newRotY = Math.max(-55, Math.min(55, dragStartRef.current.startRotY + deltaX * 0.35));
    const newRotX = Math.max(-40, Math.min(40, dragStartRef.current.startRotX - deltaY * 0.35));

    setRotation({ x: newRotX, y: newRotY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignored if capture was already released
    }
  };

  const handlePresetAngle = (x: number, y: number) => {
    setAutoSway(false);
    setRotation({ x, y });
  };

  const handleSpin360 = () => {
    setAutoSway(false);
    const startY = rotation.y;
    const startTime = performance.now();
    const duration = 1200;

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Smooth easeInOutQuad
      const eased = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
      setRotation({
        x: 6 * Math.sin(progress * Math.PI),
        y: startY + 360 * eased,
      });

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setRotation({ x: 8, y: -12 });
      }
    };

    requestAnimationFrame(step);
  };

  // Specular light position based on 3D rotation angle
  const glareX = 50 + rotation.y * 1.2;
  const glareY = 50 - rotation.x * 1.2;

  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      {/* 3D Model Floating Controller Header */}
      <div className="w-full max-w-[420px] mb-3 flex items-center justify-between gap-2 px-3 py-2 rounded-2xl bg-neutral-900/90 dark:bg-neutral-950/90 border border-neutral-800 backdrop-blur-xl shadow-lg z-20">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-200 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5" />
            <span>Celular 3D Interativo</span>
          </span>
        </div>

        {/* Quick Angle Presets */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handlePresetAngle(0, 0)}
            className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
              rotation.x === 0 && rotation.y === 0
                ? 'bg-white text-black'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
            title="Vista Frontal"
          >
            Frontal
          </button>
          <button
            type="button"
            onClick={() => handlePresetAngle(12, -18)}
            className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-all"
            title="Vista 3D Inclinada"
          >
            3D Tilt
          </button>
          <button
            type="button"
            onClick={handleSpin360}
            className="p-1 rounded-lg text-[10px] bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-all"
            title="Giro 360°"
            aria-label="Girar 360 graus"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
          {onToggleLock && (
            <button
              type="button"
              onClick={() => onToggleLock(!isStandbyLocked)}
              className="p-1 rounded-lg text-[10px] bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-all"
              title={isStandbyLocked ? 'Destravar' : 'Bloquear (Standby)'}
              aria-label="Alternar bloqueio da tela"
            >
              {isStandbyLocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>

      {/* 3D Stage Viewport */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ perspective: '1300px' }}
        className="relative w-full max-w-[440px] flex items-center justify-center cursor-grab active:cursor-grabbing py-2 touch-none select-none"
      >
        {/* Dynamic Shadow underneath the floating phone */}
        <div
          style={{
            transform: `translate3d(${rotation.y * 1.5}px, 40px, -60px) scale(${1 - Math.abs(rotation.x) * 0.005})`,
            filter: 'blur(24px)',
          }}
          className="absolute bottom-6 w-[280px] h-[36px] rounded-full bg-black/80 dark:bg-black/95 pointer-events-none transition-transform duration-75 ease-out"
        />

        {/* 3D Chassis Object */}
        <div
          style={{
            transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
            transformStyle: 'preserve-3d',
            transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
          className="relative transition-transform preserve-3d will-change-transform"
        >
          {/* Simulated Titanium Side Buttons (Left & Right Edge) */}
          <div
            style={{ transform: 'translateZ(-4px)' }}
            className="absolute -left-[10px] top-28 w-2 h-10 rounded-l-md bg-neutral-700 border-l border-neutral-500 pointer-events-none shadow-md"
          />
          <div
            style={{ transform: 'translateZ(-4px)' }}
            className="absolute -left-[10px] top-42 w-2 h-12 rounded-l-md bg-neutral-700 border-l border-neutral-500 pointer-events-none shadow-md"
          />
          <div
            style={{ transform: 'translateZ(-4px)' }}
            className="absolute -right-[10px] top-32 w-2 h-16 rounded-r-md bg-neutral-700 border-r border-neutral-500 pointer-events-none shadow-md"
          />

          {/* Phone Shell */}
          <div className="relative rounded-[48px] bg-neutral-950 p-2 shadow-[0_30px_90px_rgba(0,0,0,0.85)] border border-neutral-700/80 ring-1 ring-white/10">
            {/* Interactive Screen Target Area */}
            <div className="phone-screen-target relative overflow-hidden rounded-[40px]">
              {children}

              {/* Dynamic Specular Glass Glare Layer */}
              <div
                style={{
                  background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 35%, transparent 70%)`,
                }}
                className="absolute inset-0 pointer-events-none z-40 transition-all duration-75"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Drag & Interaction Instruction Pill */}
      <div className="mt-3 flex items-center justify-between w-full max-w-[400px] px-3 py-1.5 rounded-full bg-neutral-900/80 dark:bg-neutral-950/80 border border-neutral-800 text-[11px] font-mono text-neutral-400">
        <span className="flex items-center gap-1.5">
          <Move className="w-3.5 h-3.5 text-neutral-200 animate-pulse" />
          <span>Arraste para girar em 3D livre</span>
        </span>
        <button
          type="button"
          onClick={() => {
            setAutoSway(true);
            setRotation({ x: 8, y: -12 });
          }}
          className="text-neutral-300 hover:text-white underline underline-offset-2 transition-colors"
        >
          Auto-flutuação
        </button>
      </div>
    </div>
  );
};
