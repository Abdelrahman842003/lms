'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';

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
  onCancel,
  disabled = false,
}) => {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [smoothLevel, setSmoothLevel] = useState(0);
  const [bars, setBars] = useState<number[]>([15, 15, 15, 15, 15]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const isRecordingRef = useRef(false);
  const targetLevelRef = useRef(0);

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setIsSupported(false);
      setError('متصفحك لا يدعم تسجيل الصوت');
    }
  }, []);

  useEffect(() => {
    return () => {
      isRecordingRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') audioContextRef.current.close();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const getMimeType = (): string => {
    const types = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/webm', 'audio/ogg', 'audio/mp4'];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return 'audio/webm';
  };

  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current || !isRecordingRef.current) return;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
    const average = sum / bufferLength;
    targetLevelRef.current = Math.min(average / 80, 1);
    
    setSmoothLevel(prev => prev + (targetLevelRef.current - prev) * 0.25);
    
    const newBars: number[] = [];
    const sliceWidth = Math.floor(bufferLength / 5);
    for (let i = 0; i < 5; i++) {
      let sliceSum = 0;
      for (let j = 0; j < sliceWidth; j++) sliceSum += dataArray[i * sliceWidth + j];
      const sliceAvg = sliceSum / sliceWidth;
      const height = 10 + (sliceAvg / 255) * 35;
      newBars.push(height);
    }
    setBars(prev => prev.map((bar, i) => bar + (newBars[i] - bar) * 0.3));
    
    if (isRecordingRef.current) animationRef.current = requestAnimationFrame(analyzeAudio);
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      
      streamRef.current = stream;
      audioChunksRef.current = [];
      isRecordingRef.current = true;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 128;
      analyserRef.current.smoothingTimeConstant = 0.75;
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      const mimeType = getMimeType();
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        isRecordingRef.current = false;
        const buffer = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(buffer);
        setAudioBlob(buffer);
        setAudioUrl(url);
        setRecordingState('preview');
        stream.getTracks().forEach(track => track.stop());
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        setBars([15, 15, 15, 15, 15]);
        setSmoothLevel(0);
      };

      mediaRecorder.start(100);
      setRecordingState('recording');
      setDuration(0);
      analyzeAudio();

      timerRef.current = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1;
          if (newDuration >= maxDuration) stopRecording();
          return newDuration;
        });
      }, 1000);

    } catch (err) {
      setError('فشل في بدء التسجيل. تأكد من السماح بصلاحيات الميكروفون.');
    }
  }, [maxDuration, analyzeAudio]);

  const stopRecording = useCallback(() => {
    isRecordingRef.current = false;
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop();
  }, []);

  const resetRecording = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setAudioBlob(null);
    setDuration(0);
    setRecordingState('idle');
    setError(null);
    setSmoothLevel(0);
    setBars([15, 15, 15, 15, 15]);
  }, [audioUrl]);

  const confirmRecording = useCallback(() => {
    if (audioBlob && duration > 0) onRecordingComplete(audioBlob, duration);
  }, [audioBlob, duration, onRecordingComplete]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (duration / maxDuration) * 100;
  const isNearLimit = duration >= maxDuration - 10;

  // Smooth color
  const r = Math.round(59 + smoothLevel * 140);
  const g = Math.round(130 + smoothLevel * 90);
  const b = 246;
  const dynamicColor = `rgb(${r}, ${g}, ${b})`;

  if (!isSupported) {
    return (
      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-center text-sm">
        <i className="fas fa-exclamation-triangle mr-2"></i>
        {error || 'متصفحك لا يدعم تسجيل الصوت'}
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-sm mx-auto">
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2 animate-fadeIn">
          <i className="fas fa-exclamation-circle"></i>
          <span>{error}</span>
        </div>
      )}

      <div className="relative overflow-hidden rounded-2xl bg-[#13131f] border border-white/5 shadow-2xl transition-all duration-500">
        {/* Ambient Background Glow */}
        <div 
          className="absolute inset-0 opacity-30 transition-opacity duration-700"
          style={{
            background: recordingState === 'recording' 
              ? `radial-gradient(circle at 50% 50%, ${dynamicColor}20 0%, transparent 70%)`
              : 'none'
          }}
        />

        <div className="relative z-10 p-6 flex flex-col items-center">
          
          {/* Main Visualizer Circle */}
          <div className="relative mb-6 group">
            {/* Outer Glow Ring */}
            <div 
              className="absolute inset-0 rounded-full transition-all duration-300"
              style={{
                boxShadow: recordingState === 'recording' 
                  ? `0 0 ${30 + smoothLevel * 30}px ${dynamicColor}40` 
                  : 'none',
                transform: 'scale(1.1)',
                opacity: recordingState === 'recording' ? 0.8 : 0
              }}
            />

            {/* The Circle Itself */}
            <div 
              className="w-32 h-32 rounded-full flex items-center justify-center relative z-10 transition-all duration-500"
              style={{
                background: recordingState === 'recording'
                  ? `linear-gradient(135deg, #1e293b 0%, #0f172a 100%)`
                  : recordingState === 'preview'
                  ? 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)'
                  : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                border: `2px solid ${recordingState === 'recording' ? dynamicColor : 'rgba(255,255,255,0.1)'}`,
                transform: recordingState === 'recording' ? `scale(${1 + smoothLevel * 0.05})` : 'scale(1)'
              }}
            >
              {recordingState === 'recording' ? (
                <div className="flex items-end justify-center gap-1 h-12">
                  {bars.map((height, i) => (
                    <div 
                      key={i}
                      className="w-1.5 rounded-full transition-all duration-75 ease-out"
                      style={{ 
                        height: `${Math.max(8, height * 0.8)}px`,
                        background: dynamicColor,
                        opacity: 0.8 + (height / 60) * 0.2,
                        boxShadow: `0 0 8px ${dynamicColor}60`
                      }}
                    />
                  ))}
                </div>
              ) : recordingState === 'preview' ? (
                <i className="fas fa-check text-4xl text-emerald-400 animate-scaleIn"></i>
              ) : (
                <i className="fas fa-microphone text-3xl text-gray-400 group-hover:text-white transition-colors"></i>
              )}
            </div>
            
            {/* Ripple Effect when recording */}
            {recordingState === 'recording' && (
               <div className="absolute inset-0 rounded-full border border-blue-500/30 animate-ping opacity-20" />
            )}
          </div>

          {/* Timer Display */}
          <div className="text-center mb-6 space-y-1">
            <div 
              className="text-4xl font-bold font-mono tracking-wider transition-colors duration-300"
              style={{ 
                color: recordingState === 'recording' 
                  ? (isNearLimit ? '#ef4444' : '#ffffff') 
                  : '#9ca3af',
                textShadow: recordingState === 'recording' ? `0 0 20px ${dynamicColor}40` : 'none'
              }}
            >
              {formatTime(duration)}
            </div>
            <div className="text-xs font-medium uppercase tracking-widest text-gray-500">
              {recordingState === 'recording' ? (
                <span className={isNearLimit ? 'text-red-400 animate-pulse' : 'text-blue-400'}>
                  جاري التسجيل • الحد {formatTime(maxDuration)}
                </span>
              ) : recordingState === 'preview' ? (
                <span className="text-emerald-500">تم التسجيل بنجاح</span>
              ) : (
                'جاهز للتسجيل'
              )}
            </div>
          </div>

          {/* Progress Bar (Only when recording) */}
          <div className={`w-full h-1.5 bg-gray-800 rounded-full overflow-hidden mb-6 transition-opacity duration-300 ${recordingState === 'recording' ? 'opacity-100' : 'opacity-0 h-0 mb-0'}`}>
            <div 
              className="h-full rounded-full transition-all duration-1000 linear"
              style={{ 
                width: `${progress}%`,
                background: isNearLimit 
                  ? 'linear-gradient(90deg, #ef4444, #b91c1c)' 
                  : `linear-gradient(90deg, #3b82f6, ${dynamicColor})`,
                boxShadow: `0 0 10px ${dynamicColor}50`
              }}
            />
          </div>

          {/* Audio Preview Player */}
          {recordingState === 'preview' && audioUrl && (
            <div className="w-full mb-6 bg-white/5 rounded-xl p-3 border border-white/5 animate-fadeIn">
              <audio src={audioUrl} controls className="w-full h-8 opacity-80 hover:opacity-100 transition-opacity" />
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center gap-3 w-full">
            {recordingState === 'idle' && (
              <button
                onClick={startRecording}
                disabled={disabled}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <i className="fas fa-microphone mr-2 group-hover:scale-110 transition-transform"></i>
                ابدأ التسجيل
              </button>
            )}

            {recordingState === 'recording' && (
              <button
                onClick={stopRecording}
                className="w-full py-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/30 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 group"
              >
                <div className="w-3 h-3 bg-current rounded-sm group-hover:scale-110 transition-transform" />
                إيقاف التسجيل
              </button>
            )}

            {recordingState === 'preview' && (
              <>
                <button 
                  onClick={resetRecording} 
                  className="flex-1 py-3.5 bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                >
                  <i className="fas fa-redo text-xs"></i>
                  إعادة
                </button>
                <button 
                  onClick={confirmRecording} 
                  className="flex-[2] py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
                >
                  <i className="fas fa-paper-plane text-xs"></i>
                  إرسال
                </button>
              </>
            )}
          </div>

          {/* Cancel Button */}
          {onCancel && recordingState !== 'recording' && (
            <button 
              onClick={onCancel} 
              className="mt-4 text-gray-500 hover:text-gray-300 text-sm font-medium transition-colors"
            >
              إلغاء الأمر
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceRecorder;
