import React, { useState, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { RouteSelector } from './components/RouteSelector';
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
import { Map, Smartphone, ShieldCheck, AlertCircle, Route, Activity } from 'lucide-react';

export function App() {
  // Accessibility & Theme Hook (Light, Dark, Device/System, Font Scale, High Contrast)
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

  // Safety Alerts Hook (CRUD + Supabase/IndexedDB)
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

  // Navigation Hook
  const {
    routes,
    selectedRoute,
    selectRoute,
    switchImmediatelyToSafeRoute,
    calculateJourney,
    swapOriginAndDestination,
    setPointFromMap,
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

  // Workspace view mode: 'map' (Interactive wide map) or 'phone' (Mobile GPS simulator)
  const [viewMode, setViewMode] = useState<'map' | 'phone'>('map');
  const [focusPoint, setFocusPoint] = useState<{ coords: [number, number]; ts: number } | null>(null);

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

  const handleAcceptReroute = () => {
    switchImmediatelyToSafeRoute();
    speakAlert('Desvio seguro ativado. Rota monitorada em andamento.');
  };

  const handleResetAll = () => {
    resetNavigation();
    resetDismissed();
  };

  const handleFocusIncident = (coords: [number, number]) => {
    setFocusPoint({ coords, ts: Date.now() });
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        resolvedTheme === 'dark'
          ? 'bg-grid-dark text-neutral-100 selection:bg-white selection:text-black'
          : 'bg-grid-light text-neutral-900 selection:bg-neutral-900 selection:text-white'
      }`}
    >
      {/* Top Navbar with Accessibility & Theme Controls */}
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
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Clean Interactive Overview Strip */}
        <section
          aria-label="Resumo operacional"
          className="grid grid-cols-2 lg:grid-cols-4 gap-3"
        >
          <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 backdrop-blur-md shadow-xs">
            <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-[11px] font-semibold uppercase tracking-wider">
              <span>Trajeto Ativo</span>
              <Route className="w-3.5 h-3.5" />
            </div>
            <div className="mt-1.5 text-lg font-extrabold font-mono text-neutral-950 dark:text-white">
              {selectedRoute.distanceKm} km
            </div>
            <div className="text-[11px] text-neutral-500 truncate mt-0.5">
              {originLocation.name} &rarr; {destinationLocation.name}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 backdrop-blur-md shadow-xs">
            <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-[11px] font-semibold uppercase tracking-wider">
              <span>Índice de Segurança</span>
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <div className="mt-1.5 text-lg font-extrabold font-mono text-neutral-950 dark:text-white">
              {selectedRoute.safetyScore}/100
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5">
              Análise de vias monitoradas
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 backdrop-blur-md shadow-xs">
            <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-[11px] font-semibold uppercase tracking-wider">
              <span>Zonas Mapeadas</span>
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
            <div className="mt-1.5 text-lg font-extrabold font-mono text-neutral-950 dark:text-white">
              {dangerZones.length} áreas
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5">
              Cobertura Grande São Paulo
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 backdrop-blur-md shadow-xs">
            <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-[11px] font-semibold uppercase tracking-wider">
              <span>Alertas Ativos</span>
              <Activity className="w-3.5 h-3.5" />
            </div>
            <div className="mt-1.5 text-lg font-extrabold font-mono text-neutral-950 dark:text-white">
              {allIncidents.length} relatos
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5">
              Atualização colaborativa
            </div>
          </div>
        </section>

        {/* Main Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Interactive Map Workspace / Mobile Simulator Switcher */}
          <div className="lg:col-span-7 space-y-4 lg:sticky lg:top-20">
            {/* Workspace View Switcher */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div
                role="tablist"
                aria-label="Modo de visualização do mapa"
                className="inline-flex items-center gap-1 p-1 rounded-xl bg-white/90 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 shadow-xs"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={viewMode === 'map'}
                  onClick={() => setViewMode('map')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    viewMode === 'map'
                      ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                  }`}
                >
                  <Map className="w-3.5 h-3.5" />
                  <span>Mapa Interativo</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={viewMode === 'phone'}
                  onClick={() => setViewMode('phone')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    viewMode === 'phone'
                      ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Simulador Celular</span>
                </button>
              </div>

              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                {viewMode === 'map'
                  ? 'Clique para explorar ou marcar partida/destino'
                  : 'Pré-visualização mobile em tempo real'}
              </span>
            </div>

            {viewMode === 'map' ? (
              <ExpandedMapWorkspace
                currentPosition={currentPosition}
                nextPosition={nextPosition}
                selectedRoute={selectedRoute}
                dangerZones={dangerZones}
                incidents={incidents}
                isNavigating={isNavigating}
                isPaused={isPaused}
                speedKmH={speedKmH}
                progressPercentage={progressPercentage}
                activeAlertZone={activeAlertZone}
                onStart={startNavigation}
                onPause={pauseNavigation}
                onResume={resumeNavigation}
                onReset={handleResetAll}
                onAcceptReroute={handleAcceptReroute}
                onDismissAlert={dismissAlert}
                onPickPointFromMap={(role, coords) => setPointFromMap(role, coords, dangerZones)}
                focusPoint={focusPoint}
                simSpeed={simSpeed}
                onToggleSimSpeed={setSimSpeed}
              />
            ) : (
              <MobilePhoneSimulator
                currentPosition={currentPosition}
                nextPosition={nextPosition}
                selectedRoute={selectedRoute}
                dangerZones={dangerZones}
                incidents={incidents}
                isNavigating={isNavigating}
                isPaused={isPaused}
                speedKmH={speedKmH}
                progressPercentage={progressPercentage}
                activeAlertZone={activeAlertZone}
                voiceEnabled={voiceEnabled}
                onToggleVoice={() => setVoiceEnabled(!voiceEnabled)}
                onStart={startNavigation}
                onPause={pauseNavigation}
                onResume={resumeNavigation}
                onReset={handleResetAll}
                onAcceptReroute={handleAcceptReroute}
                onDismissAlert={dismissAlert}
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

          {/* Right: Route Planner & Incident Feed */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-4 rounded-2xl bg-white/95 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 backdrop-blur-xl shadow-lg">
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
            </div>

            <div className="p-4 rounded-2xl bg-white/95 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 backdrop-blur-xl shadow-lg">
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
          </div>
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
