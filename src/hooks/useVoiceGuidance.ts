import { useState, useCallback, useEffect, useRef } from 'react';
import { speakNaturalPortuguese, stopPortugueseSpeech } from '../services/voiceEngine';

export function useVoiceGuidance() {
  const [enabled, setEnabled] = useState<boolean>(true);
  const [speaking, setSpeaking] = useState<boolean>(false);
  const pendingTimerRef = useRef<number | null>(null);

  // Soft notification chime using Web Audio API
  const playSoftChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5 gentle chime
      osc.frequency.setValueAtTime(659.25, now + 0.14); // E5

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);
    } catch (err) {
      console.warn('Audio synthesis not supported or blocked:', err);
    }
  }, []);

  const stop = useCallback(() => {
    if (pendingTimerRef.current !== null) {
      clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
    }
    stopPortugueseSpeech();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
  }, []);

  // Speak text warmly using natural female pt-BR voice
  const speakAlert = useCallback(
    (text: string) => {
      if (!enabled || !('speechSynthesis' in window)) return;

      stop();
      playSoftChime();

      pendingTimerRef.current = window.setTimeout(() => {
        speakNaturalPortuguese(text, {
          onStart: () => setSpeaking(true),
          onEnd: () => setSpeaking(false),
          onError: () => setSpeaking(false),
        });
      }, 300);
    },
    [enabled, playSoftChime, stop]
  );

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    voiceEnabled: enabled,
    setVoiceEnabled: setEnabled,
    speaking,
    speakAlert,
    playEmergencyTone: playSoftChime,
    stop,
  };
}
