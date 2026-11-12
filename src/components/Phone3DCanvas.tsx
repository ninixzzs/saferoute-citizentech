import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  RotateCcw,
  Play,
  Pause,
  Move,
  FastForward,
  Navigation,
  ShieldCheck,
  Sparkles,
  MapPin,
  Clock,
  Gauge,
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
  const screenTextureRef = useRef<THREE.CanvasTexture | null>(null);

  // Rotation & Physics State
  const rotationTarget = useRef<{ x: number; y: number }>({ x: 0.14, y: -0.32 });
  const rotationCurrent = useRef<{ x: number; y: number }>({ x: 0.14, y: -0.32 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number; rotX: number; rotY: number }>({
    x: 0,
    y: 0,
    rotX: 0.14,
    rotY: -0.32,
  });
  const autoSwayRef = useRef(true);
  const [activePreset, setActivePreset] = useState<'3d' | 'front' | 'back'>('3d');

  // Simulation / Video State inside the 3D phone screen
  const [isPlaying, setIsPlaying] = useState(true);
  const isPlayingRef = useRef(true);
  const [simSpeed, setSimSpeed] = useState<1 | 2>(1);
  const simSpeedRef = useRef<1 | 2>(1);
  const simTimeRef = useRef(0); // 0 to 18 seconds loop
  const [simProgressPercent, setSimProgressPercent] = useState(0);
  const [simPhaseLabel, setSimPhaseLabel] = useState('Monitoramento Ativo');

  // Sync refs with state
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    simSpeedRef.current = simSpeed;
  }, [simSpeed]);

  // Waypoints for the vehicle trajectory in SP (Pinheiros -> Rebouças -> Paulista)
  const trajectoryPoints = [
    { x: 220, y: 1620 },
    { x: 290, y: 1450 },
    { x: 330, y: 1280 },
    { x: 330, y: 1050 },
    { x: 420, y: 820 },
    { x: 580, y: 640 },
    { x: 740, y: 530 },
    { x: 820, y: 480 },
  ];

  // Helper to interpolate point along trajectory
  const getInterpolatedPosition = (progress: number) => {
    const totalSegments = trajectoryPoints.length - 1;
    const scaledP = progress * totalSegments;
    const index = Math.min(totalSegments - 1, Math.floor(scaledP));
    const subP = scaledP - index;

    const p0 = trajectoryPoints[index];
    const p1 = trajectoryPoints[index + 1] || p0;

    return {
      x: p0.x + (p1.x - p0.x) * subP,
      y: p0.y + (p1.y - p0.y) * subP,
      angle: Math.atan2(p1.y - p0.y, p1.x - p0.x),
    };
  };

  // Draw 60fps Dynamic Living Mini-App Video Screen on Canvas
  const drawScreenFrame = useCallback((ctx: CanvasRenderingContext2D, time: number) => {
    const totalDuration = 18; // 18 seconds loop
    const progress = (time % totalDuration) / totalDuration;
    const vehicle = getInterpolatedPosition(progress);

    // Dynamic phase info
    let phase = 'Traçado Seguro';
    let speed = 42;
    let turnText = 'Siga na Av. Rebouças';
    let turnDistance = 'Em 400 metros';
    let showAlertBanner = false;
    let alertMessage = 'Zona de atenção monitorada no Brás';

    if (progress < 0.22) {
      phase = 'Planejando Desvio';
      speed = Math.round(20 + progress * 80);
      turnText = 'Inicie pela Av. Brigadeiro Faria Lima';
      turnDistance = 'Partida';
    } else if (progress < 0.55) {
      phase = 'Trajeto em Andamento';
      speed = Math.round(44 + Math.sin(time * 3) * 6);
      turnText = 'Acesse Av. Rebouças (Desvio Seguro)';
      turnDistance = 'Em 350 metros';
    } else if (progress < 0.85) {
      phase = 'Alerta Evitado';
      speed = Math.round(38 + Math.sin(time * 2) * 5);
      turnText = 'Vire à direita na Av. Paulista';
      turnDistance = 'Em 180 metros';
      showAlertBanner = true;
      alertMessage = 'Desvio SafeRoute ativo: área de risco evitada';
    } else {
      phase = 'Chegada Segura';
      speed = Math.max(0, Math.round((1 - progress) * 120));
      turnText = 'Você chegou ao seu destino!';
      turnDistance = 'Chegada';
    }

    // 1. Dark Vector Map Background
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, 1024, 2048);

    // Subtle Grid
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 2.5;
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

    // Secondary City Streets
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(100, 1800);
    ctx.lineTo(920, 1200);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(80, 800);
    ctx.lineTo(960, 950);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(500, 100);
    ctx.lineTo(450, 1950);
    ctx.stroke();

    // 2. Monitored Danger Zone Polygon (Brás / Centro SP) with Animated Radar Ring
    const zoneCenterX = 680;
    const zoneCenterY = 880;
    const radarPulseRadius = 160 + (Math.sin(time * 4) * 20 + 20);

    // Concentric Radar Scan
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(zoneCenterX, zoneCenterY, radarPulseRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Danger Zone Area Fill & Dashed Border
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 4;
    ctx.setLineDash([14, 12]);
    ctx.beginPath();
    ctx.arc(zoneCenterX, zoneCenterY, 180, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);

    // Warning Tag inside Risk Zone
    ctx.fillStyle = 'rgba(15, 15, 18, 0.95)';
    ctx.beginPath();
    ctx.roundRect(550, 850, 260, 60, 16);
    ctx.fill();
    ctx.strokeStyle = '#52525b';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('ZONA DE ATENÇÃO SP', 568, 888);

    // 3. Alternative Route (Fast, passes straight through warning zone - dashed gray)
    ctx.strokeStyle = '#52525b';
    ctx.lineWidth = 9;
    ctx.setLineDash([20, 14]);
    ctx.beginPath();
    ctx.moveTo(220, 1620);
    ctx.lineTo(400, 1200);
    ctx.lineTo(680, 880); // Through danger zone!
    ctx.lineTo(820, 480);
    ctx.stroke();
    ctx.setLineDash([]);

    // Label for Fast Route
    ctx.fillStyle = '#71717a';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('Rota Rápida (Passa por risco)', 430, 1140);

    // 4. SafeRoute Detour (100% Monitored Safe Bypass - Glowing Solid White)
    ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
    ctx.shadowBlur = 26;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    trajectoryPoints.forEach((pt, i) => {
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Origin Pin (Faria Lima)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(220, 1620, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#050505';
    ctx.beginPath();
    ctx.arc(220, 1620, 9, 0, Math.PI * 2);
    ctx.fill();

    // Destination Pin (Av. Paulista)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(820, 480, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#050505';
    ctx.lineWidth = 6;
    ctx.stroke();

    // 5. Animated Moving Vehicle with Pulse Ring
    const vehiclePulse = 28 + Math.sin(time * 8) * 8;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(vehicle.x, vehicle.y, vehiclePulse, 0, Math.PI * 2);
    ctx.stroke();

    // Vehicle Core Dot
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(vehicle.x, vehicle.y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Vehicle Direction Arrow Tip
    ctx.save();
    ctx.translate(vehicle.x, vehicle.y);
    ctx.rotate(vehicle.angle + Math.PI / 2);
    ctx.fillStyle = '#050505';
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(6, 6);
    ctx.lineTo(0, 3);
    ctx.lineTo(-6, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 6. Top iOS Status Bar & Dynamic Island
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('9:41', 110, 115);

    ctx.font = 'bold 28px monospace';
    ctx.fillText('5G  100%', 810, 115);

    // Dynamic Island
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.roundRect(360, 64, 304, 76, 38);
    ctx.fill();
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 7. Live Turn-by-Turn Guidance Header Card
    ctx.fillStyle = 'rgba(15, 15, 18, 0.94)';
    ctx.beginPath();
    ctx.roundRect(64, 190, 896, 210, 40);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Arrow Box
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(94, 225, 110, 110, 26);
    ctx.fill();

    ctx.fillStyle = '#050505';
    ctx.beginPath();
    ctx.moveTo(149, 250);
    ctx.lineTo(180, 280);
    ctx.lineTo(160, 280);
    ctx.lineTo(160, 305);
    ctx.lineTo(138, 305);
    ctx.lineTo(138, 280);
    ctx.lineTo(118, 280);
    ctx.closePath();
    ctx.fill();

    // Turn Instructions Text
    ctx.fillStyle = '#a1a1aa';
    ctx.font = 'bold 26px monospace';
    ctx.fillText(turnDistance.toUpperCase(), 234, 258);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 40px sans-serif';
    ctx.fillText(turnText, 234, 310);

    ctx.fillStyle = '#e4e4e7';
    ctx.font = '26px sans-serif';
    ctx.fillText('Desvio 100% monitorado pela Defesa Civil SP', 234, 360);

    // 8. Animated Slide-Down Defesa Civil Alert Notification
    if (showAlertBanner) {
      ctx.fillStyle = 'rgba(24, 24, 27, 0.96)';
      ctx.beginPath();
      ctx.roundRect(64, 430, 896, 110, 30);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('Alerta Defesa Civil SP', 104, 474);

      ctx.fillStyle = '#d4d4d8';
      ctx.font = '24px sans-serif';
      ctx.fillText(alertMessage, 104, 512);
    }

    // 9. Floating Speedometer Widget
    ctx.fillStyle = 'rgba(15, 15, 18, 0.92)';
    ctx.beginPath();
    ctx.arc(130, 1420, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 44px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${speed}`, 130, 1425);
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#a1a1aa';
    ctx.fillText('KM/H', 130, 1455);
    ctx.textAlign = 'left';

    // 10. Bottom Navigation Sheet
    ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
    ctx.beginPath();
    ctx.roundRect(64, 1530, 896, 430, 50);
    ctx.fill();

    // Sheet Handle
    ctx.fillStyle = '#d4d4d8';
    ctx.beginPath();
    ctx.roundRect(472, 1550, 80, 8, 4);
    ctx.fill();

    // Telemetry: Remaining Minutes & Distance
    const remainingMin = Math.max(1, Math.round(21 * (1 - progress)));
    const remainingKm = Math.max(0.2, +(7.4 * (1 - progress)).toFixed(1)).toFixed(1);

    ctx.fillStyle = '#050505';
    ctx.font = '900 76px monospace';
    ctx.fillText(`${remainingMin} min`, 104, 1640);

    ctx.fillStyle = '#71717a';
    ctx.font = 'bold 36px monospace';
    ctx.fillText(`(${remainingKm} km)`, 410, 1630);

    // Safety Pill
    ctx.fillStyle = '#050505';
    ctx.beginPath();
    ctx.roundRect(660, 1580, 264, 68, 22);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px monospace';
    ctx.fillText('SEGURANÇA 94/100', 680, 1624);

    ctx.fillStyle = '#52525b';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText('Destino: Av. Paulista (Monitorado)', 104, 1705);

    // Bottom Action / Status Button
    ctx.fillStyle = '#050505';
    ctx.beginPath();
    ctx.roundRect(96, 1750, 832, 106, 32);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(progress > 0.85 ? 'Destino Alcançado com Segurança' : 'Navegação SafeRoute em Andamento', 512, 1815);
    ctx.textAlign = 'left';

    // Impact Slogan inside Screen
    ctx.fillStyle = '#71717a';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('“Vá com segurança. Vá de SafeRoute.”', 512, 1905);
    ctx.textAlign = 'left';

    // iOS Home Indicator
    ctx.fillStyle = '#71717a';
    ctx.beginPath();
    ctx.roundRect(372, 1990, 280, 12, 6);
    ctx.fill();
  }, [trajectoryPoints]);

  // Three.js Setup, Scene & Texture Render Loop
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

    const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
    keyLight.position.set(5, 7, 6);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xd4d4d8, 2.4);
    rimLight.position.set(-6, -2, -4);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0xa1a1aa, 1.2);
    fillLight.position.set(0, -5, 4);
    scene.add(fillLight);

    // 4. Main Phone Group
    const phoneGroup = new THREE.Group();
    scene.add(phoneGroup);
    phoneGroupRef.current = phoneGroup;

    const phoneW = 3.0;
    const phoneH = 6.2;
    const phoneD = 0.28;

    const titaniumMaterial = new THREE.MeshStandardMaterial({
      color: 0x1f1f22,
      metalness: 0.85,
      roughness: 0.25,
    });

    const backGlassMaterial = new THREE.MeshStandardMaterial({
      color: 0x0c0c0e,
      metalness: 0.2,
      roughness: 0.45,
    });

    // Create Offscreen Screen Canvas & Texture for 60fps Living Mini-App Video
    const screenCanvas = document.createElement('canvas');
    screenCanvas.width = 1024;
    screenCanvas.height = 2048;
    const screenCtx = screenCanvas.getContext('2d');

    const screenTexture = new THREE.CanvasTexture(screenCanvas);
    screenTexture.generateMipmaps = true;
    screenTexture.minFilter = THREE.LinearMipmapLinearFilter;
    screenTextureRef.current = screenTexture;

    const screenMaterial = new THREE.MeshStandardMaterial({
      map: screenTexture,
      roughness: 0.12,
      metalness: 0.05,
    });

    // Main Phone Body
    const bodyGeo = new THREE.BoxGeometry(phoneW, phoneH, phoneD);
    const bodyMaterials = [
      titaniumMaterial,
      titaniumMaterial,
      titaniumMaterial,
      titaniumMaterial,
      screenMaterial,
      backGlassMaterial,
    ];
    const phoneBody = new THREE.Mesh(bodyGeo, bodyMaterials);
    phoneGroup.add(phoneBody);

    // Perimeter Rim
    const rimGeo = new THREE.BoxGeometry(phoneW + 0.04, phoneH + 0.04, phoneD - 0.04);
    const rimMesh = new THREE.Mesh(rimGeo, titaniumMaterial);
    phoneGroup.add(rimMesh);

    // Side Buttons
    const buttonMat = new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.9, roughness: 0.2 });
    const volUp = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.45, 0.08), buttonMat);
    volUp.position.set(-phoneW / 2 - 0.02, 1.1, 0);
    phoneGroup.add(volUp);

    const volDown = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.45, 0.08), buttonMat);
    volDown.position.set(-phoneW / 2 - 0.02, 0.5, 0);
    phoneGroup.add(volDown);

    const powerBtn = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.7, 0.08), buttonMat);
    powerBtn.position.set(phoneW / 2 + 0.02, 0.8, 0);
    phoneGroup.add(powerBtn);

    // Camera Plateau & 3 Sapphire Lenses
    const cameraIslandMat = new THREE.MeshStandardMaterial({ color: 0x141416, metalness: 0.4, roughness: 0.3 });
    const cameraIsland = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.25, 0.12), cameraIslandMat);
    cameraIsland.position.set(-phoneW / 2 + 0.8, phoneH / 2 - 0.85, -phoneD / 2 - 0.06);
    phoneGroup.add(cameraIsland);

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
      ring.position.set(cameraIsland.position.x + pos.x, cameraIsland.position.y + pos.y, cameraIsland.position.z - 0.04);
      phoneGroup.add(ring);

      const glass = new THREE.Mesh(lensGlassGeo, lensGlassMat);
      glass.position.set(ring.position.x, ring.position.y, ring.position.z - 0.01);
      phoneGroup.add(glass);
    });

    // Back Laser Logo
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

    // Floor Shadow
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

    // 5. 60fps Animation Loop: Physics + Living Mini-App Video Screen Update
    let animationFrameId: number;
    let t = 0;
    let lastTime = performance.now();
    let frameThrottle = 0;

    const animate = (now: number) => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = (now - lastTime) / 1000;
      lastTime = now;

      // Update Mini-App Video Simulation Timeline
      if (isPlayingRef.current) {
        simTimeRef.current += delta * simSpeedRef.current;
        const totalDuration = 18;
        const currProgress = (simTimeRef.current % totalDuration) / totalDuration;
        setSimProgressPercent(Math.round(currProgress * 100));

        if (currProgress < 0.25) setSimPhaseLabel('Planejando Desvio Seguro');
        else if (currProgress < 0.55) setSimPhaseLabel('Deslocamento em Tempo Real');
        else if (currProgress < 0.85) setSimPhaseLabel('Alerta Evitado com Sucesso');
        else setSimPhaseLabel('Chegada Segura');
      }

      // Update Screen Texture Canvas at ~30-40fps for high performance
      frameThrottle += delta;
      if (frameThrottle >= 0.028 && screenCtx) {
        frameThrottle = 0;
        drawScreenFrame(screenCtx, simTimeRef.current);
        screenTexture.needsUpdate = true;
      }

      // Physics: Floating Sway when Idle
      if (autoSwayRef.current && !isDraggingRef.current) {
        t += 0.016;
        rotationTarget.current.x = 0.14 + Math.sin(t) * 0.05;
        rotationTarget.current.y = -0.32 + Math.cos(t * 0.8) * 0.08;
        phoneGroup.position.y = Math.sin(t * 1.2) * 0.08;
      }

      // Lerp Rotation Dampening
      rotationCurrent.current.x += (rotationTarget.current.x - rotationCurrent.current.x) * 0.1;
      rotationCurrent.current.y += (rotationTarget.current.y - rotationCurrent.current.y) * 0.1;

      phoneGroup.rotation.x = rotationCurrent.current.x;
      phoneGroup.rotation.y = rotationCurrent.current.y;

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

    animationFrameId = requestAnimationFrame(animate);

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
  }, [drawScreenFrame]);

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

  const handleResetSim = () => {
    simTimeRef.current = 0;
    setSimProgressPercent(0);
  };

  return (
    <div className={`relative flex flex-col items-center justify-center w-full select-none ${className}`}>
      {/* Real WebGL Three.js Viewport (ZERO TEXT ABOVE) */}
      <div
        ref={mountRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="w-full h-[520px] sm:h-[600px] max-w-[430px] flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none relative"
      />

      {/* Mini App Video Simulation Control Capsule (Tactile & Luxurious Glassmorphism) */}
      <div className="w-full max-w-[400px] px-4 py-2.5 rounded-2xl bg-neutral-900/90 dark:bg-neutral-950/90 border border-neutral-800 backdrop-blur-2xl shadow-2xl flex flex-col gap-2 z-20 -mt-2">
        {/* Top Control Bar: Video Play/Pause, Scrubber & Status */}
        <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-7 h-7 rounded-lg bg-white text-black hover:bg-neutral-200 flex items-center justify-center transition-transform active:scale-90"
              title={isPlaying ? 'Pausar vídeo demo' : 'Reproduzir vídeo demo'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            </button>

            <button
              type="button"
              onClick={handleResetSim}
              className="p-1.5 rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors"
              title="Reiniciar trajeto simulado"
            >
              <RotateCcw className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={() => setSimSpeed(simSpeed === 1 ? 2 : 1)}
              className="px-2 py-0.5 rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700 font-bold text-[10px]"
              title="Velocidade da simulação"
            >
              {simSpeed}x
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-neutral-300 truncate max-w-[170px]">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse shrink-0" />
            <span className="truncate text-[10px] font-bold">{simPhaseLabel}</span>
          </div>
        </div>

        {/* Video Timeline Progress Bar */}
        <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
          <div
            style={{ width: `${simProgressPercent}%` }}
            className="bg-white h-full transition-all duration-100 ease-linear rounded-full shadow-[0_0_8px_white]"
          />
        </div>

        {/* Bottom Control Bar: 3D Angle Presets */}
        <div className="flex items-center justify-between gap-1 pt-1 border-t border-neutral-800/80">
          <div className="flex items-center gap-1 text-[10px] font-mono text-neutral-400">
            <Move className="w-3 h-3 text-neutral-300" />
            <span>Giro 3D Livre</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewAngle('front')}
              className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition-all ${
                activePreset === 'front' ? 'bg-white text-black' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              Tela
            </button>
            <button
              type="button"
              onClick={() => setViewAngle('3d')}
              className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition-all ${
                activePreset === '3d' ? 'bg-white text-black' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              3D Tilt
            </button>
            <button
              type="button"
              onClick={() => setViewAngle('back')}
              className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition-all ${
                activePreset === 'back' ? 'bg-white text-black' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              Câmeras
            </button>
            <button
              type="button"
              onClick={handleSpin360}
              className="p-1 rounded-md bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
              title="Giro 360°"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
