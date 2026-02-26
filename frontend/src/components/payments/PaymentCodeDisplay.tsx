'use client';

import React, { useRef } from 'react';
import QRCode from 'react-qr-code';
import { Button, Icon } from '@/components/ui';

interface Props {
  code: string;
  amount: number;
  studentName: string;
  onClose: () => void;
}

export default function PaymentCodeDisplay({ code, amount, studentName, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  // Copy code to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    // Use a simple alert since we can't assume toast is available here
    alert('تم نسخ الكود');
  };

  // Print receipt
  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '', 'width=400,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <title>إيصال الدفع</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            padding: 20px;
            text-align: center;
          }
          .receipt {
            border: 2px dashed #333;
            padding: 20px;
            max-width: 300px;
            margin: 0 auto;
          }
          .code {
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 4px;
            margin: 20px 0;
            font-family: monospace;
          }
          .amount {
            font-size: 24px;
            color: #2563eb;
            margin: 10px 0;
          }
          .student {
            font-size: 18px;
            margin: 10px 0;
          }
          .note {
            font-size: 12px;
            color: #666;
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px dashed #ccc;
          }
          .qr {
            margin: 20px auto;
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <h2>إيصال دفع</h2>
          <p class="student">${studentName}</p>
          <p class="amount">${amount} ج.م</p>
          <p class="code">${code}</p>
          <p class="note">
            أدخل هذا الكود في التطبيق لتأكيد الدفع<br>
            صالح لمدة 7 أيام
          </p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div 
        ref={printRef}
        className="bg-dark-lighter rounded-2xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary/70 p-6 text-center">
          <Icon name="check-circle" size="3x" className="text-white mb-3" />
          <h2 className="text-xl font-bold text-white">تم تسجيل الدفعة بنجاح</h2>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          {/* Student & Amount */}
          <p className="text-gray-400 mb-2">الطالب</p>
          <p className="text-xl text-white font-medium mb-4">{studentName}</p>
          
          <p className="text-gray-400 mb-2">المبلغ</p>
          <p className="text-3xl text-primary font-bold mb-6">{amount} ج.م</p>

          {/* Code Display */}
          <p className="text-gray-400 mb-3">كود التأكيد</p>
          <div className="bg-white/10 border-2 border-dashed border-primary/50 rounded-xl p-6 mb-6">
            <p className="text-4xl font-mono font-bold text-white tracking-widest">
              {code}
            </p>
          </div>

          {/* QR Code */}
          <div className="bg-white p-4 rounded-xl inline-block mb-6">
            <QRCode value={code} size={120} />
          </div>

          {/* Instructions */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
            <p className="text-yellow-400 text-sm">
              <Icon name="info-circle" className="ml-2" />
              أعط هذا الكود للطالب ليؤكد الدفع من التطبيق
            </p>
            <p className="text-yellow-400/70 text-xs mt-2">
              صالح لمدة 7 أيام
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleCopy}
              variant="outline"
              className="flex-1 py-3"
            >
              <Icon name="copy" className="ml-2" />
              نسخ الكود
            </Button>
            <Button
              onClick={handlePrint}
              variant="outline"
              className="flex-1 py-3"
            >
              <Icon name="print" className="ml-2" />
              طباعة
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <Button
            onClick={onClose}
            variant="primary"
            className="w-full py-3"
          >
            تم
          </Button>
        </div>
      </div>
    </div>
  );
}
