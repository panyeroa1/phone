import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { MODEL_NAME } from '../constants';
import { createPcmBlob, base64ToUint8Array, decodeAudioData } from '../utils/audio';

export type ConnectionState = 'disconnected' | 'ringing' | 'connecting' | 'connected';

interface UseLiveCallProps {
  systemInstruction: string;
  voiceName: string;
}

interface UseLiveCallReturn {
  connectionState: ConnectionState;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  volumeLevel: number; // 0.0 to 1.0 for visualization
  error: string | null;
}

export const useLiveCall = ({ systemInstruction, voiceName }: UseLiveCallProps): UseLiveCallReturn => {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [volumeLevel, setVolumeLevel] = useState(0);
  
  // Refs for audio handling to avoid re-renders
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const isPlayingRef = useRef(false);
  const nextStartTimeRef = useRef(0);
  
  // Refs for connection management
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const ringingTimeoutRef = useRef<number | null>(null);
  
  // Refs for silence detection
  const lastUserInteractionRef = useRef<number>(0);
  const silenceIntervalRef = useRef<number | null>(null);
  
  // API Session
  const sessionRef = useRef<any>(null); 
  const clientRef = useRef<GoogleGenAI | null>(null);

  // Initialize GenAI client
  useEffect(() => {
    if (process.env.API_KEY) {
      clientRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY });
    } else {
      setError("API Key not found. Please check your environment configuration.");
    }
  }, []);

  const playNextBuffer = useCallback(() => {
    if (!outputAudioContextRef.current) return;
    
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      return;
    }

    isPlayingRef.current = true;
    const buffer = audioQueueRef.current.shift();
    if (!buffer) return;

    const source = outputAudioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(outputAudioContextRef.current.destination);

    const currentTime = outputAudioContextRef.current.currentTime;
    // Ensure we schedule at least slightly in the future if we fell behind
    const startTime = Math.max(nextStartTimeRef.current, currentTime);
    
    source.start(startTime);
    nextStartTimeRef.current = startTime + buffer.duration;

    source.onended = () => {
      playNextBuffer();
    };
  }, []);

  const queueAudio = useCallback((buffer: AudioBuffer) => {
    audioQueueRef.current.push(buffer);
    if (!isPlayingRef.current) {
      playNextBuffer();
    }
  }, [playNextBuffer]);

  // Defined before connect to avoid "variable used before declaration" error
  const disconnect = useCallback(async () => {
    // 0. Stop Ringtone and Ringing Timeout
    if (ringingTimeoutRef.current) {
        clearTimeout(ringingTimeoutRef.current);
        ringingTimeoutRef.current = null;
    }
    if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current.currentTime = 0;
        ringtoneRef.current = null;
    }

    // Stop Silence Detection
    if (silenceIntervalRef.current) {
      clearInterval(silenceIntervalRef.current);
      silenceIntervalRef.current = null;
    }

    // 1. Close Session
    if (sessionRef.current) {
        try {
            await sessionRef.current;
        } catch (e) { /* ignore */ }
    }
    
    // 2. Stop Microphone
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    // 3. Disconnect Audio Nodes
    if (inputSourceRef.current) {
        inputSourceRef.current.disconnect();
        inputSourceRef.current = null;
    }
    if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
    }

    // 4. Close Contexts
    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
      await inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
      await outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }

    setConnectionState('disconnected');
    setVolumeLevel(0);
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    sessionRef.current = null;
  }, []);

  const connect = useCallback(async () => {
    if (!clientRef.current) {
      setError("GenAI client not initialized.");
      return;
    }

    try {
      setConnectionState('ringing');
      setError(null);
      
      // Play Ringtone
      const ringtone = new Audio('https://botsrhere.online/deontic/callerpro/ring.mp3');
      ringtoneRef.current = ringtone;
      try {
        await ringtone.play();
      } catch (e) {
        console.warn("Ringtone playback failed (likely user interaction required)", e);
      }

      // Delay connection for 2 seconds (simulated network delay for realism)
      await new Promise<void>((resolve, reject) => {
        ringingTimeoutRef.current = window.setTimeout(() => {
          resolve();
        }, 2000);
      });

      // Stop ringtone before connecting
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current = null;
      }
      
      setConnectionState('connecting');

      // 1. Setup Audio Contexts
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      nextStartTimeRef.current = outputAudioContextRef.current.currentTime;

      // 2. Get Microphone Access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          channelCount: 1, 
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      mediaStreamRef.current = stream;

      // 3. Connect to Gemini Live
      console.log("Connecting with voice:", voiceName);
      const sessionPromise = clientRef.current.live.connect({
        model: MODEL_NAME,
        callbacks: {
          onopen: () => {
            console.log("Gemini Live Session Opened");
            setConnectionState('connected');
            lastUserInteractionRef.current = Date.now();
            
            // Start Silence Detection Interval
            silenceIntervalRef.current = window.setInterval(() => {
              const now = Date.now();
              const timeSinceLastInput = now - lastUserInteractionRef.current;
              
              // If user silent for > 6s AND agent is NOT speaking
              if (timeSinceLastInput > 6000 && !isPlayingRef.current) {
                console.log("Silence detected, sending nudge.");
                sessionRef.current.then((session: any) => {
                  // Send a text nudge to the model to check in
                  session.sendRealtimeInput([{
                    mimeType: "text/plain", 
                    data: "System: The user has been silent for 6 seconds. If appropriate, casually check if they are still there or suggest a relevant topic. Do not repeat yourself." 
                  }]);
                });
                // Reset timer to avoid spamming the nudge
                lastUserInteractionRef.current = Date.now(); 
              }
            }, 1000);
            
            // Start streaming audio
            if (!inputAudioContextRef.current || !mediaStreamRef.current) return;
            
            inputSourceRef.current = inputAudioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
            processorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
            
            processorRef.current.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              
              // Calculate volume for UI
              let sum = 0;
              for (let i = 0; i < inputData.length; i++) {
                sum += inputData[i] * inputData[i];
              }
              const rms = Math.sqrt(sum / inputData.length);
              setVolumeLevel(prev => prev * 0.8 + rms * 2.0); 

              // Silence Detection Logic
              if (rms > 0.02) {
                lastUserInteractionRef.current = Date.now();
              }

              const pcmBlob = createPcmBlob(inputData);
              sessionRef.current.then((session: any) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            inputSourceRef.current.connect(processorRef.current);
            processorRef.current.connect(inputAudioContextRef.current.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const serverContent = message.serverContent;
            
            if (serverContent?.modelTurn?.parts?.[0]?.inlineData) {
              const base64Audio = serverContent.modelTurn.parts[0].inlineData.data;
              if (base64Audio && outputAudioContextRef.current) {
                const audioData = base64ToUint8Array(base64Audio);
                const audioBuffer = await decodeAudioData(audioData, outputAudioContextRef.current);
                queueAudio(audioBuffer);
                lastUserInteractionRef.current = Date.now();
              }
            }
            
            if (serverContent?.interrupted) {
              audioQueueRef.current = [];
              isPlayingRef.current = false;
              nextStartTimeRef.current = outputAudioContextRef.current?.currentTime || 0;
            }
          },
          onclose: () => {
            console.log("Session Closed");
            setConnectionState('disconnected');
            if (silenceIntervalRef.current) clearInterval(silenceIntervalRef.current);
          },
          onerror: (err: any) => {
            console.error("Session Error", err);
            setError(err.message || "An error occurred during the call.");
            setConnectionState('disconnected');
            if (silenceIntervalRef.current) clearInterval(silenceIntervalRef.current);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } }
          },
          systemInstruction: systemInstruction,
        }
      });
      
      sessionRef.current = sessionPromise;
      await sessionPromise;

    } catch (err: any) {
      console.error("Connection failed", err);
      if (ringtoneRef.current) {
          ringtoneRef.current.pause();
          ringtoneRef.current = null;
      }
      setError("Failed to connect. " + (err.message || ""));
      setConnectionState('disconnected');
      disconnect(); 
    }
  }, [queueAudio, disconnect, systemInstruction, voiceName]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return { connectionState, connect, disconnect, volumeLevel, error };
};
