'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getStudentPendingPayments } from '@/services/paymentService';

export default function PaymentConfirmBanner() {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const payments = await getStudentPendingPayments();
        setPendingCount(payments.length);
      } catch {
        // Ignore errors
      }
    };
    fetchPending();
  }, []);

  if (pendingCount === 0) return null;

  return (
    <div className="bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
            <i className="fas fa-receipt text-primary text-xl"></i>
          </div>
          <div>
            <p className="text-white font-medium">
              لديك {pendingCount} دفعة في انتظار التأكيد
            </p>
            <p className="text-gray-400 text-sm">
              أدخل الكود المستلم لتفعيل اشتراكك
            </p>
          </div>
        </div>
        <Link
          href="/student/payments/confirm"
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors flex items-center gap-2"
        >
          <span>تأكيد الآن</span>
          <i className="fas fa-arrow-left"></i>
        </Link>
      </div>
    </div>
  );
}
