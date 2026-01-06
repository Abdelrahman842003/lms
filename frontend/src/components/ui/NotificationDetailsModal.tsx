import React from 'react';
import VoicePlayer from '@/components/notifications/VoicePlayer';

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
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" 
      onClick={onClose}
    >
      <div 
        className="w-full max-w-[480px] bg-[#1e1e2d] rounded-xl shadow-2xl border border-white/10 animate-scaleIn flex flex-col max-h-[70vh]" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
          <h3 className="text-lg font-bold text-white m-0">تفاصيل الإخطار</h3>
          <button 
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors" 
            onClick={onClose}
            type="button"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar">
          {/* Header Info */}
          <div className="flex flex-wrap gap-3 justify-between items-start">
            <div className="space-y-1">
              <h4 className="text-base font-semibold text-white">{notification.title}</h4>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <i className="far fa-clock"></i>
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
              <div className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                <i className="fas fa-user mr-1.5"></i>
                {notification.sender_name}
              </div>
            )}
            
            {notification.recipient_type && (
              <div className="px-2.5 py-0.5 rounded-full bg-info/10 text-info text-xs font-medium border border-info/20">
                <i className="fas fa-paper-plane mr-1.5"></i>
                {notification.recipient_type === 'admin' ? 'الدعم الفني' : notification.recipient_type}
              </div>
            )}

            {isVoice && (
              <div className="px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 text-xs font-medium border border-red-500/20">
                <i className="fas fa-microphone mr-1.5"></i>
                رسالة صوتية
              </div>
            )}
          </div>

          {/* Voice Player for voice notifications */}
          {isVoice && voiceUrl && (
            <div className="bg-[#151521] p-3 rounded-lg border border-white/5">
              <VoicePlayer voiceUrl={voiceUrl} duration={voiceDuration} />
            </div>
          )}

          {/* Message Body - show if NOT voice, OR if voice but missing URL (fallback) */}
          {(!isVoice || (isVoice && !voiceUrl)) && (
            <div className="bg-[#151521] p-3 rounded-lg border border-white/5">
              <p className={`text-gray-300 leading-relaxed whitespace-pre-wrap text-sm transition-all duration-300 ${!isExpanded ? 'line-clamp-2' : ''}`}>
                {notification.message}
              </p>
              {notification.message.length > 100 && (
                <button 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="mt-1.5 text-primary text-xs hover:underline focus:outline-none"
                >
                  {isExpanded ? 'عرض أقل' : 'عرض المزيد'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-white/10 bg-black/20 rounded-b-xl shrink-0">
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all duration-200 text-sm font-medium"
            onClick={onClose}
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
