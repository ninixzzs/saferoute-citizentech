import React, { useState, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { AlertBanner } from './components/AlertBanner';
import { NavigationMap } from './components/NavigationMap';
import { RouteSelector } from './components/RouteSelector';
import { NavigationControls } from './components/NavigationControls';
import { IncidentList } from './components/IncidentList';
import { IncidentReportModal } from './components/IncidentReportModal';
import { DefesaCivilModal } from './components/DefesaCivilModal';
import { SafetyTipsDrawer } from './components/SafetyTipsDrawer';
import { StatsOverview } from './components/StatsOverview';
import { Footer } from './components/Footer';

import { useSafetyAlerts } from './hooks/useSafetyAlerts';
import { useRouteNavigation } from './hooks/useRouteNavigation';
import { useVoiceGuidance } from './hooks/useVoiceGuidance';
import { useGeofenceAlert } from './hooks/useGeofenceAlert';
import { DangerZone } from './types';

export function App() {
  // 1. Safety Alerts Hook (CRUD + State)
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
    isNavigating,
    isPaused,
    currentPosition,
    speedKmH,
    progressPercentage,
    startNavigation,
    pauseNavigation,
    resumeNavigation,
    resetNavigation,
  } = useRouteNavigation();

  // 3. Audio / Voice Guidance Hook
  const { voiceEnabled, setVoiceEnabled, speakAlert } = useVoiceGuidance();

  // UI Modals State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isTipsDrawerOpen, setIsTipsDrawerOpen] = useState(false);
  const [isDefesaModalOpen, setIsDefesaModalOpen] = useState(false);
  const [selectedZoneModal, setSelectedZoneModal] = useState<DangerZone | null>(null);

  // Triggered when entering critical geofence
  const handleEnterCriticalZone = useCallback(
    (zone: DangerZone) => {
      setSelectedZoneModal(zone);
      setIsDefesaModalOpen(true);
      speakAlert(
        `Alerta Defesa Civil! Você está entrando em área de risco em ${zone.neighborhood}. ${zone.defenseCivilTip}`
      );
    },
    [speakAlert]
  );

  // 4. Geofencing Alert Hook
  const { activeAlertZone, nearestZone, dismissAlert } = useGeofenceAlert({
    currentPosition,
    dangerZones,
    isNavigating,
    onEnterCriticalZone: handleEnterCriticalZone,
  });

  // Action: Accept Reroute to SafeRoute
  const handleAcceptReroute = () => {
    switchImmediatelyToSafeRoute();
    setIsDefesaModalOpen(false);
    speakAlert('Desvio seguro ativado com sucesso. Recalculando trajeto protegido.');
  };

  const handleZoneClick = (zone: DangerZone) => {
    setSelectedZoneModal(zone);
    setIsDefesaModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <Navbar
        voiceEnabled={voiceEnabled}
        onToggleVoice={() => setVoiceEnabled(!voiceEnabled)}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenTipsDrawer={() => setIsTipsDrawerOpen(true)}
        activeIncidentsCount={allIncidents.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-6">
        {/* Real-time Emergency Alert Banner */}
        <AlertBanner
          zone={activeAlertZone}
          onDismiss={dismissAlert}
          onReroute={handleAcceptReroute}
          onSpeak={speakAlert}
        />

        {/* Dashboard High-Level Stats */}
        <StatsOverview
          totalIncidents={allIncidents.length}
          totalDangerZones={dangerZones.length}
        />

        {/* Core Navigation & Map Cockpit Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left / Center: Interactive Map & Live Cockpit (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="relative">
              <NavigationMap
                currentPosition={currentPosition}
                selectedRoute={selectedRoute}
                dangerZones={dangerZones}
                incidents={incidents}
                isNavigating={isNavigating}
                onZoneClick={handleZoneClick}
              />
            </div>

            {/* GPS Simulation Controls */}
            <NavigationControls
              isNavigating={isNavigating}
              isPaused={isPaused}
              speedKmH={speedKmH}
              progressPercentage={progressPercentage}
              selectedRoute={selectedRoute}
              nearestDangerZone={nearestZone}
              onStart={startNavigation}
              onPause={pauseNavigation}
              onResume={resumeNavigation}
              onReset={resetNavigation}
              onInstantReroute={handleAcceptReroute}
            />
          </div>

          {/* Right: Route Comparison & Trajeto Options (4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-sm shadow-xl">
              <RouteSelector
                routes={routes}
                selectedRouteId={selectedRoute.id}
                onSelectRoute={selectRoute}
                isNavigating={isNavigating}
              />
            </div>

            {/* Defesa Civil Quick Info Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-900 to-red-500/10 border border-amber-500/30 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <span>🛡️</span>
                <span>Como funciona o SafeRoute SP?</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Assim como a <strong>Defesa Civil</strong> envia alertas meteorológicos de emergência, o SafeRoute monitora o trajeto do veículo em tempo real contra as manchas criminais de furto de celular da SSP-SP e colaboração cidadã.
              </p>
              <button
                onClick={() => setIsTipsDrawerOpen(true)}
                className="text-amber-400 hover:text-amber-300 font-bold underline transition-colors"
              >
                Ver protocolos e dicas de segurança &rarr;
              </button>
            </div>
          </div>
        </div>

        {/* Community CitizenTech Incidents Feed (CRUD) */}
        <div className="mt-8 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-6 backdrop-blur-sm shadow-xl">
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
      </main>

      {/* Global Modals & Drawers */}
      <IncidentReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmit={addIncident}
      />

      <DefesaCivilModal
        zone={selectedZoneModal || activeAlertZone}
        isOpen={isDefesaModalOpen}
        onClose={() => setIsDefesaModalOpen(false)}
        onAcceptReroute={handleAcceptReroute}
      />

      <SafetyTipsDrawer
        isOpen={isTipsDrawerOpen}
        onClose={() => setIsTipsDrawerOpen(false)}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;
