import React, { useEffect, useMemo, useState } from 'react';
import { FormModal, Select, Icon } from '@/components/ui';
import type { PlanOption, SubscriptionRenewalRequest } from '@/types/subscription.types';

interface SubscriptionRenewalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: SubscriptionRenewalRequest) => Promise<void> | void;
  planOptions: PlanOption[];
  currentSeatsLimit: number | null;
  currentStorageLimitGb: number | null;
  pricePerSeat: number;
  pricePerStorageGb: number;
  isLoading?: boolean;
}

export default function SubscriptionRenewalModal({
  isOpen,
  onClose,
  onSubmit,
  planOptions,
  currentSeatsLimit,
  currentStorageLimitGb,
  pricePerSeat,
  pricePerStorageGb,
  isLoading = false,
}: SubscriptionRenewalModalProps) {
  const [selectedPlanCode, setSelectedPlanCode] = useState<string>('');
  const [customMonths, setCustomMonths] = useState<number>(1);
  const [upgradeSeats, setUpgradeSeats] = useState<boolean>(false);
  const [upgradeStorage, setUpgradeStorage] = useState<boolean>(false);
  const [newSeatsLimit, setNewSeatsLimit] = useState<string>('');
  const [newStorageLimitGb, setNewStorageLimitGb] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');

  const selectOptions = useMemo(
    () => planOptions.map(option => ({ value: option.value, label: option.label })),
    [planOptions]
  );

  const selectedPlan = useMemo(
    () => planOptions.find(option => option.value === selectedPlanCode),
    [planOptions, selectedPlanCode]
  );

  const months = useMemo(() => {
    if (!selectedPlanCode) return 0;
    if (selectedPlanCode === 'custom') {
      return Number.isFinite(customMonths) ? Math.max(1, customMonths) : 1;
    }

    return selectedPlan?.months ?? 0;
  }, [customMonths, selectedPlan, selectedPlanCode]);

  const seatPriceDifference = useMemo(() => {
    if (!upgradeSeats || !currentSeatsLimit || currentSeatsLimit <= 0 || months <= 0) return 0;
    const nextSeats = parseInt(newSeatsLimit || '0', 10);
    if (!Number.isFinite(nextSeats) || nextSeats <= currentSeatsLimit) return 0;

    return (nextSeats - currentSeatsLimit) * pricePerSeat * months;
  }, [upgradeSeats, currentSeatsLimit, months, newSeatsLimit, pricePerSeat]);

  const storagePriceDifference = useMemo(() => {
    if (!upgradeStorage || !currentStorageLimitGb || currentStorageLimitGb <= 0 || months <= 0) return 0;
    const nextStorage = parseInt(newStorageLimitGb || '0', 10);
    if (!Number.isFinite(nextStorage) || nextStorage <= currentStorageLimitGb) return 0;

    return (nextStorage - currentStorageLimitGb) * pricePerStorageGb * months;
  }, [upgradeStorage, currentStorageLimitGb, months, newStorageLimitGb, pricePerStorageGb]);

  const totalPriceDifference = useMemo(
    () => Number((seatPriceDifference + storagePriceDifference).toFixed(2)),
    [seatPriceDifference, storagePriceDifference]
  );

  const canUpgradeSeats = currentSeatsLimit !== null && currentSeatsLimit > 0;
  const canUpgradeStorage = currentStorageLimitGb !== null && currentStorageLimitGb > 0;

  useEffect(() => {
    if (!isOpen) {
      setSelectedPlanCode('');
      setCustomMonths(1);
      setUpgradeSeats(false);
      setUpgradeStorage(false);
      setNewSeatsLimit('');
      setNewStorageLimitGb('');
      setValidationError('');
    }
  }, [isOpen]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedPlanCode) return;

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
      if (!canUpgradeStorage) {
        setValidationError('لا يمكن ترقية مساحة التخزين لأن الباقة الحالية غير محدودة.');
        return;
      }

      const nextStorage = parseInt(newStorageLimitGb || '0', 10);
      if (!Number.isFinite(nextStorage) || nextStorage <= (currentStorageLimitGb ?? 0)) {
        setValidationError('حد التخزين الجديد يجب أن يكون أكبر من الحد الحالي.');
        return;
      }
    }

    setValidationError('');

    const payload: SubscriptionRenewalRequest = {
      plan_selection: selectedPlanCode,
      custom_months: selectedPlanCode === 'custom' ? Math.max(1, customMonths) : null,
      upgrade_seats: upgradeSeats,
      upgrade_storage: upgradeStorage,
      new_seats_limit: upgradeSeats ? parseInt(newSeatsLimit, 10) : null,
      new_storage_limit_gb: upgradeStorage ? parseInt(newStorageLimitGb, 10) : null,
    };

    await onSubmit(payload);
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="تجديد الاشتراك"
      submitText="إرسال طلب التجديد"
      cancelText="إلغاء"
      isLoading={isLoading}
      maxWidth="640px"
    >
      <div className="ux-space-y-4">
        <div className="ux-flex ux-items-center ux-gap-2 ux-text-sm ux-text-gray-300">
          <Icon name="info-circle" className="ux-text-primary" />
          اختر الباقة المناسبة (سعة المقاعد + الفئة)، وسيتم إرسال الطلب للإدارة للموافقة.
        </div>

        <Select
          options={selectOptions}
          value={selectedPlanCode}
          onChange={setSelectedPlanCode}
          placeholder="اختر الباقة"
          className="ux-w-full"
          icon="id-card"
        />

        {selectedPlanCode === 'custom' && (
          <div className="ux-space-y-2">
            <label className="ux-text-sm ux-text-gray-300">عدد الشهور (مخصص)</label>
            <input
              type="number"
              min={1}
              value={customMonths}
              onChange={(event) => setCustomMonths(Math.max(1, Number(event.target.value || 1)))}
              className="ux-w-full ux-bg-gray-900 ux-border ux-border-gray-700 ux-rounded-lg ux-px-3 ux-py-2 ux-text-white"
            />
          </div>
        )}

        <div className="ux-space-y-3 ux-rounded-lg ux-border ux-border-gray-700 ux-p-4">
          <div className="ux-flex ux-items-center ux-justify-between">
            <span className="ux-text-sm ux-text-gray-200">هل تريد ترقية عدد الكراسي؟</span>
            <input
              type="checkbox"
              checked={upgradeSeats}
              onChange={(event) => setUpgradeSeats(event.target.checked)}
              disabled={!canUpgradeSeats}
            />
          </div>
          <p className="ux-text-xs ux-text-gray-400">
            الحالي: {currentSeatsLimit ?? 'غير محدود'}
          </p>
          {upgradeSeats && (
            <input
              type="number"
              min={(currentSeatsLimit ?? 0) + 1}
              placeholder="اكتب عدد الكراسي الجديد"
              value={newSeatsLimit}
              onChange={(event) => setNewSeatsLimit(event.target.value)}
              className="ux-w-full ux-bg-gray-900 ux-border ux-border-gray-700 ux-rounded-lg ux-px-3 ux-py-2 ux-text-white"
            />
          )}
        </div>

        <div className="ux-space-y-3 ux-rounded-lg ux-border ux-border-gray-700 ux-p-4">
          <div className="ux-flex ux-items-center ux-justify-between">
            <span className="ux-text-sm ux-text-gray-200">هل تريد ترقية المساحة؟</span>
            <input
              type="checkbox"
              checked={upgradeStorage}
              onChange={(event) => setUpgradeStorage(event.target.checked)}
              disabled={!canUpgradeStorage}
            />
          </div>
          <p className="ux-text-xs ux-text-gray-400">
            الحالي: {currentStorageLimitGb ? `${currentStorageLimitGb} GB` : 'غير محدود'}
          </p>
          {upgradeStorage && (
            <input
              type="number"
              min={(currentStorageLimitGb ?? 0) + 1}
              placeholder="اكتب حد التخزين الجديد (GB)"
              value={newStorageLimitGb}
              onChange={(event) => setNewStorageLimitGb(event.target.value)}
              className="ux-w-full ux-bg-gray-900 ux-border ux-border-gray-700 ux-rounded-lg ux-px-3 ux-py-2 ux-text-white"
            />
          )}
        </div>

        {(upgradeSeats || upgradeStorage) && months > 0 && (
          <div className="ux-rounded-lg ux-border ux-border-primary/30 ux-bg-primary/10 ux-p-3 ux-text-sm ux-text-primary">
            فرق سعر الترقية: {totalPriceDifference} ج.م
          </div>
        )}

        {validationError && (
          <div className="ux-rounded-lg ux-border ux-border-red-500/30 ux-bg-red-500/10 ux-p-3 ux-text-sm ux-text-red-300">
            {validationError}
          </div>
        )}
      </div>
    </FormModal>
  );
}
