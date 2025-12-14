'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { useAuth } from '@/contexts/AuthContext';

export default function PaymentsPage() {
  const { user } = useAuth();
  const [bankAccount, setBankAccount] = useState({
    bank_name: '',
    account_number: '',
    account_holder: '',
    iban: '',
  });
  const [isEditing, setIsEditing] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Save to backend
    console.log('Saving bank account:', bankAccount);
    setIsEditing(false);
  };

  return (
    <DashboardLayout
      role={user?.userType as 'teacher' | 'secretary' || 'teacher'}
      user={{
        name: user?.name || 'المدرس',
        avatar: user?.avatar || '',
      }}
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6 mb-8">
        <StatCard
          title="إجمالي السحوبات"
          value={0}
          icon="fas fa-money-bill-transfer"
          color="primary"
          prefix="$"
        />
        <StatCard
          title="الرصيد المتاح"
          value={0}
          icon="fas fa-wallet"
          color="secondary"
          prefix="$"
        />
        <StatCard
          title="آخر سحب"
          value="لا يوجد"
          icon="fas fa-clock"
          color="warning"
        />
        <StatCard
          title="حالة الحساب"
          value="نشط"
          icon="fas fa-check-circle"
          color="secondary"
        />
      </div>

      {/* Bank Account Form */}
      <DashboardCard
        title="الحساب البنكي"
        icon="fas fa-university"
        action={
          !isEditing && (
            <button 
              className="btn btn-primary"
              onClick={() => setIsEditing(true)}
            >
              <i className="fas fa-edit"></i>
              <span>تعديل</span>
            </button>
          )
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-5">
            <div className="mb-4">
              <label htmlFor="bank_name" className="block text-gray-light mb-2 text-[0.95rem]">اسم البنك</label>
              <input
                type="text"
                id="bank_name"
                className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white text-[1rem] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                value={bankAccount.bank_name}
                onChange={(e) => setBankAccount({...bankAccount, bank_name: e.target.value})}
                disabled={!isEditing}
                required
                placeholder="مثال: البنك الأهلي"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="account_holder" className="block text-gray-light mb-2 text-[0.95rem]">اسم صاحب الحساب</label>
              <input
                type="text"
                id="account_holder"
                className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white text-[1rem] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                value={bankAccount.account_holder}
                onChange={(e) => setBankAccount({...bankAccount, account_holder: e.target.value})}
                disabled={!isEditing}
                required
                placeholder="الاسم رباعي"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="account_number" className="block text-gray-light mb-2 text-[0.95rem]">رقم الحساب</label>
              <input
                type="text"
                id="account_number"
                className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white text-[1rem] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                value={bankAccount.account_number}
                onChange={(e) => setBankAccount({...bankAccount, account_number: e.target.value})}
                disabled={!isEditing}
                required
                placeholder="رقم الحساب"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="iban" className="block text-gray-light mb-2 text-[0.95rem]">IBAN</label>
              <input
                type="text"
                id="iban"
                className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white text-[1rem] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                value={bankAccount.iban}
                onChange={(e) => setBankAccount({...bankAccount, iban: e.target.value})}
                disabled={!isEditing}
                required
                placeholder="EG..."
              />
            </div>
          </div>

          {isEditing && (
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-white/10">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setIsEditing(false)}
              >
                إلغاء
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
              >
                حفظ التغييرات
              </button>
            </div>
          )}
        </form>
      </DashboardCard>

      {/* Withdrawal History */}
      <DashboardCard
        title="سجل السحوبات"
        icon="fas fa-history"
      >
        <div className="text-center text-gray-light">
          <i className="fas fa-inbox text-5xl opacity-30 mb-3"></i>
          <p>لا توجد سحوبات حتى الآن</p>
        </div>
      </DashboardCard>
    </DashboardLayout>
  );
}
