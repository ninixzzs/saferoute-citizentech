import React, { useState } from 'react';
import {
  Radar,
  LocateFixed,
  Car,
  Bike,
  Footprints,
  ArrowRight,
  Check,
  X,
  ShieldCheck,
} from 'lucide-react';

export type TravelMode = 'carro' | 'moto' | 'a_pe';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMode: TravelMode;
  onSelectMode: (mode: TravelMode) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  selectedMode,
  onSelectMode,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [gpsRequested, setGpsRequested] = useState(false);

  if (!isOpen) return null;

  const handleRequestGps = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => setGpsRequested(true),
        () => setGpsRequested(true)
      );
    } else {
      setGpsRequested(true);
    }
  };

  const handleFinish = () => {
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Bem-vindo ao SafeRoute - Primeiros Passos"
      className="fixed inset-0 z-[2200] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md rounded-3xl bg-neutral-950 text-white border-2 border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-white text-black flex items-center justify-center font-bold text-xs shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold font-display uppercase tracking-wider text-neutral-300">
                SafeRoute &bull; Onboarding
              </span>
              <p className="text-[10px] font-mono text-neutral-500">
                Passo {step} de 3
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            title="Fechar introdução"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 flex-1 min-h-[300px] flex flex-col justify-between">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto text-white shadow-inner">
                <Radar className="w-8 h-8 animate-pulse" />
              </div>
              <div className="text-center space-y-1.5">
                <h3 className="font-display text-lg font-extrabold tracking-tight text-white">
                  1. Radar Preventivo em Tempo Real
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed max-w-sm mx-auto">
                  O SafeRoute analisa áreas de risco em São Paulo e calcula rotas que evitam cruzamentos perigosos e pontos críticos antes que você chegue até eles.
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-center">
                <span className="text-[11px] font-mono text-neutral-400">
                  Slogan oficial: &ldquo;Vá com segurança. Vá de SafeRoute.&rdquo;
                </span>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto text-white shadow-inner">
                <LocateFixed className="w-8 h-8" />
              </div>
              <div className="text-center space-y-1.5">
                <h3 className="font-display text-lg font-extrabold tracking-tight text-white">
                  2. Localização Precisa &amp; Geofence
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed max-w-sm mx-auto">
                  Para emitir alertas sonoros no momento exato e sugerir desvios automáticos sem delay durante a viagem, ative o GPS com alta precisão.
                </p>
              </div>
              <button
                type="button"
                onClick={handleRequestGps}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  gpsRequested
                    ? 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                    : 'bg-white text-black hover:bg-neutral-200 shadow-md active:scale-98'
                }`}
              >
                {gpsRequested ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Permissão Solicitada</span>
                  </>
                ) : (
                  <>
                    <LocateFixed className="w-4 h-4" />
                    <span>Conceder Acesso ao GPS</span>
                  </>
                )}
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center space-y-1">
                <h3 className="font-display text-lg font-extrabold tracking-tight text-white">
                  3. Como você vai se deslocar?
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Personalize os alertas e o cálculo de rotas para o seu modo de transporte.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => onSelectMode('carro')}
                  className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all ${
                    selectedMode === 'carro'
                      ? 'bg-white text-black border-white shadow-lg scale-102 font-bold'
                      : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700 font-semibold'
                  }`}
                >
                  <Car className="w-6 h-6" />
                  <span className="text-xs">Carro</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectMode('moto')}
                  className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all ${
                    selectedMode === 'moto'
                      ? 'bg-white text-black border-white shadow-lg scale-102 font-bold'
                      : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700 font-semibold'
                  }`}
                >
                  <Bike className="w-6 h-6" />
                  <span className="text-xs">Moto</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectMode('a_pe')}
                  className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all ${
                    selectedMode === 'a_pe'
                      ? 'bg-white text-black border-white shadow-lg scale-102 font-bold'
                      : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700 font-semibold'
                  }`}
                >
                  <Footprints className="w-6 h-6" />
                  <span className="text-xs">A pé</span>
                </button>
              </div>
            </div>
          )}

          {/* Stepper Dots & Action Buttons */}
          <div className="pt-4 border-t border-neutral-800/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full transition-all ${
                  step === 1 ? 'w-6 bg-white' : 'bg-neutral-700'
                }`}
              />
              <span
                className={`w-2 h-2 rounded-full transition-all ${
                  step === 2 ? 'w-6 bg-white' : 'bg-neutral-700'
                }`}
              />
              <span
                className={`w-2 h-2 rounded-full transition-all ${
                  step === 3 ? 'w-6 bg-white' : 'bg-neutral-700'
                }`}
              />
            </div>

            <div className="flex items-center gap-2">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => (s - 1) as 1 | 2)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white"
                >
                  Voltar
                </button>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => (s + 1) as 2 | 3)}
                  className="px-4 py-2 rounded-xl bg-white text-black hover:bg-neutral-200 text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <span>Próximo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinish}
                  className="px-4 py-2 rounded-xl bg-white text-black hover:bg-neutral-200 text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <span>Começar</span>
                  <Check className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
