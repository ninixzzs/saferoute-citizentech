import { DangerZone, IncidentReport, NavigationRoute } from '../types';
import { SAO_PAULO_LOCATIONS } from '../data/saoPauloLocations';
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
      smsText: `SafeRoute SP (SMS Pré-Viagem): Para ir até ${destination.name}, recomendamos atenção preventiva simples: trafegue por avenidas principais iluminadas, mantenha os vidros fechados e use o GPS por áudio. Há um desvio mais tranquilo (+ poucos min) disponível antes de iniciar.`,
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
 * Context-aware conversational advisor that answers pre-trip safety questions calmly.
 */
export function generateSafetyAssistantReply(
  question: string,
  context: AssistantContext
): AssistantReply {
  const qNorm = normalizeText(question);
  const { destination, selectedRoute, allRoutes, dangerZones, incidents } = context;

  // Detect if user asks specifically about any of the 75+ SP locations (or fallback to current destination)
  const mentionedSp = SAO_PAULO_LOCATIONS.find((loc) =>
    qNorm.includes(normalizeText(loc.name))
  );

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

  const safeRoute = allRoutes.find((r) => r.type === 'segura');
  const asksRouteCompare =
    qNorm.includes('rota') || qNorm.includes('desvio') || qNorm.includes('rapida') || qNorm.includes('melhor');
  const asksSms = qNorm.includes('sms') || qNorm.includes('mensagem');

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
      text: `Preparei o seu SMS informativo antes da saída. O texto foi escrito para orientar com calma, sem causar alarme: "${preSms.smsText}"`,
      tips: [
        'Você pode visualizar a prévia do SMS logo acima ou abrir no app de mensagens do aparelho.',
        'Sempre enviamos orientações objetivas e tranquilas antes de você ligar o carro.',
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
          ? `Você já está com a Rota Segura selecionada (${safeRoute.safetyScore}/100, ${safeRoute.durationMin} min). Ela prioriza avenidas iluminadas e contorna pontos de lentidão com histórico de ocorrências.`
          : `Para ${destination.name}, a Rota Segura tem índice ${safeRoute.safetyScore}/100 e leva cerca de ${diffMin > 0 ? `+${diffMin} min` : 'quase o mesmo tempo'} evitando cruzamentos mais visados. É uma troca simples que traz muito mais tranquilidade.`,
      tips: [
        'A escolha é sempre sua: mesmo na rota mais rápida, o app avisa antes caso haja ponto de atenção.',
        'Ative o guia por voz para não precisar olhar para a tela durante o trajeto.',
      ],
      smsPreview: preSms.smsText,
      suggestSafeRouteSwitch: selectedRoute.type !== 'segura',
    };
  }

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
      text: `Você pode ir até ${zoneName}${regionLabel} mantendo cuidados simples de prevenção. Essa área costuma ter registros de atenção em horários de trânsito lento ou semáforos — nada para gerar pânico, apenas vale redobrar a calma e usar a rota monitorada.`,
      tips: [
        mainZone?.defenseCivilTip ||
          'Mantenha os vidros fechados e portas travadas principalmente ao reduzir a velocidade.',
        'Evite deixar o celular visível perto da janela ou no suporte alto; prefira ouvir o trajeto por áudio.',
        safeRoute && selectedRoute.type !== 'segura'
          ? 'Se quiser ainda mais tranquilidade, você pode aplicar o Desvio Seguro com 1 toque abaixo.'
          : 'Mantenha distância segura do veículo à frente em cruzamentos movimentados.',
      ],
      smsPreview: preSms.smsText,
      suggestSafeRouteSwitch: selectedRoute.type !== 'segura' && Boolean(safeRoute),
    };
  }

  if (matchedZones.length > 0 || matchedIncidents.length > 0) {
    return {
      id: `reply-${Date.now()}`,
      toneLabel: 'Atenção Leve',
      text: `A região de ${targetPlace} apresenta circulação normal com pontos pontuais de movimento intenso. Tomando cuidados básicos de trânsito urbano, você realiza o percurso tranquilamente.`,
      tips: [
        'Mantenha vidros fechados ao parar em cruzamentos de grande fluxo.',
        'Deixe o áudio de navegação ativo para manter a atenção no trânsito.',
      ],
      smsPreview: preSms.smsText,
      suggestSafeRouteSwitch: false,
    };
  }

  // Neighborhood not flagged in critical zones
  return {
    id: `reply-${Date.now()}`,
    toneLabel: 'Tranquilo',
    text: mentionedSp
      ? `No monitoramento atual, ${targetPlace} (${mentionedSp.zone}) não concentra alertas críticos ativos nesta faixa. O deslocamento tende a ser tranquilo mantendo os hábitos preventivos usuais da cidade.`
      : `Para ${targetPlace}, não há alertas críticos ativos identificados agora no seu trajeto (${selectedRoute.safetyScore}/100). Você pode seguir com tranquilidade e contar com avisos em tempo real caso surja algo no caminho.`,
    tips: [
      'Mantenha sempre as portas travadas e prefira vias principais bem iluminadas à noite.',
      'Caso note qualquer situação incomum no caminho, você pode avisar a comunidade em Reportar.',
    ],
    smsPreview: preSms.smsText,
    suggestSafeRouteSwitch: false,
  };
}
