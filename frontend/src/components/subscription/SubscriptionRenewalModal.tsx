import React, { useMemo, useState } from 'react';
import { FormModal, Select, Input, Icon } from '@/components/ui';
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
  const [planSelection, setPlanSelection] = useState<string>('');
  const [customMonths, setCustomMonths] = useState<string>('');

  const selectOptions = useMemo(
    () => planOptions.map(option => ({ value: option.value, label: option.label })),
    [planOptions]
  );

  const requiresCustomMonths = planSelection === 'custom';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = {
      plan_selection: planSelection,
      custom_months: requiresCustomMonths ? Number(customMonths || 1) : null,
    };
    await onSubmit(payload);
    setPlanSelection('');
    setCustomMonths('');
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
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <Icon name="info-circle" className="text-primary" />
          اختر مدة الاشتراك المطلوبة، وسيتم إرسال الطلب للوحة الإدارة للموافقة.
        </div>

        <Select
          options={selectOptions}
          value={planSelection}
          onChange={setPlanSelection}
          placeholder="اختر مدة الاشتراك"
          className="w-full"
          icon="calendar"
        />

        {requiresCustomMonths && (
          <Input
            type="number"
            label="عدد الشهور (مخصص)"
            placeholder="مثال: 5"
            min={1}
            max={120}
            value={customMonths}
            onChange={(e) => setCustomMonths(e.target.value)}
          />
        )}
      </div>
    </FormModal>
  );
}
