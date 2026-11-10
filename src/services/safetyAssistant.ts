import { DangerZone, IncidentReport, NavigationRoute } from '../types';
import {
  SAO_PAULO_LOCATIONS,
  SAO_PAULO_NEARBY_PLACES,
  NearbyReferencePlace,
  SaoPauloZone,
  SaoPauloLocationEntry,
} from '../data/saoPauloLocations';
import { LocationSuggestion } from './routingService';
import { calculateDistanceMeters } from './api';
import { sanitizeUserInput } from './security';

export type ConversationStage = 'ask_name' | 'ask_destination' | 'ready';

export interface NearbyPlaceResult {
  name: string;
  category: NearbyReferencePlace['category'];
  distanceLabel: string;
}

export interface AssistantReply {
  id: string;
  toneLabel: 'Boas-vindas' | 'Tranquilo' | 'Atenção Leve' | 'Cuidado Preventivo';
  text: string;
  tips: string[];
  nearbyPlaces: NearbyPlaceResult[];
  smsPreview: string;
  nextStage: ConversationStage;
  detectedName?: string;
  detectedPlace?: string;
  suggestSafeRouteSwitch?: boolean;
  askFirstTimePlace?: string;
  suggestedDestination?: string;
  showQuickDestinations?: boolean;
}

export interface AssistantContext {
  origin: LocationSuggestion;
  destination: LocationSuggestion;
  selectedRoute: NavigationRoute;
  allRoutes: NavigationRoute[];
  dangerZones: DangerZone[];
  incidents: IncidentReport[];
  stage: ConversationStage;
  userName?: string;
  currentFocusPlace?: string;
  askedFirstTimeAlready?: boolean;
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function containsWholePhrase(normalizedText: string, normalizedPhrase: string): boolean {
  if (!normalizedPhrase) return false;
  const pattern = new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(normalizedPhrase)}(?:[^a-z0-9]|$)`);
  return pattern.test(normalizedText);
}

function capitalizeWords(text: string): string {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

const NON_NAME_WORDS = new Set([
  'oi', 'ola', 'bom', 'boa', 'tudo', 'bem', 'sim', 'nao', 'legal', 'otimo',
  'obrigado', 'obrigada', 'dia', 'tarde', 'noite', 'onde', 'quero', 'vou',
  'para', 'pro', 'pra', 'como', 'esta', 'qual', 'tem', 'perigoso', 'seguro',
  'uber', 'carro', 'onibus', 'metro', 'chuva', 'aqui', 'voce', 'vc', 'e', 'o',
  'a', 'de', 'da', 'do', 'em', 'no', 'na', 'ir', 'ate', 'meu', 'nome', 'me',
  'chamo', 'sou', 'chamar', 'pode', 'gente', 'saber', 'preciso', 'ajuda',
]);

/**
 * Accent-safe customer name extractor supporting natural Portuguese intros.
 */
export function extractUserName(rawInput: string): string | null {
  const clean = sanitizeUserInput(rawInput, 100).trim();
  if (!clean) return null;

  const norm = normalizeText(clean);

  // Explicit intro patterns checked on accent-stripped text ("meu nome é" -> "meu nome e")
  const explicitPatterns = [
    /(?:meu nome e|me chamo|pode me chamar de|aqui e o|aqui e a|aqui e|eu sou o|eu sou a|eu sou|sou o|sou a|sou)\s+([a-z][a-z-]{1,24})/i,
  ];

  for (const regex of explicitPatterns) {
    const match = norm.match(regex);
    if (match?.[1] && !NON_NAME_WORDS.has(match[1])) {
      return capitalizeWords(match[1]);
    }
  }

  // Fallback for direct replies like "Nicolly", "Nicolly Vilela", "Oi, Nicolly", "Tudo bem, Pedro"
  const tokens = norm.replace(/[^a-z\s-]/g, ' ').trim().split(/\s+/);
  if (tokens.length >= 1 && tokens.length <= 5) {
    const candidate = tokens.find((t) => t.length >= 2 && !NON_NAME_WORDS.has(t));
    if (candidate) {
      return capitalizeWords(candidate);
    }
  }

  return null;
}

const LOCATION_ALIASES: { alias: string; targetName: string; fallback?: SaoPauloLocationEntry }[] = [
  { alias: 'paulista', targetName: 'Avenida Paulista' },
  { alias: 'av paulista', targetName: 'Avenida Paulista' },
  {
    alias: 'ibirapuera',
    targetName: 'Parque Ibirapuera',
    fallback: { name: 'Parque Ibirapuera', zone: 'Zona Sul', kind: 'via', coordinates: [-23.5874, -46.6576] },
  },
  {
    alias: 'ibira',
    targetName: 'Parque Ibirapuera',
    fallback: { name: 'Parque Ibirapuera', zone: 'Zona Sul', kind: 'via', coordinates: [-23.5874, -46.6576] },
  },
  { alias: 'faria lima', targetName: 'Avenida Brigadeiro Faria Lima' },
  { alias: 'berrini', targetName: 'Avenida Engenheiro Luís Carlos Berrini' },
  { alias: 'luis carlos berrini', targetName: 'Avenida Engenheiro Luís Carlos Berrini' },
  { alias: 'reboucas', targetName: 'Avenida Rebouças' },
  { alias: 'schaumann', targetName: 'Avenida Henrique Schaumann' },
  { alias: 'dr arnaldo', targetName: 'Avenida Doutor Arnaldo' },
  { alias: 'doutor arnaldo', targetName: 'Avenida Doutor Arnaldo' },
  { alias: 'matarazzo', targetName: 'Avenida Francisco Matarazzo' },
  { alias: 'eusebio matoso', targetName: 'Ponte Eusébio Matoso' },
  { alias: 'vital brasil', targetName: 'Avenida Vital Brasil' },
  { alias: 'radial leste', targetName: 'Avenida Radial Leste' },
  { alias: 'alcantara machado', targetName: 'Avenida Radial Leste' },
  { alias: 'salim farah maluf', targetName: 'Avenida Salim Farah Maluf' },
  { alias: 'anhaia mello', targetName: 'Avenida Professor Luiz Ignácio Anhaia Mello' },
  { alias: 'aricanduva', targetName: 'Avenida Aricanduva' },
  { alias: 'celso garcia', targetName: 'Avenida Celso Garcia' },
  { alias: 'sapopemba', targetName: 'Avenida Sapopemba' },
  { alias: 'washington luis', targetName: 'Avenida Washington Luís' },
  { alias: 'congonhas', targetName: 'Avenida Washington Luís' },
  { alias: 'ricardo jafet', targetName: 'Avenida Doutor Ricardo Jafet' },
  { alias: 'abraao de morais', targetName: 'Avenida Professor Abraão de Morais' },
  { alias: 'cupece', targetName: 'Avenida Cupecê' },
  { alias: 'rubem berta', targetName: 'Avenida Rubem Berta' },
  { alias: '23 de maio', targetName: 'Avenida Rubem Berta' },
  { alias: 'nacoes unidas', targetName: 'Avenida das Nações Unidas' },
  { alias: 'rangel pestana', targetName: 'Avenida Rangel Pestana' },
  { alias: 'rio branco', targetName: 'Avenida Rio Branco' },
  { alias: 'duque de caxias', targetName: 'Avenida Duque de Caxias' },
  { alias: 'sao joao', targetName: 'Avenida São João' },
  { alias: 'ipiranga', targetName: 'Avenida Ipiranga' },
  { alias: 'augusta', targetName: 'Rua Augusta' },
  { alias: 'viaduto do cha', targetName: 'Viaduto do Chá / Viaduto Santa Ifigênia' },
  { alias: 'santa efigenia', targetName: 'Santa Ifigênia' },
  { alias: 'capao', targetName: 'Capão Redondo' },
  { alias: 'freguesia', targetName: 'Freguesia do Ó' },
  { alias: 'casa verde', targetName: 'Ponte da Casa Verde' },
];

function matchSpLocation(qNorm: string): SaoPauloLocationEntry | undefined {
  const sortedLocations = [...SAO_PAULO_LOCATIONS].sort(
    (a, b) => b.name.length - a.name.length
  );
  const direct = sortedLocations.find((loc) =>
    containsWholePhrase(qNorm, normalizeText(loc.name))
  );
  if (direct) return direct;

  const sortedAliases = [...LOCATION_ALIASES].sort((a, b) => b.alias.length - a.alias.length);
  for (const item of sortedAliases) {
    if (containsWholePhrase(qNorm, item.alias)) {
      const found = SAO_PAULO_LOCATIONS.find((l) => l.name === item.targetName);
      return found || item.fallback;
    }
  }

  return undefined;
}

function extractCustomPlacePhrase(rawQuestion: string): string | null {
  const clean = rawQuestion.trim().replace(/[?!.]+$/, '');
  const destMatch = clean.match(
    /(?:ir\s+para|vou\s+para|vou\s+pro|vou\s+pra|ir\s+pro|ir\s+pra|indo\s+para|destino\s+|bairro\s+|ate\s+)(?:o\s+|a\s+)?([A-Za-zÀ-ÿ0-9\s]{3,35})$/i
  );
  if (destMatch?.[1]) {
    const candidate = destMatch[1].trim();
    const normCand = normalizeText(candidate);
    if (
      !['la', 'ca', 'casa', 'hoje', 'agora', 'sp', 'sao paulo', 'trabalho', 'faculdade'].includes(
        normCand
      ) &&
      candidate.length >= 3
    ) {
      return capitalizeWords(candidate);
    }
  }
  return null;
}

function formatDistanceLabel(meters: number): string {
  if (meters < 1000) return `${Math.max(100, Math.round(meters / 10) * 10)} m`;
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`;
}

export function findNearbyPlaces(coordinates: [number, number]): NearbyPlaceResult[] {
  return SAO_PAULO_NEARBY_PLACES.map((place) => ({
    name: place.name,
    category: place.category,
    distanceMeters: calculateDistanceMeters(
      coordinates[0],
      coordinates[1],
      place.coordinates[0],
      place.coordinates[1]
    ),
  }))
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .slice(0, 4)
    .map((p) => ({
      name: p.name,
      category: p.category,
      distanceLabel: formatDistanceLabel(p.distanceMeters),
    }));
}

const REGION_KEYWORDS: {
  zone: SaoPauloZone;
  aliases: string[];
  coords: [number, number];
  summary: string;
}[] = [
  {
    zone: 'Zona Sul',
    aliases: ['zona sul', 'sul de sp', 'regiao sul'],
    coords: [-23.628, -46.678],
    summary:
      'Na Zona Sul (Vila Mariana, Moema, Santo Amaro, Jabaquara, Campo Limpo, Capão Redondo e Grajaú), as vias principais fluem bem. Em pontos como Capão Redondo ou cruzamentos lentos da Berrini e Washington Luís no pico, basta manter vidros fechados nos sinais.',
  },
  {
    zone: 'Centro',
    aliases: ['centro', 'regiao central', 'centro historico'],
    coords: [-23.548, -46.638],
    summary:
      'No Centro (Sé, República, Luz, Santa Ifigênia, Brás, Liberdade e Paulista), há bastante movimento. Vale manter atenção calma perto de estações e viadutos, preferindo vias iluminadas e o áudio do GPS.',
  },
  {
    zone: 'Zona Oeste',
    aliases: ['zona oeste', 'regiao oeste', 'oeste de sp'],
    coords: [-23.56, -46.69],
    summary:
      'A Zona Oeste (Pinheiros, Lapa, Perdizes, Butantã, Vila Madalena e Faria Lima) circula bem no geral. Nos horários de pico na Rebouças, Henrique Schaumann e Ponte Eusébio Matoso, deixe o celular guardado fora do vidro.',
  },
  {
    zone: 'Zona Leste',
    aliases: ['zona leste', 'regiao leste', 'leste de sp'],
    coords: [-23.548, -46.555],
    summary:
      'Na Zona Leste (Tatuapé, Mooca, Penha, Vila Prudente, Itaquera e São Mateus), corredores como Radial Leste, Salim Farah Maluf e Anhaia Mello são bem conectados. Em retenções sob viadutos, mantenha vidros fechados.',
  },
  {
    zone: 'Zona Norte',
    aliases: ['zona norte', 'regiao norte', 'norte de sp'],
    coords: [-23.5, -46.625],
    summary:
      'Na Zona Norte (Santana, Vila Guilherme, Tucuruvi e Freguesia do Ó), vias como Cruzeiro do Sul e Ataliba Leonel são bem fáceis de navegar. Perto do Tietê e saídas de pontes, evite celular exposto na janela.',
  },
  {
    zone: 'Marginais e Pontes',
    aliases: ['marginais', 'marginal', 'pontes', 'vias expressas', 'tiete', 'pinheiros'],
    coords: [-23.525, -46.665],
    summary:
      'Nas Marginais Tietê e Pinheiros e nas pontes principais, mantenha distância do carro à frente nas alças e redobre a atenção em chuva forte para evitar pontos baixos.',
  },
];

export function buildPreTripSmsMessage(context: {
  destination: LocationSuggestion;
  selectedRoute: NavigationRoute;
  dangerZones: DangerZone[];
  incidents: IncidentReport[];
  targetPlaceOverride?: string;
}): {
  toneLabel: 'Tranquilo' | 'Atenção Leve' | 'Cuidado Preventivo';
  smsText: string;
} {
  const { destination, selectedRoute, dangerZones, incidents, targetPlaceOverride } = context;
  const placeLabel = targetPlaceOverride || destination.name;
  const destNorm = normalizeText(`${placeLabel} ${destination.address}`);

  const matchingZones = dangerZones.filter((z) => {
    const zNorm = normalizeText(z.neighborhood);
    return (
      selectedRoute.dangerZoneIds.includes(z.id) ||
      containsWholePhrase(destNorm, zNorm) ||
      containsWholePhrase(normalizeText(`${z.neighborhood} ${z.name}`), normalizeText(placeLabel))
    );
  });

  const matchingIncidents = incidents.filter(
    (inc) =>
      inc.status !== 'resolvido' &&
      (containsWholePhrase(destNorm, normalizeText(inc.neighborhood)) ||
        containsWholePhrase(normalizeText(inc.neighborhood), normalizeText(placeLabel)))
  );

  const hasCritical =
    matchingZones.some((z) => z.riskLevel === 'critico') ||
    matchingIncidents.some((i) => i.riskLevel === 'critico');

  const hasModerateOrHigh =
    matchingZones.length > 0 || matchingIncidents.length > 0 || selectedRoute.safetyScore < 75;

  if (hasCritical && selectedRoute.type !== 'segura') {
    return {
      toneLabel: 'Cuidado Preventivo',
      smsText: `SafeRoute SP (SMS Pré-Viagem): Para ir até ${placeLabel}, recomendamos atenção simples: trafegue por avenidas principais iluminadas, mantenha os vidros fechados e use o GPS por áudio. Há um desvio tranquilo disponível antes de sair.`,
    };
  }

  if (hasModerateOrHigh) {
    return {
      toneLabel: 'Atenção Leve',
      smsText: `SafeRoute SP (SMS Pré-Viagem): O caminho até ${placeLabel} tem movimento intenso em alguns cruzamentos. Siga com tranquilidade mantendo vidros fechados e celular abaixo do painel nos semáforos.`,
    };
  }

  return {
    toneLabel: 'Tranquilo',
    smsText: `SafeRoute SP (SMS Pré-Viagem): O trajeto para ${placeLabel} (${selectedRoute.durationMin} min · segurança ${selectedRoute.safetyScore}/100) está estável e monitorado. Boa viagem!`,
  };
}

/**
 * Dynamic, non-blocking conversational safety advisor with memory and direct answers.
 */
export function generateSafetyAssistantReply(
  rawQuestion: string,
  context: AssistantContext
): AssistantReply {
  const question = sanitizeUserInput(rawQuestion, 240);
  const qNorm = normalizeText(question);
  const {
    destination,
    selectedRoute,
    allRoutes,
    dangerZones,
    incidents,
    stage,
    userName,
    currentFocusPlace,
    askedFirstTimeAlready,
  } = context;

  const mentionedSp = matchSpLocation(qNorm);
  const mentionedRegion = !mentionedSp
    ? REGION_KEYWORDS.find((reg) => reg.aliases.some((alias) => containsWholePhrase(qNorm, alias)))
    : undefined;

  const preSms = buildPreTripSmsMessage({
    destination,
    selectedRoute,
    dangerZones,
    incidents,
    targetPlaceOverride: mentionedSp?.name || currentFocusPlace,
  });

  // Check if message itself already asks a direct question or names a place
  const looksLikeDirectQuestion =
    Boolean(mentionedSp) ||
    Boolean(mentionedRegion) ||
    qNorm.includes('?') ||
    containsWholePhrase(qNorm, 'como') ||
    containsWholePhrase(qNorm, 'onde') ||
    containsWholePhrase(qNorm, 'quero') ||
    containsWholePhrase(qNorm, 'vou');

  // STAGE 1: ASK USER NAME FIRST (Never lock user if they jump directly to a question!)
  if (stage === 'ask_name') {
    const parsedName = extractUserName(question);

    // If user gave a place or real question right away (with or without name), solve it smoothly!
    if (looksLikeDirectQuestion) {
      return generateSafetyAssistantReply(question, {
        ...context,
        stage: mentionedSp || mentionedRegion ? 'ready' : 'ask_destination',
        userName: parsedName || userName,
      });
    }

    if (parsedName) {
      return {
        id: `reply-${Date.now()}`,
        toneLabel: 'Boas-vindas',
        text: `Prazer, ${parsedName}! Tudo ótimo por aqui. Para onde você vai hoje em São Paulo?`,
        tips: [],
        nearbyPlaces: [],
        smsPreview: preSms.smsText,
        nextStage: 'ask_destination',
        detectedName: parsedName,
        showQuickDestinations: true,
      };
    }

    // Even if input didn't contain a recognizable name ("oi tudo bem"), don't loop stubbornly: welcome & ask destination!
    return {
      id: `reply-${Date.now()}`,
      toneLabel: 'Boas-vindas',
      text: `Tudo ótimo por aqui! Para eu te ajudar agora mesmo, me conta: para qual bairro ou lugar de São Paulo você vai hoje?`,
      tips: [],
      nearbyPlaces: [],
      smsPreview: preSms.smsText,
      nextStage: 'ask_destination',
      showQuickDestinations: true,
    };
  }

  const namePrefix = userName ? `${userName}, ` : '';
  const nameSuffix = userName ? ` ${userName}` : '';

  // Allow user to update their name mid-conversation ("meu nome é X")
  if (
    qNorm.includes('meu nome e') ||
    qNorm.includes('me chamo') ||
    qNorm.includes('pode me chamar de')
  ) {
    const updatedName = extractUserName(question);
    if (updatedName) {
      return {
        id: `reply-${Date.now()}`,
        toneLabel: 'Boas-vindas',
        text: `Anotado, ${updatedName}! Pode deixar que vou lembrar do seu nome. Como posso te ajudar com o seu trajeto agora?`,
        tips: [],
        nearbyPlaces: currentFocusPlace ? findNearbyPlaces(destination.coordinates) : [],
        smsPreview: preSms.smsText,
        nextStage: stage,
        detectedName: updatedName,
        showQuickDestinations: stage === 'ask_destination',
      };
    }
  }

  // Gratitude / Warm Closing
  if (
    containsWholePhrase(qNorm, 'obrigado') ||
    containsWholePhrase(qNorm, 'obrigada') ||
    containsWholePhrase(qNorm, 'valeu') ||
    containsWholePhrase(qNorm, 'perfeito') ||
    containsWholePhrase(qNorm, 'beleza') ||
    containsWholePhrase(qNorm, 'ok')
  ) {
    return {
      id: `reply-${Date.now()}`,
      toneLabel: 'Tranquilo',
      text: `Imagina,${nameSuffix}! Estou por aqui se precisar conferir outra região de São Paulo, ver lugares perto ou ativar seu SMS. Faça uma ótima viagem!`,
      tips: [],
      nearbyPlaces: [],
      smsPreview: preSms.smsText,
      nextStage: 'ready',
    };
  }

  // FAQ: Accessibility & font scale
  if (
    containsWholePhrase(qNorm, 'acessibilidade') ||
    containsWholePhrase(qNorm, 'fonte') ||
    containsWholePhrase(qNorm, 'letra') ||
    containsWholePhrase(qNorm, 'aumentar') ||
    containsWholePhrase(qNorm, 'escuro') ||
    containsWholePhrase(qNorm, 'noturno')
  ) {
    return {
      id: `reply-${Date.now()}`,
      toneLabel: 'Tranquilo',
      text: `${namePrefix}toque em "Acessibilidade (Aa)" na barra superior para aumentar as letras até 20px, alternar entre Claro, Noturno e Aparelho ou ligar o Alto Contraste.`,
      tips: ['Todas as telas, mapas e as diretrizes da Defesa Civil acompanham o tamanho escolhido.'],
      nearbyPlaces: [],
      smsPreview: preSms.smsText,
      nextStage: stage,
      showQuickDestinations: stage === 'ask_destination',
    };
  }

  // FAQ: Emergency contacts
  if (
    containsWholePhrase(qNorm, 'emergencia') ||
    containsWholePhrase(qNorm, 'policia') ||
    containsWholePhrase(qNorm, 'defesa civil') ||
    containsWholePhrase(qNorm, 'telefone') ||
    containsWholePhrase(qNorm, 'numero')
  ) {
    return {
      id: `reply-${Date.now()}`,
      toneLabel: 'Tranquilo',
      text: `${namePrefix}os telefones em São Paulo são: 190 (Polícia Militar), 199 (Defesa Civil), 153 (GCM) e 181 (Disque-Denúncia). Para SMS oficial de chuvas, envie seu CEP para 40199.`,
      tips: ['Você também pode abrir todos os protocolos completos no botão de livrinho ("Diretrizes") no topo.'],
      nearbyPlaces: [],
      smsPreview: preSms.smsText,
      nextStage: stage,
    };
  }

  // Extract custom place if user typed one
  const customSpPhrase =
    !mentionedSp && !mentionedRegion ? extractCustomPlacePhrase(question) : null;
  const shortDirectPlace =
    stage === 'ask_destination' &&
    !mentionedSp &&
    !mentionedRegion &&
    !customSpPhrase &&
    question.trim().split(/\s+/).length <= 4 &&
    !qNorm.includes('?') &&
    !containsWholePhrase(qNorm, 'sms') &&
    !containsWholePhrase(qNorm, 'rota')
      ? capitalizeWords(question.replace(/[.!,]/g, ''))
      : null;

  const customPlaceName = customSpPhrase || shortDirectPlace;

  const focusName = mentionedSp?.name || customPlaceName || currentFocusPlace;
  const focusCoords = mentionedSp?.coordinates || destination.coordinates;
  const nearbyPlaces = focusName
    ? findNearbyPlaces(mentionedRegion ? mentionedRegion.coords : focusCoords)
    : [];

  const safeRoute = allRoutes.find((r) => r.type === 'segura');
  const suggestedDestination =
    mentionedSp || customPlaceName ? mentionedSp?.name || customPlaceName || undefined : undefined;

  // Dynamic intents
  const isFirstTimeYes =
    (containsWholePhrase(qNorm, 'primeira vez') && !qNorm.includes('nao e')) ||
    qNorm.includes('nunca fui') ||
    qNorm.includes('nao conheco') ||
    qNorm === 'sim';
  const isAlreadyKnow =
    qNorm.includes('ja conheco') ||
    qNorm.includes('ja fui') ||
    qNorm.includes('conheco sim') ||
    qNorm === 'nao';
  const asksNearby =
    containsWholePhrase(qNorm, 'perto') ||
    containsWholePhrase(qNorm, 'redor') ||
    containsWholePhrase(qNorm, 'lugares') ||
    containsWholePhrase(qNorm, 'parar') ||
    containsWholePhrase(qNorm, 'estacionar') ||
    containsWholePhrase(qNorm, 'apoio');
  const asksTransport =
    containsWholePhrase(qNorm, 'uber') ||
    containsWholePhrase(qNorm, '99') ||
    containsWholePhrase(qNorm, 'aplicativo') ||
    containsWholePhrase(qNorm, 'carro') ||
    containsWholePhrase(qNorm, 'metro') ||
    containsWholePhrase(qNorm, 'onibus') ||
    containsWholePhrase(qNorm, 'a pe');
  const asksRouteCompare =
    qNorm.includes('comparar') ||
    containsWholePhrase(qNorm, 'desvio') ||
    containsWholePhrase(qNorm, 'rapida') ||
    containsWholePhrase(qNorm, 'tempo') ||
    containsWholePhrase(qNorm, 'rota');
  const asksSms = containsWholePhrase(qNorm, 'sms') || containsWholePhrase(qNorm, 'mensagem');
  const asksRain =
    containsWholePhrase(qNorm, 'chuva') ||
    containsWholePhrase(qNorm, 'alagamento') ||
    containsWholePhrase(qNorm, 'temporal');
  const asksNight =
    containsWholePhrase(qNorm, 'noite') ||
    containsWholePhrase(qNorm, 'madrugada') ||
    containsWholePhrase(qNorm, 'tarde') ||
    containsWholePhrase(qNorm, 'horario');

  if (isFirstTimeYes && focusName) {
    return {
      id: `reply-${Date.now()}`,
      toneLabel: 'Atenção Leve',
      text: `Perfeito, ${userName || 'combinado'}! Como é sua primeira vez em ${focusName}, deixei pontos conhecidos ali perto para você ter referência visual fácil. Vá ouvindo o GPS por áudio e mantenha os vidros fechados nos sinais.`,
      tips: ['Qualquer outra dúvida antes de sair, pode perguntar!'],
      nearbyPlaces,
      smsPreview: preSms.smsText,
      nextStage: 'ready',
      suggestSafeRouteSwitch: selectedRoute.type !== 'segura' && Boolean(safeRoute),
      suggestedDestination,
    };
  }

  if (isAlreadyKnow && focusName) {
    return {
      id: `reply-${Date.now()}`,
      toneLabel: 'Tranquilo',
      text: `Maravilha,${nameSuffix}! Como você já conhece ${focusName}, deixei os pontos de apoio próximos aqui embaixo caso precise e seu SMS informativo pronto.`,
      tips: [],
      nearbyPlaces,
      smsPreview: preSms.smsText,
      nextStage: 'ready',
    };
  }

  if (asksTransport) {
    const isUber =
      containsWholePhrase(qNorm, 'uber') ||
      containsWholePhrase(qNorm, '99') ||
      containsWholePhrase(qNorm, 'aplicativo');
    const isMetro =
      containsWholePhrase(qNorm, 'metro') || containsWholePhrase(qNorm, 'onibus');
    return {
      id: `reply-${Date.now()}`,
      toneLabel: 'Tranquilo',
      text: isUber
        ? `${namePrefix}indo de carro por aplicativo até ${focusName || 'seu destino'}, prefira embarcar em frente a estabelecimentos iluminados, confirme a placa antes de abrir a porta e guarde o celular ao parar em semáforos.`
        : isMetro
          ? `${namePrefix}para transporte público perto de ${focusName || 'São Paulo'}, separei logo abaixo as estações e terminais mais próximos como ponto de referência.`
          : `${namePrefix}dirigindo por São Paulo, manter os vidros fechados em retenções e usar o GPS por áudio deixa a viagem muito mais tranquila.`,
      tips: [],
      nearbyPlaces: focusName ? nearbyPlaces : findNearbyPlaces(destination.coordinates),
      smsPreview: preSms.smsText,
      nextStage: 'ready',
      suggestedDestination,
    };
  }

  if (asksNearby && focusName) {
    return {
      id: `reply-${Date.now()}`,
      toneLabel: 'Tranquilo',
      text: `${namePrefix}perto de ${focusName} você tem ótimos pontos conhecidos e movimentados para se orientar ou fazer uma parada tranquila:`,
      tips: [],
      nearbyPlaces,
      smsPreview: preSms.smsText,
      nextStage: 'ready',
      suggestedDestination,
    };
  }

  if (asksSms) {
    return {
      id: `reply-${Date.now()}`,
      toneLabel: preSms.toneLabel,
      text: `${namePrefix}preparei seu SMS informativo antes da saída (em tom calmo, sem alarme): "${preSms.smsText}"`,
      tips: ['Toque em "Testar SMS" ou "Abrir no SMS" no cartão logo abaixo para usar direto no aparelho.'],
      nearbyPlaces,
      smsPreview: preSms.smsText,
      nextStage: 'ready',
      suggestSafeRouteSwitch: selectedRoute.type !== 'segura' && Boolean(safeRoute),
    };
  }

  if (mentionedRegion) {
    const regionLocations = SAO_PAULO_LOCATIONS.filter((l) => l.zone === mentionedRegion.zone);
    const hasRegionAlert = dangerZones.some((z) =>
      regionLocations.some((rl) =>
        containsWholePhrase(normalizeText(`${z.neighborhood} ${z.name}`), normalizeText(rl.name))
      )
    );
    return {
      id: `reply-${Date.now()}`,
      toneLabel: hasRegionAlert ? 'Cuidado Preventivo' : 'Atenção Leve',
      text: `${namePrefix}${mentionedRegion.summary}${!askedFirstTimeAlready ? ' É a sua primeira vez por essa área?' : ''}`,
      tips: [],
      nearbyPlaces,
      smsPreview: preSms.smsText,
      nextStage: 'ready',
      detectedPlace: mentionedRegion.zone,
      askFirstTimePlace: !askedFirstTimeAlready ? mentionedRegion.zone : undefined,
    };
  }

  if (asksRain) {
    return {
      id: `reply-${Date.now()}`,
      toneLabel: 'Atenção Leve',
      text: `${namePrefix}em chuva forte, evite baixadas das Marginais, Glicério e Av. do Estado. Preferindo vias mais altas e paradas em pontos elevados como os abaixo, você segue com segurança.`,
      tips: ['Se a água atingir metade da roda, pare em local seguro elevado até baixar.'],
      nearbyPlaces: focusName ? nearbyPlaces : findNearbyPlaces(destination.coordinates),
      smsPreview: preSms.smsText,
      nextStage: 'ready',
      suggestSafeRouteSwitch: selectedRoute.type !== 'segura' && Boolean(safeRoute),
    };
  }

  if (asksRouteCompare && safeRoute) {
    const diffMin = Math.max(0, safeRoute.durationMin - selectedRoute.durationMin);
    return {
      id: `reply-${Date.now()}`,
      toneLabel: selectedRoute.type === 'segura' ? 'Tranquilo' : 'Atenção Leve',
      text:
        selectedRoute.type === 'segura'
          ? `${namePrefix}a Rota Segura já está ativa (${safeRoute.safetyScore}/100, ${safeRoute.durationMin} min), priorizando vias iluminadas.`
          : `${namePrefix}a Rota Segura tem índice ${safeRoute.safetyScore}/100 e leva cerca de ${diffMin > 0 ? `+${diffMin} min` : 'quase o mesmo tempo'}, desviando dos cruzamentos mais lentos.`,
      tips: [],
      nearbyPlaces,
      smsPreview: preSms.smsText,
      nextStage: 'ready',
      suggestSafeRouteSwitch: selectedRoute.type !== 'segura',
    };
  }

  // If user is in ask_destination and still hasn't named a place, prompt gently with 1-tap chips
  if (!focusName) {
    return {
      id: `reply-${Date.now()}`,
      toneLabel: 'Boas-vindas',
      text: `${namePrefix}escolha um dos lugares abaixo ou digite qualquer bairro de São Paulo para eu verificar agora mesmo para você!`,
      tips: [],
      nearbyPlaces: [],
      smsPreview: preSms.smsText,
      nextStage: 'ask_destination',
      showQuickDestinations: true,
    };
  }

  // Follow-up time/safety question about existing focusName
  if (stage === 'ready' && asksNight && !mentionedSp && !customPlaceName) {
    return {
      id: `reply-${Date.now()}`,
      toneLabel: 'Atenção Leve',
      text: `${namePrefix}no período noturno em ${focusName}, a principal orientação é seguir por avenidas principais bem iluminadas, manter os vidros fechados em semáforos e evitar usar o celular perto da janela.`,
      tips: ['Se precisar parar, dê preferência às referências movimentadas listadas abaixo.'],
      nearbyPlaces,
      smsPreview: preSms.smsText,
      nextStage: 'ready',
      suggestSafeRouteSwitch: selectedRoute.type !== 'segura' && Boolean(safeRoute),
    };
  }

  // Analyze the destination concisely
  const targetNorm = normalizeText(focusName);
  const matchedZones = dangerZones.filter((z) => {
    const zNeighborhoodNorm = normalizeText(z.neighborhood);
    const zFullNorm = normalizeText(`${z.neighborhood} ${z.name}`);
    return (
      containsWholePhrase(zFullNorm, targetNorm) ||
      containsWholePhrase(targetNorm, zNeighborhoodNorm)
    );
  });

  const matchedIncidents = incidents.filter((inc) => {
    if (inc.status === 'resolvido') return false;
    const incNbNorm = normalizeText(inc.neighborhood);
    const incAddrNorm = normalizeText(inc.address);
    return (
      containsWholePhrase(incNbNorm, targetNorm) ||
      containsWholePhrase(targetNorm, incNbNorm) ||
      containsWholePhrase(incAddrNorm, targetNorm)
    );
  });

  const hasCritical =
    matchedZones.some((z) => z.riskLevel === 'critico') ||
    matchedIncidents.some((i) => i.riskLevel === 'critico');
  const hasHigh =
    matchedZones.some((z) => z.riskLevel === 'alto') ||
    matchedIncidents.some((i) => i.riskLevel === 'alto');

  if (hasCritical || hasHigh) {
    const mainZone = matchedZones[0];
    const regionLabel = mentionedSp ? ` (${mentionedSp.zone})` : '';
    return {
      id: `reply-${Date.now()}`,
      toneLabel: 'Cuidado Preventivo',
      text: `${namePrefix}sobre ${focusName}${regionLabel}: dá para ir com calma seguindo cuidados simples nos semáforos — mantenha vidros fechados e use o GPS por áudio, sem motivo para pânico.${!askedFirstTimeAlready ? ' É a sua primeira vez indo para lá?' : ''}`,
      tips: [
        mainZone?.defenseCivilTip ||
          'Mantenha o celular fora da linha do vidro ao reduzir em cruzamentos.',
      ],
      nearbyPlaces,
      smsPreview: preSms.smsText,
      nextStage: 'ready',
      detectedPlace: focusName,
      suggestSafeRouteSwitch: selectedRoute.type !== 'segura' && Boolean(safeRoute),
      askFirstTimePlace: !askedFirstTimeAlready ? focusName : undefined,
      suggestedDestination,
    };
  }

  if (matchedZones.length > 0 || matchedIncidents.length > 0) {
    return {
      id: `reply-${Date.now()}`,
      toneLabel: 'Atenção Leve',
      text: `${namePrefix}${focusName}${mentionedSp ? ` (${mentionedSp.zone})` : ''} está com fluxo normal e movimento em alguns cruzamentos — basta manter vidros fechados nos sinais.${!askedFirstTimeAlready ? ' É a sua primeira vez indo até lá?' : ''}`,
      tips: [],
      nearbyPlaces,
      smsPreview: preSms.smsText,
      nextStage: 'ready',
      detectedPlace: focusName,
      askFirstTimePlace: !askedFirstTimeAlready ? focusName : undefined,
      suggestedDestination,
    };
  }

  return {
    id: `reply-${Date.now()}`,
    toneLabel: 'Tranquilo',
    text: `${namePrefix}${focusName}${mentionedSp ? ` (${mentionedSp.zone})` : ''} não concentra alertas críticos neste momento — viagem tranquila!${!askedFirstTimeAlready ? ' É a sua primeira vez indo para lá?' : ''}`,
    tips: [],
    nearbyPlaces,
    smsPreview: preSms.smsText,
    nextStage: 'ready',
    detectedPlace: focusName,
    askFirstTimePlace: !askedFirstTimeAlready ? focusName : undefined,
    suggestedDestination,
  };
}
