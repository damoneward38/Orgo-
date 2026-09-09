// Speech Synthesis and Recognition Utilities for NeuroCore

let isCurrentlySpeakingAudio = false;
let speechMuteTimer: any = null;
let lastSpeechEndedAt = 0;
let lastSpokenPhrases: string[] = [];
let activeUtterance: SpeechSynthesisUtterance | null = null;
let cachedVoices: SpeechSynthesisVoice[] = [];

export function getLastSpeechEndedAt(): number {
  return lastSpeechEndedAt;
}

function loadVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  const voices = window.speechSynthesis.getVoices();
  if (voices && voices.length > 0) {
    cachedVoices = voices;
  }
  return cachedVoices;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    loadVoices();
  };
}

export function unlockAudioContext(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.resume();
    } catch {}
  }
}

export function isNeuroCoreSpeaking(): boolean {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    return isCurrentlySpeakingAudio || window.speechSynthesis.speaking;
  }
  return isCurrentlySpeakingAudio;
}

export function speakText(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: any) => void
): () => void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Web Speech API synthesis not supported in this browser.');
    if (onStart) onStart();
    if (onEnd) setTimeout(onEnd, 1200);
    return () => {};
  }

  try {
    // Unpause Chrome speech synthesis if paused
    window.speechSynthesis.resume();
    window.speechSynthesis.cancel(); // Stop any pending speech
    if (speechMuteTimer) clearTimeout(speechMuteTimer);

    // Clean markdown/code before speaking so it sounds pristine
    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'Code block generated.')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      .replace(/[#*_~>]/g, '')
      .replace(/https?:\/\/[^\s]+/g, 'link')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) {
      if (onEnd) onEnd();
      return () => {};
    }

    // Keep history of recent spoken phrases and fragments to prevent microphone feedback loops
    const normalizedSpoken = cleanText.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
    lastSpokenPhrases.push(normalizedSpoken);
    // Also record sentences
    cleanText.split(/[.?!]+/).forEach((sent) => {
      const s = sent.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
      if (s.length > 3) lastSpokenPhrases.push(s);
    });
    if (lastSpokenPhrases.length > 20) lastSpokenPhrases = lastSpokenPhrases.slice(-20);

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.02;
    utterance.pitch = 1.04;

    // Pick best natural voice (prefer pleasant natural female English voice)
    const voices = cachedVoices.length > 0 ? cachedVoices : loadVoices();
    const femaleVoice = voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.includes('Google') ||
          v.name.includes('Natural') ||
          v.name.includes('Samantha') ||
          v.name.includes('Karen') ||
          v.name.includes('Victoria') ||
          v.name.includes('Zira') ||
          v.name.includes('Jenny') ||
          v.name.includes('Moira') ||
          v.name.toLowerCase().includes('female'))
    ) || voices.find((v) => v.lang.startsWith('en'));

    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }

    // Keep reference so Chrome garbage collector does not silence mid-speech
    activeUtterance = utterance;
    (window as any).__activeNeuroUtterance = utterance;

    utterance.onstart = () => {
      isCurrentlySpeakingAudio = true;
      if (onStart) onStart();
    };

    const handleFinish = () => {
      lastSpeechEndedAt = Date.now();
      activeUtterance = null;
      (window as any).__activeNeuroUtterance = null;
      if (speechMuteTimer) clearTimeout(speechMuteTimer);
      // Retain audio guard for 850ms after speech ends to prevent acoustic tail pickup
      speechMuteTimer = setTimeout(() => {
        isCurrentlySpeakingAudio = false;
      }, 850);
      if (onEnd) onEnd();
    };

    utterance.onend = handleFinish;
    utterance.onerror = (e) => {
      activeUtterance = null;
      (window as any).__activeNeuroUtterance = null;
      if (onError) onError(e);
      handleFinish();
    };

    // Chrome resume watchdog to prevent synthesis freeze
    window.speechSynthesis.resume();
    window.speechSynthesis.speak(utterance);

    return () => {
      window.speechSynthesis.cancel();
      isCurrentlySpeakingAudio = false;
      activeUtterance = null;
    };
  } catch (err) {
    isCurrentlySpeakingAudio = false;
    activeUtterance = null;
    if (onError) onError(err);
    if (onEnd) onEnd();
    return () => {};
  }
}

export function stopSpeech(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
  isCurrentlySpeakingAudio = false;
  activeUtterance = null;
  if (speechMuteTimer) clearTimeout(speechMuteTimer);
}

export interface SpeechRecognitionHook {
  start: () => void;
  stop: () => void;
  isSupported: boolean;
  setContinuousMode?: (enabled: boolean) => void;
}

export interface ContinuousSpeechOptions {
  onTranscript: (finalText: string) => void;
  onInterim?: (interimText: string) => void;
  onStateChange?: (listening: boolean) => void;
  onError?: (err: any) => void;
}

export function createContinuousSpeechEngine(options: ContinuousSpeechOptions): {
  start: () => void;
  stop: () => void;
  setContinuous: (enabled: boolean) => void;
  startContinuous: () => void;
  isSupported: boolean;
  isActive: () => boolean;
  isListening: () => boolean;
} {
  if (typeof window === 'undefined') {
    return {
      start: () => {},
      stop: () => {},
      setContinuous: () => {},
      startContinuous: () => {},
      isSupported: false,
      isActive: () => false,
      isListening: () => false,
    };
  }

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return {
      start: () => {},
      stop: () => {},
      setContinuous: () => {},
      startContinuous: () => {},
      isSupported: false,
      isActive: () => false,
      isListening: () => false,
    };
  }

  let recognition: any = null;
  let isContinuous = false;
  let shouldBeListening = false;
  let restartTimeout: any = null;
  let isCurrentlyActive = false;

  const initRecognition = () => {
    if (recognition) {
      try {
        recognition.abort();
      } catch (e) {}
    }

    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      isCurrentlyActive = true;
      if (options.onStateChange) options.onStateChange(true);
    };

    recognition.onresult = (event: any) => {
      // SHIELD: Ignore any audio picked up while NeuroCore is speaking or reverberating in room
      const timeSinceSpeechEnded = Date.now() - lastSpeechEndedAt;
      if (isNeuroCoreSpeaking() || timeSinceSpeechEnded < 900) {
        return;
      }

      let interim = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      const trimmedFinal = finalTranscript.trim();

      // Double shield: check if the transcript is an echo of what was just spoken
      if (trimmedFinal) {
        // Discard ultra short single-character noise
        if (trimmedFinal.length < 2) return;

        const normalizedInput = trimmedFinal.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
        const inputWords = normalizedInput.split(' ').filter((w) => w.length > 2);

        const isEcho = lastSpokenPhrases.some((phrase) => {
          if (!phrase || phrase.length < 4) return false;
          // Substring match
          if (normalizedInput.includes(phrase) || phrase.includes(normalizedInput)) return true;
          // Word overlap match: if more than 50% of the recognized words exist in a recent spoken phrase
          if (inputWords.length >= 2) {
            const matchedWords = inputWords.filter((w) => phrase.includes(w));
            if (matchedWords.length / inputWords.length >= 0.5) return true;
          }
          return false;
        });

        if (isEcho) {
          console.log('[SpeechRecognition] Suppressed acoustic feedback loop:', trimmedFinal);
          return;
        }

        options.onTranscript(trimmedFinal);
      } else if (interim && options.onInterim) {
        options.onInterim(interim);
      }
    };

    recognition.onerror = (event: any) => {
      // Ignore benign 'no-speech' or 'aborted' errors in continuous mode
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        if (options.onError) options.onError(event.error);
      }
    };

    recognition.onend = () => {
      isCurrentlyActive = false;
      // If continuous mode is enabled or user wants it listening, immediately re-arm!
      if (shouldBeListening || isContinuous) {
        if (restartTimeout) clearTimeout(restartTimeout);
        restartTimeout = setTimeout(() => {
          if (shouldBeListening || isContinuous) {
            try {
              recognition.start();
            } catch (err) {
              // If already started, ignore
            }
          }
        }, 200);
      } else {
        if (options.onStateChange) options.onStateChange(false);
      }
    };
  };

  initRecognition();

  const start = () => {
    shouldBeListening = true;
    if (restartTimeout) clearTimeout(restartTimeout);
    try {
      recognition.start();
    } catch (e) {
      // May throw if already active
      try {
        initRecognition();
        recognition.start();
      } catch (err2) {
        console.warn('Recognition start caught:', err2);
      }
    }
  };

  const stop = () => {
    shouldBeListening = false;
    isContinuous = false;
    if (restartTimeout) clearTimeout(restartTimeout);
    try {
      recognition.stop();
    } catch (e) {}
    isCurrentlyActive = false;
    if (options.onStateChange) options.onStateChange(false);
  };

  const setContinuous = (enabled: boolean) => {
    isContinuous = enabled;
    if (enabled) {
      start();
    }
  };

  const startContinuous = () => {
    setContinuous(true);
  };

  return {
    start,
    stop,
    setContinuous,
    startContinuous,
    isSupported: true,
    isActive: () => isCurrentlyActive,
    isListening: () => isCurrentlyActive,
  };
}

export function createSpeechRecognizer(
  onTranscript: (text: string) => void,
  onStateChange?: (listening: boolean) => void,
  onError?: (err: any) => void
): SpeechRecognitionHook {
  if (typeof window === 'undefined') {
    return { start: () => {}, stop: () => {}, isSupported: false };
  }

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return { start: () => {}, stop: () => {}, isSupported: false };
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  recognition.onstart = () => {
    if (onStateChange) onStateChange(true);
  };

  recognition.onresult = (event: any) => {
    if (event.results && event.results[0] && event.results[0][0]) {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
    }
  };

  recognition.onerror = (event: any) => {
    if (onError) onError(event.error);
    if (onStateChange) onStateChange(false);
  };

  recognition.onend = () => {
    if (onStateChange) onStateChange(false);
  };

  return {
    start: () => {
      try {
        recognition.start();
      } catch (err) {
        console.warn('Speech recognition start failed:', err);
      }
    },
    stop: () => {
      try {
        recognition.stop();
      } catch (err) {
        console.warn('Speech recognition stop failed:', err);
      }
    },
    isSupported: true,
  };
}
