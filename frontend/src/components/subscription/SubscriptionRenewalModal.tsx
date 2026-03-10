import React, { useMemo, useState } from 'react';
import { FormModal, Select, Icon } from '@/components/ui';
import type { PlanOption } from '@/types/subscription.types';

interface SubscriptionRenewalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: { plan_selection: string; custom_months?: number | null }) => Promise<void> | void;
  planOptions: PlanOption[];
  isLoading?: boolean;
}

export default function SubscriptionRenewalModal({
  isOpen,
  onClose,
  onSubmit,
  planOptions,
  isLoading = false,
}: SubscriptionRenewalModalProps) {
  const [selectedPlanCode, setSelectedPlanCode] = useState<string>('');

  const selectOptions = useMemo(
    () => planOptions.map(option => ({ value: option.value, label: option.label })),
    [planOptions]
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedPlanCode) return;

    const payload = { plan_selection: selectedPlanCode };
    await onSubmit(payload);
    setSelectedPlanCode('');
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
      </div>
    </FormModal>
  );
}
