import React, { useState, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { RouteSelector } from './components/RouteSelector';
import { IncidentList } from './components/IncidentList';
import { IncidentReportModal } from './components/IncidentReportModal';
import { SafetyTipsDrawer } from './components/SafetyTipsDrawer';
import { MobilePhoneSimulator } from './components/MobilePhoneSimulator';
import { Footer } from './components/Footer';

import { useSafetyAlerts } from './hooks/useSafetyAlerts';
import { useRouteNavigation } from './hooks/useRouteNavigation';
import { useVoiceGuidance } from './hooks/useVoiceGuidance';
import { useGeofenceAlert } from './hooks/useGeofenceAlert';
import { isSupabaseConfigured } from './services/supabase';
import { DangerZone } from './types';
import { Database } from 'lucide-react';

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
    calculateRouteForAddress,
    resetToPresetRoutes,
    currentDestination,
    isCalculatingRoute,
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

  // Modals
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isTipsDrawerOpen, setIsTipsDrawerOpen] = useState(false);

  // Triggered when entering critical geofence
  const handleEnterCriticalZone = useCallback(
    (zone: DangerZone) => {
      speakAlert(
        `Alerta Defesa Civil: Você está entrando em área de risco em ${zone.neighborhood}. ${zone.defenseCivilTip}`
      );
    },
    [speakAlert]
  );

  // 4. Geofencing Alert Hook
  const { activeAlertZone, dismissAlert } = useGeofenceAlert({
    currentPosition,
    dangerZones,
    isNavigating,
    onEnterCriticalZone: handleEnterCriticalZone,
  });

  // Action: Accept Reroute to SafeRoute
  const handleAcceptReroute = () => {
    switchImmediatelyToSafeRoute();
    speakAlert('Desvio seguro ativado com sucesso. Rota protegida em andamento.');
  };

  return (
    <div className="min-h-screen bg-black text-neutral-100 flex flex-col font-sans selection:bg-neutral-800 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        voiceEnabled={voiceEnabled}
        onToggleVoice={() => setVoiceEnabled(!voiceEnabled)}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenTipsDrawer={() => setIsTipsDrawerOpen(true)}
        activeIncidentsCount={allIncidents.length}
      />

      {/* Supabase status strip */}
      <div className="border-b border-neutral-900 bg-neutral-950 py-1.5 px-4 text-center">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-[11px] text-neutral-500 font-mono">
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-neutral-400" />
            <span>
              Banco de Dados:{' '}
              <strong className="text-neutral-300">
                {isSupabaseConfigured ? 'Supabase Conectado' : 'Supabase Client Ativo (Local Cache)'}
              </strong>
            </span>
          </div>
          <span className="hidden sm:inline">Defesa Civil SP &bull; Monitoramento Ativo</span>
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Smartphone Prototype (Google Maps Navigation with In-Phone Message) */}
          <div className="lg:col-span-7 flex justify-center">
            <MobilePhoneSimulator
              currentPosition={currentPosition}
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
              onReset={resetNavigation}
              onAcceptReroute={handleAcceptReroute}
              onDismissAlert={dismissAlert}
              onOpenReportModal={() => setIsReportModalOpen(true)}
              onSearchDestination={(addr) => calculateRouteForAddress(addr, dangerZones)}
              isCalculatingRoute={isCalculatingRoute}
              currentDestination={currentDestination}
              onResetPresetRoutes={resetToPresetRoutes}
            />
          </div>

          {/* Right: Route Options & Incident Management (CRUD) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Route Selector Card */}
            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
              <RouteSelector
                routes={routes}
                selectedRouteId={selectedRoute.id}
                onSelectRoute={selectRoute}
                isNavigating={isNavigating}
                onSearchDestination={(addr) => calculateRouteForAddress(addr, dangerZones)}
                isCalculatingRoute={isCalculatingRoute}
                currentDestination={currentDestination}
                onResetPresetRoutes={resetToPresetRoutes}
              />
            </div>

            {/* Community Incidents CRUD Feed */}
            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
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
  );
}

export default App;
