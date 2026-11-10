import React, { useState, useMemo, useRef, useEffect } from 'react';
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
} from 'lucide-react';
import { DangerZone, IncidentReport, NavigationRoute } from '../types';
import { SaoPauloZone } from '../data/saoPauloLocations';
import { LocationSuggestion } from '../services/routingService';
import {
  buildPreTripSmsMessage,
  generateSafetyAssistantReply,
  AssistantReply,
} from '../services/safetyAssistant';

interface SafetyAssistantChatProps {
  originLocation: LocationSuggestion;
  destinationLocation: LocationSuggestion;
  selectedRoute: NavigationRoute;
  allRoutes: NavigationRoute[];
  dangerZones: DangerZone[];
  incidents: IncidentReport[];
  onSwitchToSafeRoute: () => void;
  focusInputTrigger?: number;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  toneLabel?: AssistantReply['toneLabel'];
  tips?: string[];
  suggestSafeRouteSwitch?: boolean;
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
  focusInputTrigger = 0,
}) => {
  const [phoneInput, setPhoneInput] = useState('');
  const [smsSentNotice, setSmsSentNotice] = useState(false);
  const [inputText, setInputText] = useState('');
  const [activeRegion, setActiveRegion] = useState<SaoPauloZone | null>(null);
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
        text: `Olá! Sou sua Assistente Preventiva em todas as regiões de São Paulo. Antes de iniciar sua rota até ${destinationLocation.name}, me pergunte sobre qualquer bairro, avenida ou peça seu resumo por SMS.`,
        tips: [
          'Resposta imediata e serena para toda a capital: Centro, Zonas Sul, Oeste, Leste, Norte e Marginais.',
        ],
        suggestSafeRouteSwitch: initial.suggestSafeRouteSwitch,
      },
    ];
  });

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Scoped internal chat scroll so outer page never jumps unexpectedly
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

  const askAssistant = (question: string, regionTag?: SaoPauloZone) => {
    const clean = question.trim();
    if (!clean) return;

    if (regionTag) {
      setActiveRegion(regionTag);
    }

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sender: 'user',
      text: clean,
    };

    const reply = generateSafetyAssistantReply(clean, {
      origin: originLocation,
      destination: destinationLocation,
      selectedRoute,
      allRoutes,
      dangerZones,
      incidents,
    });

    const botMsg: ChatMessage = {
      id: `${reply.id}-${Math.random().toString(36).slice(2, 6)}`,
      sender: 'assistant',
      toneLabel: reply.toneLabel,
      text: reply.text,
      tips: reply.tips,
      suggestSafeRouteSwitch: reply.suggestSafeRouteSwitch,
    };

    // Instant synchronous update (0 ms delay)
    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInputText('');
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
    `É tranquilo ir para ${destinationLocation.name}?`,
    'Como está o Capão Redondo?',
    'Comparar rota segura vs rápida',
    'Chuva e alagamentos em SP',
    'Ver texto do SMS',
  ];

  return (
    <div className="space-y-4">
      {/* 1. Prominent Executive AI Spotlight Banner & Chat Console */}
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
                  <span>Resposta imediata &bull; Todas as regiões de São Paulo</span>
                </p>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full bg-white/15 dark:bg-neutral-950/10 border border-white/20 dark:border-neutral-950/20 text-[10px] font-mono font-bold uppercase tracking-wider">
              Sem Pânico
            </span>
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
                    onClick={() => askAssistant(reg.prompt, reg.zone)}
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
          className="p-3.5 space-y-3 max-h-[21rem] overflow-y-auto bg-neutral-50/70 dark:bg-neutral-900/50"
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[94%] rounded-2xl p-3.5 space-y-2 ${
                  msg.sender === 'user'
                    ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 rounded-tr-sm shadow-sm'
                    : 'bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-800 rounded-tl-sm shadow-xs'
                }`}
              >
                {msg.sender === 'assistant' && msg.toneLabel && (
                  <div className="flex items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Análise Instantânea SP</span>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-[10px] font-bold">
                      {msg.toneLabel}
                    </span>
                  </div>
                )}

                <p className="text-xs sm:text-sm leading-relaxed">{msg.text}</p>

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

        {/* High-Visibility Instant Composer */}
        <form
          onSubmit={handleSubmit}
          className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/80 flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Pergunte sobre qualquer bairro, rua ou região de SP..."
            aria-label="Perguntar ao assistente preventivo"
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-xs text-neutral-950 dark:text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-950 dark:focus:border-white"
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

        {/* Authentic Monochrome SMS Bubble */}
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
    </div>
  );
};
