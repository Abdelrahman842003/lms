'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button, Icon } from '@/components/ui';
import { cn } from '@/utils';

interface VoiceRecorderProps {
  maxDuration?: number;
  onRecordingComplete: (blob: Blob, duration: number) => void;
  onCancel?: () => void;
  disabled?: boolean;
}

type RecordingState = 'idle' | 'recording' | 'preview';

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  maxDuration = 90,
  onRecordingComplete,
  disabled = false,
}) => {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [smoothLevel, setSmoothLevel] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const isRecordingRef = useRef(false);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current || !isRecordingRef.current) return;
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
    const average = sum / bufferLength;
    setSmoothLevel(average / 100);
    
    if (isRecordingRef.current) animationRef.current = requestAnimationFrame(analyzeAudio);
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];
      isRecordingRef.current = true;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setRecordingState('preview');
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start();
      setRecordingState('recording');
      setDuration(0);
      analyzeAudio();

      timerRef.current = setInterval(() => {
        setDuration(prev => {
          if (prev >= maxDuration) { stopRecording(); return prev; }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error(err);
    }
  };

  const stopRecording = () => {
    isRecordingRef.current = false;
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
  };

  const reset = () => {
    setAudioUrl(null);
    setAudioBlob(null);
    setDuration(0);
    setRecordingState('idle');
    setSmoothLevel(0);
  };

  const confirm = () => {
    if (audioBlob) onRecordingComplete(audioBlob, duration);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      
      {/* Compact Visualizer */}
      <div className="relative flex items-center justify-center">
        {/* Glow Pulses */}
        {recordingState === 'recording' && (
          <>
            <div 
              className="absolute w-24 h-24 rounded-full bg-secondary/10 blur-xl transition-all duration-150"
              style={{ transform: `scale(${1 + smoothLevel * 1.2})` }}
            />
            <div 
              className="absolute w-20 h-20 rounded-full border border-secondary/20 animate-ping opacity-10"
            />
          </>
        )}

        <div 
          className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center relative z-10 border-2 transition-all duration-500",
            recordingState === 'recording' ? "border-secondary bg-secondary/5" : "border-white/10 bg-white/5",
            recordingState === 'preview' ? "border-success bg-success/5" : ""
          )}
        >
          {recordingState === 'recording' ? (
            <div className="flex gap-1 h-6 items-center">
              {[1, 2, 3, 4, 5].map((i) => (
                <div 
                  key={i}
                  className="w-1 bg-secondary rounded-full transition-all duration-75"
                  style={{ height: `${30 + Math.random() * 50 * smoothLevel}%` }}
                />
              ))}
            </div>
          ) : recordingState === 'preview' ? (
            <Icon name="check" className="text-success text-xl" />
          ) : (
            <Icon name="microphone" className="text-gray-light/20 text-xl" />
          )}
        </div>
      </div>

      {/* Timer & Status */}
      <div className="text-center space-y-0.5">
        <div className={cn(
          "text-2xl font-black font-mono tracking-tighter transition-colors",
          recordingState === 'recording' ? "text-white" : "text-gray-light/10"
        )}>
          {formatTime(duration)}
        </div>
        <p className="text-[8px] font-black uppercase tracking-widest text-gray-light/30">
          {recordingState === 'recording' ? 'تسجيل...' : 
           recordingState === 'preview' ? 'جاهز' : 'ابدأ'}
        </p>
      </div>

      {/* Controls */}
      <div className="w-full space-y-3">
        <div className="flex gap-2">
          {recordingState === 'idle' && (
            <Button 
              onClick={startRecording} 
              disabled={disabled}
              className="w-full h-11 rounded-xl bg-secondary text-white font-black text-xs uppercase tracking-widest shadow-md"
            >
              <Icon name="microphone" size="xs" /> ابدأ التسجيل
            </Button>
          )}

          {recordingState === 'recording' && (
            <Button 
              onClick={stopRecording} 
              className="w-full h-11 rounded-xl bg-red-500 text-white font-black text-xs uppercase tracking-widest"
            >
              <div className="w-2.5 h-2.5 bg-white rounded-sm ml-2" /> إيقاف
            </Button>
          )}

          {recordingState === 'preview' && (
            <>
              <Button 
                onClick={reset} 
                variant="ghost" 
                className="flex-1 h-11 rounded-xl bg-white/5 text-gray-light font-bold text-xs"
              >
                إعادة
              </Button>
              <Button 
                onClick={confirm} 
                className="flex-[2] h-11 rounded-xl bg-success text-white font-black text-xs uppercase tracking-widest"
              >
                تأكيد
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceRecorder;
