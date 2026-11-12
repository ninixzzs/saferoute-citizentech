import React, { useState } from 'react';
import {
  ShieldAlert,
  Volume2,
  Route,
  Activity,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  BellRing,
  Play,
  CheckCircle2,
  ArrowRight,
  Navigation,
} from 'lucide-react';

interface EarlyAlertShowcaseProps {
  onTriggerDemoAlert?: () => void;
  voiceEnabled?: boolean;
}

export const EarlyAlertShowcase: React.FC<EarlyAlertShowcaseProps> = ({
  onTriggerDemoAlert,
  voiceEnabled = true,
}) => {
  const [isAlertActive, setIsAlertActive] = useState(true);
  const [activeTab, setActiveTab] = useState<'preventivo' | 'desvio'>('preventivo');

  const handleTestNotification = () => {
    setIsAlertActive(false);
    setTimeout(() => {
      setIsAlertActive(true);
      if (onTriggerDemoAlert) onTriggerDemoAlert();
    }, 150);
  };

  return (
    <section
      aria-label="Como funciona o sistema de alertas do SafeRoute"
      className="scroll-reveal rounded-[32px] sm:rounded-[40px] bg-[#050505] text-white border border-neutral-800/90 shadow-[0_20px_60px_rgba(0,0,0,0.8)] p-6 sm:p-10 lg:p-14 overflow-hidden relative select-none"
    >
      {/* Background Architectural Dot Grid & Ambient Aura */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.25) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-white/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Header Section (Centered Title & Description like reference image) */}
      <div className="relative z-10 max-w-3xl mx-auto text-center space-y-3.5 mb-10 sm:mb-14">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/15 text-[10px] font-mono font-bold tracking-widest uppercase text-neutral-300 scroll-reveal-badge">
          <BellRing className="w-3 h-3 text-white" />
          <span>SISTEMA DE ALERTA ANTECIPADO</span>
        </div>

        <h2 className="font-hero-alt text-2xl sm:text-4xl lg:text-[2.75rem] font-black tracking-tight text-white leading-[1.12] scroll-reveal-title reveal-delay-1">
          Alertas que avisam antes de você chegar ao perigo.
        </h2>

        <p className="text-xs sm:text-sm text-neutral-400 max-w-xl mx-auto leading-relaxed scroll-reveal-text reveal-delay-2">
          O SafeRoute monitora o trajeto em segundo plano por geofencing. Se um perímetro crítico surgir no seu caminho em São Paulo, você recebe o alerta no celular a tempo de desviar sem pânico.
        </p>
      </div>

      {/* 3-Column Grid: Left Features (2), Center Phone Mockup, Right Features (2) */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center max-w-6xl mx-auto">
        {/* LEFT COLUMN: 2 Features (lg:col-span-3) */}
        <div className="lg:col-span-3 space-y-8 sm:space-y-10 order-2 lg:order-1">
          {/* Feature 1: Geofencing */}
          <div className="space-y-2.5 text-left scroll-reveal-scale reveal-delay-1 group">
            <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-white/15 flex items-center justify-center text-white shadow-md group-hover:scale-105 group-hover:border-white/40 transition-all">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-hero-alt text-base font-bold text-white tracking-tight">
                Geofencing Perimétrico
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed mt-1">
                Detecta polígonos críticos com centenas de metros de antecedência antes de seu veículo cruzar a zona de risco.
              </p>
            </div>
          </div>

          {/* Feature 2: Voz Calmante */}
          <div className="space-y-2.5 text-left scroll-reveal-scale reveal-delay-2 group">
            <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-white/15 flex items-center justify-center text-white shadow-md group-hover:scale-105 group-hover:border-white/40 transition-all">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-hero-alt text-base font-bold text-white tracking-tight">
                Voz Sem Pânico
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed mt-1">
                Instrução falada acolhedora com síntese neural de baixa latência, orientando condutor e passageiros com calma e clareza.
              </p>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: Authentic Smartphone Mockup with Alert Notification (lg:col-span-6) */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center order-1 lg:order-2">
          {/* Smartphone Hardware Chassis */}
          <div className="relative w-full max-w-[310px] sm:max-w-[325px] rounded-[48px] p-2.5 bg-gradient-to-b from-neutral-700 via-neutral-900 to-neutral-950 border border-neutral-600/70 shadow-[0_25px_80px_rgba(0,0,0,0.95)] ring-1 ring-white/15">
            {/* Screen Bezel */}
            <div className="relative rounded-[40px] overflow-hidden bg-[#09090b] border border-neutral-800 shadow-inner flex flex-col justify-between h-[540px] p-4 text-white">
              {/* Top Status Bar & Dynamic Island */}
              <div className="flex items-center justify-between text-[11px] font-mono text-neutral-300 pt-1">
                <span>09:41</span>
                {/* Dynamic Island */}
                <div className="w-24 h-5 rounded-full bg-black border border-neutral-800 flex items-center justify-center gap-1.5 px-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span className="text-[9px] font-bold tracking-tight text-neutral-300">Alerta SP</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span>5G</span>
                  <div className="w-4 h-2 rounded-2xs border border-white/60 p-0.5 flex items-center">
                    <div className="w-2 h-full bg-white rounded-3xs" />
                  </div>
                </div>
              </div>

              {/* Central Alert Display (Like the crypto wallet screen in reference image) */}
              <div className="space-y-4 my-auto py-2">
                {/* Mode Selector Pill inside Phone */}
                <div className="flex items-center justify-center gap-1 p-1 rounded-full bg-neutral-900 border border-neutral-800 w-fit mx-auto text-[10px] font-mono">
                  <button
                    type="button"
                    onClick={() => setActiveTab('preventivo')}
                    className={`px-3 py-1 rounded-full transition-all ${
                      activeTab === 'preventivo' ? 'bg-white text-black font-bold' : 'text-neutral-400'
                    }`}
                  >
                    Alerta Ativo
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('desvio')}
                    className={`px-3 py-1 rounded-full transition-all ${
                      activeTab === 'desvio' ? 'bg-white text-black font-bold' : 'text-neutral-400'
                    }`}
                  >
                    Desvio Seguro
                  </button>
                </div>

                {/* Big Metric Display (like $48,296.24 in reference image) */}
                <div className="text-center space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-[10px] font-mono text-neutral-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    <span>Perímetro Detectado</span>
                  </div>
                  <div className="text-3xl font-black font-mono tracking-tight text-white pt-1">
                    250m de risco
                  </div>
                  <div className="text-[11px] font-mono text-neutral-400">
                    Tempo de reação estimado: 45 segundos
                  </div>
                </div>

                {/* Simulated Notification Banner on Phone Screen */}
                {isAlertActive && (
                  <div className="p-3.5 rounded-2xl bg-neutral-900/95 border border-white/20 shadow-2xl space-y-2 animate-in slide-in-from-top-3 duration-300 text-left">
                    <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                      <span className="flex items-center gap-1 font-bold text-white">
                        <ShieldAlert className="w-3.5 h-3.5 text-white" />
                        Alerta SafeRoute
                      </span>
                      <span>agora</span>
                    </div>

                    <p className="text-xs font-bold text-white leading-snug">
                      {activeTab === 'preventivo'
                        ? 'Atenção: Área com registro de incidentes à frente no Brás.'
                        : 'Desvio SafeRoute ativo: contornando via Av. Rebouças.'}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-neutral-800 text-[10px] font-mono">
                      <span className="text-neutral-400">Sugestão: Desvio Seguro</span>
                      <span className="font-bold text-white">+2 min &bull; 94/100</span>
                    </div>
                  </div>
                )}

                {/* Mini Route Preview Card */}
                <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-white text-black flex items-center justify-center">
                      <Navigation className="w-4 h-4 fill-current rotate-45" />
                    </div>
                    <div>
                      <div className="font-bold text-[11px]">Av. Paulista</div>
                      <div className="text-[10px] text-neutral-400">Desvio 100% monitorado</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-neutral-300">21 min</span>
                </div>
              </div>

              {/* Bottom CTA Button inside Phone (Like "Download app" in reference image) */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleTestNotification}
                  className="w-full py-2.5 px-4 rounded-full bg-white hover:bg-neutral-200 text-black text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Simular Notificação no Aparelho</span>
                </button>
                {/* Home Indicator */}
                <div className="w-24 h-1 rounded-full bg-neutral-700 mx-auto mt-3" />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: 2 Features (lg:col-span-3) */}
        <div className="lg:col-span-3 space-y-8 sm:space-y-10 order-3">
          {/* Feature 3: Sugestão Imediata de Desvio */}
          <div className="space-y-2.5 text-left scroll-reveal-scale reveal-delay-1 group">
            <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-white/15 flex items-center justify-center text-white shadow-md group-hover:scale-105 group-hover:border-white/40 transition-all">
              <Route className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-hero-alt text-base font-bold text-white tracking-tight">
                Sugestão Imediata
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed mt-1">
                Recalcula em milissegundos uma rota alternativa protegida sem acrescentar atrasos significativos ao seu trajeto.
              </p>
            </div>
          </div>

          {/* Feature 4: Dados Oficiais SP */}
          <div className="space-y-2.5 text-left scroll-reveal-scale reveal-delay-2 group">
            <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-white/15 flex items-center justify-center text-white shadow-md group-hover:scale-105 group-hover:border-white/40 transition-all">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-hero-alt text-base font-bold text-white tracking-tight">
                Dados Oficiais SP 24h
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed mt-1">
                Integração direta com ocorrências da Defesa Civil, SSP-SP e validações comunitárias georreferenciadas na capital.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
