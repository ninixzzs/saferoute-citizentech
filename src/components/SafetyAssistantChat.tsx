import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Check,
  ExternalLink,
} from 'lucide-react';
import { DangerZone, IncidentReport, NavigationRoute } from '../types';
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
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  toneLabel?: AssistantReply['toneLabel'];
  tips?: string[];
  suggestSafeRouteSwitch?: boolean;
}

export const SafetyAssistantChat: React.FC<SafetyAssistantChatProps> = ({
  originLocation,
  destinationLocation,
  selectedRoute,
  allRoutes,
  dangerZones,
  incidents,
  onSwitchToSafeRoute,
}) => {
  const [phoneInput, setPhoneInput] = useState('');
  const [smsSentNotice, setSmsSentNotice] = useState(false);
  const [inputText, setInputText] = useState('');
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
        text: `Olá! Antes de sair, posso conferir com calma as condições do seu trajeto até ${destinationLocation.name} ou preparar seu SMS informativo.`,
        tips: [
          'Pergunte sobre qualquer bairro ou avenida de São Paulo (ex: "É tranquilo ir para o Capão Redondo?").',
        ],
        suggestSafeRouteSwitch: initial.suggestSafeRouteSwitch,
      },
    ];
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages.length]);

  const askAssistant = (question: string) => {
    const clean = question.trim();
    if (!clean) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
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
      id: reply.id,
      sender: 'assistant',
      toneLabel: reply.toneLabel,
      text: reply.text,
      tips: reply.tips,
      suggestSafeRouteSwitch: reply.suggestSafeRouteSwitch,
    };

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
    'Ver resumo do SMS pré-viagem',
  ];

  return (
    <div className="space-y-4">
      {/* 1. Calm Pre-Trip SMS Card */}
      <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-neutral-950 dark:text-white shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-950 dark:text-white">
              SMS Pré-Viagem &middot; Orientação Calma
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
            <span>Antes da saída</span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed">
            {preTripSms.smsText}
          </p>
        </div>

        {/* SMS Preview / Send to Device Bar */}
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

      {/* 2. Calm AI Pre-Trip Advisor Chat */}
      <div className="rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col">
        <div className="px-3.5 py-2.5 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-neutral-950 dark:text-white shrink-0" />
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-950 dark:text-white leading-tight">
                Assistente Preventivo
              </h3>
              <p className="text-[11px] text-neutral-500">
                Consulte bairros e rotas com calma antes de iniciar
              </p>
            </div>
          </div>
        </div>

        {/* Message History */}
        <div className="p-3.5 space-y-3 max-h-[20rem] overflow-y-auto">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[92%] rounded-2xl p-3 space-y-2 ${
                  msg.sender === 'user'
                    ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 rounded-tr-sm'
                    : 'bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-800 rounded-tl-sm shadow-2xs'
                }`}
              >
                {msg.sender === 'assistant' && msg.toneLabel && (
                  <div className="flex items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">
                      Orientação SafeRoute
                    </span>
                    <span className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-[10px] font-bold">
                      {msg.toneLabel}
                    </span>
                  </div>
                )}

                <p className="text-xs sm:text-sm leading-relaxed">{msg.text}</p>

                {msg.tips && msg.tips.length > 0 && (
                  <ul className="space-y-1 pt-1 border-t border-neutral-100 dark:border-neutral-800/80 text-[11px] sm:text-xs text-neutral-600 dark:text-neutral-300">
                    {msg.tips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
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
                    className="w-full mt-1 py-2 px-3 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-xs font-bold flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Aplicar Desvio Seguro</span>
                  </button>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick 1-Tap Prompt Chips */}
        <div className="px-3.5 pb-2 flex items-center gap-1.5 overflow-x-auto">
          {quickQuestions.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => askAssistant(q)}
              className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 text-[11px] font-medium text-neutral-800 dark:text-neutral-200 whitespace-nowrap shrink-0 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Chat Composer */}
        <form
          onSubmit={handleSubmit}
          className="p-2.5 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Pergunte sobre um bairro ou rota antes de sair..."
            aria-label="Perguntar ao assistente preventivo"
            className="flex-1 px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-950 dark:text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-400"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 disabled:opacity-40 transition-opacity shrink-0"
            aria-label="Enviar mensagem"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
