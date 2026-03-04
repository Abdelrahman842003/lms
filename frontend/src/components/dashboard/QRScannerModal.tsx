import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
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

  useEffect(() => {
    let mounted = true;

    const startScanner = async () => {
      if (isOpen && !scannerRef.current && mounted) {
        try {
          // Small delay to ensure DOM is ready
          await new Promise(resolve => setTimeout(resolve, 100));
          
          if (!mounted) return;

          const scanner = new Html5Qrcode("reader");
          scannerRef.current = scanner;

          const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          };

          const onSuccess = (decodedText: string) => {
            if (mounted) {
              onScanSuccess(decodedText);
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
                // Could show a toast here if needed
              }
            }
          }
        } catch (err) {
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
