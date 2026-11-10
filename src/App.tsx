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
import { Footer } from './components/Footer';

import { useSafetyAlerts } from './hooks/useSafetyAlerts';
import { useRouteNavigation } from './hooks/useRouteNavigation';
import { useVoiceGuidance } from './hooks/useVoiceGuidance';
import { useGeofenceAlert } from './hooks/useGeofenceAlert';
import { useAccessibility } from './hooks/useAccessibility';
import { DangerZone } from './types';
import {
  Map,
  Smartphone,
  ShieldCheck,
  AlertCircle,
  Route,
  ListChecks,
  Navigation,
  MessageSquareWarning,
  Sparkles,
  ArrowRight,
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
  } = useSafetyAlerts();

  const {
    routes,
    selectedRoute,
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
  } = useRouteNavigation();

  const { voiceEnabled, setVoiceEnabled, speakAlert } = useVoiceGuidance();

  // Workspace states
  const [viewMode, setViewMode] = useState<'map' | 'phone'>('map');
  const [mobileView, setMobileView] = useState<'map' | 'phone' | 'ai'>('map');
  const [sidebarTab, setSidebarTab] = useState<'routes' | 'itinerary' | 'alerts' | 'messages'>('routes');
  const [assistantFocusTrigger, setAssistantFocusTrigger] = useState(0);
  const mobileInfoTab = sidebarTab === 'messages' ? 'routes' : sidebarTab;
  const [focusPoint, setFocusPoint] = useState<{ coords: [number, number]; ts: number } | null>(null);
  const [simulatedAlertZone, setSimulatedAlertZone] = useState<DangerZone | null>(null);

  // Modals
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isTipsDrawerOpen, setIsTipsDrawerOpen] = useState(false);

  const handleEnterCriticalZone = useCallback(
    (zone: DangerZone) => {
      speakAlert(
        `Alerta Defesa Civil: Você está entrando em área de atenção em ${zone.neighborhood}. ${zone.defenseCivilTip}`
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

  const handleDismissEffectiveAlert = (id: string) => {
    dismissAlert(id);
    setSimulatedAlertZone(null);
  };

  const handleAcceptReroute = () => {
    switchImmediatelyToSafeRoute();
    setSimulatedAlertZone(null);
    speakAlert('Desvio seguro ativado. Rota monitorada em andamento.');
  };

  const handleResetAll = () => {
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
        `Alerta Defesa Civil: Área de risco próxima em ${targetZone.neighborhood}. ${targetZone.defenseCivilTip}`
      );
    }
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

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5">
        {/* Hero Header Section with Editorial Display Typography */}
        <section
          aria-label="Apresentação do SafeRoute"
          className="rounded-[24px] sm:rounded-[28px] bg-white/95 dark:bg-neutral-950/88 border border-neutral-200/90 dark:border-neutral-800/90 backdrop-blur-xl p-3.5 sm:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.05)] dark:shadow-[0_14px_44px_rgba(0,0,0,0.55)]"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-6">
            {/* Hero Title & Description */}
            <div className="space-y-1 sm:space-y-2 max-w-2xl">
              <h1 className="font-display text-[1.4rem] sm:text-[2.15rem] lg:text-[2.4rem] font-extrabold tracking-[-0.03em] text-neutral-950 dark:text-white leading-[1.08]">
                Rotas que avisam antes do risco.
              </h1>

              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-xl">
                O SafeRoute compara o caminho mais rápido com um desvio seguro e manda uma mensagem
                no celular quando você chega perto de uma área de risco em São Paulo.
              </p>
            </div>

            {/* Interactive Quick Actions & Universal Map/Phone Switcher (Mobile + Desktop) */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2.5 sm:gap-3 shrink-0 tabular-nums select-none">
              {/* Desktop Telemetry Pills */}
              <div className="hidden lg:flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-100/90 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 text-xs">
                  <Route className="w-3.5 h-3.5 text-neutral-950 dark:text-white" />
                  <span className="font-mono font-bold text-neutral-950 dark:text-white">
                    {selectedRoute.distanceKm} km
                  </span>
                  <span className="text-neutral-400">&bull;</span>
                  <span className="font-mono text-neutral-600 dark:text-neutral-300">
                    {selectedRoute.durationMin} min
                  </span>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100/90 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 text-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-neutral-800 dark:text-neutral-200" />
                  <span className="text-neutral-500 dark:text-neutral-400">Segurança:</span>
                  <span className="font-mono font-bold text-neutral-950 dark:text-white">
                    {selectedRoute.safetyScore}/100
                  </span>
                </div>
              </div>

              {/* Action Controls: Desktop Map/Phone Switcher + Mobile Map/Phone/AI Tab Switcher */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Desktop Switcher (Untouched >= lg) */}
                <div
                  role="tablist"
                  aria-label="Modo de visualização"
                  className="hidden lg:inline-flex items-center gap-1 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
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

                {/* Mobile 3-Tab Switcher (< lg): Dedicated isolated IA tab */}
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

                <button
                  type="button"
                  onClick={handleTriggerDemoAlert}
                  className="px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-950 dark:text-white text-xs font-semibold shadow-2xs flex items-center justify-center gap-1.5 transition-all active:scale-97"
                  title="Simular recebimento de alerta da Defesa Civil no aparelho"
                >
                  <MessageSquareWarning className="w-3.5 h-3.5" />
                  <span>Testar Alerta</span>
                </button>
              </div>
            </div>
          </div>

          {/* Prominent Featured AI Assistant & All-São-Paulo Coverage Strip (Desktop >= lg; mobile uses dedicated IA tab above) */}
          <div className="hidden lg:flex mt-3.5 pt-3.5 border-t border-neutral-200/80 dark:border-neutral-800/80 flex-row items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-neutral-950 dark:text-white flex flex-wrap items-center gap-1.5">
                  <span>Assistente de IA Pré-Viagem &amp; SMS</span>
                  <span className="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[10px] font-mono text-neutral-700 dark:text-neutral-300">
                    Resposta na hora
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

        {/* DESKTOP LAYOUT (>= lg): Map Prototype on LEFT (7 cols), Information on RIGHT (5 cols) */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-6 items-start">
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
                onStart={startNavigation}
                onPause={pauseNavigation}
                onResume={resumeNavigation}
                onReset={handleResetAll}
                onAcceptReroute={handleAcceptReroute}
                onDismissAlert={handleDismissEffectiveAlert}
                focusPoint={focusPoint}
                simSpeed={simSpeed}
                onToggleSimSpeed={setSimSpeed}
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
                onStart={startNavigation}
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
                  onSwitchToSafeRoute={handleAcceptReroute}
                  onSelectCustomDestination={(destName) =>
                    calculateJourney(originLocation.name, destName, dangerZones)
                  }
                  focusInputTrigger={assistantFocusTrigger}
                />
              )}
            </div>
          </aside>
        </div>

        {/* MOBILE APP EXPERIENCE (< lg): Dedicated AI tab OR Interactive Stage + 3-Tab Hub */}
        <div className="lg:hidden space-y-5">
          {mobileView === 'ai' ? (
            <section id="mobile-ai-tab" aria-label="Assistente IA SafeRoute">
              <SafetyAssistantChat
                originLocation={originLocation}
                destinationLocation={destinationLocation}
                selectedRoute={selectedRoute}
                allRoutes={routes}
                dangerZones={dangerZones}
                incidents={incidents}
                onSwitchToSafeRoute={handleAcceptReroute}
                onSelectCustomDestination={(destName) =>
                  calculateJourney(originLocation.name, destName, dangerZones)
                }
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
                    onStart={startNavigation}
                    onPause={pauseNavigation}
                    onResume={resumeNavigation}
                    onReset={handleResetAll}
                    onAcceptReroute={handleAcceptReroute}
                    onDismissAlert={handleDismissEffectiveAlert}
                    focusPoint={focusPoint}
                    simSpeed={simSpeed}
                    onToggleSimSpeed={setSimSpeed}
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
                    onStart={startNavigation}
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

      <Footer />
    </div>
  );
}

export default App;
