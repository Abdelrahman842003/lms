'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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

type CameraState = 'idle' | 'requesting' | 'scanning' | 'error';

const QRScannerModal: React.FC<QRScannerModalProps> = ({ isOpen, onClose, onScanSuccess, lectureTitle, instructions }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cameraState, setCameraState] = useState<CameraState>('idle');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);



  const getQrBox = (viewfinderWidth: number, viewfinderHeight: number) => {
    const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
    const size = Math.floor(minEdge * 0.7);
    const bounded = Math.max(180, Math.min(280, size));
    return { width: bounded, height: bounded };
  };

  const getCameraErrorMessage = (error: any) => {
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && window.location.protocol !== 'https:') {
      return 'تطبيق الكاميرا يتطلب اتصال آمن (HTTPS) أو استخدام Localhost. يرجى التأكد من الرابط.';
    }
    const name = String(error?.name || '').toLowerCase();
    const message = String(error?.message || '').toLowerCase();

    if (name.includes('notallowed') || message.includes('permission') || message.includes('denied')) {
      return 'تعذر الوصول للكاميرا. تأكد من إعطاء الصلاحية للكاميرا من إعدادات المتصفح نفسه.';
    }
    if (name.includes('notfound') || message.includes('not found') || message.includes('no camera')) {
      return 'لم يتم العثور على كاميرا على هذا الجهاز.';
    }
    if (name.includes('notreadable') || message.includes('device in use')) {
      return 'الكاميرا مستخدمة حالياً بواسطة تطبيق آخر. أغلق أي تطبيق يستخدم الكاميرا وحاول مرة أخرى.';
    }
    return 'تعذر الوصول للكاميرا. تأكد من إعطاء الصلاحية.';
  };

  const stopScanner = useCallback(async () => {
    if (scannerRef.current && isScanningRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {
        // ignore
      }
    }
    scannerRef.current = null;
    isScanningRef.current = false;
  }, []);

  const startCamera = useCallback(async () => {
    setCameraState('requesting');
    setCameraError(null);

    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setCameraState('error');
      setCameraError('تشغيل الكاميرا يتطلب HTTPS أو الاتصال من localhost.');
      return;
    }

    // انتطار بسيط لضمان أن الـ Div حصل له Mount في الـ DOM بالكامل
    await new Promise(resolve => setTimeout(resolve, 350));

    try {
      await stopScanner();

      const scanner = new Html5Qrcode("reader");
      scannerRef.current = scanner;

      const config = { fps: 15, qrbox: getQrBox, aspectRatio: 1.0 };
      const onSuccess = (text: string) => { onScanSuccess(text); };

      let lastError: any = null;

      try {
        await scanner.start({ facingMode: "environment" }, config, onSuccess, () => {});
        isScanningRef.current = true;
        setCameraState('scanning');
        return;
      } catch (err) {
        lastError = err;
      }

      try {
        await scanner.start({ facingMode: "user" }, config, onSuccess, () => {});
        isScanningRef.current = true;
        setCameraState('scanning');
        return;
      } catch (err2) {
        lastError = err2;
      }

      setCameraState('error');
      setCameraError(getCameraErrorMessage(lastError));
    } catch (err) {
      setCameraState('error');
      setCameraError('حدث خطأ في تشغيل الماسح الضوئي للكاميرا.');
    }
  }, [onScanSuccess, stopScanner]);

  // هنا السحر: تشغيل تلقائي فوري بمجرد فتح المودال، و Cleanup كامل عند القفل
  useEffect(() => {
    if (isOpen) {
      startCamera();
    }
    return () => {
      stopScanner();
      setCameraState('idle');
      setCameraError(null);
    };
  }, [isOpen, startCamera, stopScanner]);

  const handleTriggerFileInput = async () => {
    await stopScanner();
    setCameraState('idle');
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
      toast.error('لم يتم العثور على رمز QR صالح في الصورة.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-overlay-bg backdrop-blur-2xl" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface-primary border border-border-theme-primary rounded-[3rem] shadow-2xl overflow-hidden">
        <div className="px-8 pt-8 pb-6 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-text-theme-primary tracking-tight">مسح الحضور</h3>
            <p className="text-[10px] font-bold text-primary uppercase mt-1">{lectureTitle}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-surface-secondary flex items-center justify-center text-text-theme-secondary">
            <Icon name="times" className="text-sm" />
          </button>
        </div>

        <div className="px-6 pb-6">
          <div className="relative aspect-square bg-black rounded-[2rem] overflow-hidden border border-border-theme-secondary">
            <div id="reader" className="w-full h-full scale-110" />
            
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="absolute top-10 left-10 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-2xl opacity-80" />
              <div className="absolute top-10 right-10 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-2xl opacity-80" />
              <div className="absolute bottom-10 left-10 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-2xl opacity-80" />
              <div className="absolute bottom-10 right-10 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-2xl opacity-80" />
              {cameraState === 'scanning' && <div className="w-[80%] h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent animate-scan" />}
            </div>

            {cameraState === 'requesting' && (
              <div className="absolute inset-0 bg-surface-primary/95 flex flex-col items-center justify-center p-6 text-center z-10">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 animate-pulse">
                  <Icon name="spinner" className="text-xl animate-spin" />
                </div>
                <h4 className="text-sm font-bold text-text-theme-primary mb-2">جاري تشغيل الكاميرا تلقائياً...</h4>
              </div>
            )}

            {cameraState === 'error' && cameraError && (
              <div className="absolute inset-0 bg-surface-primary/95 flex flex-col items-center justify-center p-6 text-center z-10">
                <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mb-4">
                  <Icon name="exclamation-triangle" className="text-xl" />
                </div>
                <h4 className="text-sm font-bold text-text-theme-primary mb-2">عذراً، تعذر تشغيل الكاميرا</h4>
                <p className="text-xs text-text-theme-secondary mb-6 leading-relaxed max-w-[260px]">{cameraError}</p>
                <div className="flex gap-2">
                  <button onClick={handleTriggerFileInput} className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold">رفع صورة الـ QR</button>
                  <button onClick={startCamera} className="px-4 py-2 bg-surface-secondary text-text-theme-primary rounded-xl text-xs font-bold border border-border-theme-primary">إعادة المحاولة</button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-8 pb-8 space-y-6">
          <div className="text-center">
            <p className="text-sm font-bold text-text-theme-secondary leading-relaxed">
              {instructions || "وجه الكاميرا نحو رمز QR لتسجيل الحضور"}
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <button onClick={handleTriggerFileInput} disabled={isProcessing} className="w-full py-4 rounded-2xl bg-primary text-white font-bold text-xs shadow-xl flex items-center justify-center gap-2">
              <Icon name="file-image" className="text-sm" />
              <span>مسح من صورة (معرض الصور)</span>
            </button>
            <button onClick={onClose} className="w-full py-4 rounded-2xl bg-surface-secondary text-text-theme-muted font-bold text-xs border border-border-theme-primary">إلغاء العملية</button>
          </div>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>
      <style jsx global>{`
        #reader { border: none !important; }
        #reader video { object-fit: cover !important; border-radius: 2rem !important; }
        @keyframes scan { 0%, 100% { transform: translateY(-100px); opacity: 0; } 50% { opacity: 1; } 90% { transform: translateY(100px); opacity: 0; } }
        .animate-scan { animation: scan 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default QRScannerModal;
