import React, { useEffect, useMemo, useState } from 'react';
import { FormModal, Select, Icon } from '@/components/ui';
import type { PlanOption, SubscriptionRenewalRequest } from '@/types/subscription.types';

interface SubscriptionRenewalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: SubscriptionRenewalRequest) => Promise<void> | void;
  planOptions: PlanOption[];
  currentPlanSelection: string;
  currentPlanLabel?: string;
  currentSeatsLimit: number | null;
  currentStorageLimitMinutes: number;
  currentDeliveryLimitMinutes: number;
  pricePerSeat: number;
  pricePerStorageMinute: number;
  pricePerDeliveryMinute: number;
  isLoading?: boolean;
}

export default function SubscriptionRenewalModal({
  isOpen,
  onClose,
  onSubmit,
  planOptions,
  currentPlanSelection,
  currentPlanLabel,
  currentSeatsLimit,
  currentStorageLimitMinutes,
  currentDeliveryLimitMinutes,
  pricePerSeat,
  pricePerStorageMinute,
  pricePerDeliveryMinute,
  isLoading = false,
}: SubscriptionRenewalModalProps) {
  const [selectedPlanCode, setSelectedPlanCode] = useState<string>('');
  const [changePlan, setChangePlan] = useState<boolean>(false);
  const [customMonths, setCustomMonths] = useState<number>(1);
  const [upgradeSeats, setUpgradeSeats] = useState<boolean>(false);
  const [upgradeStorage, setUpgradeStorage] = useState<boolean>(false);
  const [newSeatsLimit, setNewSeatsLimit] = useState<string>('');
  const [newStorageLimitMinutes, setNewStorageLimitMinutes] = useState<string>('');
  const [newDeliveryLimitMinutes, setNewDeliveryLimitMinutes] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');

  const activePlanSelection = changePlan ? selectedPlanCode : currentPlanSelection;

  const selectOptions = useMemo(
    () => planOptions.map(option => ({ value: option.value, label: option.label })),
    [planOptions]
  );

  const selectedPlan = useMemo(
    () => planOptions.find(option => option.value === activePlanSelection),
    [activePlanSelection, planOptions]
  );

  const months = useMemo(() => {
    if (!activePlanSelection) return 0;
    if (activePlanSelection === 'custom') {
      return Number.isFinite(customMonths) ? Math.max(1, customMonths) : 1;
    }

    return selectedPlan?.months ?? 0;
  }, [activePlanSelection, customMonths, selectedPlan]);

  const seatPriceDifference = useMemo(() => {
    if (!upgradeSeats || !currentSeatsLimit || currentSeatsLimit <= 0 || months <= 0) return 0;
    const nextSeats = parseInt(newSeatsLimit || '0', 10);
    if (!Number.isFinite(nextSeats) || nextSeats <= currentSeatsLimit) return 0;

    return (nextSeats - currentSeatsLimit) * pricePerSeat * months;
  }, [upgradeSeats, currentSeatsLimit, months, newSeatsLimit, pricePerSeat]);

  const storagePriceDifference = useMemo(() => {
    if (!upgradeStorage || months <= 0) return 0;
    
    const nextStorage = parseInt(newStorageLimitMinutes || '0', 10);
    const nextDelivery = parseInt(newDeliveryLimitMinutes || '0', 10);
    
    let diff = 0;
    if (Number.isFinite(nextStorage) && nextStorage > currentStorageLimitMinutes) {
      diff += (nextStorage - currentStorageLimitMinutes) * pricePerStorageMinute;
    }
    
    if (Number.isFinite(nextDelivery) && nextDelivery > currentDeliveryLimitMinutes) {
      diff += (nextDelivery - currentDeliveryLimitMinutes) * pricePerDeliveryMinute;
    }

    return diff * months;
  }, [upgradeStorage, currentStorageLimitMinutes, currentDeliveryLimitMinutes, months, newStorageLimitMinutes, newDeliveryLimitMinutes, pricePerStorageMinute, pricePerDeliveryMinute]);

  const totalPriceDifference = useMemo(
    () => Number((seatPriceDifference + storagePriceDifference).toFixed(2)),
    [seatPriceDifference, storagePriceDifference]
  );

  const canUpgradeSeats = currentSeatsLimit !== null && currentSeatsLimit > 0;
  const canUpgradeStorage = true; // Minutes are always upgradable

  useEffect(() => {
    if (!isOpen) {
      setSelectedPlanCode('');
      setChangePlan(false);
      setCustomMonths(1);
      setUpgradeSeats(false);
      setUpgradeStorage(false);
      setNewSeatsLimit('');
      setNewStorageLimitMinutes('');
      setNewDeliveryLimitMinutes('');
      setValidationError('');
    }
  }, [isOpen]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!activePlanSelection) {
      setValidationError('تعذر تحديد الباقة الحالية، يرجى اختيار الباقة يدوياً.');
      return;
    }

    if (upgradeSeats) {
      if (!canUpgradeSeats) {
        setValidationError('لا يمكن ترقية عدد الكراسي لأن الباقة الحالية غير محدودة.');
        return;
      }

      const nextSeats = parseInt(newSeatsLimit || '0', 10);
      if (!Number.isFinite(nextSeats) || nextSeats <= (currentSeatsLimit ?? 0)) {
        setValidationError('عدد الكراسي الجديد يجب أن يكون أكبر من العدد الحالي.');
        return;
      }
    }

    if (upgradeStorage) {
      const nextStorage = parseInt(newStorageLimitMinutes || '0', 10);
      const nextDelivery = parseInt(newDeliveryLimitMinutes || '0', 10);
      
      if (!Number.isFinite(nextStorage) && !Number.isFinite(nextDelivery)) {
        setValidationError('يجب إدخال عدد الدقائق الجديد.');
        return;
      }

      if (nextStorage > 0 && nextStorage <= currentStorageLimitMinutes) {
        setValidationError('حد التخزين الجديد يجب أن يكون أكبر من الحد الحالي.');
        return;
      }

      if (nextDelivery > 0 && nextDelivery <= currentDeliveryLimitMinutes) {
        setValidationError('حد المشاهدة الجديد يجب أن يكون أكبر من الحد الحالي.');
        return;
      }
    }

    setValidationError('');

    const payload: SubscriptionRenewalRequest = {
      plan_selection: activePlanSelection,
      custom_months: activePlanSelection === 'custom' ? Math.max(1, customMonths) : null,
      upgrade_seats: upgradeSeats,
      upgrade_storage: upgradeStorage,
      new_seats_limit: upgradeSeats ? parseInt(newSeatsLimit, 10) : null,
      new_storage_minutes_limit: upgradeStorage ? parseInt(newStorageLimitMinutes, 10) : null,
      new_delivery_minutes_limit: upgradeStorage ? parseInt(newDeliveryLimitMinutes, 10) : null,
    };

    await onSubmit(payload);
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="تجديد وتطوير الاشتراك"
      submitText="تأكيد الطلب"
      cancelText="إلغاء"
      isLoading={isLoading}
      maxWidth="580px"
    >
      <div className="space-y-8 py-2">
        {/* Current Context Row */}
        <div className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5">
           <div className="space-y-1">
              <span className="text-[10px] font-black text-gray-light/20 uppercase tracking-widest">الباقة الحالية</span>
              <p className="text-sm font-black text-white">{currentPlanLabel || selectedPlan?.label || '---'}</p>
           </div>
           <div className="flex items-center gap-3">
              <div className="text-right">
                  <p className="text-[10px] font-bold text-gray-light/40">الكراسي: {currentSeatsLimit ?? "∞"}</p>
                  <p className="text-[10px] font-bold text-gray-light/40">تخزين: {currentStorageLimitMinutes} د</p>
                  <p className="text-[10px] font-bold text-gray-light/40">مشاهدة: {currentDeliveryLimitMinutes} د</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                 <Icon name="shield-check" className="text-primary text-lg" />
              </div>
           </div>
        </div>

        {/* Change Plan Option */}
        <div className="space-y-4">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <Icon name="exchange-alt" className="text-gray-light/40" />
                 <h3 className="text-sm font-black text-white">هل ترغب في تغيير الباقة؟</h3>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={changePlan} onChange={(e) => setChangePlan(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-white/5 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-inner"></div>
              </label>
           </div>
           
           {changePlan && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-4">
                 <Select
                    options={selectOptions}
                    value={selectedPlanCode}
                    onChange={setSelectedPlanCode}
                    placeholder="اختر الباقة الجديدة"
                    className="w-full"
                    icon="magic"
                 />
                 {activePlanSelection === 'custom' && (
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-light/40 uppercase mr-1">عدد الشهور المراد تجديدها</label>
                       <div className="relative">
                          <input
                            type="number"
                            min={1}
                            value={customMonths}
                            onChange={(e) => setCustomMonths(Math.max(1, Number(e.target.value || 1)))}
                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white font-black focus:border-primary/50 outline-none transition-all"
                          />
                          <Icon name="calendar-day" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-light/20" />
                       </div>
                    </div>
                 )}
              </div>
           )}
        </div>

        <div className="h-px bg-white/5 w-full"></div>

        {/* Resources Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {/* Seats */}
           <div className="space-y-4">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <Icon name="users" size="sm" className="text-gray-light/40" />
                    <span className="text-xs font-black text-white">ترقية الكراسي</span>
                 </div>
                 <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={upgradeSeats} onChange={(e) => setUpgradeSeats(e.target.checked)} disabled={!canUpgradeSeats} className="sr-only peer" />
                    <div className={`w-10 h-5 bg-white/5 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary ${!canUpgradeSeats && 'opacity-20'}`}></div>
                 </label>
              </div>
              {upgradeSeats && (
                 <input
                    type="number"
                    min={(currentSeatsLimit ?? 0) + 1}
                    placeholder="العدد الجديد"
                    value={newSeatsLimit}
                    onChange={(e) => setNewSeatsLimit(e.target.value)}
                    className="w-full bg-slate-900 border border-primary/20 rounded-xl px-4 py-3 text-white font-black text-sm focus:border-primary/50 outline-none transition-all placeholder:text-gray-light/10"
                 />
              )}
           </div>

           {/* Storage & Delivery */}
           <div className="space-y-4">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <Icon name="cloud-upload-alt" size="sm" className="text-gray-light/40" />
                    <span className="text-xs font-black text-white">ترقية الدقائق</span>
                 </div>
                 <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={upgradeStorage} onChange={(e) => setUpgradeStorage(e.target.checked)} className="sr-only peer" />
                    <div className={`w-10 h-5 bg-white/5 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500`}></div>
                 </label>
              </div>
              {upgradeStorage && (
                 <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-300">
                    <div className="space-y-1">
                       <label className="text-[9px] font-black text-gray-light/20 uppercase mr-1">دقائق التخزين الجديدة</label>
                       <input
                          type="number"
                          min={currentStorageLimitMinutes}
                          placeholder="مثلاً 1000 دقيقة"
                          value={newStorageLimitMinutes}
                          onChange={(e) => setNewStorageLimitMinutes(e.target.value)}
                          className="w-full bg-slate-900 border border-emerald-500/20 rounded-xl px-4 py-3 text-white font-black text-sm focus:border-emerald-500/50 outline-none transition-all placeholder:text-gray-light/10"
                       />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-black text-gray-light/20 uppercase mr-1">دقائق المشاهدة الجديدة</label>
                       <input
                          type="number"
                          min={currentDeliveryLimitMinutes}
                          placeholder="مثلاً 5000 دقيقة"
                          value={newDeliveryLimitMinutes}
                          onChange={(e) => setNewDeliveryLimitMinutes(e.target.value)}
                          className="w-full bg-slate-900 border border-blue-500/20 rounded-xl px-4 py-3 text-white font-black text-sm focus:border-blue-500/50 outline-none transition-all placeholder:text-gray-light/10"
                       />
                    </div>
                 </div>
              )}
           </div>
        </div>

        {/* Total & Feedback Section */}
        <div className="space-y-4 pt-4">
           {(upgradeSeats || upgradeStorage) && months > 0 && (
              <div className="flex items-center justify-between p-5 bg-primary/10 border border-primary/20 rounded-2xl animate-in zoom-in-95 duration-500">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                       <Icon name="calculator" className="text-primary" />
                    </div>
                    <div>
                       <p className="text-xs font-black text-white">فرق تكلفة الترقية</p>
                       <p className="text-[10px] font-bold text-gray-light/40">بناءً على المدة المتبقية: {months} شهر</p>
                    </div>
                 </div>
                 <div className="text-right">
                    <span className="text-2xl font-black text-primary tracking-tighter">{totalPriceDifference}</span>
                    <span className="text-xs font-black text-primary/60 mr-1">ج.م</span>
                 </div>
              </div>
           )}

           {validationError && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 animate-in shake duration-300">
                 <Icon name="exclamation-circle" />
                 <p className="text-[10px] font-black">{validationError}</p>
              </div>
           )}
        </div>
      </div>
    </FormModal>
  );
}
