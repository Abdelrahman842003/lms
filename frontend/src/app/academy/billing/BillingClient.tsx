'use client';

import React, { useState } from 'react';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { InstaPayModal } from '@/components/payments/InstaPayModal';
import { initiateInstapayPayment } from '@/services/academyService';
import { toast } from 'react-hot-toast';

export function BillingClient() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<{
    instapay_number: string;
    amount: number;
    payment_message: string;
    payment_key: string;
  } | null>(null);

  // Mock data for demonstration if API fails or for initial view
  const handlePayClick = async () => {
    setIsLoading(true);
    try {
      // In a real scenario, we might fetch the amount due first
      // For now, we'll initiate a payment for the current month
      const date = new Date();
      const response = await initiateInstapayPayment({
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        amount: 500 // Example amount, should come from backend calculation
      });

      if (response && response.data) {
        setPaymentData({
          instapay_number: response.data.instapay_number || 'abdo.eid@instapay',
          amount: response.data.amount || 500,
          payment_message: response.data.payment_message || `Order #${Date.now()}`,
          payment_key: response.data.payment_key || '',
        });
        setIsModalOpen(true);
      } else {
        // Fallback if API doesn't return expected structure (e.g. during dev)
        setPaymentData({
          instapay_number: 'abdo.eid@instapay',
          amount: 500,
          payment_message: `PAY-${Math.random().toString(36).substring(7).toUpperCase()}`,
          payment_key: 'mock-key',
        });
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error('Failed to initiate payment:', error);
      toast.error('فشل في بدء عملية الدفع');
      
      // Fallback for demo purposes so user can see the modal
      setPaymentData({
        instapay_number: 'abdo.eid@instapay',
        amount: 500,
        payment_message: `PAY-${Math.random().toString(36).substring(7).toUpperCase()}`,
        payment_key: 'mock-key',
      });
      setIsModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <DashboardCard title="الاشتراك الحالي" icon="fas fa-credit-card">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-2 text-center md:text-right">
            <h3 className="text-xl font-bold text-white">باقة الأكاديمية</h3>
            <p className="text-gray-400">اشتراك شهري شامل جميع المميزات</p>
            <div className="flex items-center gap-2 text-primary">
              <i className="fas fa-check-circle"></i>
              <span>نشط حالياً</span>
            </div>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-1">500 ج.م</div>
            <div className="text-sm text-gray-400">شهرياً</div>
          </div>

          <button
            onClick={handlePayClick}
            disabled={isLoading}
            className="btn btn-primary px-8 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
          >
            {isLoading ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <i className="fas fa-money-bill-wave"></i>
            )}
            دفع الاشتراك
          </button>
        </div>
      </DashboardCard>

      {paymentData && (
        <InstaPayModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          data={paymentData}
        />
      )}
    </div>
  );
}
