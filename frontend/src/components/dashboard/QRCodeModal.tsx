import React from 'react';
import QRCode from 'react-qr-code';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden">
        <div className="p-6 text-center">
          <h3 className="text-xl font-bold text-white mb-2">{lectureTitle}</h3>
          <p className="text-gray-400 mb-6">امسح الرمز لتسجيل الحضور</p>

          <div className="bg-white p-4 rounded-xl inline-block mb-6">
            <QRCode value={url} size={256} />
          </div>

          {expiresAt && (
            <div className={`mb-6 text-sm ${isExpired ? 'text-red-400' : 'text-emerald-400'}`}>
              {isExpired ? 'انتهت صلاحية الرمز' : `ينتهي في: ${new Date(expiresAt).toLocaleTimeString('ar-EG')}`}
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;
