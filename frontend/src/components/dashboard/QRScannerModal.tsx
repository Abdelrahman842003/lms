import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import toast from 'react-hot-toast';
import { Button, Icon } from '@/components/ui';

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

  const getCameraSupportMessage = () => {
    if (typeof window === 'undefined') return null;
    if (!window.isSecureContext) {
      return 'تشغيل الكاميرا يتطلب HTTPS أو localhost.';
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return 'الكاميرا غير مدعومة في هذا المتصفح.';
    }
    return null;
  };

  const getCameraErrorMessage = (error: any) => {
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      return 'تشغيل الكاميرا يتطلب HTTPS أو localhost.';
    }

    const name = String(error?.name || '').toLowerCase();
    const message = String(error?.message || '').toLowerCase();

    if (name.includes('notallowed') || message.includes('permission') || message.includes('denied')) {
      return 'تم رفض إذن الكاميرا. فعّل الإذن من إعدادات المتصفح.';
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
    return 'فشل الوصول إلى الكاميرا. يرجى التحقق من الأذونات.';
  };

  useEffect(() => {
    let mounted = true;

    const startScanner = async () => {
      if (isOpen && !scannerRef.current && mounted) {
        try {
          // Small delay to ensure DOM is ready
          await new Promise(resolve => setTimeout(resolve, 100));
          
          if (!mounted) return;

          const supportMessage = getCameraSupportMessage();
          if (supportMessage) {
            toast.error(supportMessage);
            return;
          }

          const scanner = new Html5Qrcode("reader");
          scannerRef.current = scanner;

          const config = {
            fps: 10,
            qrbox: getQrBox,
            aspectRatio: 1.0
          };

          const onSuccess = (decodedText: string) => {
            if (mounted) {
              onScanSuccess(decodedText);
            }
          };

          let lastError: any = null;

          try {
            // Attempt 1: Back Camera (Environment)
            await scanner.start({ facingMode: "environment" }, config, onSuccess, () => {});
            isScanningRef.current = true;
            return;
          } catch (err) {
            lastError = err;
          }

          try {
            // Attempt 2: User Camera (Front/Webcam)
            await scanner.start({ facingMode: "user" }, config, onSuccess, () => {});
            isScanningRef.current = true;
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
              return;
            }
            lastError = new Error("No cameras found");
          } catch (err3) {
            lastError = err3;
          }

          toast.error(getCameraErrorMessage(lastError));
        } catch (err) {
          toast.error('حدث خطأ في تشغيل الماسح الضوئي');
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
        }).catch(() => {
        });
      }
    };
  }, [isOpen, onScanSuccess]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content qr-scanner-modal">
        <div className="modal-body">
          <div className="qr-scanner-header">
            <h3 className="qr-scanner-title">تسجيل حضور: {lectureTitle}</h3>
            <button onClick={onClose} className="modal-close" type="button" aria-label="إغلاق">
              <Icon name="times" />
            </button>
          </div>
          
          <div className="qr-scanner-reader-wrap">
            <div id="reader" className="ux-w-full ux-h-full"></div>
          </div>

          <p className="qr-scanner-instructions">
            {instructions || "وجه الكاميرا نحو رمز QR للطالب لتسجيل الحضور"}
          </p>

          <Button
            variant="secondary"
            onClick={onClose}
            className="qr-scanner-cancel"
          >
            إلغاء
          </Button>


        </div>
      </div>
    </div>
  );
};

export default QRScannerModal;
