import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import toast from 'react-hot-toast';
import * as teacherService from '@/services/teacherService';

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
                console.error('Scan error:', error);
                const errorMessage = error?.response?.data?.message || error?.message || 'فشل تسجيل الحضور';
                toast.error(errorMessage);
                
                // Restart scanner after error
                setIsProcessing(false);
                if (mounted && scannerRef.current) {
                  try {
                    await scannerRef.current.start({ facingMode: "environment" }, config, onSuccess, () => {});
                    isScanningRef.current = true;
                  } catch (restartErr) {
                    console.error('Failed to restart scanner:', restartErr);
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
            console.warn("Environment camera failed, trying user camera...", err);
            try {
              // Attempt 2: User Camera (Front/Webcam)
              await scanner.start({ facingMode: "user" }, config, onSuccess, () => {});
              isScanningRef.current = true;
            } catch (err2) {
              console.warn("User camera failed, trying fallback...", err2);
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
                console.error("All camera attempts failed:", err3);
                toast.error('فشل الوصول إلى الكاميرا. يرجى التحقق من الأذونات.');
              }
            }
          }
        } catch (err) {
          console.error("Critical error starting scanner:", err);
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
        }).catch(err => {
          console.error("Failed to stop scanner", err);
        });
      }
    };
  }, [isOpen, onClose, onScanSuccess, isProcessing]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white">تسجيل الحضور والانصراف</h3>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-white"
              disabled={isProcessing}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          
          <div className="bg-black rounded-lg overflow-hidden mb-4 relative min-h-[300px] flex items-center justify-center">
            <div id="attendance-reader" className="w-full h-full"></div>
          </div>

          <p className="text-center text-gray-400 text-sm mb-4">
            وجه الكاميرا نحو رمز QR المعروض من قبل الأكاديمية
          </p>

          {isProcessing && (
            <div className="text-center text-primary mb-4">
              <i className="fas fa-spinner fa-spin mr-2"></i>
              جاري المعالجة...
            </div>
          )}

          <button
            onClick={onClose}
            disabled={isProcessing}
            className="w-full py-3 px-4 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScanAttendanceModal;
