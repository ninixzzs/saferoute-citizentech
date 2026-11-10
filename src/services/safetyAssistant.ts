import { DangerZone, IncidentReport, NavigationRoute } from '../types';
import {
  SAO_PAULO_LOCATIONS,
  SAO_PAULO_NEARBY_PLACES,
  NearbyReferencePlace,
  SaoPauloZone,
} from '../data/saoPauloLocations';
import { LocationSuggestion } from './routingService';
import { calculateDistanceMeters } from './api';

export interface NearbyPlaceResult {
  name: string;
  category: NearbyReferencePlace['category'];
  distanceLabel: string;
}

export interface AssistantReply {
  id: string;
  toneLabel: 'Tranquilo' | 'Atenção Leve' | 'Cuidado Preventivo';
  text: string;
  tips: string[];
  nearbyPlaces: NearbyPlaceResult[];
  smsPreview: string;
  suggestSafeRouteSwitch?: boolean;
  askFirstTimePlace?: string;
}

export interface AssistantContext {
  origin: LocationSuggestion;
  destination: LocationSuggestion;
  selectedRoute: NavigationRoute;
  allRoutes: NavigationRoute[];
  dangerZones: DangerZone[];
  incidents: IncidentReport[];
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function formatDistanceLabel(meters: number): string {
  if (meters < 1000) return `${Math.max(100, Math.round(meters / 10) * 10)} m`;
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`;
}

export function findNearbyPlaces(
  coordinates: [number, number],
  preferredZone?: SaoPauloZone
): NearbyPlaceResult[] {
  const pool =
    preferredZone && preferredZone !== 'Marginais e Pontes'
      ? SAO_PAULO_NEARBY_PLACES
      : SAO_PAULO_NEARBY_PLACES;

  return pool
    .map((place) => ({
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
      'Na Zona Sul (como Vila Mariana, Moema, Santo Amaro, Jabaquara, Campo Limpo, Capão Redondo e Grajaú), o deslocamento flui muito bem pelos corredores principais. Em pontos como Capão Redondo e cruzamentos movimentados da Berrini ou Washington Luís no horário de pico, basta manter vidros fechados nos semáforos e seguir com calma.',
  },
  {
    zone: 'Centro',
    aliases: ['centro', 'regiao central', 'centro historico'],
    coords: [-23.548, -46.638],
    summary:
      'No Centro (Sé, República, Luz, Santa Ifigênia, Brás, Liberdade, Consolação e Bela Vista), há bastante movimento de pedestres e comércios. Vale apenas manter uma atenção serena ao parar perto de grandes estações e viadutos, preferindo vias iluminadas e o contorno pela 23 de Maio ou Av. Paulista.',
  },
  {
    zone: 'Zona Oeste',
    aliases: ['zona oeste', 'regiao oeste', 'oeste de sp'],
    coords: [-23.56, -46.69],
    summary:
      'A Zona Oeste (Pinheiros, Lapa, Perdizes, Butantã, Vila Madalena e Faria Lima) tem circulação bem organizada no geral. Nos horários de maior movimento na Rebouças, Henrique Schaumann e Ponte Eusébio Matoso, manter o celular guardado e usar o GPS por voz deixa a viagem bem leve.',
  },
  {
    zone: 'Zona Leste',
    aliases: ['zona leste', 'regiao leste', 'leste de sp'],
    coords: [-23.548, -46.555],
    summary:
      'Na Zona Leste (Tatuapé, Mooca, Penha, Vila Prudente, Itaquera e São Mateus), os grandes corredores como Radial Leste, Salim Farah Maluf e Anhaia Mello são bem conectados. Em retenções sob viadutos e sinais mais longos, mantenha os vidros fechados para seguir tranquilo.',
  },
  {
    zone: 'Zona Norte',
    aliases: ['zona norte', 'regiao norte', 'norte de sp'],
    coords: [-23.5, -46.625],
    summary:
      'Na Zona Norte (Santana, Vila Guilherme, Tucuruvi e Freguesia do Ó), vias como Cruzeiro do Sul, Ataliba Leonel e Caetano Álvares são bem movimentadas e fáceis de navegar. Nos acessos próximos à Rodoviária do Tietê e saídas de pontes, vale deixar o celular longe do vidro.',
  },
  {
    zone: 'Marginais e Pontes',
    aliases: ['marginais', 'marginal', 'pontes', 'vias expressas', 'tiete', 'pinheiros'],
    coords: [-23.525, -46.665],
    summary:
      'Nas Marginais Tietê e Pinheiros e em pontes como Casa Verde, Cidade Universitária, Jaguaré e Morumbi, o ideal é manter uma distância confortável do carro da frente em alças de saída e acompanhar desvios de chuva forte pelos corredores elevados.',
  },
];

/**
 * Generates a calm, informative pre-trip SMS text without causing panic.
 */
export function buildPreTripSmsMessage(context: AssistantContext): {
  toneLabel: 'Tranquilo' | 'Atenção Leve' | 'Cuidado Preventivo';
  smsText: string;
} {
  const { destination, selectedRoute, dangerZones, incidents } = context;
  const destNorm = normalizeText(destination.name + ' ' + destination.address);

  const matchingZones = dangerZones.filter((z) => {
    const zText = normalizeText(`${z.neighborhood} ${z.name}`);
    return (
      selectedRoute.dangerZoneIds.includes(z.id) ||
      destNorm.includes(normalizeText(z.neighborhood)) ||
      zText.includes(normalizeText(destination.name))
    );
  });

  const matchingIncidents = incidents.filter(
    (inc) =>
      inc.status !== 'resolvido' &&
      (destNorm.includes(normalizeText(inc.neighborhood)) ||
        normalizeText(inc.neighborhood).includes(normalizeText(destination.name)))
  );

  const hasCritical =
    matchingZones.some((z) => z.riskLevel === 'critico') ||
    matchingIncidents.some((i) => i.riskLevel === 'critico');

  const hasModerateOrHigh =
    matchingZones.length > 0 || matchingIncidents.length > 0 || selectedRoute.safetyScore < 75;

  if (hasCritical && selectedRoute.type !== 'segura') {
    return {
      toneLabel: 'Cuidado Preventivo',
      smsText: `SafeRoute SP (SMS Pré-Viagem): Para ir até ${destination.name}, recomendamos atenção preventiva simples: trafegue por avenidas principais iluminadas, mantenha os vidros fechados e use o GPS por áudio. Há um desvio mais tranquilo disponível antes de iniciar.`,
    };
  }

  if (hasModerateOrHigh) {
    return {
      toneLabel: 'Atenção Leve',
      smsText: `SafeRoute SP (SMS Pré-Viagem): O caminho para ${destination.name} tem movimento intenso em alguns cruzamentos. Siga normalmente mantendo vidros fechados e o celular guardado abaixo do painel ao parar em semáforos. Boa viagem!`,
    };
  }

  return {
    toneLabel: 'Tranquilo',
    smsText: `SafeRoute SP (SMS Pré-Viagem): O trajeto selecionado até ${destination.name} (${selectedRoute.durationMin} min · segurança ${selectedRoute.safetyScore}/100) segue estável e monitorado no momento. Siga com tranquilidade.`,
  };
}

/**
 * Instant, zero-delay conversational safety companion covering all São Paulo regions, nearby landmarks, and first-time guidance.
 */
export function generateSafetyAssistantReply(
  question: string,
  context: AssistantContext,
  lastTargetPlace?: string
): AssistantReply {
  const qNorm = normalizeText(question);
  const { destination, selectedRoute, allRoutes, dangerZones, incidents } = context;

  // 1. Match specific neighborhood or corridor (longest first for precision)
  const sortedLocations = [...SAO_PAULO_LOCATIONS].sort(
    (a, b) => b.name.length - a.name.length
  );
  const mentionedSp = sortedLocations.find((loc) =>
    qNorm.includes(normalizeText(loc.name))
  );

  // 2. Match region if no specific neighborhood
  const mentionedRegion = !mentionedSp
    ? REGION_KEYWORDS.find((reg) => reg.aliases.some((alias) => qNorm.includes(alias)))
    : undefined;

  const focusName = mentionedSp?.name || lastTargetPlace || destination.name;
  const focusCoords = mentionedSp?.coordinates || destination.coordinates;
  const focusZone = mentionedSp?.zone;
  const nearbyPlaces = findNearbyPlaces(
    mentionedRegion ? mentionedRegion.coords : focusCoords,
    mentionedRegion?.zone || focusZone
  );

  const safeRoute = allRoutes.find((r) => r.type === 'segura');
  const isFirstTimeYes =
    qNorm.includes('primeira vez') && !qNorm.includes('nao e') ||
    qNorm.includes('nunca fui') ||
    qNorm.includes('nao conheco') ||
    qNorm === 'sim';
  const isAlreadyKnow =
    qNorm.includes('ja conheco') ||
    qNorm.includes('ja fui') ||
    qNorm.includes('conheco sim') ||
    qNorm === 'nao';
  const asksNearby =
    qNorm.includes('perto') ||
    qNorm.includes('redor') ||
    qNorm.includes('lugar') ||
    qNorm.includes('ponto') ||
    qNorm.includes('apoio');
  const asksRouteCompare =
    qNorm.includes('rota') ||
    qNorm.includes('desvio') ||
    qNorm.includes('rapida') ||
    qNorm.includes('melhor');
  const asksSms = qNorm.includes('sms') || qNorm.includes('mensagem');
  const asksRain =
    qNorm.includes('chuva') || qNorm.includes('alagamento') || qNorm.includes('temporal');
  const asksNight =
    qNorm.includes('noite') || qNorm.includes('madrugada') || qNorm.includes('horario');

  const preSms = buildPreTripSmsMessage({
    ...context,
    destination: mentionedSp
      ? {
          name: mentionedSp.name,
          address: `${mentionedSp.name} - ${mentionedSp.zone}, São Paulo - SP`,
          coordinates: mentionedSp.coordinates,
        }
      : destination,
  });

  // First-time visitor warm guidance
  if (isFirstTimeYes) {
    return {
      id: `reply-${Date.now()}`,
      toneLabel: 'Atenção Leve',
      text: `Que bom saber! Como é a sua primeira vez indo para ${focusName}, fique tranquilo(a): preparei referências conhecidas e bem movimentadas ali perto caso queira se localizar ou fazer uma parada segura, e recomendo ir ouvindo o áudio do trajeto para dirigir sem pressa.`,
      tips: [
        'Antes de sair, dê uma olhada rápida nos pontos de referência logo abaixo — são estações, parques ou shoppings fáceis de identificar.',
        'Nos semáforos, deixe os vidros fechados e evite apoiar o celular no painel alto perto da janela.',
        safeRoute && selectedRoute.type !== 'segura'
          ? 'Se preferir o caminho mais calmo e iluminado desde o início, clique em "Aplicar Desvio Seguro" abaixo.'
          : 'Com a Rota Segura ativa, eu aviso você com calma antes de qualquer cruzamento que mereça atenção.',
      ],
      nearbyPlaces,
      smsPreview: preSms.smsText,
      suggestSafeRouteSwitch: selectedRoute.type !== 'segura' && Boolean(safeRoute),
    };
  }

  // Returning visitor warm response
  if (isAlreadyKnow) {
    return {
      id: `reply-${Date.now()}`,
      toneLabel: 'Tranquilo',
      text: `Perfeito! Como você já conhece ${focusName}, fica bem mais fácil aproveitar a viagem. Deixei os pontos de referência próximos listados aqui caso precise de uma parada rápida, e sigo monitorando qualquer ocorrência no seu caminho.`,
      tips: [
        'Você já tem o SMS pré-viagem atualizado pronto logo abaixo se quiser conferir antes de partir.',
        'Ative o guia por voz ou o Auto-Desvio para fazer todo o percurso com tranquilidade.',
      ],
      nearbyPlaces,
      smsPreview: preSms.smsText,
      suggestSafeRouteSwitch: false,
    };
  }

  if (asksNearby) {
    return {
      id: `reply-${Date.now()}`,
      toneLabel: 'Tranquilo',
      text: `Perto de ${focusName}, você tem ótimos pontos conhecidos e de fácil acesso para se orientar ou parar com tranquilidade caso precise. Listei os mais próximos logo abaixo com a distância estimada!`,
      tips: [
        'Locais como estações de metrô, shoppings e parques movimentados são boas referências visuais se precisar recalcular a rota.',
        'Quer que eu verifique mais algum bairro de São Paulo antes de sair?',
      ],
      nearbyPlaces,
      smsPreview: preSms.smsText,
      askFirstTimePlace: focusName,
    };
  }

  if (asksSms) {
    return {
      id: `reply-${Date.now()}`,
      toneLabel: preSms.toneLabel,
      text: `Prontinho! Deixei seu SMS informativo preparado com calma, sem gerar nenhum alarme desnecessário: "${preSms.smsText}"`,
      tips: [
        'Você pode testar o recebimento ou abrir direto no aplicativo de SMS do seu celular logo abaixo.',
      ],
      nearbyPlaces,
      smsPreview: preSms.smsText,
      suggestSafeRouteSwitch: selectedRoute.type !== 'segura' && Boolean(safeRoute),
    };
  }

  if (mentionedRegion) {
    const regionLocations = SAO_PAULO_LOCATIONS.filter((l) => l.zone === mentionedRegion.zone);
    const regionIncidents = incidents.filter(
      (inc) =>
        inc.status !== 'resolvido' &&
        regionLocations.some((rl) =>
          normalizeText(inc.neighborhood).includes(normalizeText(rl.name))
        )
    );
    const regionZones = dangerZones.filter((z) =>
      regionLocations.some((rl) =>
        normalizeText(`${z.neighborhood} ${z.name}`).includes(normalizeText(rl.name))
      )
    );

    const hasRegionAlert = regionZones.length > 0 || regionIncidents.length > 0;
    return {
      id: `reply-${Date.now()}`,
      toneLabel: hasRegionAlert ? 'Cuidado Preventivo' : 'Atenção Leve',
      text: `${mentionedRegion.summary} É a sua primeira vez circulando por essa parte da ${mentionedRegion.zone}?`,
      tips: [
        `Principais pontos em ${mentionedRegion.zone}: ${regionLocations
          .slice(0, 5)
          .map((l) => l.name)
          .join(', ')}.`,
        'Mantenha os vidros fechados em semáforos lentos e use o áudio do GPS para manter a atenção no trânsito.',
      ],
      nearbyPlaces,
      smsPreview: preSms.smsText,
      suggestSafeRouteSwitch: selectedRoute.type !== 'segura' && Boolean(safeRoute),
      askFirstTimePlace: mentionedRegion.zone,
    };
  }

  if (asksRain) {
    return {
      id: `reply-${Date.now()}`,
      toneLabel: 'Atenção Leve',
      text: `Em dias de chuva forte em São Paulo, o mais importante é manter a calma e evitar baixadas e acessos sob viadutos das Marginais, Glicério/Tamanduateí e Av. do Estado. Buscando ruas mais altas, você segue tranquilo(a).`,
      tips: [
        'Se a água atingir metade da altura da roda, busque um ponto elevado como os listados abaixo até o nível baixar.',
        'A Defesa Civil envia boletins gratuitos por SMS quando você envia seu CEP para 40199.',
      ],
      nearbyPlaces,
      smsPreview: preSms.smsText,
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
          ? `Você já escolheu a Rota Segura (${safeRoute.safetyScore}/100, ${safeRoute.durationMin} min)! Ela prioriza avenidas amplas, iluminadas e contorna pontos mais visados.`
          : `Para ${destination.name}, a Rota Segura alcança ${safeRoute.safetyScore}/100 levando apenas cerca de ${diffMin > 0 ? `+${diffMin} min` : 'o mesmo tempo'}, evitando cruzamentos de trânsito muito parado.`,
      tips: [
        'Mesmo na rota rápida, eu e o alerta sonoro avisamos antes de qualquer zona de atenção.',
      ],
      nearbyPlaces,
      smsPreview: preSms.smsText,
      suggestSafeRouteSwitch: selectedRoute.type !== 'segura',
    };
  }

  const targetNorm = normalizeText(focusName);

  const matchedZones = dangerZones.filter((z) => {
    const zNorm = normalizeText(`${z.neighborhood} ${z.name}`);
    return zNorm.includes(targetNorm) || targetNorm.includes(normalizeText(z.neighborhood));
  });

  const matchedIncidents = incidents.filter(
    (inc) =>
      inc.status !== 'resolvido' &&
      (normalizeText(inc.neighborhood).includes(targetNorm) ||
        targetNorm.includes(normalizeText(inc.neighborhood)) ||
        normalizeText(inc.address).includes(targetNorm))
  );

  const hasCritical =
    matchedZones.some((z) => z.riskLevel === 'critico') ||
    matchedIncidents.some((i) => i.riskLevel === 'critico');
  const hasHigh =
    matchedZones.some((z) => z.riskLevel === 'alto') ||
    matchedIncidents.some((i) => i.riskLevel === 'alto');

  if (hasCritical || hasHigh) {
    const mainZone = matchedZones[0];
    const zoneName = mainZone ? mainZone.neighborhood : focusName;
    const regionLabel = mentionedSp ? ` (${mentionedSp.zone})` : '';

    return {
      id: `reply-${Date.now()}`,
      toneLabel: 'Cuidado Preventivo',
      text: `Você pode ir até ${zoneName}${regionLabel} com calma seguindo cuidados simples de rotina: essa região tem semáforos e cruzamentos movimentados${asksNight ? ' (especialmente à noite)' : ''} que pedem atenção preventiva, sem motivo para pânico. Aliás, é a sua primeira vez indo para ${zoneName}?`,
      tips: [
        mainZone?.defenseCivilTip ||
          'Mantenha vidros fechados e portas travadas principalmente ao reduzir a velocidade.',
        'Prefira esconder o celular abaixo do painel e acompanhar as curvas apenas pelo áudio do GPS.',
      ],
      nearbyPlaces,
      smsPreview: preSms.smsText,
      suggestSafeRouteSwitch: selectedRoute.type !== 'segura' && Boolean(safeRoute),
      askFirstTimePlace: zoneName,
    };
  }

  if (matchedZones.length > 0 || matchedIncidents.length > 0) {
    return {
      id: `reply-${Date.now()}`,
      toneLabel: 'Atenção Leve',
      text: `A região de ${focusName}${mentionedSp ? ` (${mentionedSp.zone})` : ''} está com circulação normal e bom movimento comercial. Basta manter cuidados simples nos semáforos. É a sua primeira vez indo por lá?`,
      tips: [
        'Mantenha vidros fechados em cruzamentos lentos e prefira orientação por voz.',
      ],
      nearbyPlaces,
      smsPreview: preSms.smsText,
      askFirstTimePlace: focusName,
    };
  }

  return {
    id: `reply-${Date.now()}`,
    toneLabel: 'Tranquilo',
    text: `Boas notícias! No acompanhamento atual, ${focusName}${mentionedSp ? ` (${mentionedSp.zone})` : ''} não concentra alertas críticos ativos nesta faixa${asksNight ? ' neste horário' : ''}. Você pode fazer uma viagem bem tranquila. É a sua primeira vez indo até esse local?`,
    tips: [
      'Cobertura ativa em todas as regiões de São Paulo: Centro, Sul, Oeste, Leste, Norte e Marginais.',
      'Deixei abaixo alguns lugares conhecidos próximos para servir de referência no seu caminho.',
    ],
    nearbyPlaces,
    smsPreview: preSms.smsText,
    askFirstTimePlace: focusName,
  };
}
