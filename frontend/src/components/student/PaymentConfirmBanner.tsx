'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getStudentPendingPayments } from '@/services/paymentService';
import { Icon } from '@/components/ui';

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
    <div className="ux-bg-gradient-to-r ux-from-primary-20 ux-to-primary-10 ux-border ux-border-primary-30 ux-rounded-xl ux-p-4 ux-mb-6">
      <div className="ux-flex ux-items-center ux-justify-between">
        <div className="ux-flex ux-items-center ux-gap-3">
          <div className="ux-w-12 ux-h-12 ux-bg-primary-20 ux-rounded-full ux-flex ux-items-center ux-justify-center">
            <Icon name="receipt" size="xl" color="primary" />
          </div>
          <div>
            <p className="ux-text-white ux-font-medium">
              لديك {pendingCount} دفعة في انتظار التأكيد
            </p>
            <p className="ux-text-gray-400 ux-text-sm">
              أدخل الكود المستلم لتفعيل اشتراكك
            </p>
          </div>
        </div>
        <Link
          href="/student/payments/confirm"
          className="ux-px-4 ux-py-2 ux-bg-primary ux-text-white ux-rounded-lg ux-hover-bg-primary-80 ux-transition-colors ux-flex ux-items-center ux-gap-2"
        >
          <span>تأكيد الآن</span>
          <Icon name="arrow-left" size="sm" />
        </Link>
      </div>
    </div>
  );
}
