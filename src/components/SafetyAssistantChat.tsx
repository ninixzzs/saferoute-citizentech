import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  MessageSquare,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Check,
  ExternalLink,
  Compass,
  Zap,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  MapPin,
  X,
  AudioLines,
  Navigation,
} from 'lucide-react';
import { DangerZone, IncidentReport, NavigationRoute } from '../types';
import { SaoPauloZone } from '../data/saoPauloLocations';
import { LocationSuggestion } from '../services/routingService';
import {
  buildPreTripSmsMessage,
  generateSafetyAssistantReply,
  AssistantReply,
  NearbyPlaceResult,
} from '../services/safetyAssistant';
import {
  speakNaturalPortuguese,
  stopPortugueseSpeech,
  pickWarmFemalePortugueseVoice,
} from '../services/voiceEngine';

interface SafetyAssistantChatProps {
  originLocation: LocationSuggestion;
  destinationLocation: LocationSuggestion;
  selectedRoute: NavigationRoute;
  allRoutes: NavigationRoute[];
  dangerZones: DangerZone[];
  incidents: IncidentReport[];
  onSwitchToSafeRoute: () => void;
  onSelectCustomDestination?: (destinationName: string) => void;
  focusInputTrigger?: number;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  toneLabel?: AssistantReply['toneLabel'];
  tips?: string[];
  nearbyPlaces?: NearbyPlaceResult[];
  suggestSafeRouteSwitch?: boolean;
  askFirstTimePlace?: string;
  suggestedDestination?: string;
}

const SP_REGIONS: { label: string; zone: SaoPauloZone; prompt: string }[] = [
  { label: 'Centro', zone: 'Centro', prompt: 'Como está a segurança no Centro de SP?' },
  { label: 'Zona Sul', zone: 'Zona Sul', prompt: 'Como está a Zona Sul agora?' },
  { label: 'Zona Oeste', zone: 'Zona Oeste', prompt: 'Como está a Zona Oeste de São Paulo?' },
  { label: 'Zona Leste', zone: 'Zona Leste', prompt: 'Como está a Zona Leste agora?' },
  { label: 'Zona Norte', zone: 'Zona Norte', prompt: 'Como está a Zona Norte de SP?' },
  { label: 'Marginais', zone: 'Marginais e Pontes', prompt: 'Como estão as Marginais e Pontes?' },
];

export const SafetyAssistantChat: React.FC<SafetyAssistantChatProps> = ({
  originLocation,
  destinationLocation,
  selectedRoute,
  allRoutes,
  dangerZones,
  incidents,
  onSwitchToSafeRoute,
  onSelectCustomDestination,
  focusInputTrigger = 0,
}) => {
  const [phoneInput, setPhoneInput] = useState('');
  const [smsSentNotice, setSmsSentNotice] = useState(false);
  const [inputText, setInputText] = useState('');
  const [activeRegion, setActiveRegion] = useState<SaoPauloZone | null>(null);
  const [lastTargetPlace, setLastTargetPlace] = useState<string>(destinationLocation.name);
  const [aiVoiceEnabled, setAiVoiceEnabled] = useState(true);

  // Live Floating Voice Orb Mode (Siri / ChatGPT / Gemini style)
  const [isVoiceOrbOpen, setIsVoiceOrbOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [micErrorNotice, setMicErrorNotice] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const initial = generateSafetyAssistantReply(
      `Como está o trajeto para ${destinationLocation.name}?`,
      {
        origin: originLocation,
        destination: destinationLocation,
        selectedRoute,
        allRoutes,
        dangerZones,
        incidents,
      }
    );
    return [
      {
        id: 'welcome-msg',
        sender: 'assistant',
        toneLabel: initial.toneLabel,
        text: `Olá! Que bom falar com você. Antes de iniciar sua rota até ${destinationLocation.name}, posso te orientar com calma sobre o caminho e lugares conhecidos por perto. É a sua primeira vez indo até lá?`,
        tips: [
          'Toque em "Modo Voz (Orbe)" ou no microfone para conversar comigo por voz em ritmo calmo e natural.',
        ],
        nearbyPlaces: initial.nearbyPlaces,
        suggestSafeRouteSwitch: initial.suggestSafeRouteSwitch,
        askFirstTimePlace: destinationLocation.name,
      },
    ];
  });

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const speechRecognitionSupported =
    typeof window !== 'undefined' &&
    Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const preTripSms = useMemo(
    () =>
      buildPreTripSmsMessage({
        origin: originLocation,
        destination: destinationLocation,
        selectedRoute,
        allRoutes,
        dangerZones,
        incidents,
      }),
    [originLocation, destinationLocation, selectedRoute, allRoutes, dangerZones, incidents]
  );

  // Warm voice cache early
  useEffect(() => {
    pickWarmFemalePortugueseVoice();
  }, []);

  // Sync assistant focus live whenever destinationLocation changes
  useEffect(() => {
    setLastTargetPlace(destinationLocation.name);
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'welcome-msg') {
        const refreshed = generateSafetyAssistantReply(
          `Como está o trajeto para ${destinationLocation.name}?`,
          {
            origin: originLocation,
            destination: destinationLocation,
            selectedRoute,
            allRoutes,
            dangerZones,
            incidents,
          }
        );
        return [
          {
            ...prev[0],
            toneLabel: refreshed.toneLabel,
            text: `Olá! Que bom falar com você. Antes de iniciar sua rota até ${destinationLocation.name}, posso te orientar com calma sobre o caminho e lugares conhecidos por perto. É a sua primeira vez indo até lá?`,
            nearbyPlaces: refreshed.nearbyPlaces,
            suggestSafeRouteSwitch: refreshed.suggestSafeRouteSwitch,
            askFirstTimePlace: destinationLocation.name,
          },
        ];
      }
      return prev;
    });
  }, [destinationLocation.name, originLocation.name, selectedRoute.id]);

  // Scoped internal chat scroll
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  useEffect(() => {
    if (focusInputTrigger > 0) {
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [focusInputTrigger]);

  // Body scroll lock & Escape handler while Voice Orb is open
  useEffect(() => {
    if (!isVoiceOrbOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCloseVoiceOrb();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isVoiceOrbOpen]);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {}
      stopPortugueseSpeech();
    };
  }, []);

  const speakCalmReply = (text: string) => {
    speakNaturalPortuguese(text, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const askAssistant = (
    question: string,
    options?: { regionTag?: SaoPauloZone; speakResponse?: boolean }
  ) => {
    const clean = question.trim();
    if (!clean) return;

    if (options?.regionTag) {
      setActiveRegion(options.regionTag);
    }

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sender: 'user',
      text: clean,
    };

    const reply = generateSafetyAssistantReply(
      clean,
      {
        origin: originLocation,
        destination: destinationLocation,
        selectedRoute,
        allRoutes,
        dangerZones,
        incidents,
      },
      lastTargetPlace
    );

    if (reply.askFirstTimePlace) {
      setLastTargetPlace(reply.askFirstTimePlace);
    }

    const botMsg: ChatMessage = {
      id: `${reply.id}-${Math.random().toString(36).slice(2, 6)}`,
      sender: 'assistant',
      toneLabel: reply.toneLabel,
      text: reply.text,
      tips: reply.tips,
      nearbyPlaces: reply.nearbyPlaces,
      suggestSafeRouteSwitch: reply.suggestSafeRouteSwitch,
      askFirstTimePlace: reply.askFirstTimePlace,
      suggestedDestination: reply.suggestedDestination,
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInputText('');

    if (options?.speakResponse || aiVoiceEnabled || isVoiceOrbOpen) {
      speakCalmReply(reply.text);
    }
  };

  const startVoiceCapture = () => {
    setMicErrorNotice(null);
    stopPortugueseSpeech();
    setIsSpeaking(false);

    if (!speechRecognitionSupported) {
      setMicErrorNotice(
        'Seu navegador não suporta microfone nativo, mas você pode tocar nas perguntas rápidas abaixo para conversar por voz comigo.'
      );
      return;
    }

    try {
      const SpeechRec =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRec();
      recognition.lang = 'pt-BR';
      recognition.interimResults = true;
      recognition.continuous = false;

      let latestFinalTranscript = '';
      let latestInterimTranscript = '';
      let alreadySubmitted = false;

      recognition.onstart = () => {
        setIsListening(true);
        setLiveTranscript('');
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0]?.transcript || '';
          if (event.results[i].isFinal) {
            latestFinalTranscript += transcript;
          } else {
            interim += transcript;
          }
        }
        latestInterimTranscript = interim.trim();
        const currentText = (latestFinalTranscript || interim).trim();
        if (currentText) {
          setLiveTranscript(currentText);
          setInputText(currentText);
        }
        if (latestFinalTranscript.trim() && !alreadySubmitted) {
          alreadySubmitted = true;
          const finalPrompt = latestFinalTranscript.trim();
          latestFinalTranscript = '';
          try {
            recognition.stop();
          } catch {}
          setIsListening(false);
          askAssistant(finalPrompt, { speakResponse: true });
        }
      };

      // Fast commit when speaker finishes talking without waiting long trailing silence
      recognition.onspeechend = () => {
        const fastText = (latestFinalTranscript || latestInterimTranscript).trim();
        if (fastText && !alreadySubmitted) {
          alreadySubmitted = true;
          try {
            recognition.stop();
          } catch {}
          setIsListening(false);
          askAssistant(fastText, { speakResponse: true });
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
        setMicErrorNotice('Não consegui captar sua voz agora. Tente tocar no orbe novamente ou escolha uma pergunta abaixo.');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
      setMicErrorNotice('Não foi possível acessar o microfone neste navegador.');
    }
  };

  const stopVoiceCapture = () => {
    try {
      recognitionRef.current?.stop();
    } catch {}
    setIsListening(false);
  };

  const handleOpenVoiceOrb = (autoListen = true) => {
    setIsVoiceOrbOpen(true);
    setLiveTranscript('');
    setMicErrorNotice(null);
    if (autoListen && speechRecognitionSupported) {
      setTimeout(() => startVoiceCapture(), 150);
    }
  };

  const handleCloseVoiceOrb = () => {
    stopVoiceCapture();
    stopPortugueseSpeech();
    setIsSpeaking(false);
    setIsVoiceOrbOpen(false);
  };

  const handleOrbTap = () => {
    if (isSpeaking) {
      stopPortugueseSpeech();
      setIsSpeaking(false);
      if (speechRecognitionSupported) {
        setTimeout(() => startVoiceCapture(), 120);
      }
      return;
    }
    if (isListening) {
      stopVoiceCapture();
    } else {
      startVoiceCapture();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    askAssistant(inputText);
  };

  const handleSimulateSms = () => {
    setSmsSentNotice(true);
    setTimeout(() => setSmsSentNotice(false), 4500);
  };

  const smsHref = `sms:${phoneInput.replace(/[^\d+]/g, '')}?body=${encodeURIComponent(
    preTripSms.smsText
  )}`;

  const quickQuestions = [
    'Lugares conhecidos por perto?',
    `É tranquilo ir para ${destinationLocation.name}?`,
    'Como está o Capão Redondo?',
    'Comparar rota segura vs rápida',
    'Chuva e alagamentos em SP',
    'Ver texto do SMS',
  ];

  const latestAssistantMsg = [...messages].reverse().find((m) => m.sender === 'assistant');

  return (
    <div className="space-y-4">
      {/* 1. Prominent Executive AI Spotlight Banner & Voice Chat Console */}
      <div className="rounded-3xl bg-white dark:bg-neutral-950 border-2 border-neutral-950 dark:border-white/25 shadow-[0_14px_36px_rgba(0,0,0,0.12)] overflow-hidden flex flex-col">
        {/* Inverted Monochrome Spotlight Header */}
        <div className="p-4 bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white dark:bg-neutral-950 text-neutral-950 dark:text-white flex items-center justify-center shrink-0 shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display text-base font-extrabold tracking-tight leading-tight">
                  Assistente IA SafeRoute
                </h3>
                <p className="text-[11px] opacity-80 flex items-center gap-1">
                  <Zap className="w-3 h-3 shrink-0" />
                  <span>Voz feminina calma &bull; Todas as regiões de SP</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Siri / ChatGPT / Gemini Live Orb Mode Trigger */}
              <button
                type="button"
                onClick={() => handleOpenVoiceOrb(true)}
                className="px-3 py-1.5 rounded-full bg-white dark:bg-neutral-950 text-neutral-950 dark:text-white text-[11px] font-bold flex items-center gap-1.5 shadow-sm hover:opacity-90 active:scale-95 transition-all"
                title="Abrir modo conversa por voz com orbe flutuante"
              >
                <AudioLines className="w-3.5 h-3.5" />
                <span>Orbe de Voz</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const next = !aiVoiceEnabled;
                  setAiVoiceEnabled(next);
                  if (!next) {
                    stopPortugueseSpeech();
                    setIsSpeaking(false);
                  }
                }}
                className="p-1.5 rounded-full bg-white/15 dark:bg-neutral-950/10 border border-white/25 dark:border-neutral-950/20 transition-colors hover:bg-white/25"
                title={aiVoiceEnabled ? 'Voz da IA ativada' : 'Voz da IA silenciada'}
                aria-label={aiVoiceEnabled ? 'Silenciar voz da IA' : 'Ativar voz da IA'}
              >
                {aiVoiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* All Regions of São Paulo 1-Tap Explorer */}
          <div className="pt-1 space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider opacity-75 flex items-center gap-1">
              <Compass className="w-3 h-3" />
              <span>Consultar regiões de São Paulo em 1 toque:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SP_REGIONS.map((reg) => {
                const isActive = activeRegion === reg.zone;
                return (
                  <button
                    key={reg.zone}
                    type="button"
                    onClick={() => askAssistant(reg.prompt, { regionTag: reg.zone })}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all active:scale-95 ${
                      isActive
                        ? 'bg-white dark:bg-neutral-950 text-neutral-950 dark:text-white border-white dark:border-neutral-950 shadow-xs'
                        : 'bg-white/10 dark:bg-neutral-950/5 text-white dark:text-neutral-950 border-white/20 dark:border-neutral-950/20 hover:bg-white/20 dark:hover:bg-neutral-950/15'
                    }`}
                  >
                    {reg.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Instant Zero-Delay Conversation Thread */}
        <div
          ref={chatScrollRef}
          className="p-3.5 space-y-3 max-h-[22rem] overflow-y-auto bg-neutral-50/70 dark:bg-neutral-900/50"
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[95%] rounded-2xl p-3.5 space-y-2.5 ${
                  msg.sender === 'user'
                    ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 rounded-tr-sm shadow-sm'
                    : 'bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-800 rounded-tl-sm shadow-xs'
                }`}
              >
                {msg.sender === 'assistant' && msg.toneLabel && (
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Companhia SafeRoute</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => speakCalmReply(msg.text)}
                        className="p-1 rounded-lg bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white"
                        title="Ouvir esta mensagem com voz suave"
                        aria-label="Ouvir mensagem em voz alta"
                      >
                        <Volume2 className="w-3 h-3" />
                      </button>
                      <span className="px-2 py-0.5 rounded bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-[10px] font-bold">
                        {msg.toneLabel}
                      </span>
                    </div>
                  </div>
                )}

                <p className="text-xs sm:text-sm leading-relaxed">{msg.text}</p>

                {/* Interactive "First Time Going There?" Quick Replies */}
                {msg.sender === 'assistant' && msg.askFirstTimePlace && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={() =>
                        askAssistant(`Sim, é minha primeira vez indo para ${msg.askFirstTimePlace}`)
                      }
                      className="px-3 py-1.5 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-[11px] font-bold hover:opacity-90 transition-opacity"
                    >
                      Sim, é minha primeira vez
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        askAssistant(`Não, já conheço a região de ${msg.askFirstTimePlace}`)
                      }
                      className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 text-[11px] font-semibold hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                    >
                      Já conheço o local
                    </button>
                  </div>
                )}

                {/* Nearby Reference Places Around Destination */}
                {msg.nearbyPlaces && msg.nearbyPlaces.length > 0 && (
                  <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/80 space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>Lugares conhecidos por perto:</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {msg.nearbyPlaces.map((place) => (
                        <div
                          key={place.name}
                          className="p-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="text-[11px] font-semibold text-neutral-950 dark:text-white truncate">
                              {place.name}
                            </div>
                            <div className="text-[10px] text-neutral-500">{place.category}</div>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-neutral-700 dark:text-neutral-300 shrink-0">
                            {place.distanceLabel}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {msg.tips && msg.tips.length > 0 && (
                  <ul className="space-y-1.5 pt-1.5 border-t border-neutral-100 dark:border-neutral-800/80 text-xs text-neutral-700 dark:text-neutral-300">
                    {msg.tips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="font-bold text-neutral-400">&bull;</span>
                        <span className="leading-relaxed">{tip}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {msg.suggestedDestination && onSelectCustomDestination && (
                  <button
                    type="button"
                    onClick={() => onSelectCustomDestination(msg.suggestedDestination!)}
                    className="w-full mt-1 py-2.5 px-3 rounded-xl border border-neutral-950 dark:border-white bg-neutral-100 dark:bg-neutral-900 text-neutral-950 dark:text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Traçar rota para {msg.suggestedDestination}</span>
                  </button>
                )}

                {msg.suggestSafeRouteSwitch && selectedRoute.type !== 'segura' && (
                  <button
                    type="button"
                    onClick={onSwitchToSafeRoute}
                    className="w-full mt-1 py-2.5 px-3 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-xs font-bold flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Aplicar Desvio Seguro Agora</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Quick 1-Tap Prompt Chips */}
        <div className="px-3.5 py-2 border-t border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex items-center gap-1.5 overflow-x-auto">
          {quickQuestions.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => askAssistant(q)}
              className="px-2.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-900 dark:hover:border-white text-[11px] font-semibold text-neutral-900 dark:text-neutral-100 whitespace-nowrap shrink-0 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* High-Visibility Voice Orb + Text Composer */}
        <form
          onSubmit={handleSubmit}
          className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/80 flex items-center gap-2"
        >
          <button
            type="button"
            onClick={() => handleOpenVoiceOrb(true)}
            aria-label="Abrir Orbe de Voz para conversar falando"
            title="Conversar com o Orbe Flutuante da IA"
            className="p-2.5 rounded-xl border bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 border-neutral-950 dark:border-white font-bold text-xs flex items-center justify-center shrink-0 hover:opacity-90 active:scale-95 transition-all shadow-xs"
          >
            <Mic className="w-4 h-4" />
          </button>

          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Digite ou toque no microfone para o Modo Voz..."
            aria-label="Perguntar ao assistente preventivo"
            className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-xs text-neutral-950 dark:text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-950 dark:focus:border-white"
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="px-4 py-2.5 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 disabled:opacity-40 transition-opacity font-bold text-xs flex items-center gap-1.5 shrink-0"
            aria-label="Enviar pergunta para a IA"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Perguntar</span>
          </button>
        </form>
      </div>

      {/* 2. Calm Pre-Trip SMS Card (Synced Live before Route Starts) */}
      <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-neutral-950 dark:text-white shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-950 dark:text-white">
              SMS Pré-Viagem &middot; Antes de Iniciar
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-[10px] font-bold uppercase tracking-tight">
            {preTripSms.toneLabel}
          </span>
        </div>

        <div className="p-3 rounded-2xl rounded-tl-sm bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500">
            <span>Remetente: SafeRoute · 40199</span>
            <span>Orientação tranquila</span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed">
            {preTripSms.smsText}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="tel"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            placeholder="Seu celular opcional (ex: 11 99999-9999)"
            aria-label="Número de celular opcional para prévia de SMS"
            className="flex-1 min-w-[160px] px-3 py-2 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-400"
          />

          <button
            type="button"
            onClick={handleSimulateSms}
            className="px-3 py-2 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-xs font-bold flex items-center gap-1.5 hover:opacity-90 transition-opacity"
          >
            {smsSentNotice ? <Check className="w-3.5 h-3.5" /> : <MessageSquare className="w-3.5 h-3.5" />}
            <span>{smsSentNotice ? 'SMS Simulado!' : 'Testar SMS'}</span>
          </button>

          <a
            href={smsHref}
            className="px-3 py-2 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
            title="Abrir texto pronto no aplicativo de SMS do celular"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Abrir no SMS</span>
          </a>
        </div>

        {smsSentNotice && (
          <div className="text-[11px] font-medium text-neutral-800 dark:text-neutral-200 bg-neutral-200/70 dark:bg-neutral-800 px-3 py-1.5 rounded-xl">
            Prévia enviada{phoneInput.trim() ? ` para ${phoneInput}` : ' no painel'} com tom informativo e sem alarmismo.
          </div>
        )}
      </div>

      {/* =====================================================================
          LIVE VOICE ORB OVERLAY (Siri / ChatGPT / Gemini Monochrome Style)
         ===================================================================== */}
      {isVoiceOrbOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Conversa por voz com a Assistente SafeRoute"
            className="fixed inset-0 z-[2100] bg-neutral-950/98 backdrop-blur-2xl text-white flex flex-col justify-between p-5 sm:p-8 select-none animate-in fade-in duration-200"
          >
            {/* Top Header */}
            <div className="flex items-center justify-between gap-3 max-w-2xl w-full mx-auto">
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isListening
                      ? 'bg-white animate-ping'
                      : isSpeaking
                        ? 'bg-white animate-pulse'
                        : 'bg-neutral-500'
                  }`}
                />
                <div>
                  <span className="font-display text-sm font-bold tracking-tight block leading-none">
                    SafeRoute &middot; Modo Voz
                  </span>
                  <span className="text-[11px] text-neutral-400 font-mono mt-0.5 block">
                    {isListening
                      ? 'Ouvindo você...'
                      : isSpeaking
                        ? 'Falando com você...'
                        : 'Toque no orbe para falar'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseVoiceOrb}
                className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-colors"
                aria-label="Fechar modo voz e voltar para o chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Centerpiece Animated Monochrome Floating Orb */}
            <div className="flex-1 flex flex-col items-center justify-center gap-7 max-w-xl w-full mx-auto text-center my-4">
              <div className="relative flex items-center justify-center">
                {/* Ambient outer halo rings */}
                {isListening && (
                  <>
                    <span className="absolute w-64 h-64 rounded-full border border-white/25 animate-ping" />
                    <span className="absolute w-52 h-52 rounded-full border border-white/35 animate-pulse" />
                  </>
                )}
                {isSpeaking && (
                  <span className="absolute w-56 h-56 rounded-full border border-white/25 animate-pulse" />
                )}

                {/* Tactile Floating Orb Button */}
                <button
                  type="button"
                  onClick={handleOrbTap}
                  aria-label={
                    isSpeaking
                      ? 'Interromper fala e ouvir novamente'
                      : isListening
                        ? 'Parar microfone'
                        : 'Tocar no orbe para falar'
                  }
                  className={`relative w-40 h-40 sm:w-48 sm:h-48 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 ${
                    isListening
                      ? 'orb-listening'
                      : isSpeaking
                        ? 'orb-speaking'
                        : 'orb-idle'
                  }`}
                  style={{
                    background:
                      'radial-gradient(circle at 32% 28%, #ffffff 0%, #d4d4d4 35%, #525252 72%, #171717 100%)',
                  }}
                >
                  {/* Inner Liquid Specular Highlight */}
                  <span
                    className="absolute top-5 left-7 w-14 h-8 rounded-full bg-white/55 blur-md pointer-events-none"
                    aria-hidden="true"
                  />

                  {/* Subtle Sound Equalizer when speaking or listening */}
                  <div className="relative z-10 flex items-center justify-center gap-1.5 h-10">
                    {isSpeaking || isListening ? (
                      [0, 1, 2, 3, 4].map((bar) => (
                        <span
                          key={bar}
                          className="w-1.5 bg-neutral-950/85 rounded-full orb-wave-bar"
                          style={{
                            height: bar % 2 === 0 ? '28px' : '18px',
                            animationDelay: `${bar * 120}ms`,
                          }}
                        />
                      ))
                    ) : (
                      <Mic className="w-8 h-8 text-neutral-950/85" />
                    )}
                  </div>
                </button>
              </div>

              {/* Live Voice Caption & Calming Subtitles */}
              <div className="space-y-3 px-2 max-w-lg">
                {liveTranscript ? (
                  <p className="text-base sm:text-lg font-medium text-white/95 leading-relaxed">
                    "{liveTranscript}"
                  </p>
                ) : (
                  latestAssistantMsg && (
                    <div className="space-y-2.5">
                      <p className="text-sm sm:text-base text-neutral-200 leading-relaxed max-h-36 overflow-y-auto">
                        {latestAssistantMsg.text}
                      </p>
                      {latestAssistantMsg.nearbyPlaces && latestAssistantMsg.nearbyPlaces.length > 0 && (
                        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                          {latestAssistantMsg.nearbyPlaces.slice(0, 3).map((p) => (
                            <span
                              key={p.name}
                              className="px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] text-neutral-200 flex items-center gap-1"
                            >
                              <MapPin className="w-3 h-3 shrink-0" />
                              <span>{p.name}</span>
                              <span className="font-mono text-neutral-400">({p.distanceLabel})</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                )}

                {micErrorNotice && (
                  <p className="text-xs text-neutral-300 bg-white/10 border border-white/15 rounded-xl px-3 py-2">
                    {micErrorNotice}
                  </p>
                )}
              </div>
            </div>

            {/* Bottom Quick Voice Starters + Action Controls */}
            <div className="max-w-xl w-full mx-auto space-y-4">
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {[
                  'Como está o Capão Redondo?',
                  'Lugares perto do destino',
                  'Sim, é minha primeira vez',
                  'Comparar rota segura',
                ].map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => {
                      setLiveTranscript(prompt);
                      askAssistant(prompt, { speakResponse: true });
                    }}
                    className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-medium text-neutral-200 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleOrbTap}
                  className={`px-6 py-3.5 rounded-full font-bold text-xs flex items-center gap-2 transition-all active:scale-95 ${
                    isListening
                      ? 'bg-neutral-800 text-white border border-white/25'
                      : 'bg-white text-neutral-950 shadow-xl'
                  }`}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-4 h-4" />
                      <span>Pausar microfone</span>
                    </>
                  ) : isSpeaking ? (
                    <>
                      <Mic className="w-4 h-4" />
                      <span>Interromper e falar</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" />
                      <span>Falar com a IA</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleCloseVoiceOrb}
                  className="px-4 py-3.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white transition-colors"
                >
                  Voltar ao chat
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
