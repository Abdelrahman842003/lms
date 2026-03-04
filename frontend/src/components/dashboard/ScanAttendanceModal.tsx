import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import toast from 'react-hot-toast';
import * as teacherService from '@/services/teacherService';
import { LoadingSpinner, Button, Icon } from '@/components/ui';

interface ScanAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess?: () => void;
}

const ScanAttendanceModal: React.FC<ScanAttendanceModalProps> = ({ isOpen, onClose, onScanSuccess }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef<boolean>(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    let mounted = true;

    const startScanner = async () => {
      if (isOpen && !scannerRef.current && mounted && !isProcessing) {
        try {
          // Small delay to ensure DOM is ready
          await new Promise(resolve => setTimeout(resolve, 100));
          
          if (!mounted) return;

          const scanner = new Html5Qrcode("attendance-reader");
          scannerRef.current = scanner;

          const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          };

          const onSuccess = async (decodedText: string) => {
            if (mounted && !isProcessing) {
              setIsProcessing(true);
              
              try {
                // Stop scanner immediately
                if (scannerRef.current && isScanningRef.current) {
                  await scannerRef.current.stop();
                  isScanningRef.current = false;
                }

                // Call API
                const response = await teacherService.scanAttendance(decodedText);
                
                if (response.status && response.data) {
                  toast.success(response.data.message || 'تم تسجيل الحضور بنجاح');
                  
                  // Call success callback
                  if (onScanSuccess) {
                    onScanSuccess();
                  }
                  
                  // Close modal after short delay
                  setTimeout(() => {
                    if (mounted) {
                      onClose();
                    }
                  }, 1000);
                }
              } catch (error: any) {
                const errorMessage = error?.response?.data?.message || error?.message || 'فشل تسجيل الحضور';
                toast.error(errorMessage);
                
                // Restart scanner after error
                setIsProcessing(false);
                if (mounted && scannerRef.current) {
                  try {
                    await scannerRef.current.start({ facingMode: "environment" }, config, onSuccess, () => {});
                    isScanningRef.current = true;
                  } catch (restartErr) {
                  }
                }
              }
            }
          };

          try {
            // Attempt 1: Back Camera (Environment)
            await scanner.start({ facingMode: "environment" }, config, onSuccess, () => {});
            isScanningRef.current = true;
          } catch (err) {
            try {
              // Attempt 2: User Camera (Front/Webcam)
              await scanner.start({ facingMode: "user" }, config, onSuccess, () => {});
              isScanningRef.current = true;
            } catch (err2) {
              try {
                // Attempt 3: First available camera ID
                const devices = await Html5Qrcode.getCameras();
                if (devices && devices.length > 0) {
                  await scanner.start(devices[0].id, config, onSuccess, () => {});
                  isScanningRef.current = true;
                } else {
                  throw new Error("No cameras found");
                }
              } catch (err3) {
                toast.error('فشل الوصول إلى الكاميرا. يرجى التحقق من الأذونات.');
              }
            }
          }
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
  }, [isOpen, onClose, onScanSuccess, isProcessing]);

  if (!isOpen) return null;

  return (
    <div className="ux-fixed ux-inset-0 ux-z-50 ux-flex ux-items-center ux-justify-center ux-bg-black-50 ux-backdrop-blur-sm">
      <div className="ux-w-full ux-max-w-md ux-bg-gray-900 ux-border ux-border-gray-800 ux-rounded-xl ux-shadow-2xl ux-overflow-hidden">
        <div className="ux-p-6">
          <div className="ux-flex ux-justify-between ux-items-center ux-mb-4">
            <h3 className="ux-text-xl ux-font-bold ux-text-white">تسجيل الحضور والانصراف</h3>
            <button
              onClick={onClose}
              className="ux-text-gray-400 ux-hover-text-white"
              disabled={isProcessing}
            >
              <Icon name="times" />
            </button>
          </div>
          
          <div className="ux-bg-black ux-rounded-lg ux-overflow-hidden ux-mb-4 ux-relative ux-min-h-300px ux-flex ux-items-center ux-justify-center">
            <div id="attendance-reader" className="ux-w-full ux-h-full"></div>
          </div>

          <p className="ux-text-center ux-text-gray-400 ux-text-sm ux-mb-4">
            وجه الكاميرا نحو رمز QR المعروض من قبل الأكاديمية
          </p>

          {isProcessing && (
            <div className="ux-text-center ux-text-primary ux-mb-4 ux-flex ux-items-center ux-justify-center ux-gap-2">
              <LoadingSpinner size="sm" color="primary" />
              <span>جاري المعالجة...</span>
            </div>
          )}

          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isProcessing}
            className="ux-w-full"
          >
            إلغاء
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ScanAttendanceModal;
