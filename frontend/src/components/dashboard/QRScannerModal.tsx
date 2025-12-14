import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
  lectureTitle: string;
  instructions?: string;
}

const QRScannerModal: React.FC<QRScannerModalProps> = ({ isOpen, onClose, onScanSuccess, lectureTitle, instructions }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (isOpen && !scannerRef.current) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        const scanner = new Html5QrcodeScanner(
          "reader",
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          /* verbose= */ false
        );
        
        scanner.render(
          (decodedText) => {
            scanner.clear();
            onScanSuccess(decodedText);
          },
          () => {
            // parse error, ignore it.
          }
        );
        
        scannerRef.current = scanner;
      }, 100);

      return () => clearTimeout(timer);
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [isOpen, onScanSuccess]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white">تسجيل حضور: {lectureTitle}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <i className="fas fa-times"></i>
            </button>
          </div>
          
          <div className="bg-black rounded-lg overflow-hidden mb-4 relative min-h-[300px]">
            <div id="reader" className="w-full h-full"></div>
          </div>

          <p className="text-center text-gray-400 text-sm mb-4">
            {instructions || "وجه الكاميرا نحو رمز QR للطالب لتسجيل الحضور"}
          </p>

          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRScannerModal;
