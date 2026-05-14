'use client';
import React from 'react';
import QRCode from 'react-qr-code';
import { Icon } from '@/components/ui';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  expiresAt: string | null;
  lectureTitle: string;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose, url, expiresAt, lectureTitle }) => {
  if (!isOpen) return null;

  const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
      {/* Immersive Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-xl animate-in fade-in duration-500"
        onClick={onClose}
      />

      {/* Premium Modal Card */}
      <div className="relative w-full max-w-sm bg-slate-950/90 border border-white/10 rounded-[3rem] shadow-2xl shadow-primary/10 overflow-hidden animate-in zoom-in-95 fade-in duration-500">
        <div className="p-8 flex flex-col items-center">
          
          {/* Header Icon */}
          <div className="w-16 h-16 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 shadow-lg shadow-primary/5">
             <Icon name="qrcode" className="text-3xl text-primary" />
          </div>

          {/* Titles */}
          <h3 className="text-2xl font-black text-white tracking-tight text-center mb-2">{lectureTitle}</h3>
          <p className="text-gray-light/40 text-xs font-bold uppercase tracking-widest mb-8">تسجيل الحضور عبر الرمز</p>

          {/* QR Code with Glowing Container */}
          <div className="relative group">
            <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white p-6 rounded-[2.5rem] shadow-2xl mb-8">
              <QRCode 
                value={url} 
                size={220} 
                fgColor="#020617" 
                level="H"
              />
            </div>
          </div>

          {/* Status & Expiry */}
          {expiresAt && (
            <div className={`flex items-center gap-2 mb-8 px-4 py-2 rounded-full border ${
              isExpired 
                ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                : 'bg-primary/10 border-primary/20 text-primary'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isExpired ? 'bg-red-500' : 'bg-primary'}`} />
              <span className="text-[11px] font-black uppercase tracking-widest">
                {isExpired ? 'انتهت صلاحية الرمز' : `ينتهي في: ${new Date(expiresAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`}
              </span>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={onClose}
            className="w-full py-5 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-black text-xs border border-white/10 transition-all active:scale-95 uppercase tracking-[0.2em]"
          >
            إغلاق النافذة
          </button>
        </div>

        {/* Decorative corner glow */}
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary/20 blur-[80px] rounded-full" />
      </div>
    </div>
  );
};

export default QRCodeModal;
