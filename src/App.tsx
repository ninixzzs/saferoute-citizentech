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
  MessageSquare,
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
  const [sidebarTab, setSidebarTab] = useState<'routes' | 'itinerary' | 'alerts' | 'messages'>('routes');
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

              {/* Action Controls: Test Alert + Responsive Map/Phone Switcher */}
              <div className="flex flex-wrap items-center gap-2">
                <div
                  role="tablist"
                  aria-label="Modo de visualização"
                  className="inline-flex flex-1 sm:flex-initial items-center gap-1 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={viewMode === 'map'}
                    onClick={() => setViewMode('map')}
                    className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 ${
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
                    className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 ${
                      viewMode === 'phone'
                        ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Modo Celular</span>
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
                className={`py-2.5 px-1.5 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1 transition-all duration-200 ${
                  sidebarTab === 'messages'
                    ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                <span>Mensagens</span>
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
                />
              )}
            </div>
          </aside>
        </div>

        {/* MOBILE APP EXPERIENCE (< lg): Interactive Stage + Separated Details/Steps/Alerts above Footer */}
        <div className="lg:hidden space-y-5">
          <div id="mobile-stage">
            {viewMode === 'map' ? (
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

          {/* Separated High-Contrast Details / Steps / Alerts Card Above Footer (for both Mapa and Modo Celular) */}
          <section
            aria-label="Detalhes da rota, passo a passo e alertas"
            className="rounded-[28px] bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 shadow-[0_14px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_18px_48px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            <div
              role="tablist"
              aria-label="Detalhes, passo a passo, alertas e mensagens"
              className="grid grid-cols-2 sm:grid-cols-4 p-1.5 gap-1 bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 select-none"
            >
              <button
                type="button"
                role="tab"
                aria-selected={sidebarTab === 'routes'}
                onClick={() => setSidebarTab('routes')}
                className={`py-2.5 px-1.5 rounded-2xl text-xs font-bold flex flex-wrap items-center justify-center gap-1 text-center leading-tight transition-all ${
                  sidebarTab === 'routes'
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
                aria-selected={sidebarTab === 'itinerary'}
                onClick={() => setSidebarTab('itinerary')}
                className={`py-2.5 px-1.5 rounded-2xl text-xs font-bold flex flex-wrap items-center justify-center gap-1 text-center leading-tight transition-all ${
                  sidebarTab === 'itinerary'
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
                aria-selected={sidebarTab === 'alerts'}
                onClick={() => setSidebarTab('alerts')}
                className={`py-2.5 px-1.5 rounded-2xl text-xs font-bold flex flex-wrap items-center justify-center gap-1 text-center leading-tight transition-all ${
                  sidebarTab === 'alerts'
                    ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 shadow-sm'
                    : 'text-neutral-900 dark:text-neutral-100 hover:bg-neutral-200/70 dark:hover:bg-neutral-800'
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
                className={`py-2.5 px-1.5 rounded-2xl text-xs font-bold flex flex-wrap items-center justify-center gap-1 text-center leading-tight transition-all ${
                  sidebarTab === 'messages'
                    ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 shadow-sm'
                    : 'text-neutral-900 dark:text-neutral-100 hover:bg-neutral-200/70 dark:hover:bg-neutral-800'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                <span>Mensagens</span>
              </button>
            </div>

            <div className="p-4">
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
                />
              )}
            </div>
          </section>
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
