import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import toast from 'react-hot-toast';
import * as teacherService from '@/services/teacherService';
import { LoadingSpinner, Button, Icon } from '@/components/ui';

interface ScanAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess?: () => void;
}

type CameraState = 'idle' | 'requesting' | 'scanning' | 'error';

const ScanAttendanceModal: React.FC<ScanAttendanceModalProps> = ({ isOpen, onClose, onScanSuccess }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef<boolean>(false);
  const isProcessingRef = useRef<boolean>(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraState, setCameraState] = useState<CameraState>('idle');
  const [cameraError, setCameraError] = useState<string | null>(null);

  const getQrBox = (viewfinderWidth: number, viewfinderHeight: number) => {
    const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
    const size = Math.floor(minEdge * 0.7);
    const bounded = Math.max(180, Math.min(280, size));
    return { width: bounded, height: bounded };
  };

  const getCameraErrorMessage = (error: any) => {
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && window.location.protocol !== 'https:') {
      return 'تطبيق الكاميرا يتطلب اتصال آمن (HTTPS). يرجى التأكد من الرابط.';
    }
    const name = String(error?.name || '').toLowerCase();
    const message = String(error?.message || '').toLowerCase();

    if (name.includes('notallowed') || message.includes('permission') || message.includes('denied')) {
      return 'تعذر الوصول للكاميرا. تأكد من إعطاء الصلاحية من إعدادات المتصفح.';
    }
    return 'تعذر تشغيل الكاميرا. يرجى إعادة المحاولة.';
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
      setCameraError('تشغيل الكاميرا يتطلب HTTPS أو localhost.');
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 350));

    try {
      await stopScanner();

      const scanner = new Html5Qrcode("attendance-reader");
      scannerRef.current = scanner;

      const config = { fps: 10, qrbox: getQrBox, aspectRatio: 1.0 };

      const onSuccess = async (decodedText: string) => {
        // حماية تضمن عدم إرسال الكود أكتر من مرة في نفس الوقت (ref بدل state عشان الـ closure)
        if (isScanningRef.current && !isProcessingRef.current) {
          isProcessingRef.current = true;
          setIsProcessing(true);
          
          try {
            // 1. أوقف السكنر فوراً لمنع القراءة المتكررة
            await stopScanner();
            setCameraState('idle');

            // 2. أرسل البيانات للـ API
            const response = await teacherService.scanAttendance(decodedText);
            
            if (response.status && response.data) {
              toast.success(response.data.message || 'تم تسجيل الحضور بنجاح');
              if (onScanSuccess) onScanSuccess();
              setTimeout(() => { onClose(); }, 800);
            }
          } catch (error: any) {
            const errorMessage = error?.response?.data?.message || error?.message || 'فشل تسجيل الحضور';
            toast.error(errorMessage);
            isProcessingRef.current = false;
            setIsProcessing(false);
            
            // إعادة تشغيل الكاميرا تلقائياً إذا فشل الـ API بدون تعليق
            startCamera();
          }
        }
      };

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
      setCameraError('حدث خطأ في تشغيل الماسح الضوئي');
    }
  }, [onClose, onScanSuccess, stopScanner]);

  // تشغيل الكاميرا أوتوماتيكياً فور فتح المودال
  useEffect(() => {
    if (isOpen) {
      startCamera();
    }
    return () => {
      stopScanner();
      setCameraState('idle');
      setCameraError(null);
      isProcessingRef.current = false;
      setIsProcessing(false);
    };
  }, [isOpen, startCamera, stopScanner]);

  if (!isOpen) return null;

  return (
    <div className="ux-fixed ux-inset-0 ux-z-50 ux-flex ux-items-center ux-justify-center ux-bg-black-50 ux-backdrop-blur-sm">
      <div className="ux-w-full ux-max-w-md ux-bg-gray-900 ux-border ux-border-gray-800 ux-rounded-xl ux-shadow-2xl ux-overflow-hidden">
        <div className="ux-p-6">
          <div className="ux-flex ux-justify-between ux-items-center ux-mb-4">
            <h3 className="ux-text-xl ux-font-bold ux-text-white">تسجيل الحضور والانصراف</h3>
            <button onClick={onClose} className="ux-text-gray-400 ux-hover-text-white" disabled={isProcessing}>
              <Icon name="times" />
            </button>
          </div>
          
          <div className="ux-bg-black ux-rounded-lg ux-overflow-hidden ux-mb-4 ux-relative ux-min-h-[300px] ux-flex ux-items-center ux-justify-center">
            <div id="attendance-reader" className="ux-w-full ux-h-full"></div>

            {cameraState === 'requesting' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-gray-900/95">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 animate-pulse">
                  <Icon name="spinner" className="text-xl animate-spin" />
                </div>
                <h4 className="text-sm font-bold text-white mb-2">جاري تشغيل الكاميرا تلقائياً...</h4>
              </div>
            )}

            {cameraState === 'error' && cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-gray-900/95">
                <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mb-4">
                  <Icon name="exclamation-triangle" className="text-xl" />
                </div>
                <h4 className="text-sm font-bold text-white mb-2">تعذر تشغيل الكاميرا</h4>
                <p className="text-xs text-gray-400 mb-4">{cameraError}</p>
                <button onClick={startCamera} className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold flex items-center gap-2">
                  <Icon name="sync" />
                  <span>إعادة المحاولة</span>
                </button>
              </div>
            )}
          </div>

          <p className="ux-text-center ux-text-gray-400 ux-text-sm ux-mb-4">
            وجه الكاميرا نحو رمز QR المعروض من قبل الأكاديمية
          </p>

          {isProcessing && (
            <div className="ux-text-center ux-text-primary ux-mb-4 ux-flex ux-items-center ux-justify-center ux-gap-2">
              <LoadingSpinner size="sm" color="primary" />
              <span>جاري تسجيل حضور الطالب...</span>
            </div>
          )}

          <Button variant="secondary" onClick={onClose} disabled={isProcessing} className="ux-w-full">
            إلغاء
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ScanAttendanceModal;
