import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  RotateCcw,
  Compass,
  Move,
  Maximize2,
  Layers,
  Shield,
  Smartphone,
  Sparkles,
} from 'lucide-react';

interface Phone3DCanvasProps {
  className?: string;
  onExploreWorkspace?: () => void;
  onOpenSimulator?: () => void;
}

export const Phone3DCanvas: React.FC<Phone3DCanvasProps> = ({
  className = '',
  onExploreWorkspace,
  onOpenSimulator,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const phoneGroupRef = useRef<THREE.Group | null>(null);
  const shadowMeshRef = useRef<THREE.Mesh | null>(null);

  // Rotation & Physics State
  const rotationTarget = useRef<{ x: number; y: number }>({ x: 0.15, y: -0.35 });
  const rotationCurrent = useRef<{ x: number; y: number }>({ x: 0.15, y: -0.35 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number; rotX: number; rotY: number }>({
    x: 0,
    y: 0,
    rotX: 0.15,
    rotY: -0.35,
  });
  const autoSwayRef = useRef(true);
  const [activePreset, setActivePreset] = useState<'3d' | 'front' | 'back'>('3d');

  // Draw High-Resolution Live UI Canvas for the Phone Screen Texture
  const createScreenCanvas = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    // Dark sleek background
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, 1024, 2048);

    // Subtle dark map grid
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 3;
    for (let x = 0; x < 1024; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 2048);
      ctx.stroke();
    }
    for (let y = 0; y < 2048; y += 80) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1024, y);
      ctx.stroke();
    }

    // Secondary streets (subtle white lines)
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(120, 200);
    ctx.lineTo(900, 700);
    ctx.lineTo(400, 1400);
    ctx.lineTo(850, 1900);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(80, 1200);
    ctx.lineTo(950, 1100);
    ctx.stroke();

    // Risk Zone Geofencing Circle (São Paulo Centro/Brás)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 4;
    ctx.setLineDash([16, 12]);
    ctx.beginPath();
    ctx.arc(680, 880, 190, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);

    // Risk zone warning badge inside circle
    ctx.fillStyle = 'rgba(24, 24, 27, 0.9)';
    ctx.fillRect(560, 850, 240, 60);
    ctx.strokeStyle = '#52525b';
    ctx.strokeRect(560, 850, 240, 60);
    ctx.fillStyle = '#e4e4e7';
    ctx.font = 'bold 24px monospace';
    ctx.fillText('ÁREA MONITORADA', 575, 890);

    // Alternative Route (Rapid, enters warning zone - dashed gray)
    ctx.strokeStyle = '#52525b';
    ctx.lineWidth = 10;
    ctx.setLineDash([20, 16]);
    ctx.beginPath();
    ctx.moveTo(220, 1600);
    ctx.lineTo(420, 1200);
    ctx.lineTo(650, 920);
    ctx.lineTo(820, 480);
    ctx.stroke();
    ctx.setLineDash([]);

    // SafeRoute Detour (100% monitored bypass - glowing solid white line)
    ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
    ctx.shadowBlur = 24;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(220, 1600);
    ctx.lineTo(340, 1350);
    ctx.lineTo(320, 1050);
    ctx.lineTo(480, 680);
    ctx.lineTo(820, 480);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Origin Marker (Pinheiros / Faria Lima)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(220, 1600, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#050505';
    ctx.beginPath();
    ctx.arc(220, 1600, 10, 0, Math.PI * 2);
    ctx.fill();

    // Destination Marker (Avenida Paulista / Jardins)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(820, 480, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#050505';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Top Status Bar (Clean minimalist status)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('9:41', 110, 120);

    ctx.font = 'bold 30px monospace';
    ctx.fillText('5G  100%', 810, 120);

    // Dynamic Island
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.roundRect(360, 68, 304, 76, 38);
    ctx.fill();
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Live Turn-by-Turn HUD Card (Floating Glassmorphism Header)
    ctx.fillStyle = 'rgba(15, 15, 18, 0.94)';
    ctx.beginPath();
    ctx.roundRect(64, 210, 896, 230, 44);
    ctx.fill();
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Turn arrow icon background
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(96, 246, 120, 120, 30);
    ctx.fill();
    // Turn arrow shape
    ctx.fillStyle = '#050505';
    ctx.beginPath();
    ctx.moveTo(156, 276);
    ctx.lineTo(190, 310);
    ctx.lineTo(168, 310);
    ctx.lineTo(168, 336);
    ctx.lineTo(144, 336);
    ctx.lineTo(144, 310);
    ctx.lineTo(122, 310);
    ctx.closePath();
    ctx.fill();

    // Turn instructions
    ctx.fillStyle = '#a1a1aa';
    ctx.font = 'bold 28px monospace';
    ctx.fillText('EM 350 METROS', 246, 280);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText('Acesse Av. Paulista (Desvio)', 246, 336);

    ctx.fillStyle = '#e4e4e7';
    ctx.font = '30px sans-serif';
    ctx.fillText('100% monitorada pela Defesa Civil SP', 246, 385);

    // Pre-Trip Calm Notification Floating Banner
    ctx.fillStyle = 'rgba(24, 24, 27, 0.92)';
    ctx.beginPath();
    ctx.roundRect(64, 480, 896, 130, 36);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText('SafeRoute Alerta Preventivo', 104, 532);

    ctx.fillStyle = '#d4d4d8';
    ctx.font = '26px sans-serif';
    ctx.fillText('Boa viagem! Seu trajeto está sem indícios negativos.', 104, 574);

    // Bottom Navigation Summary Card
    ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
    ctx.beginPath();
    ctx.roundRect(64, 1540, 896, 420, 52);
    ctx.fill();

    // Route Metrics
    ctx.fillStyle = '#050505';
    ctx.font = '900 76px monospace';
    ctx.fillText('21 min', 110, 1650);

    ctx.fillStyle = '#71717a';
    ctx.font = 'bold 36px monospace';
    ctx.fillText('(7.4 km)', 420, 1640);

    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.roundRect(660, 1590, 260, 68, 24);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px monospace';
    ctx.fillText('SEGURANÇA 94/100', 680, 1634);

    ctx.fillStyle = '#52525b';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText('Rota Segura: Av. Brigadeiro Faria Lima → Paulista', 110, 1720);

    // Big Action Button inside phone screen
    ctx.fillStyle = '#050505';
    ctx.beginPath();
    ctx.roundRect(100, 1770, 824, 110, 36);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 36px sans-serif';
    ctx.fillText('Iniciar Trajeto Monitorado', 310, 1838);

    // Impact Signature inside Screen
    ctx.fillStyle = '#71717a';
    ctx.font = 'bold 24px monospace';
    ctx.fillText('“Vá com segurança. Vá de SafeRoute.”', 270, 1925);

    // iOS Home Indicator Line
    ctx.fillStyle = '#71717a';
    ctx.beginPath();
    ctx.roundRect(372, 1990, 280, 12, 6);
    ctx.fill();

    return canvas;
  }, []);

  // Initialize Three.js Scene, Realistic Phone Geometry & Physics
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 440;
    const height = container.clientHeight || 640;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.8);
    cameraRef.current = camera;

    // 2. Renderer with High Dynamic Range Tone Mapping
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 3. Studio Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    // Directional Key Light (Top-Right specular highlight)
    const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
    keyLight.position.set(5, 7, 6);
    scene.add(keyLight);

    // Rim Light (Left rim gleam on titanium edges)
    const rimLight = new THREE.DirectionalLight(0xd4d4d8, 2.4);
    rimLight.position.set(-6, -2, -4);
    scene.add(rimLight);

    // Subtle Bottom Fill Light
    const fillLight = new THREE.DirectionalLight(0xa1a1aa, 1.2);
    fillLight.position.set(0, -5, 4);
    scene.add(fillLight);

    // 4. Main Phone Group
    const phoneGroup = new THREE.Group();
    scene.add(phoneGroup);
    phoneGroupRef.current = phoneGroup;

    // Dimensions of Flagship Smartphone in 3D Units
    const phoneW = 3.0;
    const phoneH = 6.2;
    const phoneD = 0.28;

    // Chassis Material (Dark Brushed Natural Titanium)
    const titaniumMaterial = new THREE.MeshStandardMaterial({
      color: 0x1f1f22,
      metalness: 0.85,
      roughness: 0.25,
    });

    // Back Glass Material (Frosted Matte Obsidian)
    const backGlassMaterial = new THREE.MeshStandardMaterial({
      color: 0x0c0c0e,
      metalness: 0.2,
      roughness: 0.45,
    });

    // Screen Texture Material (High-Res Procedural UI Canvas)
    const screenCanvas = createScreenCanvas();
    const screenTexture = new THREE.CanvasTexture(screenCanvas);
    screenTexture.generateMipmaps = true;
    screenTexture.minFilter = THREE.LinearMipmapLinearFilter;

    const screenMaterial = new THREE.MeshStandardMaterial({
      map: screenTexture,
      roughness: 0.12,
      metalness: 0.05,
    });

    // A. Main Phone Body (Center Core)
    const bodyGeo = new THREE.BoxGeometry(phoneW, phoneH, phoneD);
    const bodyMaterials = [
      titaniumMaterial, // Right edge
      titaniumMaterial, // Left edge
      titaniumMaterial, // Top edge
      titaniumMaterial, // Bottom edge
      screenMaterial,   // Front face (Screen)
      backGlassMaterial // Back face (Matte Glass)
    ];
    const phoneBody = new THREE.Mesh(bodyGeo, bodyMaterials);
    phoneGroup.add(phoneBody);

    // B. Beveled Titanium Perimeter Rim
    const rimGeo = new THREE.BoxGeometry(phoneW + 0.04, phoneH + 0.04, phoneD - 0.04);
    const rimMesh = new THREE.Mesh(rimGeo, titaniumMaterial);
    phoneGroup.add(rimMesh);

    // C. Physical Hardware Buttons (Volume & Power / Action Button)
    const buttonMat = new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.9, roughness: 0.2 });
    
    // Left Buttons (Volume Up & Down)
    const volUpGeo = new THREE.BoxGeometry(0.04, 0.45, 0.08);
    const volUp = new THREE.Mesh(volUpGeo, buttonMat);
    volUp.position.set(-phoneW / 2 - 0.02, 1.1, 0);
    phoneGroup.add(volUp);

    const volDownGeo = new THREE.BoxGeometry(0.04, 0.45, 0.08);
    const volDown = new THREE.Mesh(volDownGeo, buttonMat);
    volDown.position.set(-phoneW / 2 - 0.02, 0.5, 0);
    phoneGroup.add(volDown);

    // Right Button (Power Lock)
    const powerGeo = new THREE.BoxGeometry(0.04, 0.7, 0.08);
    const powerBtn = new THREE.Mesh(powerGeo, buttonMat);
    powerBtn.position.set(phoneW / 2 + 0.02, 0.8, 0);
    phoneGroup.add(powerBtn);

    // D. Pro Camera Island on the Back Face
    const cameraIslandGeo = new THREE.BoxGeometry(1.2, 1.25, 0.12);
    const cameraIslandMat = new THREE.MeshStandardMaterial({
      color: 0x141416,
      metalness: 0.4,
      roughness: 0.3,
    });
    const cameraIsland = new THREE.Mesh(cameraIslandGeo, cameraIslandMat);
    cameraIsland.position.set(-phoneW / 2 + 0.8, phoneH / 2 - 0.85, -phoneD / 2 - 0.06);
    phoneGroup.add(cameraIsland);

    // 3 Sapphire Camera Lenses with Metallic Chamfers
    const lensRingGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.1, 32);
    lensRingGeo.rotateX(Math.PI / 2);
    const lensRingMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46, metalness: 0.95, roughness: 0.15 });

    const lensGlassGeo = new THREE.CylinderGeometry(0.17, 0.17, 0.11, 32);
    lensGlassGeo.rotateX(Math.PI / 2);
    const lensGlassMat = new THREE.MeshStandardMaterial({ color: 0x050508, metalness: 0.1, roughness: 0.05 });

    const lensPositions = [
      { x: -0.32, y: 0.32 },
      { x: -0.32, y: -0.32 },
      { x: 0.32, y: 0 },
    ];

    lensPositions.forEach((pos) => {
      const ring = new THREE.Mesh(lensRingGeo, lensRingMat);
      ring.position.set(
        cameraIsland.position.x + pos.x,
        cameraIsland.position.y + pos.y,
        cameraIsland.position.z - 0.04
      );
      phoneGroup.add(ring);

      const glass = new THREE.Mesh(lensGlassGeo, lensGlassMat);
      glass.position.set(ring.position.x, ring.position.y, ring.position.z - 0.01);
      phoneGroup.add(glass);
    });

    // Dual-Tone Flash & LiDAR Sensor on Camera Island
    const flashGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.04, 16);
    flashGeo.rotateX(Math.PI / 2);
    const flashMat = new THREE.MeshStandardMaterial({ color: 0xf4f4f5, roughness: 0.2 });
    const flash = new THREE.Mesh(flashGeo, flashMat);
    flash.position.set(cameraIsland.position.x + 0.32, cameraIsland.position.y + 0.34, cameraIsland.position.z - 0.04);
    phoneGroup.add(flash);

    // E. Back Logo (Laser-Etched SafeRoute Minimalist Shield)
    const logoCanvas = document.createElement('canvas');
    logoCanvas.width = 256;
    logoCanvas.height = 256;
    const lCtx = logoCanvas.getContext('2d');
    if (lCtx) {
      lCtx.clearRect(0, 0, 256, 256);
      lCtx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      lCtx.lineWidth = 14;
      lCtx.beginPath();
      lCtx.moveTo(128, 40);
      lCtx.lineTo(200, 70);
      lCtx.lineTo(200, 140);
      lCtx.quadraticCurveTo(200, 210, 128, 230);
      lCtx.quadraticCurveTo(56, 210, 56, 140);
      lCtx.lineTo(56, 70);
      lCtx.closePath();
      lCtx.stroke();
    }
    const logoTex = new THREE.CanvasTexture(logoCanvas);
    const logoMat = new THREE.MeshBasicMaterial({ map: logoTex, transparent: true, opacity: 0.5 });
    const logoMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), logoMat);
    logoMesh.rotation.y = Math.PI;
    logoMesh.position.set(0, 0, -phoneD / 2 - 0.005);
    phoneGroup.add(logoMesh);

    // 5. Dynamic Floor Shadow underneath the floating phone
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sCtx = shadowCanvas.getContext('2d');
    if (sCtx) {
      const grad = sCtx.createRadialGradient(128, 128, 10, 128, 128, 120);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
      grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.35)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, 256, 256);
    }
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    const shadowGeo = new THREE.PlaneGeometry(4.6, 2.4);
    const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, opacity: 0.75 });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.set(0, -3.5, 0);
    scene.add(shadowMesh);
    shadowMeshRef.current = shadowMesh;

    // 6. Smooth Animation Loop with Inertia Dampening
    let animationFrameId: number;
    let t = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Auto floating sway when idle
      if (autoSwayRef.current && !isDraggingRef.current) {
        t += 0.016;
        rotationTarget.current.x = 0.15 + Math.sin(t) * 0.05;
        rotationTarget.current.y = -0.35 + Math.cos(t * 0.8) * 0.08;
        phoneGroup.position.y = Math.sin(t * 1.2) * 0.08;
      }

      // Smooth Lerp Dampening towards rotation target
      const lerpSpeed = 0.1;
      rotationCurrent.current.x += (rotationTarget.current.x - rotationCurrent.current.x) * lerpSpeed;
      rotationCurrent.current.y += (rotationTarget.current.y - rotationCurrent.current.y) * lerpSpeed;

      phoneGroup.rotation.x = rotationCurrent.current.x;
      phoneGroup.rotation.y = rotationCurrent.current.y;

      // Deform floor shadow dynamically with 3D tilt
      if (shadowMeshRef.current) {
        shadowMeshRef.current.position.x = phoneGroup.position.x + rotationCurrent.current.y * 0.6;
        shadowMeshRef.current.scale.set(
          1 - Math.abs(rotationCurrent.current.y) * 0.15,
          1 - Math.abs(rotationCurrent.current.x) * 0.15,
          1
        );
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 440;
      const h = container.clientHeight || 640;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [createScreenCanvas]);

  // Pointer Interaction Handlers for 3D Drag Rotation
  const handlePointerDown = (e: React.PointerEvent) => {
    autoSwayRef.current = false;
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      rotX: rotationTarget.current.x,
      rotY: rotationTarget.current.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;

    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;

    rotationTarget.current.y = dragStartRef.current.rotY + deltaX * 0.007;
    rotationTarget.current.x = Math.max(-0.6, Math.min(0.6, dragStartRef.current.rotX + deltaY * 0.007));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const setViewAngle = (preset: '3d' | 'front' | 'back') => {
    setActivePreset(preset);
    autoSwayRef.current = false;

    if (preset === 'front') {
      rotationTarget.current = { x: 0, y: 0 };
    } else if (preset === 'back') {
      rotationTarget.current = { x: 0.1, y: Math.PI };
    } else {
      rotationTarget.current = { x: 0.18, y: -0.45 };
    }
  };

  const handleSpin360 = () => {
    autoSwayRef.current = false;
    const startY = rotationTarget.current.y;
    const startTime = performance.now();
    const duration = 1200;

    const spinStep = (now: number) => {
      const elapsed = now - startTime;
      const p = Math.min(1, elapsed / duration);
      const eased = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      rotationTarget.current.y = startY + Math.PI * 2 * eased;

      if (p < 1) {
        requestAnimationFrame(spinStep);
      } else {
        rotationTarget.current.y = startY + Math.PI * 2;
        autoSwayRef.current = true;
      }
    };

    requestAnimationFrame(spinStep);
  };

  return (
    <div className={`relative flex flex-col items-center justify-center w-full select-none ${className}`}>
      {/* Real WebGL Three.js Viewport (ZERO TEXT ABOVE) */}
      <div
        ref={mountRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="w-full h-[540px] sm:h-[620px] max-w-[440px] flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none relative"
      />

      {/* Luxury Minimal Floating Glass Capsule at BOTTOM */}
      <div className="w-full max-w-[390px] px-3.5 py-2 rounded-2xl bg-neutral-900/90 dark:bg-neutral-950/90 border border-neutral-800 backdrop-blur-2xl shadow-2xl flex items-center justify-between gap-2 z-20 -mt-4">
        {/* Drag Hint */}
        <div className="flex items-center gap-1.5 text-neutral-300 font-mono text-[11px]">
          <Move className="w-3.5 h-3.5 text-white animate-pulse" />
          <span>Girar 3D Livre</span>
        </div>

        {/* Preset Angle Pills */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setViewAngle('front')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
              activePreset === 'front' ? 'bg-white text-black shadow-sm' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            Tela
          </button>
          <button
            type="button"
            onClick={() => setViewAngle('3d')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
              activePreset === '3d' ? 'bg-white text-black shadow-sm' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            3D Tilt
          </button>
          <button
            type="button"
            onClick={() => setViewAngle('back')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
              activePreset === 'back' ? 'bg-white text-black shadow-sm' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            Traseira
          </button>
          <button
            type="button"
            onClick={handleSpin360}
            className="p-1.5 rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-all"
            title="Giro 360°"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
