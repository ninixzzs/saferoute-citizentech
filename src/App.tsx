import React, { useState, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { RouteSelector } from './components/RouteSelector';
import { RouteItinerary } from './components/RouteItinerary';
import { IncidentList } from './components/IncidentList';
import { IncidentReportModal } from './components/IncidentReportModal';
import { SafetyTipsDrawer } from './components/SafetyTipsDrawer';
import { MobilePhoneSimulator } from './components/MobilePhoneSimulator';
import { ExpandedMapWorkspace } from './components/ExpandedMapWorkspace';
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
  const [sidebarTab, setSidebarTab] = useState<'routes' | 'itinerary' | 'alerts'>('routes');
  const [mobileTab, setMobileTab] = useState<'map' | 'routes' | 'itinerary' | 'alerts'>('map');
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
    setMobileTab('map');
  };

  const handleMobileCalculateJourney = async (orig: string, dest: string) => {
    const res = await calculateJourney(orig, dest, dangerZones);
    if (res) {
      setMobileTab('map');
    }
    return res;
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5 pb-24 lg:pb-8">
        {/* Hero Header Section with Requested Title & Description */}
        <section
          aria-label="Apresentação do SafeRoute"
          className="rounded-3xl bg-white/90 dark:bg-neutral-900/85 border border-neutral-200 dark:border-neutral-800 backdrop-blur-xl p-5 sm:p-6 shadow-sm"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            {/* Hero Title & Description */}
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/70 text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isNavigating ? 'bg-indigo-600 dark:bg-indigo-400 animate-pulse' : 'bg-indigo-500'
                  }`}
                />
                <span>SafeRoute São Paulo &bull; Navegação Preventiva</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-950 dark:text-white leading-tight">
                Rotas que avisam antes do risco.
              </h1>

              <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                O SafeRoute compara o caminho mais rápido com um desvio seguro e manda uma mensagem
                no celular quando você chega perto de uma área de risco em São Paulo.
              </p>
            </div>

            {/* Interactive Quick Actions & Desktop View Mode Switcher */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-3 shrink-0 tabular-nums select-none">
              {/* Telemetry Pills */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100/90 dark:bg-neutral-950/80 border border-neutral-200 dark:border-neutral-800 text-xs">
                  <Route className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span className="font-mono font-bold text-neutral-950 dark:text-white">
                    {selectedRoute.distanceKm} km
                  </span>
                  <span className="text-neutral-400">&bull;</span>
                  <span className="font-mono text-neutral-600 dark:text-neutral-300">
                    {selectedRoute.durationMin} min
                  </span>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100/90 dark:bg-neutral-950/80 border border-neutral-200 dark:border-neutral-800 text-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-neutral-700 dark:text-neutral-300" />
                  <span className="text-neutral-500 dark:text-neutral-400">Segurança:</span>
                  <span className="font-mono font-bold text-neutral-950 dark:text-white">
                    {selectedRoute.safetyScore}/100
                  </span>
                </div>
              </div>

              {/* Action Controls: Test Alert + Desktop Map/Phone Switcher */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleTriggerDemoAlert}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all active:scale-98"
                  title="Simular recebimento de alerta da Defesa Civil no aparelho"
                >
                  <MessageSquareWarning className="w-3.5 h-3.5" />
                  <span>Testar Alerta de Risco</span>
                </button>

                <div
                  role="tablist"
                  aria-label="Modo de visualização no computador"
                  className="hidden lg:inline-flex items-center gap-1 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={viewMode === 'map'}
                    onClick={() => setViewMode('map')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      viewMode === 'map'
                        ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-xs ring-1 ring-neutral-200 dark:ring-neutral-700'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                    }`}
                  >
                    <Map className="w-3.5 h-3.5" />
                    <span>Mapa Amplo</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={viewMode === 'phone'}
                    onClick={() => setViewMode('phone')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      viewMode === 'phone'
                        ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-xs ring-1 ring-neutral-200 dark:ring-neutral-700'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Simulador Celular</span>
                  </button>
                </div>
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
            className="lg:col-span-5 rounded-3xl bg-white/95 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 backdrop-blur-xl shadow-xl overflow-hidden flex flex-col"
          >
            <div
              role="tablist"
              aria-label="Seções de informação"
              className="grid grid-cols-3 p-1.5 gap-1 bg-neutral-100/80 dark:bg-neutral-950/60 border-b border-neutral-200 dark:border-neutral-800 select-none"
            >
              <button
                type="button"
                role="tab"
                aria-selected={sidebarTab === 'routes'}
                onClick={() => setSidebarTab('routes')}
                className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  sidebarTab === 'routes'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-950 dark:text-white shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-700'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                }`}
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Rotas</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={sidebarTab === 'itinerary'}
                onClick={() => setSidebarTab('itinerary')}
                className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  sidebarTab === 'itinerary'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-950 dark:text-white shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-700'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                }`}
              >
                <ListChecks className="w-3.5 h-3.5" />
                <span>Passo a Passo</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={sidebarTab === 'alerts'}
                onClick={() => setSidebarTab('alerts')}
                className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  sidebarTab === 'alerts'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-950 dark:text-white shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-700'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Alertas ({allIncidents.length})</span>
              </button>
            </div>

            <div className="p-4 max-h-[622px] overflow-y-auto">
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
            </div>
          </aside>
        </div>

        {/* MOBILE APP EXPERIENCE (< lg) */}
        <div className="lg:hidden space-y-3">
          {/* Quick Trip Pill on Mobile */}
          <button
            type="button"
            onClick={() => setMobileTab('routes')}
            className="w-full p-3 rounded-2xl bg-white/95 dark:bg-neutral-900/95 border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center justify-between gap-3 text-left"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Navigation className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-neutral-950 dark:text-white truncate">
                  {originLocation.name} &rarr; {destinationLocation.name}
                </div>
                <div className="text-[11px] text-neutral-500 font-mono tabular-nums">
                  {selectedRoute.durationMin} min &bull; {selectedRoute.distanceKm} km &bull; Segurança {selectedRoute.safetyScore}/100
                </div>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-[11px] font-bold text-neutral-700 dark:text-neutral-200 shrink-0">
              Alterar
            </span>
          </button>

          {mobileTab === 'map' && (
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
          )}

          {mobileTab === 'routes' && (
            <div className="p-4 rounded-2xl bg-white/95 dark:bg-neutral-900/95 border border-neutral-200 dark:border-neutral-800 shadow-lg">
              <RouteSelector
                routes={routes}
                selectedRouteId={selectedRoute.id}
                onSelectRoute={(r) => {
                  selectRoute(r);
                  setMobileTab('map');
                }}
                isNavigating={isNavigating}
                progressPercentage={progressPercentage}
                originLocation={originLocation}
                destinationLocation={destinationLocation}
                onCalculateJourney={handleMobileCalculateJourney}
                onSwapLocations={() => swapOriginAndDestination(dangerZones)}
                isCalculatingRoute={isCalculatingRoute}
                onResetPresetRoutes={resetToPresetRoutes}
                simSpeed={simSpeed}
                onToggleSimSpeed={setSimSpeed}
              />
            </div>
          )}

          {mobileTab === 'itinerary' && (
            <div className="p-4 rounded-2xl bg-white/95 dark:bg-neutral-900/95 border border-neutral-200 dark:border-neutral-800 shadow-lg">
              <RouteItinerary
                selectedRoute={selectedRoute}
                isNavigating={isNavigating}
                progressPercentage={progressPercentage}
              />
            </div>
          )}

          {mobileTab === 'alerts' && (
            <div className="p-4 rounded-2xl bg-white/95 dark:bg-neutral-900/95 border border-neutral-200 dark:border-neutral-800 shadow-lg">
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
            </div>
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar (< lg) */}
      <nav
        aria-label="Navegação principal no smartphone"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-xl border-t border-neutral-200 dark:border-neutral-800 px-2 py-1.5 shadow-[0_-8px_30px_rgba(0,0,0,0.12)]"
      >
        <div className="grid grid-cols-4 gap-1 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setMobileTab('map')}
            className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors ${
              mobileTab === 'map'
                ? 'text-indigo-600 dark:text-white bg-indigo-50 dark:bg-neutral-800'
                : 'text-neutral-500 dark:text-neutral-400'
            }`}
          >
            <Map className="w-4 h-4" />
            <span>Mapa</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileTab('routes')}
            className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors ${
              mobileTab === 'routes'
                ? 'text-indigo-600 dark:text-white bg-indigo-50 dark:bg-neutral-800'
                : 'text-neutral-500 dark:text-neutral-400'
            }`}
          >
            <Navigation className="w-4 h-4" />
            <span>Rotas</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileTab('itinerary')}
            className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors ${
              mobileTab === 'itinerary'
                ? 'text-indigo-600 dark:text-white bg-indigo-50 dark:bg-neutral-800'
                : 'text-neutral-500 dark:text-neutral-400'
            }`}
          >
            <ListChecks className="w-4 h-4" />
            <span>Passos</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileTab('alerts')}
            className={`relative py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors ${
              mobileTab === 'alerts'
                ? 'text-indigo-600 dark:text-white bg-indigo-50 dark:bg-neutral-800'
                : 'text-neutral-500 dark:text-neutral-400'
            }`}
          >
            <div className="relative">
              <AlertCircle className="w-4 h-4" />
              {allIncidents.length > 0 && (
                <span className="absolute -top-1.5 -right-2.5 px-1 min-w-[16px] h-4 rounded-full bg-indigo-600 dark:bg-white text-white dark:text-neutral-950 text-[9px] font-mono font-bold flex items-center justify-center">
                  {allIncidents.length}
                </span>
              )}
            </div>
            <span>Alertas</span>
          </button>
        </div>
      </nav>

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
