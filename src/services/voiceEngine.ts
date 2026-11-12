const PREFERRED_FEMALE_PATTERNS = [
  'francisca',
  'leticia',
  'letícia',
  'thalita',
  'google português do brasil',
  'google português',
  'google portugues',
  'neural',
  'natural',
  'luciana',
  'vitoria',
  'vitória',
  'fernanda',
  'camila',
  'helena',
  'raquel',
  'maria',
  'joana',
  'manuela',
  'isabela',
  'brazil female',
  'pt-br-standard',
];

const EXCLUDED_MALE_PATTERNS = [
  'daniel',
  'ricardo',
  'felipe',
  'antonio',
  'antônio',
  'fabio',
  'fábio',
  'duarte',
  'tiago',
  'cristiano',
  'humberto',
  'julio',
  'júlio',
];

let cachedVoices: SpeechSynthesisVoice[] = [];
let listenerAttached = false;

function refreshVoiceCache(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    cachedVoices = voices;
  }
  if (!listenerAttached && 'onvoiceschanged' in window.speechSynthesis) {
    listenerAttached = true;
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      const updated = window.speechSynthesis.getVoices();
      if (updated.length > 0) cachedVoices = updated;
    });
  }
  return cachedVoices;
}

/**
 * Picks the most natural, gentle female Portuguese voice available on the user's device.
 */
export function pickWarmFemalePortugueseVoice(): SpeechSynthesisVoice | null {
  const voices = refreshVoiceCache();
  if (voices.length === 0) return null;

  const ptVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('pt'));
  if (ptVoices.length === 0) return null;

  const ptBrVoices = ptVoices.filter((v) => v.lang.toLowerCase().includes('br'));
  const pool = ptBrVoices.length > 0 ? ptBrVoices : ptVoices;

  // Prefer named natural female neural/cloud voices first
  for (const pattern of PREFERRED_FEMALE_PATTERNS) {
    const onlineMatch = pool.find(
      (v) => v.name.toLowerCase().includes(pattern) && v.localService === false
    );
    if (onlineMatch) return onlineMatch;

    const anyMatch = pool.find((v) => v.name.toLowerCase().includes(pattern));
    if (anyMatch) return anyMatch;
  }

  // Fallback: pick any pt voice not explicitly marked as male
  const nonMale = pool.find(
    (v) => !EXCLUDED_MALE_PATTERNS.some((m) => v.name.toLowerCase().includes(m))
  );
  return nonMale || pool[0];
}

export interface SpeakCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: () => void;
}

/**
 * Speaks Portuguese text at a calm, soothing pace using a warm female neural voice when available.
 * Implements low-latency chunking so audio starts immediately on the first phrase.
 */
export function speakNaturalPortuguese(
  rawText: string,
  callbacks?: SpeakCallbacks
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    callbacks?.onError?.();
    return;
  }

  try {
    window.speechSynthesis.cancel();

    // Soften symbols for natural spoken pauses
    const cleanSpeech = rawText
      .replace(/·|•/g, ',')
      .replace(/\s*\([^)]*m\)/g, '') // keep cadence fluid
      .replace(/\s{2,}/g, ' ')
      .trim();

    if (!cleanSpeech) {
      callbacks?.onEnd?.();
      return;
    }

    // Split sentences for immediate streaming start without browser preparation delay
    const sentences = cleanSpeech
      .split(/(?<=[.?!])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const femaleVoice = pickWarmFemalePortugueseVoice();
    let started = false;

    sentences.forEach((sentence, idx) => {
      const utterance = new SpeechSynthesisUtterance(sentence);
      utterance.lang = 'pt-BR';
      utterance.rate = 0.96;
      utterance.pitch = 1.02;
      utterance.volume = 0.95;

      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }

      if (idx === 0) {
        utterance.onstart = () => {
          started = true;
          callbacks?.onStart?.();
        };
      }

      if (idx === sentences.length - 1) {
        utterance.onend = () => callbacks?.onEnd?.();
      }

      utterance.onerror = () => {
        if (!started) callbacks?.onError?.();
      };

      window.speechSynthesis.speak(utterance);
    });

    // Guard against Chrome speech pause bug
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  } catch {
    callbacks?.onError?.();
  }
}

export function stopPortugueseSpeech(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
