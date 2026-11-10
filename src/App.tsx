import React, { useState, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { RouteSelector } from './components/RouteSelector';
import { IncidentList } from './components/IncidentList';
import { IncidentReportModal } from './components/IncidentReportModal';
import { SafetyTipsDrawer } from './components/SafetyTipsDrawer';
import { MobilePhoneSimulator } from './components/MobilePhoneSimulator';
import { BackgroundMap } from './components/BackgroundMap';
import { Footer } from './components/Footer';

import { useSafetyAlerts } from './hooks/useSafetyAlerts';
import { useRouteNavigation } from './hooks/useRouteNavigation';
import { useVoiceGuidance } from './hooks/useVoiceGuidance';
import { useGeofenceAlert } from './hooks/useGeofenceAlert';
import { DangerZone } from './types';

export function App() {
  // 1. Safety Alerts Hook (CRUD + Supabase/Local State)
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

  // 2. Navigation Simulation Hook
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

  // 3. Audio / Voice Guidance Hook
  const { voiceEnabled, setVoiceEnabled, speakAlert } = useVoiceGuidance();

  // Modals
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isTipsDrawerOpen, setIsTipsDrawerOpen] = useState(false);

  // Triggered when entering critical geofence
  const handleEnterCriticalZone = useCallback(
    (zone: DangerZone) => {
      speakAlert(
        `Alerta Defesa Civil: Você está entrando em área de atenção em ${zone.neighborhood}. ${zone.defenseCivilTip}`
      );
    },
    [speakAlert]
  );

  // 4. Geofencing Alert Hook
  const { activeAlertZone, dismissAlert, resetDismissed } = useGeofenceAlert({
    currentPosition,
    dangerZones,
    isNavigating,
    onEnterCriticalZone: handleEnterCriticalZone,
  });

  // Action: Accept Reroute to SafeRoute
  const handleAcceptReroute = () => {
    switchImmediatelyToSafeRoute();
    speakAlert('Desvio seguro ativado. Rota monitorada em andamento.');
  };

  // Wrap reset to also clear dismissed alerts for fresh simulation runs
  const handleResetAll = () => {
    resetNavigation();
    resetDismissed();
  };

  return (
    <div className="relative min-h-screen bg-black text-neutral-100 flex flex-col font-sans selection:bg-white selection:text-black">
      {/* Live Interactive Map of São Paulo Running in the Background */}
      <BackgroundMap
        selectedRoute={selectedRoute}
        currentPosition={currentPosition}
      />

      {/* Foreground Content Layer */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <Navbar
          voiceEnabled={voiceEnabled}
          onToggleVoice={() => setVoiceEnabled(!voiceEnabled)}
          onOpenReportModal={() => setIsReportModalOpen(true)}
          onOpenTipsDrawer={() => setIsTipsDrawerOpen(true)}
          activeIncidentsCount={allIncidents.length}
        />

        {/* Main Container */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-7">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left: Smartphone Prototype (Live Navigation Simulator) */}
            <div className="lg:col-span-6 xl:col-span-7 flex justify-center lg:sticky lg:top-20">
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
              />
            </div>

            {/* Right: Route Planner & Incident Management */}
            <div className="lg:col-span-6 xl:col-span-5 space-y-6">
              {/* Route Selector Card */}
              <div className="p-4 rounded-2xl bg-neutral-950/80 backdrop-blur-xl border border-white/10 shadow-2xl">
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

              {/* Community Incidents Feed */}
              <div className="p-4 rounded-2xl bg-neutral-950/80 backdrop-blur-xl border border-white/10 shadow-2xl">
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

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}

export default App;
