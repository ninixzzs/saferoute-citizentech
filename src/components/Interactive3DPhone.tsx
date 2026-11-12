import React, { useState, useRef, useEffect } from 'react';
import {
  RotateCcw,
  Move,
  Lock,
  Unlock,
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
  const [rotation, setRotation] = useState<{ x: number; y: number }>({ x: 9, y: -14 });
  const [isDragging, setIsDragging] = useState(false);
  const [autoSway, setAutoSway] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startRotX: number; startRotY: number }>({
    mouseX: 0,
    mouseY: 0,
    startRotX: 9,
    startRotY: -14,
  });

  // Smooth auto-idle floating & breathing animation
  useEffect(() => {
    if (!autoSway || isDragging || isHovered) return;

    let frameId: number;
    let t = 0;

    const loop = () => {
      t += 0.018;
      setRotation({
        x: 9 + Math.sin(t) * 3.5,
        y: -14 + Math.cos(t * 0.75) * 5,
      });
      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [autoSway, isDragging, isHovered]);

  // Pointer drag handling for 3D orbital rotation
  const handlePointerDown = (e: React.PointerEvent) => {
    // If the click is directly on an interactive button inside the phone screen, don't drag
    if ((e.target as HTMLElement).closest('button, input, a, select')) {
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
    if (isDragging) {
      const deltaX = e.clientX - dragStartRef.current.mouseX;
      const deltaY = e.clientY - dragStartRef.current.mouseY;

      const newRotY = Math.max(-50, Math.min(50, dragStartRef.current.startRotY + deltaX * 0.38));
      const newRotX = Math.max(-35, Math.min(35, dragStartRef.current.startRotX - deltaY * 0.38));

      setRotation({ x: newRotX, y: newRotY });
      return;
    }

    // Parallax gyro tilt on mouse hover
    if (containerRef.current && isHovered) {
      const rect = containerRef.current.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      setRotation({
        x: -py * 16,
        y: px * 22,
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Release capture safe
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
    const duration = 1100;

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Smooth easeInOutCubic
      const eased =
        progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      setRotation({
        x: 8 * Math.sin(progress * Math.PI),
        y: startY + 360 * eased,
      });

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setRotation({ x: 9, y: -14 });
        setAutoSway(true);
      }
    };

    requestAnimationFrame(step);
  };

  // Specular light position based on 3D rotation angle
  const glareX = 50 + rotation.y * 1.35;
  const glareY = 50 - rotation.x * 1.35;

  return (
    <div
      className={`relative flex flex-col items-center justify-center select-none w-full ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        if (!isDragging) setAutoSway(true);
      }}
    >
      {/* 3D Stage Viewport (ZERO TEXT ABOVE - Clean & Immersive) */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ perspective: '1400px' }}
        className="relative w-full max-w-[430px] flex items-center justify-center cursor-grab active:cursor-grabbing py-3 touch-none select-none"
      >
        {/* Soft 3D Floating Shadow */}
        <div
          style={{
            transform: `translate3d(${rotation.y * 1.8}px, 48px, -80px) scale(${1 - Math.abs(rotation.x) * 0.006})`,
            filter: 'blur(28px)',
          }}
          className="absolute bottom-6 w-[290px] h-[40px] rounded-full bg-black/85 dark:bg-black/95 pointer-events-none transition-transform duration-100 ease-out"
        />

        {/* 3D Chassis Body with Titanium Chamfers & Lateral Depth */}
        <div
          style={{
            transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
            transformStyle: 'preserve-3d',
            transition: isDragging ? 'none' : 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          className="relative preserve-3d will-change-transform"
        >
          {/* Simulated Titanium Metallic Hardware Edge (Left Volume & Action Buttons) */}
          <div
            style={{ transform: 'translateZ(-5px)' }}
            className="absolute -left-[9px] top-28 w-2 h-9 rounded-l-sm bg-gradient-to-r from-neutral-500 to-neutral-700 pointer-events-none shadow-md"
          />
          <div
            style={{ transform: 'translateZ(-5px)' }}
            className="absolute -left-[9px] top-40 w-2 h-14 rounded-l-sm bg-gradient-to-r from-neutral-500 to-neutral-700 pointer-events-none shadow-md"
          />
          <div
            style={{ transform: 'translateZ(-5px)' }}
            className="absolute -left-[9px] top-58 w-2 h-14 rounded-l-sm bg-gradient-to-r from-neutral-500 to-neutral-700 pointer-events-none shadow-md"
          />

          {/* Right Power/Siri Button */}
          <div
            style={{ transform: 'translateZ(-5px)' }}
            className="absolute -right-[9px] top-36 w-2 h-20 rounded-r-sm bg-gradient-to-l from-neutral-500 to-neutral-700 pointer-events-none shadow-md"
          />

          {/* Phone Shell: Executive Titanium Outer Rim + Sapphire Screen Bezel */}
          <div className="relative rounded-[50px] p-[10px] bg-gradient-to-b from-neutral-700 via-neutral-900 to-neutral-950 shadow-[0_36px_110px_rgba(0,0,0,0.95)] border border-neutral-600/60 ring-1 ring-white/15">
            {/* Inner Chamfer Rim */}
            <div className="relative rounded-[42px] overflow-hidden bg-neutral-950 p-1 ring-1 ring-white/10 shadow-inner">
              {/* Screen Container */}
              <div className="phone-screen-target relative overflow-hidden rounded-[38px]">
                {children}

                {/* Optical Specular Glare (Reacts smoothly to 3D rotation) */}
                <div
                  style={{
                    background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 30%, transparent 68%)`,
                  }}
                  className="absolute inset-0 pointer-events-none z-40 transition-all duration-75"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Discreet Control Capsule at BOTTOM (Ultra-sleek glassmorphism pill) */}
      <div className="mt-2 flex items-center justify-between w-full max-w-[370px] px-3.5 py-1.5 rounded-full bg-neutral-900/85 dark:bg-neutral-950/85 border border-neutral-800/90 backdrop-blur-xl text-[11px] font-mono text-neutral-400 shadow-md">
        <div className="flex items-center gap-1.5 text-neutral-300">
          <Move className="w-3.5 h-3.5 animate-pulse text-white" />
          <span>Girar em 3D</span>
        </div>

        {/* Quick Angle Presets & Standby Toggle */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handlePresetAngle(0, 0)}
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
              rotation.x === 0 && rotation.y === 0
                ? 'bg-white text-black'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
            title="Vista Frontal"
          >
            0°
          </button>
          <button
            type="button"
            onClick={() => handlePresetAngle(12, -18)}
            className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-all"
            title="Vista Inclinada"
          >
            3D
          </button>
          <button
            type="button"
            onClick={handleSpin360}
            className="p-1 rounded-md text-[10px] bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-all"
            title="Giro 360°"
            aria-label="Girar 360 graus"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
          {onToggleLock && (
            <button
              type="button"
              onClick={() => onToggleLock(!isStandbyLocked)}
              className="p-1 rounded-md text-[10px] bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-all"
              title={isStandbyLocked ? 'Destravar' : 'Bloquear'}
              aria-label="Alternar bloqueio da tela"
            >
              {isStandbyLocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
