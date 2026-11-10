import { saveEncryptedStorage, loadEncryptedStorage } from './cryptoStorage';
import { PolicePostResult } from '../data/policePosts';
import { DangerZone, IncidentReport, NavigationRoute } from '../types';

const GEMINI_STORAGE_KEY = 'saferoute_gemini_key_v1';
const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash'];

let cachedUserKey: string | null = null;
let keyInitialized = false;

export async function initGeminiKey(): Promise<boolean> {
  if (!keyInitialized) {
    const stored = await loadEncryptedStorage<{ apiKey: string }>(GEMINI_STORAGE_KEY);
    if (stored?.apiKey) {
      cachedUserKey = stored.apiKey.trim();
    }
    keyInitialized = true;
  }
  return Boolean(getEffectiveGeminiKey());
}

export function getEffectiveGeminiKey(): string | null {
  const envKey = (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim();
  if (envKey && !envKey.includes('sua-chave')) return envKey;
  if (cachedUserKey && cachedUserKey.trim().length > 10) return cachedUserKey.trim();
  return null;
}

export function hasGeminiKeyConfigured(): boolean {
  return Boolean(getEffectiveGeminiKey());
}

export async function saveUserGeminiKey(apiKey: string): Promise<void> {
  const clean = apiKey.trim();
  cachedUserKey = clean;
  keyInitialized = true;
  if (!clean) {
    if (typeof window !== 'undefined') localStorage.removeItem(GEMINI_STORAGE_KEY);
    return;
  }
  await saveEncryptedStorage(GEMINI_STORAGE_KEY, { apiKey: clean });
}

export interface GeminiHistoryTurn {
  sender: 'user' | 'assistant';
  text: string;
}

export interface GeminiContextPayload {
  userName?: string;
  originName: string;
  destinationName: string;
  selectedRoute: NavigationRoute;
  dangerZones: DangerZone[];
  incidents: IncidentReport[];
  isEmergency: boolean;
  nearestPolicePosts?: PolicePostResult[];
  history: GeminiHistoryTurn[];
}

function buildSystemInstruction(ctx: GeminiContextPayload): string {
  const activeIncidents = ctx.incidents.filter((i) => i.status !== 'resolvido').slice(0, 6);
  const topZones = ctx.dangerZones
    .slice(0, 8)
    .map((z) => `- ${z.neighborhood} (${z.riskLevel}): ${z.defenseCivilTip}`)
    .join('\n');
  const incidentLines = activeIncidents
    .map((i) => `- ${i.neighborhood} (${i.address}): ${i.title} [${i.riskLevel}]`)
    .join('\n');
  const policeLines = (ctx.nearestPolicePosts || [])
    .map((p) => `- ${p.name} (${p.distanceLabel}) — ${p.address} | Tel: ${p.phone}`)
    .join('\n');

  return [
    'Você é a assistente de inteligência artificial oficial do SafeRoute SP (CitizenTech, criado por Nicolly Vilela).',
    'Responda sempre em português do Brasil, de forma calma, empática, coerente, objetiva e direta ao que o usuário perguntou.',
    'REGRAS FUNDAMENTAIS:',
    '1. NUNCA puxe assuntos não solicitados nem invente destinos ou listas que o usuário não pediu.',
    '2. NUNCA gere pânico ou alarmismo ao falar de segurança; use tom tranquilo e preventivo.',
    '3. Se souber o nome do usuário, use-o de forma natural e acolhedora.',
    '4. PROTOCOLO DE EMERGÊNCIA / ASSALTO: Caso o usuário relate estar sofrendo um assalto, roubo ou perigo imediato:',
    '   - Diga logo na primeira frase: "Respire calma e mantenha a tranquilidade, estou aqui com você."',
    '   - Se ele ainda NÃO informou onde está, peça para ele falar ou digitar o endereço/referência em segurança para localizar o posto policial mais próximo rápido e recomende ligar 190 se seguro.',
    '   - Se ele informou o endereço ou você recebeu os postos policiais próximos abaixo, liste imediatamente os postos policiais reais mais próximos com distância e endereço, além de orientar ligar 190.',
    '',
    'CONTEXTO ATUAL DA ROTA DO USUÁRIO:',
    `- Nome do usuário: ${ctx.userName || 'Ainda não informado'}`,
    `- Origem atual: ${ctx.originName} | Destino atual: ${ctx.destinationName}`,
    `- Rota selecionada: ${ctx.selectedRoute.name} (${ctx.selectedRoute.type}, índice ${ctx.selectedRoute.safetyScore}/100, ${ctx.selectedRoute.durationMin} min)`,
    `- Emergência detectada nesta mensagem: ${ctx.isEmergency ? 'SIM' : 'NÃO'}`,
    '',
    'ZONAS MONITORADAS EM SÃO PAULO:',
    topZones || '- Monitoramento ativo em todas as zonas de SP.',
    '',
    'OCORRÊNCIAS ATIVAS RECENTES:',
    incidentLines || '- Nenhuma ocorrência crítica adicional.',
    policeLines ? `\nPOSTOS POLICIAIS MAIS PRÓXIMOS CALCULADOS:\n${policeLines}` : '',
    '',
    'Mantenha respostas enxutas (idealmente 2 a 4 frases, sem markdown excessivo), claras para leitura no celular e para narração por voz.',
  ].join('\n');
}

export async function askGoogleGeminiFlash(
  userMessage: string,
  ctx: GeminiContextPayload
): Promise<{ text: string; model: string } | null> {
  const apiKey = getEffectiveGeminiKey();
  if (!apiKey) return null;

  const recentHistory = ctx.history.slice(-8).map((turn) => ({
    role: turn.sender === 'user' ? 'user' : 'model',
    parts: [{ text: turn.text }],
  }));

  const payload = {
    system_instruction: {
      parts: [{ text: buildSystemInstruction(ctx) }],
    },
    contents: [
      ...recentHistory,
      {
        role: 'user',
        parts: [{ text: userMessage }],
      },
    ],
    generationConfig: {
      temperature: ctx.isEmergency ? 0.25 : 0.55,
      maxOutputTokens: 320,
      topP: 0.9,
    },
  };

  for (const model of GEMINI_MODELS) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 8500);
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        }
      );
      window.clearTimeout(timer);

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      const candidateText: string | undefined =
        data?.candidates?.[0]?.content?.parts
          ?.map((p: { text?: string }) => p.text || '')
          .join('')
          .trim();

      if (candidateText) {
        return { text: candidateText, model };
      }
    } catch {
      window.clearTimeout(timer);
    }
  }

  return null;
}
