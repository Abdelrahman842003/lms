import React from 'react';
import VoicePlayer from '@/components/notifications/VoicePlayer';
import { Button } from './Button';
import { Icon } from './Icon';
import { Badge } from './Badge';

interface NotificationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notification: {
    title: string;
    message: string;
    created_at: string;
    sender_name?: string;
    recipient_type?: string;
    is_voice?: boolean;
    voice_url?: string;
    voice_duration?: number;
    [key: string]: any;
  } | null;
}

export default function NotificationDetailsModal({
  isOpen,
  onClose,
  notification
}: NotificationDetailsModalProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  if (!isOpen || !notification) return null;

  // Robustly check for voice properties
  // Check if it's explicitly marked as voice, OR has voice data, OR message indicates it
  const hasVoiceData = Boolean(
    notification.voice_url || 
    notification.data?.voice_url || 
    notification.voice_path || 
    notification.data?.voice_path
  );

  const isVoice = Boolean(
    notification.is_voice || 
    notification.data?.is_voice || 
    (notification.message && notification.message.includes('[رسالة صوتية]')) ||
    hasVoiceData
  );
  
  let voiceUrl = notification.voice_url || notification.data?.voice_url;
  // Fallback: construct URL from voice_path if available and voiceUrl is missing
  if (!voiceUrl) {
    const voicePath = notification.voice_path || notification.data?.voice_path;
    if (voicePath) {
      // If path starts with http, use it as is (R2/S3 URL)
      if (voicePath.startsWith('http')) {
        voiceUrl = voicePath;
      } else {
        // Otherwise assume local storage and ensure path starts with /storage/
        voiceUrl = voicePath.startsWith('/storage') ? voicePath : `/storage/${voicePath}`;
      }
    }
  }

  const voiceDuration = Number(notification.voice_duration || notification.data?.voice_duration || 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content notification-details-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>تفاصيل الإخطار</h3>
          <Button
            variant="ghost"
            size="sm"
            className="modal-close"
            onClick={onClose}
            aria-label="إغلاق"
          >
            <Icon name="times" size="sm" />
          </Button>
        </div>

        <div className="modal-body notification-details-body custom-scrollbar">
          {/* Header Info */}
          <div className="notification-details-header">
            <div>
              <h4 className="notification-details-title">{notification.title}</h4>
              <div className="notification-details-time">
                <Icon name="clock" set="regular" />
                <span>{new Date(notification.created_at).toLocaleDateString('ar-EG', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              </div>
            </div>
            
            {notification.sender_name && (
              <Badge variant="primary" size="sm" icon="user">
                {notification.sender_name}
              </Badge>
            )}
            
            {notification.recipient_type && (
              <Badge variant="info" size="sm" icon="paper-plane">
                {notification.recipient_type === 'admin' ? 'الدعم الفني' : notification.recipient_type}
              </Badge>
            )}

            {isVoice && (
              <Badge variant="danger" size="sm" icon="microphone">
                رسالة صوتية
              </Badge>
            )}
          </div>

          {/* Voice Player for voice notifications */}
          {isVoice && voiceUrl && (
            <div className="notification-details-box">
              <VoicePlayer voiceUrl={voiceUrl} duration={voiceDuration} />
            </div>
          )}

          {/* Message Body - show if NOT voice, OR if voice but missing URL (fallback) */}
          {(!isVoice || (isVoice && !voiceUrl)) && (
            <div className="notification-details-box">
              <p className={`notification-details-message ${!isExpanded ? 'ux-line-clamp-2' : ''}`}>
                {notification.message}
              </p>
              {notification.message.length > 100 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="notification-details-toggle"
                >
                  {isExpanded ? 'عرض أقل' : 'عرض المزيد'}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            إغلاق
          </Button>
        </div>
      </div>
    </div>
  );
}
