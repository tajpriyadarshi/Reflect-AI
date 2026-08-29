import { useState, useEffect, useRef, useCallback } from 'react';

interface UseSpeechRecognitionOptions {
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

export function useSpeechRecognition(options?: UseSpeechRecognitionOptions) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setIsSupported(Boolean(SpeechRecognition));
    }
  }, []);

  // Timer for duration tracking while recording
  useEffect(() => {
    if (isListening) {
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isListening]);

  const startListening = useCallback(() => {
    setError(null);
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser. Please use Google Chrome or a modern browser.');
      options?.onError?.('Speech recognition is not supported in this browser.');
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        let currentFinal = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptSegment = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            currentFinal += transcriptSegment + ' ';
          } else {
            currentInterim += transcriptSegment;
          }
        }

        if (currentFinal) {
          setTranscript((prev) => {
            const updated = (prev + ' ' + currentFinal).trim();
            options?.onResult?.(updated, true);
            return updated;
          });
        }
        setInterimTranscript(currentInterim);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error event:', event.error);
        if (event.error === 'no-speech') {
          // Benign error when pausing, keep listening or allow retry
          return;
        }
        if (event.error === 'not-allowed') {
          setError('Microphone access was denied. Please allow microphone permissions in your browser settings.');
        } else {
          setError(`Voice input error: ${event.error || 'Unknown error'}`);
        }
        setIsListening(false);
        options?.onError?.(event.error);
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      setError(err?.message || 'Failed to start microphone.');
      setIsListening(false);
    }
  }, [options]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.warn('Error stopping speech recognition:', err);
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setRecordingSeconds(0);
    setError(null);
  }, []);

  return {
    isListening,
    transcript,
    setTranscript,
    interimTranscript,
    recordingSeconds,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    error,
  };
}
