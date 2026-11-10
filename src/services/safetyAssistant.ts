import { DangerZone, IncidentReport, NavigationRoute } from '../types';
import { SAO_PAULO_LOCATIONS, SaoPauloZone } from '../data/saoPauloLocations';
import { LocationSuggestion } from './routingService';

export interface AssistantReply {
  id: string;
  toneLabel: 'Tranquilo' | 'Atenção Leve' | 'Cuidado Preventivo';
  text: string;
  tips: string[];
  smsPreview: string;
  suggestSafeRouteSwitch?: boolean;
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

const REGION_KEYWORDS: { zone: SaoPauloZone; aliases: string[]; summary: string }[] = [
  {
    zone: 'Zona Sul',
    aliases: ['zona sul', 'sul de sp', 'regiao sul'],
    summary:
      'Na Zona Sul (como Vila Mariana, Moema, Santo Amaro, Jabaquara, Campo Limpo, Capão Redondo e Grajaú), o deslocamento flui bem pela maioria dos corredores principais. Em trechos como Capão Redondo, Estrada de Itapecerica e cruzamentos das avenidas Santo Amaro, Berrini e Washington Luís nos horários de pico, recomenda-se atenção preventiva simples nos semáforos.',
  },
  {
    zone: 'Centro',
    aliases: ['centro', 'regiao central', 'centro historico'],
    summary:
      'No Centro (Sé, República, Luz, Santa Ifigênia, Brás, Liberdade, Consolação e Bela Vista), o movimento intenso de pedestres e cruzamentos lentos pede cuidado preventivo ao parar no trânsito, especialmente perto de grandes estações e viadutos. Já vias iluminadas e o contorno pelo corredor 23 de Maio ou Av. Paulista mantêm ótima previsibilidade.',
  },
  {
    zone: 'Zona Oeste',
    aliases: ['zona oeste', 'regiao oeste', 'oeste de sp'],
    summary:
      'A Zona Oeste (Pinheiros, Lapa, Perdizes, Butantã, Vila Leopoldina, Faria Lima e Rebouças) costuma apresentar boa circulação geral. Os pontos que pedem maior atenção calma são os afunilamentos em horários de pico nas avenidas Rebouças, Henrique Schaumann, Francisco Matarazzo e alças da Ponte Eusébio Matoso.',
  },
  {
    zone: 'Zona Leste',
    aliases: ['zona leste', 'regiao leste', 'leste de sp'],
    summary:
      'Na Zona Leste (Tatuapé, Mooca, Penha, Vila Prudente, Itaquera e São Mateus), o tráfego pelos grandes eixos como Radial Leste, Salim Farah Maluf, Anhaia Mello, Celso Garcia e Aricanduva exige atenção tranquila em retenções sob viadutos e semáforos extensos — mantendo vidros fechados e orientação por áudio, você segue com segurança.',
  },
  {
    zone: 'Zona Norte',
    aliases: ['zona norte', 'regiao norte', 'norte de sp'],
    summary:
      'Na Zona Norte (Santana, Vila Guilherme, Tucuruvi e Freguesia do Ó), os principais corredores como Av. Cruzeiro do Sul, Ataliba Leonel, Caetano Álvares e Av. Otaviano Alves de Lima são bem movimentados. Nos acessos próximos à Rodoviária do Tietê e semáforos de saída das pontes, vale manter o celular fora de suportes visíveis.',
  },
  {
    zone: 'Marginais e Pontes',
    aliases: ['marginais', 'marginal', 'pontes', 'vias expressas', 'tiete', 'pinheiros'],
    summary:
      'Nas Marginais Tietê e Pinheiros e em pontes como Casa Verde, Cidade Universitária, Jaguaré e Morumbi, o ponto principal de atenção são alças de saída e retenções sob pontilhões, além de pontos de chuva forte. Mantenha distância do veículo à frente e prefira usar o GPS apenas por voz.',
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
 * Instant, zero-delay context-aware safety advisor covering all regions of São Paulo calmly.
 */
export function generateSafetyAssistantReply(
  question: string,
  context: AssistantContext
): AssistantReply {
  const qNorm = normalizeText(question);
  const { destination, selectedRoute, allRoutes, dangerZones, incidents } = context;

  // 1. Match specific neighborhood or corridor (longest name first to prefer specific streets like "Av. Paulista")
  const sortedLocations = [...SAO_PAULO_LOCATIONS].sort(
    (a, b) => b.name.length - a.name.length
  );
  const mentionedSp = sortedLocations.find((loc) =>
    qNorm.includes(normalizeText(loc.name))
  );

  // 2. Match region if no single specific neighborhood was matched
  const mentionedRegion = !mentionedSp
    ? REGION_KEYWORDS.find((reg) => reg.aliases.some((alias) => qNorm.includes(alias)))
    : undefined;

  const safeRoute = allRoutes.find((r) => r.type === 'segura');
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

  if (asksSms) {
    return {
      id: `reply-${Date.now()}`,
      toneLabel: preSms.toneLabel,
      text: `Aqui está seu SMS informativo pronto para enviar ou ler antes da saída — redigido em tom sereno, sem alarmismo: "${preSms.smsText}"`,
      tips: [
        'Use o cartão de SMS abaixo para testar o recebimento ou abrir direto no app de mensagens do celular.',
        'Sempre que você alterar origem ou destino, o SMS pré-viagem é atualizado na hora.',
      ],
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
      text: mentionedRegion.summary,
      tips: [
        `Locais acompanhados em ${mentionedRegion.zone}: ${regionLocations
          .slice(0, 6)
          .map((l) => l.name)
          .join(', ')} e vias adjacentes.`,
        'Mantenha vidros fechados em semáforos lentos e evite apoiar o celular perto da janela.',
        'Ative o guia por voz para percorrer toda a região mantendo os olhos apenas no trânsito.',
      ],
      smsPreview: preSms.smsText,
      suggestSafeRouteSwitch: selectedRoute.type !== 'segura' && Boolean(safeRoute),
    };
  }

  if (asksRain) {
    return {
      id: `reply-${Date.now()}`,
      toneLabel: 'Atenção Leve',
      text: `Em dias de chuva forte em São Paulo, o cuidado principal é evitar baixadas e acessos sob viadutos das Marginais Tietê e Pinheiros, Glicério/Tamanduateí e Av. do Estado. O percurso segue tranquilo escolhendo corredores elevados.`,
      tips: [
        'Se a água atingir metade da altura da roda, não avance — busque uma via lateral elevada.',
        'Você também pode acompanhar comunicados oficiais da Defesa Civil enviando seu CEP por SMS gratuito para 40199.',
      ],
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
          ? `Você já está com a Rota Segura ativa (${safeRoute.safetyScore}/100, ${safeRoute.durationMin} min). Ela prioriza avenidas iluminadas e contorna pontos de lentidão em todas as regiões.`
          : `Para ${destination.name}, a Rota Segura tem índice ${safeRoute.safetyScore}/100 e leva cerca de ${diffMin > 0 ? `+${diffMin} min` : 'quase o mesmo tempo'} evitando cruzamentos mais visados. É uma troca simples que traz tranquilidade extra.`,
      tips: [
        'Mesmo se optar pela rota mais rápida, os alertas de aproximação avisam você com calma antes de entrar em áreas de atenção.',
        'No celular, deixe a opção Auto ON ligada para o desvio acontecer automaticamente se surgir algo na via.',
      ],
      smsPreview: preSms.smsText,
      suggestSafeRouteSwitch: selectedRoute.type !== 'segura',
    };
  }

  const targetPlace = mentionedSp ? mentionedSp.name : destination.name;
  const targetNorm = normalizeText(targetPlace);

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
    const zoneName = mainZone ? mainZone.neighborhood : targetPlace;
    const regionLabel = mentionedSp ? ` (${mentionedSp.zone})` : '';

    return {
      id: `reply-${Date.now()}`,
      toneLabel: 'Cuidado Preventivo',
      text: `Você pode se deslocar até ${zoneName}${regionLabel} mantendo cuidados simples de prevenção. Essa região registra maior atenção em semáforos e horários de lentidão${asksNight ? ' (especialmente à noite)' : ''} — não precisa se assustar, apenas redobre a tranquilidade com as medidas abaixo.`,
      tips: [
        mainZone?.defenseCivilTip ||
          'Mantenha os vidros fechados e portas travadas principalmente ao reduzir a velocidade.',
        'Prefira ocultar o celular abaixo da linha do painel e seguir pelas orientações por voz.',
        safeRoute && selectedRoute.type !== 'segura'
          ? 'Você pode ativar o Desvio Seguro agora mesmo pelo botão abaixo antes de partir.'
          : 'Mantenha distância segura do veículo à frente para ter espaço de manobra em cruzamentos.',
      ],
      smsPreview: preSms.smsText,
      suggestSafeRouteSwitch: selectedRoute.type !== 'segura' && Boolean(safeRoute),
    };
  }

  if (matchedZones.length > 0 || matchedIncidents.length > 0) {
    return {
      id: `reply-${Date.now()}`,
      toneLabel: 'Atenção Leve',
      text: `A região de ${targetPlace}${mentionedSp ? ` (${mentionedSp.zone})` : ''} está com circulação regular e movimento intenso em alguns cruzamentos. Com cuidados básicos de trânsito urbano, seu trajeto segue tranquilo.`,
      tips: [
        'Mantenha vidros fechados ao aguardar semáforos em vias de grande fluxo.',
        'Deixe o áudio da navegação ligado para evitar distrações na tela.',
      ],
      smsPreview: preSms.smsText,
      suggestSafeRouteSwitch: false,
    };
  }

  return {
    id: `reply-${Date.now()}`,
    toneLabel: 'Tranquilo',
    text: mentionedSp
      ? `No monitoramento atual, ${targetPlace} (${mentionedSp.zone}) não apresenta alertas críticos concentrados agora${asksNight ? ' para este período' : ''}. O percurso tende a ser tranquilo mantendo os hábitos preventivos usuais da cidade.`
      : `Analisei sua pergunta para toda a malha de São Paulo${destination.name ? ` e seu destino (${destination.name}, segurança ${selectedRoute.safetyScore}/100)` : ''}: não há alertas críticos concentrados neste momento. Você pode seguir viagem com calma e receberá avisos preventivos caso surja qualquer ocorrência no caminho.`,
    tips: [
      'Cobertura ativa em todas as regiões de São Paulo: Centro, Zonas Sul, Oeste, Leste, Norte e Marginais.',
      'Mantenha sempre as portas travadas, prefira vias iluminadas à noite e conte com nosso SMS informativo antes de partir.',
    ],
    smsPreview: preSms.smsText,
    suggestSafeRouteSwitch: false,
  };
}
