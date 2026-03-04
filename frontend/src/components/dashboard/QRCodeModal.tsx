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
    <div className="ux-fixed ux-inset-0 ux-z-50 ux-flex ux-items-center ux-justify-center ux-bg-black-50 ux-backdrop-blur-sm">
      <div className="ux-w-full ux-max-w-md ux-bg-gray-900 ux-border ux-border-gray-800 ux-rounded-xl ux-shadow-2xl ux-overflow-hidden">
        <div className="ux-p-6 ux-text-center">
          <h3 className="ux-text-xl ux-font-bold ux-text-white ux-mb-2">{lectureTitle}</h3>
          <p className="ux-text-gray-400 ux-mb-6">امسح الرمز لتسجيل الحضور</p>

          <div className="ux-bg-white ux-p-4 ux-rounded-xl ux-inline-block ux-mb-6">
            <QRCode value={url} size={256} />
          </div>

          {expiresAt && (
            <div className={`ux-mb-6 ux-text-sm ${isExpired ? 'ux-text-red-400' : 'ux-text-emerald-400'}`}>
              {isExpired ? 'انتهت صلاحية الرمز' : `ينتهي في: ${new Date(expiresAt).toLocaleTimeString('ar-EG')}`}
            </div>
          )}

          <button
            onClick={onClose}
            className="ux-w-full ux-py-3 ux-px-4 ux-bg-gray-800 ux-hover-bg-gray-700 ux-text-white ux-rounded-lg ux-transition-colors ux-font-medium"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;
