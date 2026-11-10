import { useState, useCallback, useEffect } from 'react';

export function useVoiceGuidance() {
  const [enabled, setEnabled] = useState<boolean>(true);
  const [speaking, setSpeaking] = useState<boolean>(false);

  // Play Defesa Civil Emergency Acoustic Tone using Web Audio API
  const playEmergencyTone = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // High-low alert frequencies (similar to Defesa Civil warning siren)
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.setValueAtTime(659.25, now + 0.15); // E5
      osc.frequency.setValueAtTime(880, now + 0.3); // A5
      osc.frequency.setValueAtTime(659.25, now + 0.45); // E5

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.7);
    } catch (err) {
      console.warn('Audio synthesis not supported or blocked:', err);
    }
  }, []);

  // Speak text using Web Speech API
  const speakAlert = useCallback(
    (text: string) => {
      if (!enabled || !('speechSynthesis' in window)) return;

      try {
        window.speechSynthesis.cancel(); // Cancel any ongoing speech
        playEmergencyTone();

        // Small delay to allow chime to play
        setTimeout(() => {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = 'pt-BR';
          utterance.rate = 1.05;
          utterance.pitch = 1.1;

          utterance.onstart = () => setSpeaking(true);
          utterance.onend = () => setSpeaking(false);
          utterance.onerror = () => setSpeaking(false);

          window.speechSynthesis.speak(utterance);
        }, 350);
      } catch (e) {
        console.warn('Speech synthesis error:', e);
      }
    },
    [enabled, playEmergencyTone]
  );

  const stop = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    voiceEnabled: enabled,
    setVoiceEnabled: setEnabled,
    speaking,
    speakAlert,
    playEmergencyTone,
    stop,
  };
}
