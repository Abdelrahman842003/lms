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
    <div className="modal-overlay payment-code-overlay">
      <div 
        ref={printRef}
        className="modal-content payment-code-modal"
      >
        {/* Header */}
        <div className="payment-code-header">
          <Icon name="check-circle" size="3x" className="payment-code-header-icon" />
          <h2 className="payment-code-header-title">تم تسجيل الدفعة بنجاح</h2>
        </div>

        {/* Content */}
        <div className="modal-body payment-code-body">
          {/* Student & Amount */}
          <p className="payment-code-label">الطالب</p>
          <p className="payment-code-student">{studentName}</p>
          
          <p className="payment-code-label">المبلغ</p>
          <p className="payment-code-amount">{amount} ج.م</p>

          {/* Code Display */}
          <p className="payment-code-label">كود التأكيد</p>
          <div className="payment-code-box">
            <p className="payment-code-value">
              {code}
            </p>
          </div>

          {/* QR Code */}
          <div className="payment-code-qr">
            <QRCode value={code} size={120} />
          </div>

          {/* Instructions */}
          <div className="payment-code-note">
            <p className="payment-code-note-text">
              <Icon name="info-circle" />
              أعط هذا الكود للطالب ليؤكد الدفع من التطبيق
            </p>
            <p className="payment-code-note-subtext">
              صالح لمدة 7 أيام
            </p>
          </div>

          {/* Actions */}
          <div className="payment-code-actions">
            <Button
              onClick={handleCopy}
              variant="outline"
            >
              <Icon name="copy" />
              نسخ الكود
            </Button>
            <Button
              onClick={handlePrint}
              variant="outline"
            >
              <Icon name="print" />
              طباعة
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <Button
            onClick={onClose}
            variant="primary"
            className="payment-code-done"
          >
            تم
          </Button>
        </div>
      </div>
    </div>
  );
}
