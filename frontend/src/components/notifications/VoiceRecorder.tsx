'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button, Icon } from '@/components/ui';

interface VoiceRecorderProps {
  maxDuration?: number;
  onRecordingComplete: (blob: Blob, duration: number) => void;
  onCancel?: () => void;
  disabled?: boolean;
}

type RecordingState = 'idle' | 'recording' | 'preview';
type MicPermissionState = PermissionState | 'unknown';

const PERMISSION_DENIED_MESSAGE =
  'تم رفض صلاحية الميكروفون. اسمح بالوصول للميكروفون من إعدادات المتصفح ثم أعد المحاولة.';

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
  const [permissionState, setPermissionState] = useState<MicPermissionState>('unknown');
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
    const isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
    const isSecure = window.isSecureContext || isLocalhost;

    if (!isSecure) {
      setIsSupported(false);
      setError('تسجيل الصوت يتطلب اتصالاً آمناً (HTTPS) أو التشغيل على localhost.');
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setIsSupported(false);
      setError('متصفحك لا يدعم تسجيل الصوت');
    }
  }, []);

  useEffect(() => {
    if (!navigator?.permissions?.query) {
      setPermissionState('unknown');
      return;
    }

    let isActive = true;
    let status: PermissionStatus | null = null;

    navigator.permissions
      .query({ name: 'microphone' as PermissionName })
      .then((result) => {
        if (!isActive) return;
        status = result;
        setPermissionState(result.state);

        status.onchange = () => {
          if (isActive) setPermissionState(status?.state ?? 'unknown');
        };
      })
      .catch(() => {
        if (isActive) setPermissionState('unknown');
      });

    return () => {
      isActive = false;
      if (status) status.onchange = null;
    };
  }, []);

  useEffect(() => {
    if (!isSupported) return;

    if (permissionState === 'denied') {
      setError(PERMISSION_DENIED_MESSAGE);
      return;
    }

    if (permissionState === 'granted' && error === PERMISSION_DENIED_MESSAGE) {
      setError(null);
    }
  }, [permissionState, isSupported, error]);

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
    return '';
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
      if (permissionState === 'denied') {
        setError(PERMISSION_DENIED_MESSAGE);
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      
      streamRef.current = stream;
      audioChunksRef.current = [];
      isRecordingRef.current = true;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error('AudioContextUnavailable');
      }
      audioContextRef.current = new AudioContextClass();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 128;
      analyserRef.current.smoothingTimeConstant = 0.75;
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      const mimeType = getMimeType();
      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
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

    } catch (err: unknown) {
      const errorName = err instanceof DOMException
        ? err.name
        : (err instanceof Error ? err.message : 'UnknownError');

      if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
        setError(PERMISSION_DENIED_MESSAGE);
        return;
      }

      if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
        setError('لم يتم العثور على ميكروفون. تأكد من توصيل ميكروفون يعمل.');
        return;
      }

      if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
        setError('الميكروفون مستخدم بواسطة تطبيق آخر أو غير متاح حالياً. أغلق التطبيقات الأخرى وحاول مرة أخرى.');
        return;
      }

      if (errorName === 'SecurityError') {
        setError('تسجيل الصوت يتطلب HTTPS أو localhost.');
        return;
      }

      if (errorName === 'AudioContextUnavailable') {
        setError('متصفحك لا يدعم AudioContext المطلوب لتسجيل الصوت.');
        return;
      }

      setError('فشل في بدء التسجيل. تأكد من صلاحية الميكروفون والاتصال الآمن (HTTPS).');
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
  const isPermissionDenied = permissionState === 'denied';

  // Smooth color
  const r = Math.round(59 + smoothLevel * 140);
  const g = Math.round(130 + smoothLevel * 90);
  const b = 246;
  const dynamicColor = `rgb(${r}, ${g}, ${b})`;

  if (!isSupported) {
    return (
      <div className="ux-p-3 ux-bg-red-500-10 ux-border ux-border-red-500-20 ux-rounded-xl ux-text-red-400 ux-text-center ux-text-sm">
        <Icon name="exclamation-triangle" className="ux-mr-2" />
        {error || 'متصفحك لا يدعم تسجيل الصوت'}
      </div>
    );
  }

  return (
    <div className="ux-relative ux-w-full ux-max-w-sm ux-mx-auto">
      {error && (
        <div className="ux-mb-4 ux-p-3 ux-bg-red-500-10 ux-border ux-border-red-500-20 ux-rounded-xl ux-text-red-400 ux-text-sm ux-flex ux-items-center ux-gap-2 ux-animate-fadein">
          <Icon name="exclamation-circle" />
          <span>{error}</span>
        </div>
      )}

      <div className="ux-relative ux-overflow-hidden ux-rounded-2xl ux-bg-13131f ux-border ux-border-white-5 ux-shadow-2xl ux-transition-all ux-duration-500">
        {/* Ambient Background Glow */}
        <div 
          className="ux-absolute ux-inset-0 ux-opacity-30 ux-transition-opacity ux-duration-700"
          style={{
            background: recordingState === 'recording' 
              ? `radial-gradient(circle at 50% 50%, ${dynamicColor}20 0%, transparent 70%)`
              : 'none'
          }}
        />

        <div className="ux-relative ux-z-10 ux-p-6 ux-flex ux-flex-col ux-items-center">
          
          {/* Main Visualizer Circle */}
          <div className="ux-relative ux-mb-6 group">
            {/* Outer Glow Ring */}
            <div 
              className="ux-absolute ux-inset-0 ux-rounded-full ux-transition-all ux-duration-300"
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
              className="ux-w-32 ux-h-32 ux-rounded-full ux-flex ux-items-center ux-justify-center ux-relative ux-z-10 ux-transition-all ux-duration-500"
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
                <div className="ux-flex ux-items-end ux-justify-center ux-gap-1 ux-h-12">
                  {bars.map((height, i) => (
                    <div 
                      key={i}
                      className="ux-w-1dot5 ux-rounded-full ux-transition-all ux-duration-75 ux-ease-out"
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
                <Icon name="check" size="3x" className="ux-text-emerald-400 ux-animate-scalein" />
              ) : (
                <Icon name="microphone" size="2x" className="ux-text-gray-400 ux-group-hover-text-white ux-transition-colors" />
              )}
            </div>
            
            {/* Ripple Effect when recording */}
            {recordingState === 'recording' && (
               <div className="ux-absolute ux-inset-0 ux-rounded-full ux-border ux-border-blue-500-30 ux-animate-ping ux-opacity-20" />
            )}
          </div>

          {/* Timer Display */}
          <div className="ux-text-center ux-mb-6 ux-space-y-1">
            <div 
              className="ux-text-4xl ux-font-bold ux-font-mono ux-tracking-wider ux-transition-colors ux-duration-300"
              style={{ 
                color: recordingState === 'recording' 
                  ? (isNearLimit ? '#ef4444' : '#ffffff') 
                  : '#9ca3af',
                textShadow: recordingState === 'recording' ? `0 0 20px ${dynamicColor}40` : 'none'
              }}
            >
              {formatTime(duration)}
            </div>
            <div className="ux-text-xs ux-font-medium ux-uppercase ux-tracking-widest ux-text-gray-500">
              {recordingState === 'recording' ? (
                <span className={isNearLimit ? 'ux-text-red-400 ux-animate-pulse' : 'ux-text-blue-400'}>
                  جاري التسجيل • الحد {formatTime(maxDuration)}
                </span>
              ) : recordingState === 'preview' ? (
                <span className="ux-text-emerald-500">تم التسجيل بنجاح</span>
              ) : (
                'جاهز للتسجيل'
              )}
            </div>
          </div>

          {/* Progress Bar (Only when recording) */}
          <div className={`ux-w-full ux-h-1dot5 ux-bg-gray-800 ux-rounded-full ux-overflow-hidden ux-mb-6 ux-transition-opacity ux-duration-300 ${recordingState === 'recording' ? 'ux-opacity-100' : 'ux-opacity-0 ux-h-0 ux-mb-0'}`}>
            <div 
              className="ux-h-full ux-rounded-full ux-transition-all ux-duration-1000 linear"
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
            <div className="ux-w-full ux-mb-6 ux-bg-white-5 ux-rounded-xl ux-p-3 ux-border ux-border-white-5 ux-animate-fadein">
              <audio src={audioUrl} controls className="ux-w-full ux-h-8 ux-opacity-80 ux-hover-opacity-100 ux-transition-opacity" />
            </div>
          )}

          {/* Controls */}
          <div className="ux-flex ux-items-center ux-gap-3 ux-w-full">
            {recordingState === 'idle' && (
              <Button
                type="button"
                onClick={startRecording}
                disabled={disabled || isPermissionDenied}
                className="ux-w-full ux-py-3dot5 ux-bg-gradient-to-r ux-from-blue-600 ux-to-indigo-600 ux-hover-from-blue-500 ux-hover-to-indigo-500 ux-text-white ux-rounded-xl ux-font-semibold ux-shadow-lg ux-shadow-blue-500-25 ux-hover-shadow-blue-500-40 ux-hover-translate-y-0dot5 ux-active-translate-y-0 ux-transition-all ux-disabled-opacity-50 ux-disabled-cursor-not-allowed group"
              >
                <Icon name="microphone" className="ux-mr-2 ux-group-hover-scale-110 ux-transition-transform" />
                ابدأ التسجيل
              </Button>
            )}

            {recordingState === 'recording' && (
              <Button
                type="button"
                onClick={stopRecording}
                variant="outline"
                className="ux-w-full ux-py-3dot5 ux-border-red-500-20 ux-text-red-400 ux-hover-text-red-300 ux-hover-bg-red-500-20 ux-hover-border-red-500-30 ux-rounded-xl ux-font-semibold ux-transition-all ux-flex ux-items-center ux-justify-center ux-gap-2 group"
              >
                <div className="ux-w-3 ux-h-3 ux-bg-current ux-rounded-sm ux-group-hover-scale-110 ux-transition-transform" />
                إيقاف التسجيل
              </Button>
            )}

            {recordingState === 'preview' && (
              <>
                <Button 
                  type="button"
                  onClick={resetRecording} 
                  variant="outline"
                  className="ux-flex-1 ux-py-3dot5 ux-bg-gray-700-50 ux-hover-bg-gray-700 ux-text-gray-300 ux-hover-text-white ux-rounded-xl ux-font-medium ux-transition-all ux-flex ux-items-center ux-justify-center ux-gap-2"
                >
                  <Icon name="redo" size="xs" />
                  إعادة
                </Button>
                <Button 
                  type="button"
                  onClick={confirmRecording} 
                  variant="primary"
                  className="ux-flex-2 ux-py-3dot5 ux-bg-gradient-to-r ux-from-emerald-600 ux-to-teal-600 ux-hover-from-emerald-500 ux-hover-to-teal-500 ux-text-white ux-rounded-xl ux-font-semibold ux-shadow-lg ux-shadow-emerald-500-25 ux-hover-shadow-emerald-500-40 ux-hover-translate-y-0dot5 ux-active-translate-y-0 ux-transition-all ux-flex ux-items-center ux-justify-center ux-gap-2"
                >
                  <Icon name="paper-plane" size="xs" />
                  إرسال
                </Button>
              </>
            )}
          </div>

          {/* Cancel Button */}
          {onCancel && recordingState !== 'recording' && (
            <Button 
              type="button"
              onClick={onCancel} 
              variant="ghost"
              className="ux-mt-4 ux-text-gray-500 ux-hover-text-gray-300 ux-text-sm ux-font-medium ux-transition-colors"
            >
              إلغاء الأمر
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceRecorder;
