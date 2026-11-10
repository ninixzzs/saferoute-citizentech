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
  'quem', 'fala', 'sao', 'paulo', 'sp', 'gratis', 'gratuito', 'custa',
  'funciona', 'faz', 'porque', 'quando', 'por', 'que', 'sobre', 'nada', 'ver',
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

  // Meta / conversational question detectors (must never trigger random destination analysis)
  const asksAiIdentity =
    containsWholePhrase(qNorm, 'qual o seu nome') ||
    containsWholePhrase(qNorm, 'qual seu nome') ||
    containsWholePhrase(qNorm, 'como voce se chama') ||
    containsWholePhrase(qNorm, 'quem e voce') ||
    containsWholePhrase(qNorm, 'voce e ia') ||
    containsWholePhrase(qNorm, 'voce e uma ia') ||
    containsWholePhrase(qNorm, 'voce e um robo');
  const asksCreator =
    containsWholePhrase(qNorm, 'quem criou') ||
    containsWholePhrase(qNorm, 'quem fez') ||
    containsWholePhrase(qNorm, 'criadora') ||
    containsWholePhrase(qNorm, 'desenvolvedora') ||
    containsWholePhrase(qNorm, 'nicolly');
  const asksPricing =
    containsWholePhrase(qNorm, 'gratuito') ||
    containsWholePhrase(qNorm, 'gratis') ||
    containsWholePhrase(qNorm, 'custa') ||
    containsWholePhrase(qNorm, 'valor') ||
    containsWholePhrase(qNorm, 'preco') ||
    containsWholePhrase(qNorm, 'paga') ||
    containsWholePhrase(qNorm, 'pago');
  const asksHowItWorks =
    containsWholePhrase(qNorm, 'como funciona') ||
    containsWholePhrase(qNorm, 'o que voce faz') ||
    containsWholePhrase(qNorm, 'para que serve') ||
    containsWholePhrase(qNorm, 'pode me ajudar');
  const asksCoverage =
    containsWholePhrase(qNorm, 'quais regioes') ||
    containsWholePhrase(qNorm, 'quais bairros') ||
    containsWholePhrase(qNorm, 'quais cidades') ||
    containsWholePhrase(qNorm, 'funciona onde') ||
    containsWholePhrase(qNorm, 'cobre sao paulo');

  // Check if message itself already asks a direct question or names a place
  const looksLikeDirectQuestion =
    Boolean(mentionedSp) ||
    Boolean(mentionedRegion) ||
    asksAiIdentity ||
    asksCreator ||
    asksPricing ||
    asksHowItWorks ||
    asksCoverage ||
    qNorm.includes('?') ||
    containsWholePhrase(qNorm, 'como') ||
    containsWholePhrase(qNorm, 'onde') ||
    containsWholePhrase(qNorm, 'quero') ||
    containsWholePhrase(qNorm, 'vou');

  // STAGE 1: ASK USER NAME FIRST (Never lock user if they jump directly to a question!)
  if (stage === 'ask_name') {
    const parsedName = extractUserName(question);

    if (asksAiIdentity) {
      return {
        id: `reply-${Date.now()}`,
        toneLabel: 'Boas-vindas',
        text: 'Eu sou a assistente SafeRoute, aqui para tirar suas dúvidas sobre trajetos e bairros de São Paulo! E qual é o seu nome?',
        tips: [],
        nearbyPlaces: [],
        smsPreview: preSms.smsText,
        nextStage: 'ask_name',
      };
    }

    // If user gave a place or real question right away (with or without name), solve it smoothly!
    if (looksLikeDirectQuestion && !parsedName) {
      return generateSafetyAssistantReply(question, {
        ...context,
        stage: mentionedSp || mentionedRegion ? 'ready' : 'ask_destination',
        userName: parsedName || userName,
      });
    }

    if (parsedName && (mentionedSp || mentionedRegion)) {
      return generateSafetyAssistantReply(question, {
        ...context,
        stage: 'ready',
        userName: parsedName,
      });
    }

    if (parsedName) {
      return {
        id: `reply-${Date.now()}`,
        toneLabel: 'Boas-vindas',
        text: `Prazer, ${parsedName}! Para onde você vai hoje em São Paulo?`,
        tips: [],
        nearbyPlaces: [],
        smsPreview: preSms.smsText,
        nextStage: 'ask_destination',
        detectedName: parsedName,
        showQuickDestinations: true,
      };
    }

    // Never trap the user in a name loop if they simply greet ("oi tudo bem")
    return {
      id: `reply-${Date.now()}`,
      toneLabel: 'Boas-vindas',
      text: 'Tudo ótimo por aqui! Para onde você vai hoje em São Paulo?',
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
        text: `Anotado, ${updatedName}! Pode deixar que vou lembrar do seu nome. Como posso te ajudar agora?`,
        tips: [],
        nearbyPlaces: [],
        smsPreview: preSms.smsText,
        nextStage: stage,
        detectedName: updatedName,
      };
    }
  }

  // Direct General Questions (answer strictly what was asked, zero unrelated cards)
  if (asksAiIdentity) {
    return {
      id: `reply-${Date.now()}`,
      toneLabel: 'Boas-vindas',
      text: `${namePrefix}eu sou a assistente SafeRoute. Respondo suas dúvidas sobre bairros e vias de São Paulo, rotas e orientações preventivas com tranquilidade.`,
      tips: [],
      nearbyPlaces: [],
      smsPreview: preSms.smsText,
      nextStage: stage,
    };
  }

  if (asksCreator) {
    return {
      id: `reply-${Date.now()}`,
      toneLabel: 'Tranquilo',
      text: `${namePrefix}o SafeRoute foi criado por Nicolly Vilela para ajudar motoristas e passageiros em São Paulo com rotas preventivas e informações rápidas.`,
      tips: [],
      nearbyPlaces: [],
      smsPreview: preSms.smsText,
      nextStage: stage,
    };
  }

  if (asksPricing) {
    return {
      id: `reply-${Date.now()}`,
      toneLabel: 'Tranquilo',
      text: `${namePrefix}o uso do SafeRoute e da assistente é totalmente gratuito.`,
      tips: [],
      nearbyPlaces: [],
      smsPreview: preSms.smsText,
      nextStage: stage,
    };
  }

  if (asksHowItWorks) {
    return {
      id: `reply-${Date.now()}`,
      toneLabel: 'Tranquilo',
      text: `${namePrefix}você pode me perguntar sobre qualquer bairro ou avenida de São Paulo, comparar rotas, pedir pontos de apoio próximos ou checar orientações antes de sair.`,
      tips: [],
      nearbyPlaces: [],
      smsPreview: preSms.smsText,
      nextStage: stage,
    };
  }

  if (asksCoverage) {
    return {
      id: `reply-${Date.now()}`,
      toneLabel: 'Tranquilo',
      text: `${namePrefix}eu atendo toda a cidade de São Paulo: Centro, Zona Sul, Zona Leste, Zona Oeste, Zona Norte e as Marginais Pinheiros e Tietê.`,
      tips: [],
      nearbyPlaces: [],
      smsPreview: preSms.smsText,
      nextStage: stage,
    };
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
      text: `Imagina,${nameSuffix}! Se tiver mais alguma dúvida antes ou durante o trajeto, é só chamar.`,
      tips: [],
      nearbyPlaces: [],
      smsPreview: preSms.smsText,
      nextStage: 'ready',
    };
  }

  // Simple greetings mid-chat (without a place or extra question)
  const isPureGreeting =
    !mentionedSp &&
    !mentionedRegion &&
    (qNorm === 'oi' ||
      qNorm === 'ola' ||
      qNorm === 'tudo bem' ||
      qNorm === 'bom dia' ||
      qNorm === 'boa tarde' ||
      qNorm === 'boa noite' ||
      qNorm === 'e ai');
  if (isPureGreeting) {
    return {
      id: `reply-${Date.now()}`,
      toneLabel: 'Boas-vindas',
      text:
        stage === 'ask_destination'
          ? `Oi${nameSuffix}! Para onde você vai hoje em São Paulo?`
          : `Oi${nameSuffix}! Em que posso te ajudar agora?`,
      tips: [],
      nearbyPlaces: [],
      smsPreview: preSms.smsText,
      nextStage: stage,
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
      tips: [],
      nearbyPlaces: [],
      smsPreview: preSms.smsText,
      nextStage: stage,
    };
  }

  // FAQ: Emergency contacts
  if (
    containsWholePhrase(qNorm, 'emergencia') ||
    containsWholePhrase(qNorm, 'policia') ||
    containsWholePhrase(qNorm, 'defesa civil') ||
    containsWholePhrase(qNorm, 'telefone') ||
    containsWholePhrase(qNorm, 'numero') ||
    containsWholePhrase(qNorm, '190') ||
    containsWholePhrase(qNorm, '199')
  ) {
    return {
      id: `reply-${Date.now()}`,
      toneLabel: 'Tranquilo',
      text: `${namePrefix}os telefones em São Paulo são: 190 (Polícia Militar), 199 (Defesa Civil), 153 (GCM) e 181 (Disque-Denúncia). Para SMS oficial de chuvas, envie seu CEP para 40199.`,
      tips: [],
      nearbyPlaces: [],
      smsPreview: preSms.smsText,
      nextStage: stage,
    };
  }

  // Extract custom place only when user explicitly refers to a destination phrase
  const customSpPhrase =
    !mentionedSp && !mentionedRegion ? extractCustomPlacePhrase(question) : null;
  const nonPlaceQuestionWords = [
    'quem', 'qual', 'quais', 'como', 'onde', 'quando', 'porque', 'quanto',
    'funciona', 'ajuda', 'explica', 'custa', 'gratis', 'sms', 'rota',
  ];
  const shortDirectPlace =
    stage === 'ask_destination' &&
    !mentionedSp &&
    !mentionedRegion &&
    !customSpPhrase &&
    question.trim().split(/\s+/).length <= 4 &&
    !qNorm.includes('?') &&
    !nonPlaceQuestionWords.some((w) => containsWholePhrase(qNorm, w))
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
  const asksSafetyOfPlace =
    Boolean(mentionedSp) ||
    Boolean(customPlaceName) ||
    containsWholePhrase(qNorm, 'perigoso') ||
    containsWholePhrase(qNorm, 'perigosa') ||
    containsWholePhrase(qNorm, 'seguro') ||
    containsWholePhrase(qNorm, 'segura') ||
    containsWholePhrase(qNorm, 'assalto') ||
    containsWholePhrase(qNorm, 'furto') ||
    containsWholePhrase(qNorm, 'roubo') ||
    containsWholePhrase(qNorm, 'transito') ||
    containsWholePhrase(qNorm, 'semaforo') ||
    containsWholePhrase(qNorm, 'risco') ||
    containsWholePhrase(qNorm, 'alerta') ||
    containsWholePhrase(qNorm, 'dica');

  if (isFirstTimeYes && focusName) {
    return {
      id: `reply-${Date.now()}`,
      toneLabel: 'Atenção Leve',
      text: `Perfeito, ${userName || 'combinado'}! Como é sua primeira vez em ${focusName}, separei esses pontos de referência conhecidos ali perto para você se localizar fácil.`,
      tips: [],
      nearbyPlaces,
      smsPreview: preSms.smsText,
      nextStage: 'ready',
      suggestedDestination,
    };
  }

  if (isAlreadyKnow && focusName) {
    return {
      id: `reply-${Date.now()}`,
      toneLabel: 'Tranquilo',
      text: `Ótimo,${nameSuffix}! Como você já conhece ${focusName}, é só seguir atento nos semáforos. Se quiser ver outra dúvida do trajeto, estou por aqui.`,
      tips: [],
      nearbyPlaces: [],
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
        ? `${namePrefix}de carro por aplicativo${focusName ? ` até ${focusName}` : ''}, embarque em frente a lugares iluminados, confirme a placa antes de entrar e guarde o celular ao parar nos sinais.`
        : isMetro
          ? `${namePrefix}de transporte público${focusName ? ` perto de ${focusName}` : ''}, estes são os terminais e estações mais próximos para referência:`
          : `${namePrefix}dirigindo por São Paulo, manter os vidros fechados em retenções e usar o GPS por áudio garante uma viagem tranquila.`,
      tips: [],
      nearbyPlaces: isMetro ? nearbyPlaces : [],
      smsPreview: preSms.smsText,
      nextStage: 'ready',
      suggestedDestination,
    };
  }

  if (asksNearby && focusName) {
    return {
      id: `reply-${Date.now()}`,
      toneLabel: 'Tranquilo',
      text: `${namePrefix}perto de ${focusName} há estes pontos conhecidos para referência ou parada:`,
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
      text: `${namePrefix}seu texto de SMS antes da saída está pronto em tom calmo: "${preSms.smsText}"`,
      tips: [],
      nearbyPlaces: [],
      smsPreview: preSms.smsText,
      nextStage: 'ready',
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
      text: `${namePrefix}${mentionedRegion.summary}`,
      tips: [],
      nearbyPlaces: [],
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
      text: `${namePrefix}em chuva forte em São Paulo, evite baixadas das Marginais, Glicério e Av. do Estado; se a água subir até metade da roda, pare em um trecho elevado.`,
      tips: [],
      nearbyPlaces: [],
      smsPreview: preSms.smsText,
      nextStage: 'ready',
    };
  }

  if (asksRouteCompare && safeRoute) {
    const diffMin = Math.max(0, safeRoute.durationMin - selectedRoute.durationMin);
    return {
      id: `reply-${Date.now()}`,
      toneLabel: selectedRoute.type === 'segura' ? 'Tranquilo' : 'Atenção Leve',
      text:
        selectedRoute.type === 'segura'
          ? `${namePrefix}a Rota Segura já está ativa (índice ${safeRoute.safetyScore}/100, ${safeRoute.durationMin} min).`
          : `${namePrefix}a Rota Segura tem índice ${safeRoute.safetyScore}/100 e leva cerca de ${diffMin > 0 ? `+${diffMin} min` : 'o mesmo tempo'} que a atual.`,
      tips: [],
      nearbyPlaces: [],
      smsPreview: preSms.smsText,
      nextStage: 'ready',
      suggestSafeRouteSwitch: selectedRoute.type !== 'segura',
    };
  }

  // If still in ask_destination and user didn't name a place, prompt gently
  if (stage === 'ask_destination' && !focusName) {
    return {
      id: `reply-${Date.now()}`,
      toneLabel: 'Boas-vindas',
      text: `${namePrefix}me diga para qual bairro ou avenida de São Paulo você vai hoje que eu verifico na hora!`,
      tips: [],
      nearbyPlaces: [],
      smsPreview: preSms.smsText,
      nextStage: 'ask_destination',
      showQuickDestinations: true,
    };
  }

  // Night safety question about existing focusName
  if (stage === 'ready' && asksNight && focusName && !mentionedSp && !customPlaceName) {
    return {
      id: `reply-${Date.now()}`,
      toneLabel: 'Atenção Leve',
      text: `${namePrefix}à noite em ${focusName}, prefira avenidas principais bem iluminadas, mantenha os vidros fechados nos semáforos e use o GPS por áudio.`,
      tips: [],
      nearbyPlaces: [],
      smsPreview: preSms.smsText,
      nextStage: 'ready',
    };
  }

  // CRITICAL: If user asked something unrelated to safety/destination, NEVER pull focusName from the past!
  if (!asksSafetyOfPlace || !focusName) {
    return {
      id: `reply-${Date.now()}`,
      toneLabel: 'Tranquilo',
      text: `${namePrefix}eu consigo responder apenas sobre bairros e vias de São Paulo, segurança no trânsito, rotas, pontos próximos e orientações da Defesa Civil. O que você gostaria de saber sobre seu trajeto?`,
      tips: [],
      nearbyPlaces: [],
      smsPreview: preSms.smsText,
      nextStage: stage,
    };
  }

  // Analyze the requested destination concisely (strictly answering what was asked)
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

  const isFirstAskForPlaces = !askedFirstTimeAlready && Boolean(mentionedSp || customPlaceName);

  if (hasCritical || hasHigh) {
    const mainZone = matchedZones[0];
    const regionLabel = mentionedSp ? ` (${mentionedSp.zone})` : '';
    return {
      id: `reply-${Date.now()}`,
      toneLabel: 'Cuidado Preventivo',
      text: `${namePrefix}${focusName}${regionLabel} exige atenção leve nos cruzamentos e semáforos — mantenha os vidros fechados e use o GPS por áudio, sem motivo para alarme.${mainZone?.defenseCivilTip ? ` ${mainZone.defenseCivilTip}` : ''}`,
      tips: [],
      nearbyPlaces: [],
      smsPreview: preSms.smsText,
      nextStage: 'ready',
      detectedPlace: focusName,
      suggestSafeRouteSwitch: selectedRoute.type !== 'segura' && Boolean(safeRoute),
      askFirstTimePlace: isFirstAskForPlaces ? focusName : undefined,
      suggestedDestination,
    };
  }

  if (matchedZones.length > 0 || matchedIncidents.length > 0) {
    return {
      id: `reply-${Date.now()}`,
      toneLabel: 'Atenção Leve',
      text: `${namePrefix}${focusName}${mentionedSp ? ` (${mentionedSp.zone})` : ''} tem movimento normal nos cruzamentos — mantenha vidros fechados nos sinais e celular fora da linha da janela.`,
      tips: [],
      nearbyPlaces: [],
      smsPreview: preSms.smsText,
      nextStage: 'ready',
      detectedPlace: focusName,
      askFirstTimePlace: isFirstAskForPlaces ? focusName : undefined,
      suggestedDestination,
    };
  }

  return {
    id: `reply-${Date.now()}`,
    toneLabel: 'Tranquilo',
    text: `${namePrefix}${focusName}${mentionedSp ? ` (${mentionedSp.zone})` : ''} está tranquilo neste momento, sem alertas críticos registrados.`,
    tips: [],
    nearbyPlaces: [],
    smsPreview: preSms.smsText,
    nextStage: 'ready',
    detectedPlace: focusName,
    askFirstTimePlace: isFirstAskForPlaces ? focusName : undefined,
    suggestedDestination,
  };
}
