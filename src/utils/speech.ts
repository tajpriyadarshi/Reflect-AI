// Browser Speech Synthesis and Speech Recognition utility

export interface SpeechRecognitionHookResult {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  error: string | null;
}

// Check speech recognition support
export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
}

// Check speech synthesis support
export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

// Clean markdown text for natural speech synthesis
export function cleanMarkdownForSpeech(text: string): string {
  return text
    .replace(/#{1,6}\s?/g, '') // remove headers
    .replace(/\*\*(.*?)\*\*/g, '$1') // bold
    .replace(/\*(.*?)\*/g, '$1') // italic
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // links
    .replace(/`{1,3}(.*?)`{1,3}/g, '$1') // code
    .replace(/>\s?/g, '') // blockquotes
    .replace(/[-*+]\s+/g, '. ') // list items to pauses
    .replace(/\n+/g, ' ') // newlines
    .trim();
}

let activeUtterance: SpeechSynthesisUtterance | null = null;

export function speakText(
  text: string,
  options?: {
    rate?: number;
    pitch?: number;
    onEnd?: () => void;
    onError?: (err: any) => void;
    onStart?: () => void;
  }
): boolean {
  if (!isSpeechSynthesisSupported()) {
    console.warn('Speech synthesis not supported in this browser.');
    return false;
  }

  // Cancel any existing playback
  window.speechSynthesis.cancel();

  const cleaned = cleanMarkdownForSpeech(text);
  if (!cleaned) return false;

  const utterance = new SpeechSynthesisUtterance(cleaned);
  utterance.rate = options?.rate ?? 0.95; // slightly gentle, calm pace for journaling
  utterance.pitch = options?.pitch ?? 1.0;

  // Try to pick a natural, gentle voice if available
  const voices = window.speechSynthesis.getVoices();
  const naturalVoice = voices.find(
    (v) =>
      v.lang.startsWith('en') &&
      (v.name.includes('Natural') ||
        v.name.includes('Google') ||
        v.name.includes('Samantha') ||
        v.name.includes('Karen') ||
        v.name.includes('Daniel') ||
        v.name.includes('Moira') ||
        v.name.includes('Serena'))
  ) || voices.find((v) => v.lang.startsWith('en'));

  if (naturalVoice) {
    utterance.voice = naturalVoice;
  }

  if (options?.onStart) utterance.onstart = options.onStart;
  if (options?.onEnd) utterance.onend = options.onEnd;
  if (options?.onError) utterance.onerror = options.onError;

  activeUtterance = utterance;
  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopSpeaking(): void {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
    activeUtterance = null;
  }
}

export function pauseSpeaking(): void {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.pause();
  }
}

export function resumeSpeaking(): void {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.resume();
  }
}
