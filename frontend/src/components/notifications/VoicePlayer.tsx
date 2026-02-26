'use client';

import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { Icon, LoadingSpinner } from '@/components/ui';

interface VoicePlayerProps {
  voiceUrl: string;
  duration?: number;
  compact?: boolean;
}

export const VoicePlayer: React.FC<VoicePlayerProps> = ({
  voiceUrl,
  duration,
  compact = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [durationState, setDurationState] = useState(duration || 0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number | null>(null);

  // Get proxied URL
  const normalizedUrl = useMemo(() => {
    if (!voiceUrl) return '';
    if (voiceUrl.startsWith('blob:')) return voiceUrl;

    let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    if (apiUrl.startsWith('/')) apiUrl = `http://localhost:8000${apiUrl}`;
    if (!apiUrl.endsWith('/api')) apiUrl = apiUrl.replace(/\/?$/, '/api');
    
    if (voiceUrl.includes('files.neetaq.com') || voiceUrl.includes('.r2.dev')) {
      try {
        const url = new URL(voiceUrl);
        return `${apiUrl}/media/${url.pathname.replace(/^\//, '')}`;
      } catch {
        return `${apiUrl}/media/voice/${voiceUrl}`;
      }
    }
    
    if (voiceUrl.includes('/api/media/')) return voiceUrl;
    
    if (voiceUrl.includes('voice_notifications')) {
      return `${apiUrl}/media/${voiceUrl.replace(/^\/?storage\//, '').replace(/^\//, '')}`;
    }
    
    const path = voiceUrl.startsWith('/storage/') ? voiceUrl.replace('/storage/', '') : voiceUrl;
    return `${apiUrl}/media/${path}`;
  }, [voiceUrl]);

  // Create audio element on mount
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setDurationState(audio.duration);
      }
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      // Also try to update duration if not set (webm files sometimes have late metadata)
      if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
        setDurationState(prev => prev === 0 ? audio.duration : prev);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      audio.currentTime = 0;
    };

    let retryCount = 0;
    const maxRetries = 3;

    const handleError = () => {
      // Ignore errors if audio is already loaded
      if (audio.readyState >= 2) return;
      
      retryCount++;
      
      if (retryCount <= maxRetries) {
        // Retry loading silently
        setTimeout(() => {
          audio.src = normalizedUrl;
          audio.load();
        }, 200);
      } else {
        setIsLoading(false);
        setError('فشل في تحميل الملف الصوتي');
      }
    };

    const handleCanPlay = () => {
      // Reset retry count on successful load
      retryCount = 0;
      setIsLoading(false);
      setError(null); // Clear any previous error
      if (audio.duration && isFinite(audio.duration)) {
        setDurationState(audio.duration);
      }
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);

    // Load the audio
    audio.src = normalizedUrl;
    audio.load();

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.src = '';
      audioRef.current = null;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [normalizedUrl]);

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || isLoading) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        // Reset if ended
        if (audio.ended || audio.currentTime >= audio.duration - 0.1) {
          audio.currentTime = 0;
          setCurrentTime(0);
        }
        await audio.play();
        setIsPlaying(true);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError('فشل في تشغيل الصوت');
      }
    }
  }, [isPlaying, isLoading]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !durationState) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const percentage = (e.clientX - rect.left) / rect.width;
    const seekTime = percentage * durationState;
    
    audio.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) return '0:00';
    return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
  };

  const waveHeights = useMemo(() => 
    Array.from({ length: 40 }, () => 30 + Math.random() * 70),
  []);

  const progressPercent = durationState ? (currentTime / durationState) * 100 : 0;

  if (error) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 rounded-lg text-red-400 text-sm border border-red-500/20">
        <Icon name="exclamation-circle" />
        <span>{error}</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-primary/20 to-primary/10 rounded-full border border-primary/20 backdrop-blur-sm">
        <button
          onClick={togglePlay}
          disabled={isLoading}
          className="w-7 h-7 flex items-center justify-center rounded-full bg-primary text-white hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          {isLoading ? (
            <LoadingSpinner size="sm" color="white" />
          ) : (
            <Icon name={isPlaying ? 'pause' : 'play'} size="xs" />
          )}
        </button>
        <div className="flex items-center gap-2 text-xs text-gray-300 font-medium">
          <Icon name="microphone" color="primary" />
          <span>رسالة صوتية</span>
          {durationState > 0 && <span className="text-gray-500">({formatTime(durationState)})</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-[#1e1e2d] rounded-xl border border-white/5 p-3 group hover:border-primary/30 transition-colors duration-300">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative flex items-center gap-4">
        <button
          onClick={togglePlay}
          disabled={isLoading}
          className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-dark text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-50"
        >
          {isLoading ? (
            <LoadingSpinner size="md" color="white" />
          ) : (
            <Icon name={isPlaying ? 'pause' : 'play'} size="lg" className="ml-0.5" />
          )}
        </button>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-8 flex items-center justify-start gap-px cursor-pointer" onClick={handleSeek}>
            {waveHeights.map((height, i) => {
              const isActive = ((i + 1) / 40) * 100 <= progressPercent;
              const barHeight = 20 + (height / 100) * 80;
              
              return (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all duration-300 ease-out ${isPlaying ? 'animate-wave' : ''}`}
                  style={{ 
                    height: `${barHeight}%`,
                    backgroundColor: isActive ? 'var(--primary, #6366f1)' : 'rgba(107, 114, 128, 0.4)',
                    animationDelay: `${i * 50}ms`,
                  }}
                />
              );
            })}
          </div>

          <div className="flex justify-between text-xs font-medium">
            <span className="text-primary">{formatTime(currentTime)}</span>
            <span className="text-gray-500">{durationState > 0 ? formatTime(durationState) : '0:00'}</span>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes wave {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.5); }
        }
        .animate-wave {
          animation: wave 0.8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default VoicePlayer;
