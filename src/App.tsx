import React, { useState, useCallback } from 'react';
import { Smartphone, Monitor, ShieldCheck, ShieldAlert, BookOpen, PlusCircle } from 'lucide-react';
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
import { MobilePhoneSimulator } from './components/MobilePhoneSimulator';
import { Footer } from './components/Footer';

import { useSafetyAlerts } from './hooks/useSafetyAlerts';
import { useRouteNavigation } from './hooks/useRouteNavigation';
import { useVoiceGuidance } from './hooks/useVoiceGuidance';
import { useGeofenceAlert } from './hooks/useGeofenceAlert';
import { DangerZone } from './types';

export function App() {
  // View mode: 'mobile' (Google Maps Phone Prototype) or 'desktop' (Command Center Dashboard)
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('mobile');

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
        `Alerta Defesa Civil: Você está entrando em área de risco em ${zone.neighborhood}. ${zone.defenseCivilTip}`
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
    speakAlert('Desvio seguro ativado com sucesso. Trajeto protegido em andamento.');
  };

  const handleZoneClick = (zone: DangerZone) => {
    setSelectedZoneModal(zone);
    setIsDefesaModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      {/* Top Navigation Bar */}
      <Navbar
        voiceEnabled={voiceEnabled}
        onToggleVoice={() => setVoiceEnabled(!voiceEnabled)}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenTipsDrawer={() => setIsTipsDrawerOpen(true)}
        activeIncidentsCount={allIncidents.length}
      />

      {/* View Switcher Subheader */}
      <div className="border-b border-slate-800 bg-slate-900/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="font-semibold text-white">Visualização:</span>
            <span>Alterne entre o protótipo móvel estilo Google Maps e a central web.</span>
          </div>

          <div className="inline-flex rounded-xl bg-slate-900 p-1 border border-slate-800">
            <button
              onClick={() => setViewMode('mobile')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'mobile'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Protótipo Celular (Google Maps)</span>
            </button>
            <button
              onClick={() => setViewMode('desktop')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'desktop'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Painel Web Completo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-6">
        
        {/* Real-time Emergency Alert Banner (Shown in desktop view or when active) */}
        {viewMode === 'desktop' && (
          <AlertBanner
            zone={activeAlertZone}
            onDismiss={dismissAlert}
            onReroute={handleAcceptReroute}
            onSpeak={speakAlert}
          />
        )}

        {/* Dashboard High-Level Stats */}
        <StatsOverview
          totalIncidents={allIncidents.length}
          totalDangerZones={dangerZones.length}
        />

        {/* VIEW MODE 1: MOBILE PHONE SIMULATOR (GOOGLE MAPS PROTOTYPE) */}
        {viewMode === 'mobile' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start py-2">
            {/* Phone Display in Center */}
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
                nearestZone={nearestZone}
                voiceEnabled={voiceEnabled}
                onToggleVoice={() => setVoiceEnabled(!voiceEnabled)}
                onStart={startNavigation}
                onPause={pauseNavigation}
                onResume={resumeNavigation}
                onReset={resetNavigation}
                onAcceptReroute={handleAcceptReroute}
                onDismissAlert={dismissAlert}
                onOpenReportModal={() => setIsReportModalOpen(true)}
              />
            </div>

            {/* Side Controls & Options for Mobile View */}
            <div className="lg:col-span-5 space-y-5">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                    Configuração do Trajeto Mobile
                  </h3>
                  <span className="text-xs text-emerald-400 font-mono font-semibold">
                    GPS Simulado
                  </span>
                </div>

                <RouteSelector
                  routes={routes}
                  selectedRouteId={selectedRoute.id}
                  onSelectRoute={selectRoute}
                  isNavigating={isNavigating}
                />
              </div>

              {/* Protocol info card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-900 to-red-500/10 border border-amber-500/30 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>Mapeamento de Áreas Críticas em São Paulo</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Ao aproximar-se de cruzamentos vulneráveis (como Santa Ifigênia ou Praça da Sé), a notificação surge na tela com as instruções da Defesa Civil: <strong>vidros 100% fechados</strong> e opção de desvio rápido.
                </p>
                <button
                  onClick={() => setIsTipsDrawerOpen(true)}
                  className="text-amber-400 hover:text-amber-300 font-bold underline transition-colors"
                >
                  Consultar protocolos de segurança urbana &rarr;
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* VIEW MODE 2: DESKTOP COMMAND CENTER DASHBOARD */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Map & Cockpit (8 cols) */}
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

              {/* Controls */}
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

            {/* Right: Routes (4 cols) */}
            <div className="lg:col-span-4 space-y-5">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <RouteSelector
                  routes={routes}
                  selectedRouteId={selectedRoute.id}
                  onSelectRoute={selectRoute}
                  isNavigating={isNavigating}
                />
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-900 to-red-500/10 border border-amber-500/30 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Protocolo de Autoproteção Defesa Civil</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Sistema sincronizado com as diretrizes preventivas do Centro de Gerenciamento de Emergências e Secretaria de Segurança Pública de São Paulo.
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
        )}

        {/* CitizenTech Community Incidents Feed (CRUD) */}
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
