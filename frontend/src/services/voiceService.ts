/**
 * Adil's AI Voice Service
 * =======================
 * Clean, robust abstraction for real-time Conversational Voice:
 * - Speech-to-Text (STT) using Web Speech API with continuous interim results & silence detection.
 * - Text-to-Speech (TTS) using SpeechSynthesis with natural cadence, interruption, and audio amplitude.
 * - Multilingual support (English, Urdu, Hindi, Roman Urdu/Hinglish).
 */

export type VoiceState = 'Connecting' | 'Listening' | 'Thinking' | 'Speaking' | 'Processing';

export interface VoiceServiceOptions {
  onStateChange?: (state: VoiceState) => void;
  onInterimTranscript?: (text: string) => void;
  onFinalTranscript?: (text: string) => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onAudioLevel?: (level: number) => void; // 0.0 to 1.0 for orb audio-reactivity
}

export class VoiceService {
  private recognition: any = null;
  private isListeningActive = false;
  private isSpeakingActive = false;
  private silenceTimer: any = null;
  private audioPulseInterval: any = null;
  private currentLanguage: string = 'en-US'; // default multilingual-friendly English
  private options: VoiceServiceOptions;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private speechSupported: boolean = false;
  private synthSupported: boolean = false;
  private currentTranscriptBuffer = '';
  private shouldKeepListening = false;

  constructor(options: VoiceServiceOptions = {}) {
    this.options = options;
    this.initSpeechRecognition();
    this.initSpeechSynthesis();
  }

  // ---- Speech Recognition (STT) ----

  private initSpeechRecognition() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.speechSupported = true;
      try {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = this.currentLanguage;
        rec.maxAlternatives = 1;

        rec.onstart = () => {
          this.isListeningActive = true;
          this.options.onStateChange?.('Listening');
        };

        rec.onresult = (event: any) => {
          let interim = '';
          let final = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const result = event.results[i];
            const transcript = result[0].transcript;
            if (result.isFinal) {
              final += transcript;
            } else {
              interim += transcript;
            }
          }

          const currentText = (final || interim).trim();
          if (currentText) {
            this.currentTranscriptBuffer = currentText;
            this.options.onInterimTranscript?.(currentText);

            // Natural interruption: if user starts speaking while AI is speaking, interrupt AI immediately
            if (this.isSpeakingActive) {
              this.interruptSpeaking();
            }

            // Reset silence timer on new speech tokens
            if (this.silenceTimer) clearTimeout(this.silenceTimer);
            this.silenceTimer = setTimeout(() => {
              if (this.currentTranscriptBuffer.trim()) {
                const completeSentence = this.currentTranscriptBuffer.trim();
                this.currentTranscriptBuffer = '';
                this.options.onFinalTranscript?.(completeSentence);
              }
            }, 1400); // 1.4 seconds of silence triggers automatic submission
          }
        };

        rec.onerror = (event: any) => {
          if (event.error !== 'no-speech' && event.error !== 'aborted') {
            console.warn('[Adil Voice STT] Error:', event.error);
          }
        };

        rec.onend = () => {
          this.isListeningActive = false;
          if (this.shouldKeepListening && !this.isSpeakingActive) {
            try {
              rec.start();
            } catch {
              // Ignore restart collision
            }
          }
        };

        this.recognition = rec;
      } catch (err) {
        console.warn('[Adil Voice STT] Failed to initialize:', err);
        this.speechSupported = false;
      }
    } else {
      this.speechSupported = false;
    }
  }

  public setLanguage(lang: string) {
    this.currentLanguage = lang;
    if (this.recognition) {
      const wasListening = this.isListeningActive;
      if (wasListening) this.recognition.stop();
      this.recognition.lang = lang;
      if (wasListening) {
        setTimeout(() => {
          try { this.recognition.start(); } catch {}
        }, 150);
      }
    }
  }

  public getLanguage(): string {
    return this.currentLanguage;
  }

  public isSTTSupported(): boolean {
    return this.speechSupported;
  }

  public isTTSSupported(): boolean {
    return this.synthSupported;
  }

  public startListening() {
    if (!this.speechSupported || !this.recognition) return;
    this.shouldKeepListening = true;
    if (!this.isListeningActive) {
      try {
        this.currentTranscriptBuffer = '';
        this.recognition.start();
        this.options.onStateChange?.('Listening');
      } catch (err) {
        // May already be active
      }
    }
  }

  public stopListening() {
    this.shouldKeepListening = false;
    if (this.silenceTimer) clearTimeout(this.silenceTimer);
    if (this.recognition && this.isListeningActive) {
      try {
        this.recognition.stop();
      } catch {}
    }
    this.isListeningActive = false;
  }

  // ---- Text-to-Speech (TTS) ----

  private initSpeechSynthesis() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synthSupported = true;
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
      window.speechSynthesis.getVoices();
    }
  }

  private pickBestVoice(): SpeechSynthesisVoice | null {
    if (!this.synthSupported) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    const preferredVoices = [
      'Google US English',
      'Google UK English Female',
      'Microsoft Jenny Online (Natural)',
      'Microsoft Guy Online (Natural)',
      'Microsoft Aria Online (Natural)',
      'Samantha',
      'Daniel',
      'Alex'
    ];

    for (const name of preferredVoices) {
      const found = voices.find(v => v.name.includes(name) || v.name === name);
      if (found) return found;
    }

    const enVoice = voices.find(v => v.lang.startsWith('en'));
    return enVoice || voices[0] || null;
  }

  public speak(
    text: string,
    onStartCallback?: () => void,
    onEndCallback?: () => void
  ) {
    if (!this.synthSupported || !text) {
      onEndCallback?.();
      return;
    }

    this.interruptSpeaking();

    const cleanText = text
      .replace(/\[INTERVIEW_COMPLETE\]/g, '')
      .replace(/\*+/g, '')
      .replace(/<[^>]+>/g, '')
      .trim();

    if (!cleanText) {
      onEndCallback?.();
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(cleanText);
      const voice = this.pickBestVoice();
      if (voice) utterance.voice = voice;

      utterance.rate = 1.02;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        this.isSpeakingActive = true;
        this.options.onStateChange?.('Speaking');
        this.options.onSpeechStart?.();
        onStartCallback?.();
        this.startAudioLevelSimulation();
      };

      utterance.onend = () => {
        this.finishSpeaking(onEndCallback);
      };

      utterance.onerror = (err) => {
        console.warn('[Adil Voice TTS] Synthesis warning:', err);
        this.finishSpeaking(onEndCallback);
      };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('[Adil Voice TTS] Speak failed:', err);
      this.finishSpeaking(onEndCallback);
    }
  }

  private finishSpeaking(onEndCallback?: () => void) {
    this.isSpeakingActive = false;
    this.stopAudioLevelSimulation();
    this.currentUtterance = null;
    this.options.onAudioLevel?.(0);
    this.options.onSpeechEnd?.();
    onEndCallback?.();

    // After AI finishes speaking, automatically resume listening for user's response
    if (this.shouldKeepListening) {
      this.options.onStateChange?.('Listening');
      this.startListening();
    }
  }

  /**
   * Natural interruption: halts Adil's AI speech immediately
   */
  public interruptSpeaking() {
    if (this.synthSupported && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    this.isSpeakingActive = false;
    this.stopAudioLevelSimulation();
    this.options.onAudioLevel?.(0);
    this.currentUtterance = null;
  }

  private startAudioLevelSimulation() {
    this.stopAudioLevelSimulation();
    let tick = 0;
    this.audioPulseInterval = setInterval(() => {
      tick += 0.2;
      const baseWave = (Math.sin(tick * 2.5) + Math.cos(tick * 4.1)) / 2;
      const noise = (Math.random() - 0.5) * 0.35;
      const envelope = Math.max(0.15, Math.min(1.0, 0.45 + baseWave * 0.35 + noise));
      this.options.onAudioLevel?.(envelope);
    }, 45);
  }

  private stopAudioLevelSimulation() {
    if (this.audioPulseInterval) {
      clearInterval(this.audioPulseInterval);
      this.audioPulseInterval = null;
    }
  }

  public destroy() {
    this.stopListening();
    this.interruptSpeaking();
    if (this.silenceTimer) clearTimeout(this.silenceTimer);
  }
}
