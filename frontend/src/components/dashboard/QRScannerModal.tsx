'use client';
import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import toast from 'react-hot-toast';
import { Icon } from '@/components/ui';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
  lectureTitle: string;
  instructions?: string;
}

const QRScannerModal: React.FC<QRScannerModalProps> = ({ isOpen, onClose, onScanSuccess, lectureTitle, instructions }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef<boolean>(false);

  const getQrBox = (viewfinderWidth: number, viewfinderHeight: number) => {
    const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
    const size = Math.floor(minEdge * 0.7);
    const bounded = Math.max(180, Math.min(280, size));
    return { width: bounded, height: bounded };
  };

  useEffect(() => {
    let mounted = true;

    const startScanner = async () => {
      if (isOpen && !scannerRef.current && mounted) {
        try {
          await new Promise(resolve => setTimeout(resolve, 300));
          if (!mounted) return;

          const scanner = new Html5Qrcode("reader");
          scannerRef.current = scanner;

          const config = { fps: 15, qrbox: getQrBox, aspectRatio: 1.0 };
          const onSuccess = (text: string) => { if (mounted) onScanSuccess(text); };

          try {
            await scanner.start({ facingMode: "environment" }, config, onSuccess, () => {});
            isScanningRef.current = true;
          } catch (err) {
            await scanner.start({ facingMode: "user" }, config, onSuccess, () => {});
            isScanningRef.current = true;
          }
        } catch (err) {
          toast.error('تعذر الوصول للكاميرا. تأكد من إعطاء الصلاحية.');
        }
      }
    };

    startScanner();

    return () => {
      mounted = false;
      if (scannerRef.current && isScanningRef.current) {
        scannerRef.current.stop().then(() => {
          scannerRef.current?.clear();
          scannerRef.current = null;
          isScanningRef.current = false;
        }).catch(() => {});
      }
    };
  }, [isOpen, onScanSuccess]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Immersive Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-500" onClick={onClose} />

      {/* Premium Scanner Card */}
      <div className="relative w-full max-w-md bg-slate-950/90 border border-white/10 rounded-[3rem] shadow-2xl shadow-primary/10 overflow-hidden animate-in zoom-in-95 duration-500">
        
        {/* Header Section */}
        <div className="px-8 pt-8 pb-6 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-white tracking-tight">مسح الحضور</h3>
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1">{lectureTitle}</p>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
          >
            <Icon name="times" className="text-sm" />
          </button>
        </div>

        {/* Camera & Scanner Interface */}
        <div className="px-6 pb-6">
          <div className="relative aspect-square bg-black rounded-[2rem] overflow-hidden border border-white/5 group">
            {/* The actual camera feed */}
            <div id="reader" className="w-full h-full scale-110" />

            {/* Scanning Overlay (UI Decoration) */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* Corner Brackets */}
              <div className="absolute top-10 left-10 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-2xl opacity-80" />
              <div className="absolute top-10 right-10 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-2xl opacity-80" />
              <div className="absolute bottom-10 left-10 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-2xl opacity-80" />
              <div className="absolute bottom-10 right-10 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-2xl opacity-80" />

              {/* Animated Scanning Beam */}
              <div className="w-[80%] h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent animate-scan shadow-[0_0_15px_rgba(50,73,169,0.8)]" />
            </div>

            {/* Instructions Overlay (Subtle) */}
            <div className="absolute bottom-6 left-0 right-0 text-center px-4">
              <span className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-full text-[9px] font-bold text-white/60 uppercase tracking-widest border border-white/5">
                Focusing...
              </span>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="px-8 pb-8 space-y-6">
          <div className="text-center">
            <p className="text-sm font-bold text-gray-light/60 leading-relaxed">
              {instructions || "وجه الكاميرا نحو رمز QR للطالب لتسجيل الحضور"}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full py-4 rounded-2xl bg-white/5 hover:bg-rose-500/10 text-gray-light/40 hover:text-rose-400 font-bold text-xs border border-white/5 hover:border-rose-500/20 transition-all active:scale-95 uppercase tracking-widest"
          >
            إلغاء العملية
          </button>
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-primary/20 blur-[80px] rounded-full pointer-events-none" />
      </div>

      <style jsx global>{`
        #reader { border: none !important; }
        #reader video { 
          object-fit: cover !important; 
          border-radius: 2rem !important;
        }
        @keyframes scan {
          0%, 100% { transform: translateY(-100px); opacity: 0; }
          50% { opacity: 1; }
          90% { transform: translateY(100px); opacity: 0; }
        }
        .animate-scan {
          animation: scan 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default QRScannerModal;
