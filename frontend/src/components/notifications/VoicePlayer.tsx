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

    let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    if (!apiUrl.endsWith('/api/v1')) apiUrl = `${apiUrl.replace(/\/$/, '')}/api/v1`;
    
    // If it's a full R2/Storage URL, extract the path
    if (voiceUrl.includes('files.neetaq.com') || voiceUrl.includes('.r2.dev')) {
      try {
        const url = new URL(voiceUrl);
        const path = url.pathname.replace(/^\//, '');
        return `${apiUrl}/media/${path}`;
      } catch {
        // Fallback if URL parsing fails
      }
    }
    
    // Clean the path
    let path = voiceUrl;
    if (path.includes('/api/v1/media/')) {
        path = path.split('/api/v1/media/')[1];
    } else if (path.includes('/api/media/')) {
        path = path.split('/api/media/')[1];
    }
    
    path = path.replace(/^\/?storage\//, '').replace(/^\//, '');
    
    // Ensure we don't have duplicate voice_notifications in path
    if (path.startsWith('voice_notifications/')) {
        return `${apiUrl}/media/${path}`;
    }
    
    return `${apiUrl}/media/voice/${path}`;
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
      <div className="alert alert-danger voice-player-error">
        <Icon name="exclamation-circle" />
        <span>{error}</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="voice-player-compact">
        <button
          onClick={togglePlay}
          disabled={isLoading}
          className="voice-player-compact-btn"
        >
          {isLoading ? (
            <LoadingSpinner size="sm" color="white" />
          ) : (
            <Icon name={isPlaying ? 'pause' : 'play'} size="xs" />
          )}
        </button>
        <div className="voice-player-compact-text">
          <Icon name="microphone" color="primary" />
          <span>رسالة صوتية</span>
          {durationState > 0 && <span className="voice-player-duration">({formatTime(durationState)})</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="voice-player">
      <div className="voice-player-hover-bg" />
      
      <div className="voice-player-content">
        <button
          onClick={togglePlay}
          disabled={isLoading}
          className="voice-player-main-btn"
        >
          {isLoading ? (
            <LoadingSpinner size="md" color="white" />
          ) : (
            <Icon name={isPlaying ? 'pause' : 'play'} size="lg" />
          )}
        </button>

        <div className="voice-player-main">
          <div className="voice-player-wave" onClick={handleSeek}>
            {waveHeights.map((height, i) => {
              const isActive = ((i + 1) / 40) * 100 <= progressPercent;
              const barHeight = 20 + (height / 100) * 80;
              
              return (
                <div
                  key={i}
                  className={`voice-player-bar ${isPlaying ? 'animate-wave' : ''}`}
                  style={{ 
                    height: `${barHeight}%`,
                    backgroundColor: isActive ? 'var(--primary, #6366f1)' : 'rgba(107, 114, 128, 0.4)',
                    animationDelay: `${i * 50}ms`,
                  }}
                />
              );
            })}
          </div>

          <div className="voice-player-timer">
            <span className="voice-player-current">{formatTime(currentTime)}</span>
            <span className="voice-player-duration">{durationState > 0 ? formatTime(durationState) : '0:00'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoicePlayer;
