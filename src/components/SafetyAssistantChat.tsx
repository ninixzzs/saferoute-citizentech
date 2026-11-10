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
  Zap,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  MapPin,
  X,
  AudioLines,
  Navigation,
  RotateCcw,
  PhoneCall,
  LocateFixed,
  Loader2,
  ShieldAlert,
  KeyRound,
} from 'lucide-react';
import { DangerZone, IncidentReport, NavigationRoute } from '../types';
import { PolicePostResult } from '../data/policePosts';
import { LocationSuggestion, reverseGeocode } from '../services/routingService';
import {
  buildPreTripSmsMessage,
  generateSmartAssistantReply,
  AssistantReply,
  NearbyPlaceResult,
  ConversationStage,
} from '../services/safetyAssistant';
import {
  initGeminiKey,
  hasGeminiKeyConfigured,
  saveUserGeminiKey,
} from '../services/geminiClient';
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
  currentPosition?: [number, number];
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
  showQuickDestinations?: boolean;
  isEmergency?: boolean;
  emergencyPolicePosts?: PolicePostResult[];
  showEmergencyGpsButton?: boolean;
  poweredByGemini?: boolean;
}

const INITIAL_GREETING_TEXT = 'Oi, tudo bem? Qual é o seu nome?';
const AI_SESSION_KEY = 'saferoute_ai_session_v1';

interface PersistedAiSession {
  stage: ConversationStage;
  userName: string;
  currentFocusPlace?: string;
  askedFirstTimeAlready: boolean;
  messages: ChatMessage[];
}

function createInitialWelcomeMessage(): ChatMessage {
  return {
    id: 'welcome-msg',
    sender: 'assistant',
    toneLabel: 'Boas-vindas',
    text: INITIAL_GREETING_TEXT,
    tips: [],
    nearbyPlaces: [],
  };
}

function loadAiSession(): PersistedAiSession {
  if (typeof window === 'undefined') {
    return {
      stage: 'ask_name',
      userName: '',
      currentFocusPlace: undefined,
      askedFirstTimeAlready: false,
      messages: [createInitialWelcomeMessage()],
    };
  }
  try {
    const raw = sessionStorage.getItem(AI_SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedAiSession;
      if (parsed && Array.isArray(parsed.messages) && parsed.messages.length > 0) {
        return parsed;
      }
    }
  } catch {}
  return {
    stage: 'ask_name',
    userName: '',
    currentFocusPlace: undefined,
    askedFirstTimeAlready: false,
    messages: [createInitialWelcomeMessage()],
  };
}

export const SafetyAssistantChat: React.FC<SafetyAssistantChatProps> = ({
  originLocation,
  destinationLocation,
  selectedRoute,
  allRoutes,
  dangerZones,
  incidents,
  currentPosition,
  onSwitchToSafeRoute,
  onSelectCustomDestination,
  focusInputTrigger = 0,
}) => {
  const [phoneInput, setPhoneInput] = useState('');
  const [smsSentNotice, setSmsSentNotice] = useState(false);
  const [inputText, setInputText] = useState('');

  const initialSession = useMemo(() => loadAiSession(), []);

  // Stateful conversational memory (survives switching tabs)
  const [stage, setStage] = useState<ConversationStage>(initialSession.stage);
  const [userName, setUserName] = useState<string>(initialSession.userName);
  const [currentFocusPlace, setCurrentFocusPlace] = useState<string | undefined>(
    initialSession.currentFocusPlace
  );
  const [askedFirstTimeAlready, setAskedFirstTimeAlready] = useState<boolean>(
    initialSession.askedFirstTimeAlready
  );
  const [awaitingEmergencyAddress, setAwaitingEmergencyAddress] = useState<boolean>(false);
  const [panelTab, setPanelTab] = useState<'chat' | 'sms'>('chat');
  const [aiVoiceEnabled, setAiVoiceEnabled] = useState(true);
  const [isThinking, setIsThinking] = useState(false);
  const [isLocatingEmergencyGps, setIsLocatingEmergencyGps] = useState(false);

  // Google Gemini Flash setup state
  const [geminiReady, setGeminiReady] = useState<boolean>(() => hasGeminiKeyConfigured());
  const [showGeminiConfig, setShowGeminiConfig] = useState(false);
  const [geminiKeyDraft, setGeminiKeyDraft] = useState('');

  // Speech-to-text dictation ("falar só escrevendo" inside composer)
  const [isDictating, setIsDictating] = useState(false);
  const dictationRef = useRef<any>(null);

  // Live Floating Voice Orb Mode (Siri / ChatGPT / Gemini style)
  const [isVoiceOrbOpen, setIsVoiceOrbOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [micErrorNotice, setMicErrorNotice] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>(initialSession.messages);

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const speechRecognitionSupported =
    typeof window !== 'undefined' &&
    Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  useEffect(() => {
    initGeminiKey().then((ready) => setGeminiReady(ready));
  }, []);

  const preTripSms = useMemo(
    () =>
      buildPreTripSmsMessage({
        destination: destinationLocation,
        selectedRoute,
        dangerZones,
        incidents,
        targetPlaceOverride: currentFocusPlace,
      }),
    [destinationLocation, selectedRoute, dangerZones, incidents, currentFocusPlace]
  );

  useEffect(() => {
    pickWarmFemalePortugueseVoice();
  }, []);

  // Persist active conversation session across tab switches
  useEffect(() => {
    try {
      const payload: PersistedAiSession = {
        stage,
        userName,
        currentFocusPlace,
        askedFirstTimeAlready,
        messages: messages.slice(-30),
      };
      sessionStorage.setItem(AI_SESSION_KEY, JSON.stringify(payload));
    } catch {}
  }, [stage, userName, currentFocusPlace, askedFirstTimeAlready, messages]);

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
      try {
        dictationRef.current?.stop();
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

  const askAssistant = async (
    question: string,
    options?: { speakResponse?: boolean; coordsOverride?: [number, number] }
  ) => {
    const clean = question.trim();
    if (!clean) return;

    if (isDictating) {
      try {
        dictationRef.current?.stop();
      } catch {}
      setIsDictating(false);
    }

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sender: 'user',
      text: clean,
    };

    const historySnapshot = [...messages, userMsg]
      .slice(-8)
      .map((m) => ({ sender: m.sender, text: m.text }));

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsThinking(true);
    setPanelTab('chat');

    try {
      const reply = await generateSmartAssistantReply(clean, {
        origin: originLocation,
        destination: destinationLocation,
        selectedRoute,
        allRoutes,
        dangerZones,
        incidents,
        stage,
        userName: userName || undefined,
        currentFocusPlace,
        askedFirstTimeAlready,
        awaitingEmergencyAddress,
        currentPosition: options?.coordsOverride || currentPosition,
        history: historySnapshot,
      });

      if (reply.detectedName) {
        setUserName(reply.detectedName);
      }
      if (reply.detectedPlace) {
        setCurrentFocusPlace(reply.detectedPlace);
      }
      if (reply.askFirstTimePlace) {
        setAskedFirstTimeAlready(true);
      }
      setAwaitingEmergencyAddress(Boolean(reply.awaitingEmergencyAddress));
      setStage(reply.nextStage);

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
        showQuickDestinations: reply.showQuickDestinations,
        isEmergency: reply.isEmergency,
        emergencyPolicePosts: reply.emergencyPolicePosts,
        showEmergencyGpsButton: reply.showEmergencyGpsButton,
        poweredByGemini: reply.poweredByGemini,
      };

      setMessages((prev) => [...prev, botMsg]);

      if (reply.isEmergency || options?.speakResponse || aiVoiceEnabled || isVoiceOrbOpen) {
        speakCalmReply(reply.text);
      }
    } finally {
      setIsThinking(false);
    }
  };

  const handleToggleDictation = () => {
    if (!speechRecognitionSupported) return;

    if (isDictating) {
      try {
        dictationRef.current?.stop();
      } catch {}
      setIsDictating(false);
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return;

    try {
      const recognition = new SpeechRec();
      recognition.lang = 'pt-BR';
      recognition.continuous = false;
      recognition.interimResults = true;

      const basePrefix = inputText.trim() ? `${inputText.trim()} ` : '';

      recognition.onstart = () => setIsDictating(true);
      recognition.onresult = (event: any) => {
        let transcriptText = '';
        for (let i = 0; i < event.results.length; i++) {
          transcriptText += event.results[i][0]?.transcript || '';
        }
        // Only write transcribed speech into the composer field without auto-sending
        if (transcriptText.trim()) {
          setInputText(`${basePrefix}${transcriptText.trim()}`);
        }
      };
      recognition.onerror = () => setIsDictating(false);
      recognition.onend = () => {
        setIsDictating(false);
        setTimeout(() => inputRef.current?.focus(), 60);
      };

      dictationRef.current = recognition;
      recognition.start();
    } catch {
      setIsDictating(false);
    }
  };

  const handleSendEmergencyGps = () => {
    if (!navigator.geolocation || isLocatingEmergencyGps) return;
    setIsLocatingEmergencyGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          const geo = await reverseGeocode(coords[0], coords[1]);
          await askAssistant(`Estou na ${geo.address}`, {
            coordsOverride: coords,
            speakResponse: true,
          });
        } catch {
          await askAssistant('Estou na região da minha rota atual', {
            coordsOverride: currentPosition || destinationLocation.coordinates,
            speakResponse: true,
          });
        } finally {
          setIsLocatingEmergencyGps(false);
        }
      },
      async () => {
        setIsLocatingEmergencyGps(false);
        await askAssistant(`Estou próximo a ${originLocation.name}`, {
          coordsOverride: currentPosition || originLocation.coordinates,
          speakResponse: true,
        });
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  const handleSaveGeminiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveUserGeminiKey(geminiKeyDraft);
    setGeminiReady(hasGeminiKeyConfigured());
    setGeminiKeyDraft('');
    setShowGeminiConfig(false);
  };

  const handleResetConversation = () => {
    stopPortugueseSpeech();
    try {
      dictationRef.current?.stop();
    } catch {}
    setIsDictating(false);
    setIsThinking(false);
    setIsSpeaking(false);
    setStage('ask_name');
    setUserName('');
    setCurrentFocusPlace(undefined);
    setAskedFirstTimeAlready(false);
    setAwaitingEmergencyAddress(false);
    setPanelTab('chat');
    setInputText('');
    setLiveTranscript('');
    const resetMsgs = [createInitialWelcomeMessage()];
    setMessages(resetMsgs);
    try {
      sessionStorage.removeItem(AI_SESSION_KEY);
    } catch {}
    if (aiVoiceEnabled) {
      speakCalmReply(INITIAL_GREETING_TEXT);
    }
  };

  const startVoiceCapture = () => {
    setMicErrorNotice(null);
    stopPortugueseSpeech();
    setIsSpeaking(false);

    if (!speechRecognitionSupported) {
      setMicErrorNotice(
        'Seu navegador não suporta microfone nativo, mas você pode tocar nas opções abaixo para conversar por voz comigo.'
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
        setMicErrorNotice('Não consegui captar sua voz agora. Toque no orbe para tentar de novo.');
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

  const handleOpenVoiceOrb = () => {
    setIsVoiceOrbOpen(true);
    setLiveTranscript('');
    setMicErrorNotice(null);

    // Speak greeting naturally if conversation hasn't started yet
    const latest = messages[messages.length - 1];
    if (messages.length === 1 && latest?.sender === 'assistant') {
      speakNaturalPortuguese(latest.text, {
        onStart: () => setIsSpeaking(true),
        onEnd: () => {
          setIsSpeaking(false);
          if (speechRecognitionSupported) {
            startVoiceCapture();
          }
        },
        onError: () => setIsSpeaking(false),
      });
    } else if (speechRecognitionSupported) {
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
        setTimeout(() => startVoiceCapture(), 100);
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

  const quickDestinationOptions = [
    'Avenida Paulista',
    'Capão Redondo',
    'Pinheiros',
    'Tatuapé',
    'Santana',
    'Praça da Sé',
  ];

  const inputPlaceholder =
    stage === 'ask_name'
      ? 'Digite ou fale o seu nome...'
      : stage === 'ask_destination'
        ? `Para onde você vai hoje${userName ? `, ${userName}` : ''}?`
        : `Pergunte qualquer coisa${userName ? `, ${userName}` : ''}...`;

  const latestAssistantMsg = [...messages].reverse().find((m) => m.sender === 'assistant');

  return (
    <div className="space-y-4">
      {/* Clean Dedicated AI Console & SMS Switcher */}
      <div className="rounded-3xl bg-white dark:bg-neutral-950 border-2 border-neutral-950 dark:border-white/25 shadow-[0_18px_48px_rgba(0,0,0,0.16)] overflow-hidden flex flex-col">
        {/* Monochrome Executive AI Header */}
        <div className="p-4 bg-gradient-to-br from-neutral-950 via-neutral-900 to-black dark:from-white dark:via-neutral-100 dark:to-neutral-200 text-white dark:text-neutral-950 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="relative w-9 h-9 rounded-xl bg-white dark:bg-neutral-950 text-neutral-950 dark:text-white flex items-center justify-center shrink-0 shadow-sm">
                <Sparkles className="w-4 h-4" />
                <span
                  className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-white dark:bg-neutral-950 ring-2 ring-neutral-950 dark:ring-white animate-pulse"
                  aria-hidden="true"
                />
              </div>
              <div>
                <h3 className="font-display text-base font-extrabold tracking-tight leading-tight flex items-center gap-1.5">
                  <span>SafeRoute IA{userName ? ` · ${userName}` : ''}</span>
                  <span className="px-1.5 py-0.5 rounded-md bg-white/15 dark:bg-neutral-950/10 text-[9px] font-mono uppercase tracking-wider">
                    {geminiReady ? 'Gemini Flash' : 'Modo Local'}
                  </span>
                </h3>
                <p className="text-[11px] opacity-80 flex items-center gap-1">
                  <Zap className="w-3 h-3 shrink-0" />
                  <span>Resposta calma e imediata &bull; Emergência 190</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleOpenVoiceOrb}
                className="px-3 py-1.5 rounded-full bg-white dark:bg-neutral-950 text-neutral-950 dark:text-white text-[11px] font-bold flex items-center gap-1.5 shadow-sm hover:opacity-90 active:scale-95 transition-all"
                title="Abrir conversa falada com Orbe Flutuante"
              >
                <AudioLines className="w-3.5 h-3.5" />
                <span>Orbe de Voz</span>
              </button>

              <button
                type="button"
                onClick={() => setShowGeminiConfig((prev) => !prev)}
                className={`p-1.5 rounded-full border transition-colors ${
                  showGeminiConfig
                    ? 'bg-white text-neutral-950 border-white dark:bg-neutral-950 dark:text-white dark:border-neutral-950'
                    : 'bg-white/15 dark:bg-neutral-950/10 border-white/25 dark:border-neutral-950/20 hover:bg-white/25'
                }`}
                title="Configurar chave Google Gemini Flash"
                aria-label="Configurar chave Google Gemini Flash"
              >
                <KeyRound className="w-3.5 h-3.5" />
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

              <button
                type="button"
                onClick={handleResetConversation}
                className="p-1.5 rounded-full bg-white/15 dark:bg-neutral-950/10 border border-white/25 dark:border-neutral-950/20 transition-colors hover:bg-white/25"
                title="Reiniciar conversa"
                aria-label="Reiniciar conversa com a IA"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {showGeminiConfig && (
            <form
              onSubmit={handleSaveGeminiKey}
              className="p-2.5 rounded-2xl bg-white/10 dark:bg-neutral-950/10 border border-white/20 dark:border-neutral-950/20 space-y-2 animate-in fade-in duration-150"
            >
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                <span>Conectar Google Gemini Flash (Criptografado AES-256)</span>
                {geminiReady && (
                  <button
                    type="button"
                    onClick={async () => {
                      await saveUserGeminiKey('');
                      setGeminiReady(hasGeminiKeyConfigured());
                      setShowGeminiConfig(false);
                    }}
                    className="underline opacity-80 hover:opacity-100"
                  >
                    Desconectar
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="password"
                  value={geminiKeyDraft}
                  onChange={(e) => setGeminiKeyDraft(e.target.value)}
                  placeholder="Cole sua Gemini API Key (AIza...)"
                  className="flex-1 min-w-0 px-2.5 py-1.5 rounded-xl bg-white text-neutral-950 text-xs placeholder-neutral-500 outline-none"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-white text-neutral-950 dark:bg-neutral-950 dark:text-white text-xs font-bold shrink-0"
                >
                  Salvar
                </button>
              </div>
            </form>
          )}

          {/* Quick Emergency 190 & Focused Sub-tab Switcher */}
          <div className="flex items-center gap-1.5">
            <div
              role="tablist"
              aria-label="Alternar entre conversa com IA e SMS pré-viagem"
              className="flex-1 grid grid-cols-2 gap-1 p-1 rounded-xl bg-white/10 dark:bg-neutral-950/10 border border-white/15 dark:border-neutral-950/15"
            >
              <button
                type="button"
                role="tab"
                aria-selected={panelTab === 'chat'}
                onClick={() => setPanelTab('chat')}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  panelTab === 'chat'
                    ? 'bg-white dark:bg-neutral-950 text-neutral-950 dark:text-white shadow-xs'
                    : 'text-white/80 dark:text-neutral-950/70 hover:text-white dark:hover:text-neutral-950'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Conversa IA</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={panelTab === 'sms'}
                onClick={() => setPanelTab('sms')}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  panelTab === 'sms'
                    ? 'bg-white dark:bg-neutral-950 text-neutral-950 dark:text-white shadow-xs'
                    : 'text-white/80 dark:text-neutral-950/70 hover:text-white dark:hover:text-neutral-950'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>SMS Pré-Viagem</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => askAssistant('Estou em uma emergência, preciso de ajuda')}
              className="px-2.5 py-2 rounded-xl bg-white/15 dark:bg-neutral-950/15 border border-white/30 dark:border-neutral-950/30 text-[11px] font-bold flex items-center gap-1 shrink-0 hover:bg-white/25 transition-colors"
              title="Acionar protocolo calmo de emergência / assalto"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">SOS IA</span>
            </button>
          </div>
        </div>

        {panelTab === 'chat' ? (
          <>
            {/* Instant Conversation Thread */}
            <div
              ref={chatScrollRef}
              className="p-3.5 space-y-3 min-h-[16rem] max-h-[26rem] overflow-y-auto bg-neutral-50/70 dark:bg-neutral-900/50"
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
                      <span>SafeRoute IA</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => speakCalmReply(msg.text)}
                        className="p-1 rounded-lg bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white"
                        title="Ouvir mensagem"
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

                {/* Quick Destination Chips when IA asks where user is going */}
                {msg.sender === 'assistant' && msg.showQuickDestinations && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {quickDestinationOptions.map((place) => (
                      <button
                        key={place}
                        type="button"
                        onClick={() => askAssistant(`Vou para ${place}`)}
                        className="px-2.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 text-[11px] font-semibold hover:border-neutral-950 dark:hover:border-white transition-colors"
                      >
                        {place}
                      </button>
                    ))}
                  </div>
                )}

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

                {/* Nearby Reference Places Around Chosen Destination */}
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

                {/* Emergency Robbery Quick Actions: 190 Call + Instant GPS Dispatch */}
                {msg.isEmergency && (
                  <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href="tel:190"
                        className="flex-1 min-w-[130px] py-2 px-3 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm hover:opacity-90 transition-opacity"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Ligar 190 (PM)</span>
                      </a>

                      {msg.showEmergencyGpsButton && (
                        <button
                          type="button"
                          onClick={handleSendEmergencyGps}
                          disabled={isLocatingEmergencyGps}
                          className="flex-1 min-w-[140px] py-2 px-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-900 dark:border-neutral-500 text-neutral-950 dark:text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                        >
                          {isLocatingEmergencyGps ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <LocateFixed className="w-3.5 h-3.5" />
                          )}
                          <span>Enviar meu GPS agora</span>
                        </button>
                      )}
                    </div>

                    {msg.emergencyPolicePosts && msg.emergencyPolicePosts.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" />
                          <span>Postos policiais mais próximos:</span>
                        </div>
                        {msg.emergencyPolicePosts.map((post) => (
                          <div
                            key={post.id}
                            className="p-2.5 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 space-y-0.5 shadow-xs"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-extrabold leading-tight">
                                {post.name}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-white/15 dark:bg-neutral-950/15 font-mono text-[10px] font-bold shrink-0">
                                {post.distanceLabel}
                              </span>
                            </div>
                            <p className="text-[11px] opacity-85">{post.address}</p>
                            <div className="text-[10px] font-mono opacity-75">
                              Atendimento 24h &bull; Emergência {post.phone}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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

          {isThinking && (
            <div className="flex items-start">
              <div className="rounded-2xl rounded-tl-sm px-3.5 py-2.5 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-400 flex items-center gap-2 shadow-2xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{geminiReady ? 'Gemini Flash respondendo...' : 'Analisando com calma...'}</span>
              </div>
            </div>
          )}
            </div>

            {isDictating && (
              <div className="px-3.5 py-1.5 bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-[11px] font-semibold flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-white dark:bg-neutral-950 animate-ping" />
                  <span>Ouvindo para escrever no campo...</span>
                </span>
                <button
                  type="button"
                  onClick={handleToggleDictation}
                  className="text-[10px] underline font-bold"
                >
                  Parar ditado
                </button>
              </div>
            )}

            {/* Integrated Dictation Mic ("falar só escrevendo") + Text Input Composer */}
            <form
              onSubmit={handleSubmit}
              className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/80 flex items-center gap-2"
            >
              <button
                type="button"
                onClick={handleToggleDictation}
                disabled={!speechRecognitionSupported}
                aria-label="Microfone para falar e escrever no campo de mensagem"
                title="Falar para escrever no chat (não envia automático)"
                className={`p-2.5 rounded-xl border font-bold text-xs flex items-center justify-center shrink-0 transition-all active:scale-95 ${
                  isDictating
                    ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 border-neutral-950 dark:border-white ring-2 ring-neutral-500 animate-pulse'
                    : 'bg-white dark:bg-neutral-950 text-neutral-950 dark:text-white border-neutral-300 dark:border-neutral-700 hover:border-neutral-950 dark:hover:border-white'
                } disabled:opacity-40`}
              >
                {isDictating ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={inputPlaceholder}
                aria-label="Responder ou perguntar ao assistente preventivo"
                className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-xs text-neutral-950 dark:text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-950 dark:focus:border-white"
              />

              <button
                type="submit"
                disabled={!inputText.trim() || isThinking}
                className="px-4 py-2.5 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 disabled:opacity-40 transition-opacity font-bold text-xs flex items-center gap-1.5 shrink-0"
                aria-label="Enviar mensagem para a IA"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Enviar</span>
              </button>
            </form>
          </>
        ) : (
          <div className="p-4 bg-neutral-50 dark:bg-neutral-900/60 space-y-3">
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

            <div className="p-3.5 rounded-2xl rounded-tl-sm bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-1.5">
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
                    SafeRoute &middot; Modo Voz{userName ? ` · ${userName}` : ''}
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
                {isListening && (
                  <>
                    <span className="absolute w-64 h-64 rounded-full border border-white/25 animate-ping" />
                    <span className="absolute w-52 h-52 rounded-full border border-white/35 animate-pulse" />
                  </>
                )}
                {isSpeaking && (
                  <span className="absolute w-56 h-56 rounded-full border border-white/25 animate-pulse" />
                )}

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
                  <span
                    className="absolute top-5 left-7 w-14 h-8 rounded-full bg-white/55 blur-md pointer-events-none"
                    aria-hidden="true"
                  />

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

              {/* Live Voice Caption */}
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

            {/* Bottom Stage-Aware Voice Starters */}
            <div className="max-w-xl w-full mx-auto space-y-4">
              {stage !== 'ask_name' && (
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  {(stage === 'ask_destination'
                    ? ['Vou para Avenida Paulista', 'Vou para Capão Redondo', 'Vou para Pinheiros']
                    : ['Lugares perto de lá', 'Sim, é minha primeira vez', 'Comparar rota segura']
                  ).map((prompt) => (
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
              )}

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
