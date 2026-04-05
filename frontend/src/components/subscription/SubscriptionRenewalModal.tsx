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
  currentPlanSelection,
  currentPlanLabel,
  currentSeatsLimit,
  currentStorageLimitGb,
  pricePerSeat,
  pricePerStorageGb,
  isLoading = false,
}: SubscriptionRenewalModalProps) {
  const [selectedPlanCode, setSelectedPlanCode] = useState<string>('');
  const [changePlan, setChangePlan] = useState<boolean>(false);
  const [customMonths, setCustomMonths] = useState<number>(1);
  const [upgradeSeats, setUpgradeSeats] = useState<boolean>(false);
  const [upgradeStorage, setUpgradeStorage] = useState<boolean>(false);
  const [newSeatsLimit, setNewSeatsLimit] = useState<string>('');
  const [newStorageLimitGb, setNewStorageLimitGb] = useState<string>('');
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
      setChangePlan(false);
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
      plan_selection: activePlanSelection,
      custom_months: activePlanSelection === 'custom' ? Math.max(1, customMonths) : null,
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
          اختر ما تريد تعديله فقط، وسيتم إرسال الطلب للإدارة للموافقة.
        </div>

        <div className="ux-space-y-3 ux-rounded-lg ux-border ux-border-gray-700 ux-p-4">
          <div className="ux-flex ux-items-center ux-justify-between">
            <div>
              <p className="ux-text-sm ux-font-medium ux-text-gray-100">هل تريد تعديل الباقة؟</p>
              <p className="ux-text-xs ux-text-gray-400">لو لم تختَر، سيتم التجديد على نفس الباقة الحالية.</p>
            </div>
            <label className="ux-relative ux-inline-flex ux-h-6 ux-w-11 ux-cursor-pointer ux-items-center">
              <input
                type="checkbox"
                checked={changePlan}
                onChange={(event) => {
                  const nextValue = event.target.checked;
                  setChangePlan(nextValue);
                  if (nextValue && !selectedPlanCode) {
                    setSelectedPlanCode(currentPlanSelection);
                  }
                }}
                className="ux-peer ux-sr-only"
              />
              <span className="ux-absolute ux-inset-0 ux-rounded-full ux-bg-gray-600 ux-transition-colors ux-duration-200 peer-checked:ux-bg-primary" />
              <span className="ux-relative ux-ms-1 ux-h-4 ux-w-4 ux-rounded-full ux-bg-white ux-transition-transform ux-duration-200 peer-checked:ux-translate-x-5" />
            </label>
          </div>

          <div className="ux-rounded-lg ux-bg-gray-900/70 ux-p-3 ux-text-sm ux-text-gray-200">
            <span className="ux-text-gray-400">الباقة الحالية: </span>
            <span className="ux-font-medium">{currentPlanLabel || selectedPlan?.label || 'غير محدد'}</span>
          </div>

          {changePlan && (
            <Select
              options={selectOptions}
              value={selectedPlanCode}
              onChange={setSelectedPlanCode}
              placeholder="اختر الباقة الجديدة"
              className="ux-w-full"
              icon="id-card"
            />
          )}
        </div>

        {activePlanSelection === 'custom' && (
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
            <label className={`ux-relative ux-inline-flex ux-h-6 ux-w-11 ux-items-center ${
              !canUpgradeSeats ? 'ux-cursor-not-allowed ux-opacity-60' : 'ux-cursor-pointer'
            }`}>
              <input
                type="checkbox"
                checked={upgradeSeats}
                onChange={(event) => setUpgradeSeats(event.target.checked)}
                disabled={!canUpgradeSeats}
                className="ux-peer ux-sr-only"
              />
              <span className="ux-absolute ux-inset-0 ux-rounded-full ux-bg-gray-600 ux-transition-colors ux-duration-200 peer-checked:ux-bg-primary" />
              <span className="ux-relative ux-ms-1 ux-h-4 ux-w-4 ux-rounded-full ux-bg-white ux-transition-transform ux-duration-200 peer-checked:ux-translate-x-5" />
            </label>
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
            <label className={`ux-relative ux-inline-flex ux-h-6 ux-w-11 ux-items-center ${
              !canUpgradeStorage ? 'ux-cursor-not-allowed ux-opacity-60' : 'ux-cursor-pointer'
            }`}>
              <input
                type="checkbox"
                checked={upgradeStorage}
                onChange={(event) => setUpgradeStorage(event.target.checked)}
                disabled={!canUpgradeStorage}
                className="ux-peer ux-sr-only"
              />
              <span className="ux-absolute ux-inset-0 ux-rounded-full ux-bg-gray-600 ux-transition-colors ux-duration-200 peer-checked:ux-bg-primary" />
              <span className="ux-relative ux-ms-1 ux-h-4 ux-w-4 ux-rounded-full ux-bg-white ux-transition-transform ux-duration-200 peer-checked:ux-translate-x-5" />
            </label>
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
