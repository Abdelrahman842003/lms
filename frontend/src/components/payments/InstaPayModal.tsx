import React from 'react';
import { toast } from 'react-hot-toast';

interface InstaPayModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    instapay_number: string;
    amount: number;
    payment_message: string;
    payment_key: string;
  };
}

export function InstaPayModal({ isOpen, onClose, data }: InstaPayModalProps) {
  if (!isOpen) return null;

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`تم نسخ ${label}`);
    }).catch(() => {
      toast.error('فشل النسخ');
    });
  };

  const openInstaPay = () => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isAndroid = /android/i.test(userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;

    if (isAndroid) {
      window.location.href = "intent://#Intent;scheme=instapay;package=com.fss.instapay;end";
    } else if (isIOS) {
      window.location.href = "instapay://";
      setTimeout(() => {
        window.location.href = "https://apps.apple.com/eg/app/instapay-egypt/id1592108113";
      }, 2000);
    } else {
      toast.error("يرجى فتح تطبيق إنستا باي من هاتفك");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[#1a1f37] rounded-2xl w-full max-w-md border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <i className="fas fa-money-bill-wave text-primary"></i>
            الدفع عبر إنستا باي
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          
          {/* Warning */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-start gap-3">
            <i className="fas fa-exclamation-triangle text-yellow-500 mt-1"></i>
            <div className="text-sm text-yellow-200/80">
              <p className="font-bold text-yellow-500 mb-1">تنبيه هام جداً</p>
              يرجى نسخ البيانات أدناه بدقة وعدم تغيير "رسالة الدفع" لضمان تأكيد اشتراكك تلقائياً.
            </div>
          </div>

          {/* IPA Address */}
          <div className="space-y-2">
            <label className="text-gray-400 text-sm">عنوان الدفع (IPA)</label>
            <div className="flex gap-2">
              <div className="flex-1 bg-white/5 border border-white/10 rounded-lg p-3 text-white font-mono text-center dir-ltr">
                {data.instapay_number || 'لم يتم تحديد رقم'}
              </div>
              <button 
                onClick={() => copyText(data.instapay_number, 'عنوان الدفع')}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 rounded-lg transition-all"
              >
                <i className="fas fa-copy"></i>
              </button>
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <label className="text-gray-400 text-sm">المبلغ المطلوب</label>
            <div className="flex gap-2">
              <div className="flex-1 bg-white/5 border border-white/10 rounded-lg p-3 text-white font-bold text-center">
                {data.amount} ج.م
              </div>
              <button 
                onClick={() => copyText(data.amount.toString(), 'المبلغ')}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 rounded-lg transition-all"
              >
                <i className="fas fa-copy"></i>
              </button>
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <label className="text-gray-400 text-sm">رسالة الدفع (ملاحظات التحويل)</label>
            <div className="relative">
              <textarea
                readOnly
                value={data.payment_message}
                className="w-full h-32 bg-white/5 border border-white/10 rounded-lg p-3 text-white text-sm resize-none focus:outline-none"
              />
              <button 
                onClick={() => copyText(data.payment_message, 'رسالة الدفع')}
                className="absolute top-2 left-2 bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-all text-xs flex items-center gap-1"
              >
                <i className="fas fa-copy"></i>
                نسخ
              </button>
            </div>
          </div>

          {/* Open App Button */}
          <button
            onClick={openInstaPay}
            className="w-full bg-[#4c2a78] hover:bg-[#5d3491] text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#4c2a78]/20"
          >
            <i className="fas fa-external-link-alt"></i>
            فتح تطبيق InstaPay
          </button>

        </div>
      </div>
    </div>
  );
}
