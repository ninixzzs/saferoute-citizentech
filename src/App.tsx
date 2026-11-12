import React, { useState, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { RouteSelector } from './components/RouteSelector';
import { RouteItinerary } from './components/RouteItinerary';
import { IncidentList } from './components/IncidentList';
import { IncidentReportModal } from './components/IncidentReportModal';
import { SafetyTipsDrawer } from './components/SafetyTipsDrawer';
import { MobilePhoneSimulator } from './components/MobilePhoneSimulator';
import { MobileMapExperience } from './components/MobileMapExperience';
import { ExpandedMapWorkspace } from './components/ExpandedMapWorkspace';
import { SafetyAssistantChat } from './components/SafetyAssistantChat';
import { SplashScreen } from './components/SplashScreen';
import { OnboardingModal, TravelMode } from './components/OnboardingModal';
import { Interactive3DPhone } from './components/Interactive3DPhone';
import { PhoneMiniAppSimulation } from './components/PhoneMiniAppSimulation';
import { EarlyAlertShowcase } from './components/EarlyAlertShowcase';
import { Footer } from './components/Footer';

import { useSafetyAlerts } from './hooks/useSafetyAlerts';
import { useRouteNavigation } from './hooks/useRouteNavigation';
import { useVoiceGuidance } from './hooks/useVoiceGuidance';
import { useGeofenceAlert } from './hooks/useGeofenceAlert';
import { useAccessibility } from './hooks/useAccessibility';
import { DangerZone } from './types';
import { evaluatePreTripBriefing, PreTripBriefing } from './services/safetyAssistant';
import {
  Map,
  Smartphone,
  ShieldCheck,
  Shield,
  AlertCircle,
  Route,
  ListChecks,
  Navigation,
  MessageSquareWarning,
  Sparkles,
  ArrowRight,
  ArrowDown,
  RefreshCw,
  Play,
  X,
  MessageCircle,
  Layers,
  Activity,
  ChevronDown,
  Move,
  RotateCcw,
  Compass,
} from 'lucide-react';

export function App() {
  const {
    themeMode,
    setThemeMode,
    resolvedTheme,
    fontSize,
    setFontSize,
    increaseFontSize,
    decreaseFontSize,
    highContrast,
    setHighContrast,
    resetAccessibility,
  } = useAccessibility();

  const {
    incidents,
    allIncidents,
    dangerZones,
    loading,
    lastUpdatedAt,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedRisk,
    setSelectedRisk,
    addIncident,
    updateIncident,
    deleteIncident,
    confirmIncident,
    resetData,
    refresh: refreshAlerts,
  } = useSafetyAlerts();

  const {
    routes,
    selectedRoute,
    setSelectedRoute,
    selectRoute,
    switchImmediatelyToSafeRoute,
    calculateJourney,
    swapOriginAndDestination,
    resetToPresetRoutes,
    originLocation,
    destinationLocation,
    isCalculatingRoute,
    isNavigating,
    isPaused,
    simSpeed,
    setSimSpeed,
    currentPosition,
    nextPosition,
    speedKmH,
    progressPercentage,
    startNavigation,
    pauseNavigation,
    resumeNavigation,
    resetNavigation,
    setRoutes,
  } = useRouteNavigation();

  const { voiceEnabled, setVoiceEnabled, speakAlert, stop: stopVoice } = useVoiceGuidance();

  // Workspace states
  const [viewMode, setViewMode] = useState<'map' | 'phone'>('map');
  const [mobileView, setMobileView] = useState<'map' | 'phone' | 'ai'>('map');
  const [sidebarTab, setSidebarTab] = useState<'routes' | 'itinerary' | 'alerts' | 'messages'>('routes');
  const [assistantFocusTrigger, setAssistantFocusTrigger] = useState(0);
  const mobileInfoTab = sidebarTab === 'messages' ? 'routes' : sidebarTab;
  const [focusPoint, setFocusPoint] = useState<{ coords: [number, number]; ts: number } | null>(null);
  const [simulatedAlertZone, setSimulatedAlertZone] = useState<DangerZone | null>(null);

  // Modals, Onboarding, Splash & Pre-Trip Safety Briefing
  const [showSplash, setShowSplash] = useState(true);
  const [isPhoneLocked, setIsPhoneLocked] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [travelMode, setTravelMode] = useState<TravelMode>('carro');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isTipsDrawerOpen, setIsTipsDrawerOpen] = useState(false);
  const [pendingTripBriefing, setPendingTripBriefing] = useState<PreTripBriefing | null>(null);

  // Dynamic travel mode switcher with live recalculation of realistic transit durations
  const handleSelectTravelMode = useCallback(
    (mode: TravelMode) => {
      setTravelMode(mode);
      setRoutes((prevRoutes: import('./types').NavigationRoute[]) => {
        const updated = prevRoutes.map((r: import('./types').NavigationRoute) => {
          const baseDuration =
            r.baseDurationMin ??
            (r.id === 'route-fast'
              ? 18
              : r.id === 'route-safe'
              ? 22
              : r.id === 'route-alternative'
              ? 20
              : r.durationMin);

          let newDuration = baseDuration;
          if (mode === 'moto') {
            // SP traffic corridor filtering (corredor de motos): ~40% faster
            newDuration = Math.max(3, Math.round(baseDuration * 0.6));
          } else if (mode === 'a_pe') {
            // SP pedestrian walking speed ~4.8 km/h => 1 km takes ~12.5 minutes
            newDuration = Math.max(5, Math.round(r.distanceKm * 12.5));
          }

          return {
            ...r,
            baseDurationMin: baseDuration,
            durationMin: newDuration,
          };
        });

        // Also update selectedRoute so header pills, maps, HUD and cards re-render immediately
        setSelectedRoute((prevSelected) => {
          const match = updated.find((u) => u.id === prevSelected.id);
          return match || updated[0];
        });

        return updated;
      });
    },
    [setRoutes, setSelectedRoute]
  );

  // Scroll reveal observer for silky smooth on-scroll animations & text choreographies
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      { threshold: 0.06, rootMargin: '0px 0px -25px 0px' }
    );

    const observeAll = () => {
      const elements = document.querySelectorAll(
        '.scroll-reveal, .scroll-reveal-title, .scroll-reveal-text, .scroll-reveal-badge, .scroll-reveal-scale'
      );
      elements.forEach((el) => observer.observe(el));
    };

    observeAll();

    const t1 = setTimeout(observeAll, 600);
    const t2 = setTimeout(observeAll, 1800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      observer.disconnect();
    };
  }, [showSplash]);

  const handleEnterCriticalZone = useCallback(
    (zone: DangerZone) => {
      speakAlert(
        `Alerta SafeRoute: Você está entrando em área de atenção em ${zone.neighborhood}. ${zone.defenseCivilTip}`
      );
    },
    [speakAlert]
  );

  const { activeAlertZone, dismissAlert, resetDismissed } = useGeofenceAlert({
    currentPosition,
    dangerZones,
    isNavigating,
    onEnterCriticalZone: handleEnterCriticalZone,
  });

  const effectiveAlertZone = activeAlertZone || simulatedAlertZone;

  // Immediately cancel any active or queued speech when the user dismisses an alert
  const handleDismissEffectiveAlert = (id: string) => {
    stopVoice();
    dismissAlert(id);
    setSimulatedAlertZone(null);
  };

  const handleAcceptReroute = () => {
    stopVoice();
    switchImmediatelyToSafeRoute();
    setSimulatedAlertZone(null);
    speakAlert('Desvio seguro ativado. Rota monitorada em andamento.');
  };

  const handleResetAll = () => {
    stopVoice();
    resetNavigation();
    resetDismissed();
    setSimulatedAlertZone(null);
  };

  const handleFocusIncident = (coords: [number, number]) => {
    setFocusPoint({ coords, ts: Date.now() });
    if (window.innerWidth < 1024) {
      document.getElementById('mobile-stage')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleTriggerDemoAlert = () => {
    const targetZone = dangerZones[0];
    if (targetZone) {
      setSimulatedAlertZone(targetZone);
      speakAlert(
        `Alerta SafeRoute: Área de risco próxima em ${targetZone.neighborhood}. ${targetZone.defenseCivilTip}`
      );
    }
  };

  const handleRequestStartTrip = useCallback(() => {
    const briefing = evaluatePreTripBriefing({
      route: selectedRoute,
      destination: destinationLocation,
      dangerZones,
      incidents,
    });
    setPendingTripBriefing(briefing);
    if (voiceEnabled) {
      speakAlert(briefing.message);
    }
  }, [selectedRoute, destinationLocation, dangerZones, incidents, voiceEnabled, speakAlert]);

  const handleConfirmStartTrip = () => {
    setPendingTripBriefing(null);
    startNavigation();
  };

  const handleOpenAssistant = () => {
    setSidebarTab('messages');
    setMobileView('ai');
    setAssistantFocusTrigger((n) => n + 1);
    if (window.innerWidth < 1024) {
      setTimeout(() => {
        document.getElementById('mobile-ai-tab')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    }
  };

  const handlePlotRouteAndGoToMap = useCallback(
    (destName: string) => {
      // 1. Calculate journey to chosen destination
      calculateJourney(originLocation.name, destName, dangerZones);

      // 2. Direct user straight to map in their chosen version (phone or map):
      if (window.innerWidth < 1024) {
        const targetView = mobileView === 'ai' ? 'map' : mobileView;
        setMobileView(targetView);
        setSidebarTab('routes');

        setTimeout(() => {
          document.getElementById('mobile-stage')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 90);
      } else {
        // Desktop: switch to routes tab and scroll down to the workspace (map or phone simulator)
        setSidebarTab('routes');

        setTimeout(() => {
          document.getElementById('desktop-workspace')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 90);
      }

      if (voiceEnabled) {
        speakAlert(`Traçando rota para ${destName}. Trajeto carregado no mapa.`);
      }
    },
    [calculateJourney, originLocation.name, dangerZones, mobileView, voiceEnabled, speakAlert]
  );

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        resolvedTheme === 'dark'
          ? 'bg-grid-dark text-neutral-100 selection:bg-white selection:text-black'
          : 'bg-grid-light text-neutral-900 selection:bg-neutral-900 selection:text-white'
      }`}
    >
      {/* Top Navbar */}
      <Navbar
        voiceEnabled={voiceEnabled}
        onToggleVoice={() => setVoiceEnabled(!voiceEnabled)}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenTipsDrawer={() => setIsTipsDrawerOpen(true)}
        activeIncidentsCount={allIncidents.length}
        themeMode={themeMode}
        onChangeTheme={setThemeMode}
        fontSize={fontSize}
        onChangeFontSize={setFontSize}
        onIncreaseFont={increaseFontSize}
        onDecreaseFont={decreaseFontSize}
        highContrast={highContrast}
        onToggleHighContrast={() => setHighContrast(!highContrast)}
        onResetAccessibility={resetAccessibility}
      />

      {/* Opening Pre-loader / Splash Screen (100% black #050505, minimalist radar pulse, smooth dissolve) */}
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6 sm:space-y-8">
        {/* Dobra 1 — Hero Section (Frase Monumental de Entrada & Modelo 3D Interativo) */}
        <section
          aria-label="Apresentação do SafeRoute"
          className="scroll-reveal rounded-[28px] sm:rounded-[36px] bg-white/95 dark:bg-neutral-950/90 border border-neutral-200/90 dark:border-neutral-800/90 backdrop-blur-2xl p-5 sm:p-8 lg:p-10 shadow-[0_16px_50px_rgba(0,0,0,0.08)] dark:shadow-[0_24px_64px_rgba(0,0,0,0.7)] space-y-8"
        >
          {/* Top Badge Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xs scroll-reveal-badge">
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-950 dark:bg-white animate-pulse" />
              <span className="text-[11px] font-mono font-bold tracking-widest uppercase text-neutral-950 dark:text-white">
                SISTEMA INTELIGENTE DE ROTAS &bull; SÃO PAULO
              </span>
            </div>

            <div className="flex items-center gap-2 scroll-reveal-badge reveal-delay-1">
              <button
                type="button"
                onClick={() => setIsOnboardingOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs font-bold border border-neutral-200 dark:border-neutral-800 flex items-center gap-1.5 transition-all active:scale-97 hover-glass-glow"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Como Funciona (3 passos)</span>
              </button>
            </div>
          </div>

          {/* Hero Grid: Left Content (Headline & Slogan) + Right 3D Interactive Phone */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Left Column (7 cols): Monumental Headline, Slogan & Actions */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <h1 className="font-display text-[2.2rem] sm:text-[3.2rem] lg:text-[3.8rem] font-black tracking-[-0.04em] text-neutral-950 dark:text-white leading-[1.03] scroll-reveal-title reveal-delay-1">
                  Com o{' '}
                  <span className="relative inline-block px-3.5 py-1 mx-1.5 rounded-2xl bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 shadow-[0_10px_35px_rgba(0,0,0,0.4)] dark:shadow-[0_10px_40px_rgba(255,255,255,0.45)] border border-neutral-700/80 dark:border-neutral-200 tracking-tight transition-transform duration-300 hover:scale-105">
                    SafeRoute
                  </span>
                  , você sabe dos riscos antes mesmo de chegar até eles.
                </h1>
              </div>

              {/* Slogan de Impacto (Assinatura Escultural UX/UI) */}
              <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-neutral-950 text-white border border-white/20 shadow-xl flex items-center justify-between gap-4 transition-all hover:border-white/40 group hover-glass-glow scroll-reveal-scale reveal-delay-2">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-white text-black flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                    <Shield className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 font-bold block">Assinatura do Ecossistema</span>
                    <span className="text-base sm:text-lg font-black tracking-tight text-white">
                      &ldquo;Vá com segurança. Vá de SafeRoute.&rdquo;
                    </span>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-mono text-neutral-300 shimmer-badge">
                  <Sparkles className="w-3 h-3 text-white" />
                  <span>São Paulo 24h</span>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-1 scroll-reveal-text reveal-delay-3">
                <button
                  type="button"
                  onClick={() => {
                    document.getElementById('interactive-experience')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-5 py-3 rounded-2xl bg-neutral-950 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-950 text-xs sm:text-sm font-bold shadow-md flex items-center gap-2 transition-all active:scale-97 hover-glass-glow"
                >
                  <Map className="w-4 h-4" />
                  <span>Explorar Rotas &amp; Mapa</span>
                  <ArrowDown className="w-4 h-4 animate-bounce" />
                </button>

                <button
                  type="button"
                  onClick={handleOpenAssistant}
                  className="px-4 py-3 rounded-2xl bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-950 dark:text-white text-xs sm:text-sm font-bold border border-neutral-300 dark:border-neutral-700 flex items-center gap-2 transition-all active:scale-97 hover-glass-glow"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Perguntar à SafeRoute IA</span>
                </button>

                <button
                  type="button"
                  onClick={handleTriggerDemoAlert}
                  className="px-4 py-3 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-950 dark:text-white text-xs sm:text-sm font-semibold shadow-2xs flex items-center gap-2 transition-all active:scale-97 hover-glass-glow"
                  title="Simular recebimento de alerta SafeRoute no aparelho"
                >
                  <MessageSquareWarning className="w-4 h-4" />
                  <span>Testar Alerta</span>
                </button>
              </div>
            </div>

            {/* Right Column: Authentic Flagship Smartphone with 3D Tilt & Mini App Video (Desktop Only - Hidden on Mobile) */}
            <div className="hidden lg:flex lg:col-span-5 justify-center items-center scroll-reveal-scale reveal-delay-2">
              <Interactive3DPhone className="w-full">
                <PhoneMiniAppSimulation
                  travelMode={travelMode}
                  onSelectTravelMode={handleSelectTravelMode}
                />
              </Interactive3DPhone>
            </div>
          </div>

          {/* Architectural System Pillars Grid (UX/UI Sênior) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-neutral-200/80 dark:border-neutral-800/80">
            <div className="p-5 rounded-2xl bg-neutral-50/80 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800/80 hover-glass-glow scroll-reveal-scale reveal-delay-1 space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 flex items-center justify-center shrink-0 shadow-xs">
                <Route className="w-4 h-4" />
              </div>
              <h3 className="font-hero-alt text-sm font-bold text-neutral-950 dark:text-white">
                Comparação Dinâmica de Rotas
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Calcula em tempo real a rota mais rápida versus um desvio 100% monitorado, avisando no celular antes que você entre em áreas de risco.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-neutral-50/80 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800/80 hover-glass-glow scroll-reveal-scale reveal-delay-2 space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 flex items-center justify-center shrink-0 shadow-xs">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="font-hero-alt text-sm font-bold text-neutral-950 dark:text-white">
                Defesa Civil &amp; Radar SP 24h
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Integração contínua com bases públicas de dados em São Paulo, geofencing perimétrico e orientações de segurança em áudio e texto.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-neutral-50/80 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800/80 hover-glass-glow scroll-reveal-scale reveal-delay-3 space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="font-hero-alt text-sm font-bold text-neutral-950 dark:text-white">
                Copiloto SafeRoute IA
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Assistente objetivo treinado no Google Gemini Flash, pronto para traçar destinos direto no mapa ou acolher em situações de emergência.
              </p>
            </div>
          </div>
        </section>

        {/* Seção Explicativa: Como Funciona Nossa Notificação (Design Futurista com Smartphone Central) */}
        <EarlyAlertShowcase
          onTriggerDemoAlert={handleTriggerDemoAlert}
          voiceEnabled={voiceEnabled}
        />

        {/* Dobra 2 — Cabeçalho Escultural & Plataforma Interativa */}
        <section
          id="interactive-experience"
          aria-label="Plataforma de Rotas e Segurança"
          className="scroll-reveal rounded-[28px] sm:rounded-[36px] bg-white/95 dark:bg-neutral-950/90 border border-neutral-200/90 dark:border-neutral-800/90 backdrop-blur-2xl p-5 sm:p-7 shadow-[0_12px_44px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_56px_rgba(0,0,0,0.6)] space-y-5"
        >
          {/* Header com a fonte diferenciada (font-hero-alt / Unbounded) */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6 pb-2 border-b border-neutral-200/80 dark:border-neutral-800/80">
            <div className="space-y-2 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 scroll-reveal-badge">
                <span>Navegação Preventiva em Tempo Real</span>
              </div>
              <h2 className="font-hero-alt text-2xl sm:text-3xl lg:text-[2.6rem] font-black tracking-tight text-neutral-950 dark:text-white leading-[1.12] scroll-reveal-title reveal-delay-1">
                Rotas que avisam antes do risco.
              </h2>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-2xl scroll-reveal-text reveal-delay-2">
                O SafeRoute compara o caminho mais rápido com um desvio seguro e manda uma mensagem no celular quando você chega perto de uma área de risco em São Paulo.
              </p>
            </div>

            {/* Interactive Quick Actions & Universal Map/Phone Switcher */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2.5 sm:gap-3 shrink-0 tabular-nums select-none scroll-reveal-scale reveal-delay-2">
              {/* Desktop Telemetry Pills */}
              <div className="hidden lg:flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-100/90 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 text-xs hover-glass-glow">
                  <Route className="w-3.5 h-3.5 text-neutral-950 dark:text-white" />
                  <span className="font-mono font-bold text-neutral-950 dark:text-white">
                    {selectedRoute.distanceKm} km
                  </span>
                  <span className="text-neutral-400">&bull;</span>
                  <span className="font-mono text-neutral-600 dark:text-neutral-300">
                    {selectedRoute.durationMin} min
                  </span>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100/90 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 text-xs hover-glass-glow">
                  <ShieldCheck className="w-3.5 h-3.5 text-neutral-800 dark:text-neutral-200" />
                  <span className="text-neutral-500 dark:text-neutral-400">Segurança:</span>
                  <span className="font-mono font-bold text-neutral-950 dark:text-white">
                    {selectedRoute.safetyScore}/100
                  </span>
                </div>
              </div>

              {/* Action Controls: Desktop Map/Phone Switcher + Mobile Map/Phone/AI Tab Switcher */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Desktop Switcher */}
                <div
                  role="tablist"
                  aria-label="Modo de visualização"
                  className="hidden lg:inline-flex items-center gap-1 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xs"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={viewMode === 'map'}
                    onClick={() => setViewMode('map')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 ${
                      viewMode === 'map'
                        ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                    }`}
                  >
                    <Map className="w-3.5 h-3.5" />
                    <span>Mapa</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={viewMode === 'phone'}
                    onClick={() => setViewMode('phone')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 ${
                      viewMode === 'phone'
                        ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Modo Celular</span>
                  </button>
                </div>

                {/* Mobile 3-Tab Switcher (< lg) */}
                <div
                  role="tablist"
                  aria-label="Abas principais no celular"
                  className="grid grid-cols-3 lg:hidden w-full sm:w-auto items-center gap-1 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mobileView === 'map'}
                    onClick={() => setMobileView('map')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 ${
                      mobileView === 'map'
                        ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                    }`}
                  >
                    <Map className="w-3.5 h-3.5" />
                    <span>Mapa</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mobileView === 'phone'}
                    onClick={() => setMobileView('phone')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 ${
                      mobileView === 'phone'
                        ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Celular</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mobileView === 'ai'}
                    onClick={() => setMobileView('ai')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 ${
                      mobileView === 'ai'
                        ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>IA</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Pilares do Sistema SafeRoute */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-neutral-50/80 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800/80 space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 flex items-center justify-center shrink-0">
                  <Route className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-xs font-extrabold text-neutral-950 dark:text-white">
                  Comparação Dinâmica de Rotas
                </h4>
              </div>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-snug">
                Rota Mais Rápida (18 min — área de atenção) vs. Desvio SafeRoute (21 min — 100% monitorado).
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-neutral-50/80 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800/80 space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-xs font-extrabold text-neutral-950 dark:text-white">
                  Polígonos &amp; Zonas de Risco
                </h4>
              </div>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-snug">
                Geofencing preventivo em São Paulo: alertas visuais e por voz antes de ingressar no perímetro.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-neutral-50/80 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800/80 space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-xs font-extrabold text-neutral-950 dark:text-white">
                  Simulador &amp; Voz Neural
                </h4>
              </div>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-snug">
                Voz feminina calma sem atraso, respostas objetivas e navegação em tempo real no navegador.
              </p>
            </div>
          </div>

          {/* Prominent Featured AI Assistant Strip */}
          <div className="hidden lg:flex pt-1 border-t border-neutral-200/80 dark:border-neutral-800/80 flex-row items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-neutral-950 dark:text-white flex flex-wrap items-center gap-1.5">
                  <span>Assistente de IA Pré-Viagem &amp; SMS</span>
                  <span className="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[10px] font-mono text-neutral-700 dark:text-neutral-300">
                    Resposta na hora &bull; Sem atraso
                  </span>
                </div>
                <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-snug mt-0.5">
                  Converse por texto ou voz sobre todas as regiões de São Paulo, descubra lugares conhecidos perto do destino e receba orientação calma antes de ir.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenAssistant}
              className="px-4 py-2.5 rounded-xl bg-neutral-950 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-950 text-xs font-bold shadow-sm flex items-center justify-center gap-2 shrink-0 transition-all active:scale-97"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Perguntar à IA agora</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>

        {/* Live Always-Updating Danger Zones Ticker (Hidden inside mobile dedicated AI tab for zero clutter) */}
        <div
          className={`scroll-reveal reveal-delay-1 ${
            mobileView === 'ai' ? 'hidden lg:flex' : 'flex'
          } items-center justify-between gap-2 px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-neutral-950/85 border border-neutral-200/90 dark:border-neutral-800/90 text-xs shadow-2xs`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-neutral-950 dark:bg-white animate-pulse shrink-0" />
            <span className="font-bold text-neutral-950 dark:text-white truncate">
              {dangerZones.length} zonas monitoradas em SP
            </span>
            <span className="hidden sm:inline text-neutral-500">
              &bull; {allIncidents.length} ocorrências ativas &bull; Atualizado às{' '}
              {lastUpdatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <button
            type="button"
            onClick={refreshAlerts}
            className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[11px] font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 shrink-0 transition-colors"
            title="Atualizar alertas e áreas monitoradas agora"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>

        {/* DESKTOP LAYOUT (>= lg): Map Prototype on LEFT (7 cols), Information on RIGHT (5 cols) */}
        <div id="desktop-workspace" className="scroll-reveal reveal-delay-2 hidden lg:grid lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Interactive Map Stage / Mobile Prototype (7 cols) */}
          <section
            aria-label="Protótipo do mapa interativo"
            className="lg:col-span-7 lg:sticky lg:top-20"
          >
            {viewMode === 'map' ? (
              <ExpandedMapWorkspace
                currentPosition={currentPosition}
                nextPosition={nextPosition}
                selectedRoute={selectedRoute}
                allRoutes={routes}
                onSelectRoute={selectRoute}
                originLocation={originLocation}
                destinationLocation={destinationLocation}
                dangerZones={dangerZones}
                incidents={incidents}
                isNavigating={isNavigating}
                isPaused={isPaused}
                speedKmH={speedKmH}
                progressPercentage={progressPercentage}
                activeAlertZone={effectiveAlertZone}
                onStart={handleRequestStartTrip}
                onPause={pauseNavigation}
                onResume={resumeNavigation}
                onReset={handleResetAll}
                onAcceptReroute={handleAcceptReroute}
                onDismissAlert={handleDismissEffectiveAlert}
                focusPoint={focusPoint}
                simSpeed={simSpeed}
                onToggleSimSpeed={setSimSpeed}
                travelMode={travelMode}
                onSelectTravelMode={handleSelectTravelMode}
              />
            ) : (
              <MobilePhoneSimulator
                currentPosition={currentPosition}
                nextPosition={nextPosition}
                selectedRoute={selectedRoute}
                allRoutes={routes}
                onSelectRoute={selectRoute}
                dangerZones={dangerZones}
                incidents={incidents}
                isNavigating={isNavigating}
                isPaused={isPaused}
                speedKmH={speedKmH}
                progressPercentage={progressPercentage}
                activeAlertZone={effectiveAlertZone}
                voiceEnabled={voiceEnabled}
                onToggleVoice={() => setVoiceEnabled(!voiceEnabled)}
                onStart={handleRequestStartTrip}
                onPause={pauseNavigation}
                onResume={resumeNavigation}
                onReset={handleResetAll}
                onAcceptReroute={handleAcceptReroute}
                onDismissAlert={handleDismissEffectiveAlert}
                onOpenReportModal={() => setIsReportModalOpen(true)}
                originLocation={originLocation}
                destinationLocation={destinationLocation}
                onCalculateJourney={(orig, dest) => calculateJourney(orig, dest, dangerZones)}
                onSwapLocations={() => swapOriginAndDestination(dangerZones)}
                isCalculatingRoute={isCalculatingRoute}
                onResetPresetRoutes={resetToPresetRoutes}
                simSpeed={simSpeed}
                onToggleSimSpeed={setSimSpeed}
                focusPoint={focusPoint}
                onOpenAssistant={handleOpenAssistant}
                isStandbyLocked={isPhoneLocked}
                onToggleLock={setIsPhoneLocked}
                onOpenOnboarding={() => setIsOnboardingOpen(true)}
                travelMode={travelMode}
                onSelectTravelMode={handleSelectTravelMode}
              />
            )}
          </section>

          {/* RIGHT: Information & Command Center (5 cols) */}
          <aside
            aria-label="Painel de informações e rotas"
            className="lg:col-span-5 rounded-[28px] bg-white/95 dark:bg-neutral-950/90 border border-neutral-200/90 dark:border-neutral-800/90 backdrop-blur-xl shadow-[0_14px_44px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_56px_rgba(0,0,0,0.55)] overflow-hidden flex flex-col"
          >
            <div
              role="tablist"
              aria-label="Seções de informação"
              className="grid grid-cols-4 p-1.5 gap-1 bg-neutral-100/90 dark:bg-neutral-900/90 border-b border-neutral-200 dark:border-neutral-800 select-none"
            >
              <button
                type="button"
                role="tab"
                aria-selected={sidebarTab === 'routes'}
                onClick={() => setSidebarTab('routes')}
                className={`py-2.5 px-1.5 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1 transition-all duration-200 ${
                  sidebarTab === 'routes'
                    ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                }`}
              >
                <Navigation className="w-3.5 h-3.5 shrink-0" />
                <span>Rotas</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={sidebarTab === 'itinerary'}
                onClick={() => setSidebarTab('itinerary')}
                className={`py-2.5 px-1.5 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1 transition-all duration-200 ${
                  sidebarTab === 'itinerary'
                    ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                }`}
              >
                <ListChecks className="w-3.5 h-3.5 shrink-0" />
                <span>Passos</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={sidebarTab === 'alerts'}
                onClick={() => setSidebarTab('alerts')}
                className={`py-2.5 px-1.5 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1 transition-all duration-200 ${
                  sidebarTab === 'alerts'
                    ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Alertas ({allIncidents.length})</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={sidebarTab === 'messages'}
                onClick={() => setSidebarTab('messages')}
                className={`py-2.5 px-1.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-1 transition-all duration-200 ${
                  sidebarTab === 'messages'
                    ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 shadow-sm'
                    : 'text-neutral-950 dark:text-white bg-white/80 dark:bg-neutral-950/60 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-200/70 dark:hover:bg-neutral-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>IA &amp; SMS</span>
              </button>
            </div>

            <div className="p-4 max-h-[39rem] overflow-y-auto">
              {sidebarTab === 'routes' && (
                <RouteSelector
                  routes={routes}
                  selectedRouteId={selectedRoute.id}
                  onSelectRoute={selectRoute}
                  isNavigating={isNavigating}
                  progressPercentage={progressPercentage}
                  originLocation={originLocation}
                  destinationLocation={destinationLocation}
                  onCalculateJourney={(orig, dest) => calculateJourney(orig, dest, dangerZones)}
                  onSwapLocations={() => swapOriginAndDestination(dangerZones)}
                  isCalculatingRoute={isCalculatingRoute}
                  onResetPresetRoutes={resetToPresetRoutes}
                  simSpeed={simSpeed}
                  onToggleSimSpeed={setSimSpeed}
                />
              )}

              {sidebarTab === 'itinerary' && (
                <RouteItinerary
                  selectedRoute={selectedRoute}
                  isNavigating={isNavigating}
                  progressPercentage={progressPercentage}
                />
              )}

              {sidebarTab === 'alerts' && (
                <IncidentList
                  incidents={incidents}
                  loading={loading}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                  selectedRisk={selectedRisk}
                  onRiskChange={setSelectedRisk}
                  onConfirm={confirmIncident}
                  onUpdateStatus={(id, status) => updateIncident(id, { status })}
                  onDelete={deleteIncident}
                  onResetData={resetData}
                  onFocusIncident={handleFocusIncident}
                />
              )}

              {sidebarTab === 'messages' && (
                <SafetyAssistantChat
                  originLocation={originLocation}
                  destinationLocation={destinationLocation}
                  selectedRoute={selectedRoute}
                  allRoutes={routes}
                  dangerZones={dangerZones}
                  incidents={incidents}
                  currentPosition={currentPosition}
                  onSwitchToSafeRoute={handleAcceptReroute}
                  onSelectCustomDestination={handlePlotRouteAndGoToMap}
                  focusInputTrigger={assistantFocusTrigger}
                />
              )}
            </div>
          </aside>
        </div>

        {/* MOBILE APP EXPERIENCE (< lg): Dedicated AI tab OR Interactive Stage + 3-Tab Hub */}
        <div className="scroll-reveal reveal-delay-2 lg:hidden space-y-5">
          {mobileView === 'ai' ? (
            <section id="mobile-ai-tab" aria-label="Assistente IA SafeRoute">
              <SafetyAssistantChat
                originLocation={originLocation}
                destinationLocation={destinationLocation}
                selectedRoute={selectedRoute}
                allRoutes={routes}
                dangerZones={dangerZones}
                incidents={incidents}
                currentPosition={currentPosition}
                onSwitchToSafeRoute={handleAcceptReroute}
                onSelectCustomDestination={handlePlotRouteAndGoToMap}
                focusInputTrigger={assistantFocusTrigger}
              />
            </section>
          ) : (
            <>
              <div id="mobile-stage">
                {mobileView === 'map' ? (
                  <MobileMapExperience
                    currentPosition={currentPosition}
                    nextPosition={nextPosition}
                    selectedRoute={selectedRoute}
                    allRoutes={routes}
                    onSelectRoute={selectRoute}
                    originLocation={originLocation}
                    destinationLocation={destinationLocation}
                    onCalculateJourney={(orig, dest) => calculateJourney(orig, dest, dangerZones)}
                    onSwapLocations={() => swapOriginAndDestination(dangerZones)}
                    onResetPresetRoutes={resetToPresetRoutes}
                    isCalculatingRoute={isCalculatingRoute}
                    dangerZones={dangerZones}
                    incidents={incidents}
                    onOpenReportModal={() => setIsReportModalOpen(true)}
                    isNavigating={isNavigating}
                    isPaused={isPaused}
                    speedKmH={speedKmH}
                    progressPercentage={progressPercentage}
                    activeAlertZone={effectiveAlertZone}
                    voiceEnabled={voiceEnabled}
                    onToggleVoice={() => setVoiceEnabled(!voiceEnabled)}
                    onStart={handleRequestStartTrip}
                    onPause={pauseNavigation}
                    onResume={resumeNavigation}
                    onReset={handleResetAll}
                    onAcceptReroute={handleAcceptReroute}
                    onDismissAlert={handleDismissEffectiveAlert}
                    focusPoint={focusPoint}
                    simSpeed={simSpeed}
                    onToggleSimSpeed={setSimSpeed}
                    travelMode={travelMode}
                    onSelectTravelMode={handleSelectTravelMode}
                  />
                ) : (
                  <MobilePhoneSimulator
                    currentPosition={currentPosition}
                    nextPosition={nextPosition}
                    selectedRoute={selectedRoute}
                    allRoutes={routes}
                    onSelectRoute={selectRoute}
                    dangerZones={dangerZones}
                    incidents={incidents}
                    isNavigating={isNavigating}
                    isPaused={isPaused}
                    speedKmH={speedKmH}
                    progressPercentage={progressPercentage}
                    activeAlertZone={effectiveAlertZone}
                    voiceEnabled={voiceEnabled}
                    onToggleVoice={() => setVoiceEnabled(!voiceEnabled)}
                    onStart={handleRequestStartTrip}
                    onPause={pauseNavigation}
                    onResume={resumeNavigation}
                    onReset={handleResetAll}
                    onAcceptReroute={handleAcceptReroute}
                    onDismissAlert={handleDismissEffectiveAlert}
                    onOpenReportModal={() => setIsReportModalOpen(true)}
                    originLocation={originLocation}
                    destinationLocation={destinationLocation}
                    onCalculateJourney={(orig, dest) => calculateJourney(orig, dest, dangerZones)}
                    onSwapLocations={() => swapOriginAndDestination(dangerZones)}
                    isCalculatingRoute={isCalculatingRoute}
                    onResetPresetRoutes={resetToPresetRoutes}
                    simSpeed={simSpeed}
                    onToggleSimSpeed={setSimSpeed}
                    focusPoint={focusPoint}
                    onOpenAssistant={handleOpenAssistant}
                    isStandbyLocked={isPhoneLocked}
                    onToggleLock={setIsPhoneLocked}
                    onOpenOnboarding={() => setIsOnboardingOpen(true)}
                    travelMode={travelMode}
                    onSelectTravelMode={handleSelectTravelMode}
                  />
                )}
              </div>

              {/* Clean 3-Tab Details / Steps / Alerts Card Above Footer */}
              <section
                id="info-hub-mobile"
                aria-label="Detalhes da rota, passo a passo e alertas"
                className="rounded-[28px] bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 shadow-[0_14px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_18px_48px_rgba(0,0,0,0.5)] overflow-hidden"
              >
                <div
                  role="tablist"
                  aria-label="Detalhes, passo a passo e alertas"
                  className="grid grid-cols-3 p-1.5 gap-1 bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 select-none"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mobileInfoTab === 'routes'}
                    onClick={() => setSidebarTab('routes')}
                    className={`py-2.5 px-1.5 rounded-2xl text-xs font-bold flex flex-wrap items-center justify-center gap-1 text-center leading-tight transition-all ${
                      mobileInfoTab === 'routes'
                        ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 shadow-sm'
                        : 'text-neutral-900 dark:text-neutral-100 hover:bg-neutral-200/70 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <Navigation className="w-3.5 h-3.5 shrink-0" />
                    <span>Detalhes</span>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={mobileInfoTab === 'itinerary'}
                    onClick={() => setSidebarTab('itinerary')}
                    className={`py-2.5 px-1.5 rounded-2xl text-xs font-bold flex flex-wrap items-center justify-center gap-1 text-center leading-tight transition-all ${
                      mobileInfoTab === 'itinerary'
                        ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 shadow-sm'
                        : 'text-neutral-900 dark:text-neutral-100 hover:bg-neutral-200/70 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <ListChecks className="w-3.5 h-3.5 shrink-0" />
                    <span>Passos</span>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={mobileInfoTab === 'alerts'}
                    onClick={() => setSidebarTab('alerts')}
                    className={`py-2.5 px-1.5 rounded-2xl text-xs font-bold flex flex-wrap items-center justify-center gap-1 text-center leading-tight transition-all ${
                      mobileInfoTab === 'alerts'
                        ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 shadow-sm'
                        : 'text-neutral-900 dark:text-neutral-100 hover:bg-neutral-200/70 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Alertas ({allIncidents.length})</span>
                  </button>
                </div>

                <div className="p-4">
                  {mobileInfoTab === 'routes' && (
                    <RouteSelector
                      routes={routes}
                      selectedRouteId={selectedRoute.id}
                      onSelectRoute={selectRoute}
                      isNavigating={isNavigating}
                      progressPercentage={progressPercentage}
                      originLocation={originLocation}
                      destinationLocation={destinationLocation}
                      onCalculateJourney={(orig, dest) => calculateJourney(orig, dest, dangerZones)}
                      onSwapLocations={() => swapOriginAndDestination(dangerZones)}
                      isCalculatingRoute={isCalculatingRoute}
                      onResetPresetRoutes={resetToPresetRoutes}
                      simSpeed={simSpeed}
                      onToggleSimSpeed={setSimSpeed}
                    />
                  )}

                  {mobileInfoTab === 'itinerary' && (
                    <RouteItinerary
                      selectedRoute={selectedRoute}
                      isNavigating={isNavigating}
                      progressPercentage={progressPercentage}
                    />
                  )}

                  {mobileInfoTab === 'alerts' && (
                    <IncidentList
                      incidents={incidents}
                      loading={loading}
                      searchQuery={searchQuery}
                      onSearchChange={setSearchQuery}
                      selectedCategory={selectedCategory}
                      onCategoryChange={setSelectedCategory}
                      selectedRisk={selectedRisk}
                      onRiskChange={setSelectedRisk}
                      onConfirm={confirmIncident}
                      onUpdateStatus={(id, status) => updateIncident(id, { status })}
                      onDelete={deleteIncident}
                      onResetData={resetData}
                      onFocusIncident={handleFocusIncident}
                    />
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </main>

      {/* Modals */}
      <IncidentReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmit={addIncident}
      />

      <SafetyTipsDrawer
        isOpen={isTipsDrawerOpen}
        onClose={() => setIsTipsDrawerOpen(false)}
      />

      {/* 3-Step Onboarding Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        selectedMode={travelMode}
        onSelectMode={setTravelMode}
      />

      {/* Pre-Trip Calm Passenger Safety Notification Modal */}
      {pendingTripBriefing && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Aviso tranquilo antes de iniciar viagem"
          className="fixed inset-0 z-[2000] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-neutral-950 border-2 border-neutral-950 dark:border-white/25 shadow-2xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">
                    {pendingTripBriefing.toneLabel}
                  </span>
                  <h3 className="text-sm font-extrabold text-neutral-950 dark:text-white leading-snug">
                    {pendingTripBriefing.headline}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  stopVoice();
                  setPendingTripBriefing(null);
                }}
                className="p-1.5 rounded-full bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white"
                aria-label="Fechar aviso"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
              {pendingTripBriefing.message}
            </p>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  stopVoice();
                  handleConfirmStartTrip();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-xs font-extrabold flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-98 transition-all shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Iniciar Viagem Agora</span>
              </button>

              {pendingTripBriefing.recommendSafeRoute && (
                <button
                  type="button"
                  onClick={() => {
                    stopVoice();
                    setPendingTripBriefing(null);
                    handleAcceptReroute();
                  }}
                  className="py-2.5 px-3.5 rounded-xl border border-neutral-950 dark:border-white text-neutral-950 dark:text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Usar Rota Segura</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                stopVoice();
                setPendingTripBriefing(null);
                handleOpenAssistant();
              }}
              className="w-full py-2 px-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 text-[11px] font-semibold flex items-center justify-center gap-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tirar dúvida na IA antes de sair</span>
            </button>
          </div>
        </div>
      )}

      {/* Tempting Floating Chatbot Launcher Button */}
      <button
        type="button"
        onClick={handleOpenAssistant}
        aria-label="Abrir Chatbot SafeRoute IA"
        className={`${
          mobileView === 'ai' ? 'hidden lg:flex' : 'flex'
        } fixed bottom-5 right-5 z-[1100] items-center gap-2.5 px-4 py-3 rounded-full bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 border border-white/20 dark:border-neutral-950/20 shadow-[0_14px_38px_rgba(0,0,0,0.38)] hover:scale-105 active:scale-95 transition-all group`}
      >
        <div className="relative flex items-center justify-center">
          <MessageCircle className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-white dark:bg-neutral-950 ring-2 ring-neutral-950 dark:ring-white animate-pulse" />
        </div>
        <div className="text-left leading-tight">
          <div className="text-xs font-extrabold tracking-tight flex items-center gap-1">
            <span>SafeRoute IA</span>
            <Sparkles className="w-3 h-3" />
          </div>
          <div className="text-[10px] opacity-75">Perguntar ou Emergência</div>
        </div>
      </button>

      <Footer />
    </div>
  );
}

export default App;
