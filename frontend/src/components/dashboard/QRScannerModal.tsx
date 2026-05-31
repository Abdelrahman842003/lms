'use client';
import React, { useEffect, useRef, useState } from 'react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [retryTrigger, setRetryTrigger] = useState(0);

  const getQrBox = (viewfinderWidth: number, viewfinderHeight: number) => {
    const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
    const size = Math.floor(minEdge * 0.7);
    const bounded = Math.max(180, Math.min(280, size));
    return { width: bounded, height: bounded };
  };

  const getCameraSupportMessage = () => {
    if (typeof window === 'undefined') return null;
    if (!window.isSecureContext) {
      return 'تشغيل الكاميرا يتطلب HTTPS أو الاتصال من localhost.';
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return 'الكاميرا غير مدعومة في هذا المتصفح أو التطبيق.';
    }
    return null;
  };

  const getCameraErrorMessage = (error: any) => {
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      return 'تشغيل الكاميرا يتطلب HTTPS أو الاتصال من localhost.';
    }

    const name = String(error?.name || '').toLowerCase();
    const message = String(error?.message || '').toLowerCase();

    if (name.includes('notallowed') || message.includes('permission') || message.includes('denied')) {
      return 'تم رفض إذن الكاميرا. فعّل إذن الكاميرا للموقع من إعدادات المتصفح.';
    }
    if (name.includes('notfound') || message.includes('not found') || message.includes('no camera')) {
      return 'لم يتم العثور على كاميرا على هذا الجهاز.';
    }
    if (name.includes('notreadable') || message.includes('device in use')) {
      return 'الكاميرا مستخدمة حالياً بواسطة تطبيق آخر.';
    }
    if (name.includes('overconstrained') || message.includes('constraints')) {
      return 'تعذر تهيئة الكاميرا بالإعدادات المطلوبة.';
    }
    return 'فشل الوصول إلى الكاميرا. يرجى التحقق من الأذونات وتأكد من إعطاء الصلاحية.';
  };

  useEffect(() => {
    let mounted = true;

    const startScanner = async () => {
      if (isOpen && !scannerRef.current && mounted) {
        try {
          setCameraError(null);
          // Wait for DOM to render
          await new Promise(resolve => setTimeout(resolve, 300));
          if (!mounted) return;

          const supportMessage = getCameraSupportMessage();
          if (supportMessage) {
            setCameraError(supportMessage);
            return;
          }

          const scanner = new Html5Qrcode("reader");
          scannerRef.current = scanner;

          const config = { fps: 15, qrbox: getQrBox, aspectRatio: 1.0 };
          const onSuccess = (text: string) => { if (mounted) onScanSuccess(text); };

          let lastError: any = null;

          try {
            // Attempt 1: Back Camera (Environment)
            await scanner.start({ facingMode: "environment" }, config, onSuccess, () => {});
            isScanningRef.current = true;
            setIsScanning(true);
            return;
          } catch (err) {
            lastError = err;
          }

          try {
            // Attempt 2: User Camera (Front/Webcam)
            await scanner.start({ facingMode: "user" }, config, onSuccess, () => {});
            isScanningRef.current = true;
            setIsScanning(true);
            return;
          } catch (err2) {
            lastError = err2;
          }

          try {
            // Attempt 3: First available camera ID
            const devices = await Html5Qrcode.getCameras();
            if (devices && devices.length > 0) {
              await scanner.start(devices[0].id, config, onSuccess, () => {});
              isScanningRef.current = true;
              setIsScanning(true);
              return;
            }
            lastError = new Error("No cameras found");
          } catch (err3) {
            lastError = err3;
          }

          setCameraError(getCameraErrorMessage(lastError));
        } catch (err) {
          setCameraError('حدث خطأ في تشغيل الماسح الضوئي للكاميرا.');
        }
      }
    };

    if (isOpen) {
      startScanner();
    }

    return () => {
      mounted = false;
      if (scannerRef.current && isScanningRef.current) {
        scannerRef.current.stop().then(() => {
          scannerRef.current?.clear();
          scannerRef.current = null;
          isScanningRef.current = false;
          setIsScanning(false);
        }).catch(() => {});
      }
    };
  }, [isOpen, onScanSuccess, retryTrigger]);

  const handleTriggerFileInput = async () => {
    if (scannerRef.current && isScanningRef.current) {
      try {
        await scannerRef.current.stop();
        isScanningRef.current = false;
        setIsScanning(false);
      } catch (err) {
        console.error("Failed to stop scanner before file select:", err);
      }
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      let scanner = scannerRef.current;
      if (!scanner) {
        scanner = new Html5Qrcode("reader");
        scannerRef.current = scanner;
      }
      
      const decodedText = await scanner.scanFile(file, true);
      onScanSuccess(decodedText);
    } catch (err) {
      console.error(err);
      toast.error('لم يتم العثور على رمز QR صالح في الصورة. يرجى التأكد من وضوح الصورة.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const retryCamera = () => {
    setCameraError(null);
    setRetryTrigger(prev => prev + 1);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Immersive Backdrop */}
      <div className="absolute inset-0 bg-overlay-bg backdrop-blur-2xl animate-in fade-in duration-500" onClick={onClose} />

      {/* Premium Scanner Card */}
      <div className="relative w-full max-w-md bg-surface-primary border border-border-theme-primary rounded-[3rem] shadow-2xl shadow-primary/10 overflow-hidden animate-in zoom-in-95 duration-500">
        
        {/* Header Section */}
        <div className="px-8 pt-8 pb-6 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-text-theme-primary tracking-tight">مسح الحضور</h3>
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1">{lectureTitle}</p>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-full bg-surface-secondary flex items-center justify-center text-text-theme-secondary hover:text-text-theme-primary transition-colors"
          >
            <Icon name="times" className="text-sm" />
          </button>
        </div>

        {/* Camera & Scanner Interface */}
        <div className="px-6 pb-6">
          <div className="relative aspect-square bg-black rounded-[2rem] overflow-hidden border border-border-theme-secondary group">
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
              {isScanning && !cameraError && <div className="w-[80%] h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent animate-scan shadow-[0_0_15px_rgba(50,73,169,0.8)]" />}
            </div>

            {/* Instructions Overlay (Subtle) */}
            {isScanning && !cameraError && (
              <div className="absolute bottom-6 left-0 right-0 text-center px-4">
                <span className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-full text-[9px] font-bold text-white/60 uppercase tracking-widest border border-white/5">
                  Focusing...
                </span>
              </div>
            )}

            {/* Camera Error / Fallback UI */}
            {cameraError && (
              <div className="absolute inset-0 bg-surface-primary/95 flex flex-col items-center justify-center p-6 text-center z-10 animate-in fade-in duration-300">
                <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mb-4 border border-rose-500/20">
                  <Icon name="exclamation-triangle" className="text-xl" />
                </div>
                <h4 className="text-sm font-bold text-text-theme-primary mb-2">عذراً، تعذر تشغيل الكاميرا</h4>
                <p className="text-xs text-text-theme-secondary mb-6 leading-relaxed max-w-[260px]">
                  {cameraError}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleTriggerFileInput}
                    className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-2"
                  >
                    <Icon name="file-image" />
                    <span>رفع صورة الـ QR</span>
                  </button>
                  <button
                    onClick={retryCamera}
                    className="px-4 py-2 bg-surface-secondary hover:bg-surface-secondary/80 text-text-theme-primary rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-2 border border-border-theme-primary"
                  >
                    <Icon name="sync" />
                    <span>إعادة المحاولة</span>
                  </button>
                </div>
              </div>
            )}

            {/* Processing Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-6 text-center z-20 animate-in fade-in duration-200">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 border border-primary/20 animate-pulse">
                  <Icon name="spinner" className="text-xl animate-spin" />
                </div>
                <h4 className="text-sm font-bold text-white mb-2">جاري قراءة الرمز...</h4>
                <p className="text-xs text-white/60 leading-relaxed max-w-[200px]">
                  يرجى الانتظار حتى نتمكن من فك تشفير الـ QR وإرسال الحضور.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Hidden File Input for QR Scanning Fallback */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Footer Info */}
        <div className="px-8 pb-8 space-y-6">
          <div className="text-center">
            <p className="text-sm font-bold text-text-theme-secondary leading-relaxed">
              {instructions || "وجه الكاميرا نحو رمز QR للطالب لتسجيل الحضور"}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleTriggerFileInput}
              disabled={isProcessing}
              className="w-full py-4 rounded-2xl bg-primary hover:bg-primary/95 disabled:bg-primary/50 text-white font-bold text-xs shadow-xl shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-95 uppercase tracking-widest"
            >
              {isProcessing ? (
                <>
                  <Icon name="spinner" className="animate-spin text-sm" />
                  <span>جاري قراءة الصورة...</span>
                </>
              ) : (
                <>
                  <Icon name="file-image" className="text-sm" />
                  <span>مسح من صورة (معرض الصور)</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="w-full py-4 rounded-2xl bg-surface-secondary hover:bg-rose-500/10 text-text-theme-muted hover:text-rose-400 font-bold text-xs border border-border-theme-primary hover:border-rose-500/20 transition-all active:scale-95 uppercase tracking-widest"
            >
              إلغاء العملية
            </button>
          </div>
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
