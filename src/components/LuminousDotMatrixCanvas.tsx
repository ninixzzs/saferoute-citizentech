import React, { useRef, useEffect } from 'react';

interface LuminousDotMatrixCanvasProps {
  className?: string;
  dotSpacing?: number;
  glowRadius?: number;
  interactive?: boolean;
}

interface DotPoint {
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  intensity: number;
  ambientPhase: number;
}

interface ShockwaveRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  speed: number;
  alpha: number;
}

export const LuminousDotMatrixCanvas: React.FC<LuminousDotMatrixCanvasProps> = ({
  className = '',
  dotSpacing,
  glowRadius = 210,
  interactive = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse coordinate smoothing
    const mouse = {
      x: width * 0.5,
      y: height * 0.45,
      targetX: width * 0.5,
      targetY: height * 0.45,
      active: true,
      hovering: false,
    };

    const ripples: ShockwaveRipple[] = [];
    let dots: DotPoint[] = [];

    const spacing = dotSpacing || (width < 768 ? 22 : 28);

    const initGrid = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      const effectiveSpacing = dotSpacing || (width < 768 ? 22 : 28);
      const cols = Math.ceil(width / effectiveSpacing) + 2;
      const rows = Math.ceil(height / effectiveSpacing) + 2;

      dots = [];
      const offsetX = (width - (cols - 1) * effectiveSpacing) / 2;
      const offsetY = (height - (rows - 1) * effectiveSpacing) / 2;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const bx = offsetX + c * effectiveSpacing;
          const by = offsetY + r * effectiveSpacing;
          dots.push({
            baseX: bx,
            baseY: by,
            x: bx,
            y: by,
            intensity: 0,
            ambientPhase: Math.random() * Math.PI * 2,
          });
        }
      }
    };

    initGrid();

    const handleResize = () => {
      initGrid();
    };

    window.addEventListener('resize', handleResize);

    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
      mouse.hovering = true;
      mouse.active = true;
    };

    const handlePointerDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      mouse.targetX = clickX;
      mouse.targetY = clickY;
      mouse.hovering = true;
      mouse.active = true;

      // Launch expanding 3D shockwave ripple
      ripples.push({
        x: clickX,
        y: clickY,
        radius: 0,
        maxRadius: Math.max(width, height) * 0.75,
        speed: 14,
        alpha: 1.0,
      });
    };

    const handlePointerLeave = () => {
      mouse.hovering = false;
    };

    if (interactive) {
      window.addEventListener('pointermove', handlePointerMove, { passive: true });
      window.addEventListener('pointerdown', handlePointerDown, { passive: true });
      window.addEventListener('pointerleave', handlePointerLeave, { passive: true });
    }

    let startTime = performance.now();

    const render = (now: number) => {
      const elapsed = (now - startTime) * 0.001;

      // Smooth mouse lerp
      mouse.x += (mouse.targetX - mouse.x) * 0.12;
      mouse.y += (mouse.targetY - mouse.y) * 0.12;

      // Update active ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += r.speed;
        r.alpha = Math.max(0, 1 - r.radius / r.maxRadius);
        if (r.alpha <= 0.01) {
          ripples.splice(i, 1);
        }
      }

      // 1. Deep black canvas clear
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, width, height);

      // 2. Subtle cursor ambient glow aura
      if (mouse.hovering || mouse.active) {
        const glowGrad = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          glowRadius * 1.3
        );
        glowGrad.addColorStop(0, 'rgba(255, 255, 255, 0.07)');
        glowGrad.addColorStop(0.4, 'rgba(255, 255, 255, 0.02)');
        glowGrad.addColorStop(1, 'rgba(5, 5, 5, 0)');
        ctx.fillStyle = glowGrad;
        ctx.fillRect(
          mouse.x - glowRadius * 1.3,
          mouse.y - glowRadius * 1.3,
          glowRadius * 2.6,
          glowRadius * 2.6
        );
      }

      // 3. Render Dot Matrix
      const len = dots.length;
      for (let i = 0; i < len; i++) {
        const dot = dots[i];

        // Distance to cursor
        const dx = dot.baseX - mouse.x;
        const dy = dot.baseY - mouse.y;
        const dist = Math.hypot(dx, dy);

        let targetInt = 0;

        // Proximity illumination (3D cursor lighting)
        if (dist < glowRadius) {
          const factor = 1 - dist / glowRadius;
          targetInt = Math.pow(factor, 2.2);
        }

        // Ripple pulse illumination
        for (let j = 0; j < ripples.length; j++) {
          const rip = ripples[j];
          const ripDist = Math.hypot(dot.baseX - rip.x, dot.baseY - rip.y);
          const diff = Math.abs(ripDist - rip.radius);
          if (diff < 50) {
            const ripIntensity = (1 - diff / 50) * rip.alpha;
            targetInt = Math.max(targetInt, ripIntensity);
          }
        }

        // Smooth intensity transition
        dot.intensity += (targetInt - dot.intensity) * 0.22;

        // Ambient gentle wave breathing
        const ambientWave =
          Math.sin(dot.baseX * 0.007 + dot.baseY * 0.007 + elapsed * 1.6 + dot.ambientPhase * 0.2) *
          0.5 +
          0.5;

        // 3D perspective / depth displacement
        if (dot.intensity > 0.01) {
          const angle = Math.atan2(dy, dx);
          // 3D ripple wave offset
          const wavePush = Math.sin(dist * 0.045 - elapsed * 3.5) * (dot.intensity * 7);
          dot.x = dot.baseX + Math.cos(angle) * wavePush;
          dot.y = dot.baseY + Math.sin(angle) * wavePush;
        } else {
          dot.x = dot.baseX;
          dot.y = dot.baseY;
        }

        // Calculate dot size & alpha
        const alpha = Math.min(1, 0.12 + dot.intensity * 0.88 + ambientWave * 0.06);
        const radius = 1.3 + dot.intensity * 3.4;

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);

        // Highly illuminated dots get bright white shadow bloom
        if (dot.intensity > 0.35) {
          ctx.shadowBlur = dot.intensity * 14;
          ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.fill();
          // Reset shadow for performance
          ctx.shadowBlur = 0;
        } else {
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (interactive) {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerdown', handlePointerDown);
        window.removeEventListener('pointerleave', handlePointerLeave);
      }
    };
  }, [dotSpacing, glowRadius, interactive]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-auto touch-none ${className}`}
      style={{ background: '#050505' }}
    />
  );
};
