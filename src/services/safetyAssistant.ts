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

/**
 * Extracts a customer's name cleanly from natural Portuguese answers.
 */
export function extractUserName(rawInput: string): string | null {
  const clean = sanitizeUserInput(rawInput, 80).trim();
  if (!clean) return null;

  const patterns = [
    /(?:meu nome e|me chamo|sou o|sou a|eu sou|pode me chamar de|aqui e o|aqui e a|e o|e a)\s+([A-Za-zÀ-ÿ]+(?:\s+[A-Za-zÀ-ÿ]+)?)/i,
    /(?:tudo bem[,.!]?\s*(?:e\s+com\s+voc[eê]\??\s*)?)(?:eu\s+sou\s+|me\s+chamo\s+)?([A-Za-zÀ-ÿ]+)/i,
  ];

  const ignoredWords = new Set([
    'oi', 'ola', 'bom', 'boa', 'tudo', 'bem', 'sim', 'nao', 'legal', 'otimo',
    'obrigado', 'obrigada', 'dia', 'tarde', 'noite', 'onde', 'quero', 'vou',
  ]);

  for (const regex of patterns) {
    const m = clean.match(regex);
    if (m?.[1]) {
      const firstWord = m[1].trim().split(/\s+/)[0];
      if (firstWord && !ignoredWords.has(normalizeText(firstWord)) && firstWord.length >= 2) {
        return capitalizeWords(firstWord);
      }
    }
  }

  // If short 1-3 word direct reply (e.g. "Nicolly", "Nicolly Vilela", "Maria")
  const tokens = clean.replace(/[.!?,;]/g, '').trim().split(/\s+/);
  if (tokens.length >= 1 && tokens.length <= 3) {
    const candidate = tokens.find((t) => !ignoredWords.has(normalizeText(t)) && t.length >= 2);
    if (candidate && /^[A-Za-zÀ-ÿ-]+$/.test(candidate)) {
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

/**
 * Extracts a custom São Paulo destination even if it is outside the 75 curated locations.
 */
function extractCustomPlacePhrase(rawQuestion: string): string | null {
  const clean = rawQuestion.trim().replace(/[?!.]+$/, '');
  const destMatch = clean.match(
    /(?:ir\s+para|vou\s+para|vou\s+pro|vou\s+pra|ir\s+pro|ir\s+pra|indo\s+para|destino\s+|bairro\s+|em\s+|no\s+|na\s+|ate\s+)(?:o\s+|a\s+)?([A-Za-zÀ-ÿ0-9\s]{3,35})$/i
  );
  if (destMatch?.[1]) {
    const candidate = destMatch[1].trim();
    const normCand = normalizeText(candidate);
    if (
      !['la', 'ca', 'casa', 'hoje', 'agora', 'sp', 'sao paulo'].includes(normCand) &&
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
 * Natural, concise, stateful conversational advisor:
 * 1) Asks customer's name first and remembers it throughout the session.
 * 2) Asks where they are going BEFORE assuming any preset destination.
 * 3) Answers any direct question clearly without fluff or panic.
 */
export function generateSafetyAssistantReply(
  rawQuestion: string,
  context: AssistantContext
): AssistantReply {
  const question = sanitizeUserInput(rawQuestion, 240);
  const qNorm = normalizeText(question);
  const { destination, selectedRoute, allRoutes, dangerZones, incidents, stage, userName, currentFocusPlace } =
    context;

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

  // STAGE 1: ASK USER NAME FIRST
  if (stage === 'ask_name') {
    const parsedName = extractUserName(question);
    const chosenName = parsedName || 'você';

    // If user already mentioned a destination along with their name (e.g. "Sou a Ana, vou para Paulista")
    if (mentionedSp && parsedName) {
      // Transition straight into analyzing their requested destination!
      return generateSafetyAssistantReply(question, {
        ...context,
        stage: 'ask_destination',
        userName: parsedName,
      });
    }

    return {
      id: `reply-${Date.now()}`,
      toneLabel: 'Boas-vindas',
      text: parsedName
        ? `Prazer, ${parsedName}! Tudo ótimo por aqui. Antes de começarmos, para onde você vai hoje em São Paulo?`
        : `Tudo ótimo! Antes de começarmos, como posso te chamar? E se já souber, me conta também para onde você vai hoje.`,
      tips: [],
      nearbyPlaces: [],
      smsPreview: preSms.smsText,
      nextStage: parsedName ? 'ask_destination' : 'ask_name',
      detectedName: parsedName || undefined,
      showQuickDestinations: Boolean(parsedName),
    };
  }

  const namePrefix = userName ? `${userName}, ` : '';
  const nameSuffix = userName ? ` ${userName}` : '';

  // Direct FAQ / App Help handling (no fluff)
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
      text: `${namePrefix}você pode ajustar o tamanho da letra até 20px, ligar o Modo Noturno, Claro ou Alto Contraste tocando no botão "Acessibilidade (Aa)" lá na barra superior! Toda a tela e as diretrizes aumentam juntas.`,
      tips: ['No celular, o painel de acessibilidade abre em tela cheia para facilitar a leitura.'],
      nearbyPlaces: currentFocusPlace ? findNearbyPlaces(mentionedSp?.coordinates || destination.coordinates) : [],
      smsPreview: preSms.smsText,
      nextStage: stage === 'ask_destination' ? 'ask_destination' : 'ready',
      showQuickDestinations: stage === 'ask_destination',
    };
  }

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
      text: `${namePrefix}os telefones oficiais em São Paulo são: 190 (Polícia Militar), 199 (Defesa Civil), 153 (GCM) e 181 (Disque-Denúncia). Você também pode consultar todas as diretrizes no ícone de livrinho no topo.`,
      tips: ['Para receber comunicados oficiais de chuva da Defesa Civil, envie seu CEP por SMS para 40199.'],
      nearbyPlaces: currentFocusPlace ? findNearbyPlaces(destination.coordinates) : [],
      smsPreview: preSms.smsText,
      nextStage: stage === 'ask_destination' ? 'ask_destination' : 'ready',
      showQuickDestinations: stage === 'ask_destination',
    };
  }

  if (
    containsWholePhrase(qNorm, 'como funciona') ||
    containsWholePhrase(qNorm, 'o que voce faz') ||
    containsWholePhrase(qNorm, 'auto on') ||
    containsWholePhrase(qNorm, 'reportar')
  ) {
    return {
      id: `reply-${Date.now()}`,
      toneLabel: 'Tranquilo',
      text: `${namePrefix}eu comparo rotas para você evitar cruzamentos críticos com tranquilidade, mostro lugares conhecidos por perto e aviso por voz ou SMS antes de sair. Se deixar o "Auto ON" ligado no celular, eu troco para a rota segura sozinha quando detectar risco à frente.`,
      tips: ['Você também pode registrar ocorrências em qualquer bairro de SP pelo botão "Reportar" no topo.'],
      nearbyPlaces: currentFocusPlace ? findNearbyPlaces(destination.coordinates) : [],
      smsPreview: preSms.smsText,
      nextStage: stage === 'ask_destination' ? 'ask_destination' : 'ready',
      showQuickDestinations: stage === 'ask_destination',
    };
  }

  // Extract custom place if user typed a neighborhood outside our 75-item dictionary (when asking destination)
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

  // STAGE 2: STILL WAITING FOR DESTINATION AND USER DIDN'T GIVE ONE YET
  if (
    stage === 'ask_destination' &&
    !mentionedSp &&
    !mentionedRegion &&
    !customPlaceName &&
    !containsWholePhrase(qNorm, 'sms') &&
    !containsWholePhrase(qNorm, 'rota')
  ) {
    return {
      id: `reply-${Date.now()}`,
      toneLabel: 'Boas-vindas',
      text: `Entendi,${nameSuffix}! Mas antes de eu analisar tudo direitinho, me conta: para qual bairro, rua ou região de São Paulo você pretende ir hoje?`,
      tips: [],
      nearbyPlaces: [],
      smsPreview: preSms.smsText,
      nextStage: 'ask_destination',
      showQuickDestinations: true,
    };
  }

  const focusName = mentionedSp?.name || customPlaceName || currentFocusPlace;
  const focusCoords = mentionedSp?.coordinates || destination.coordinates;
  const nearbyPlaces = focusName
    ? findNearbyPlaces(mentionedRegion ? mentionedRegion.coords : focusCoords)
    : [];

  const safeRoute = allRoutes.find((r) => r.type === 'segura');
  const suggestedDestination =
    mentionedSp || customPlaceName ? mentionedSp?.name || customPlaceName || undefined : undefined;

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
    containsWholePhrase(qNorm, 'apoio');
  const asksRouteCompare =
    qNorm.includes('comparar') ||
    containsWholePhrase(qNorm, 'desvio') ||
    containsWholePhrase(qNorm, 'rapida') ||
    containsWholePhrase(qNorm, 'rota');
  const asksSms = containsWholePhrase(qNorm, 'sms') || containsWholePhrase(qNorm, 'mensagem');
  const asksRain =
    containsWholePhrase(qNorm, 'chuva') ||
    containsWholePhrase(qNorm, 'alagamento') ||
    containsWholePhrase(qNorm, 'temporal');
  const asksNight =
    containsWholePhrase(qNorm, 'noite') || containsWholePhrase(qNorm, 'madrugada');

  if (isFirstTimeYes && focusName) {
    return {
      id: `reply-${Date.now()}`,
      toneLabel: 'Atenção Leve',
      text: `Combinado, ${userName || 'combinado'}! Como é a sua primeira vez em ${focusName}, deixei pontos conhecidos logo abaixo para você se localizar fácil. Vá ouvindo o GPS por áudio e mantenha vidros fechados nos sinais.`,
      tips: ['Qualquer dúvida no caminho ou sobre outro bairro, é só me chamar aqui.'],
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
      text: `Ótimo,${nameSuffix}! Como você já conhece ${focusName}, sigo monitorando o percurso em tempo real e já deixei seu SMS pré-viagem pronto logo abaixo.`,
      tips: [],
      nearbyPlaces,
      smsPreview: preSms.smsText,
      nextStage: 'ready',
      suggestSafeRouteSwitch: false,
    };
  }

  if (asksNearby && focusName) {
    return {
      id: `reply-${Date.now()}`,
      toneLabel: 'Tranquilo',
      text: `${namePrefix}perto de ${focusName} você tem essas referências movimentadas e fáceis de acessar:`,
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
      text: `${namePrefix}seu SMS informativo antes da saída já está pronto (em tom calmo, sem alarme): "${preSms.smsText}"`,
      tips: [],
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
      text: `${namePrefix}${mentionedRegion.summary} É a sua primeira vez por essa área da ${mentionedRegion.zone}?`,
      tips: [],
      nearbyPlaces,
      smsPreview: preSms.smsText,
      nextStage: 'ready',
      detectedPlace: mentionedRegion.zone,
      askFirstTimePlace: mentionedRegion.zone,
    };
  }

  if (asksRain) {
    return {
      id: `reply-${Date.now()}`,
      toneLabel: 'Atenção Leve',
      text: `${namePrefix}em dias de chuva em SP, evite baixadas das Marginais, Glicério e Av. do Estado. Preferindo vias mais altas, você segue tranquilo(a).`,
      tips: ['Se a água passar da metade da roda, pare em local seguro elevado.'],
      nearbyPlaces,
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

  if (!focusName) {
    return {
      id: `reply-${Date.now()}`,
      toneLabel: 'Boas-vindas',
      text: `${namePrefix}me diga para qual bairro ou endereço em São Paulo você vai hoje que eu verifico na hora para você!`,
      tips: [],
      nearbyPlaces: [],
      smsPreview: preSms.smsText,
      nextStage: 'ask_destination',
      showQuickDestinations: true,
    };
  }

  // Analyze the user's chosen destination concisely
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
      text: `${namePrefix}sobre ${focusName}${regionLabel}: dá para ir com calma tomando cuidados simples nos semáforos${asksNight ? ' (principalmente à noite)' : ''} — mantenha vidros fechados e use o GPS por áudio, sem motivo para pânico. É a sua primeira vez indo para lá?`,
      tips: [
        mainZone?.defenseCivilTip ||
          'Mantenha o celular fora da linha do vidro ao reduzir em cruzamentos.',
      ],
      nearbyPlaces,
      smsPreview: preSms.smsText,
      nextStage: 'ready',
      detectedPlace: focusName,
      suggestSafeRouteSwitch: selectedRoute.type !== 'segura' && Boolean(safeRoute),
      askFirstTimePlace: focusName,
      suggestedDestination,
    };
  }

  if (matchedZones.length > 0 || matchedIncidents.length > 0) {
    return {
      id: `reply-${Date.now()}`,
      toneLabel: 'Atenção Leve',
      text: `${namePrefix}${focusName}${mentionedSp ? ` (${mentionedSp.zone})` : ''} está com fluxo normal e movimento intenso em alguns cruzamentos — basta manter vidros fechados nos sinais. É a sua primeira vez indo até lá?`,
      tips: [],
      nearbyPlaces,
      smsPreview: preSms.smsText,
      nextStage: 'ready',
      detectedPlace: focusName,
      askFirstTimePlace: focusName,
      suggestedDestination,
    };
  }

  return {
    id: `reply-${Date.now()}`,
    toneLabel: 'Tranquilo',
    text: `${namePrefix}${focusName}${mentionedSp ? ` (${mentionedSp.zone})` : ''} não concentra alertas críticos neste momento — viagem tranquila! É a sua primeira vez indo para lá?`,
    tips: [],
    nearbyPlaces,
    smsPreview: preSms.smsText,
    nextStage: 'ready',
    detectedPlace: focusName,
    askFirstTimePlace: focusName,
    suggestedDestination,
  };
}
