export interface StorageSnapshot {
  used_bytes: number;
  used_gb: number;
  limit_gb: number | null;
  remaining_bytes: number | null;
  remaining_gb: number | null;
  percentage: number;
  is_unlimited: boolean;
}

export interface PlanOption {
  value: string;
  label: string;
  months?: number | null;
  trial_days?: number;
}

export interface SubscriptionSnapshot {
  status: 'trial' | 'active' | 'expired' | 'inactive';
  plan_type?: string;
  subscription_period?: string | null;
  plan_label?: string;
  starts_at?: string | null;
  ends_at?: string | null;
  days_remaining?: number | null;
  is_trial: boolean;
  seats_used: number;
  seats_limit: number | null;
  is_unlimited: boolean;
  price_per_seat: number;
  amount_due: number;
  amount_paid: number;
  storage?: StorageSnapshot | null;
}

export interface PendingRenewalRequest {
  id: string;
  month: string | null;
  amount_due: number;
  status: string;
  notes?: string | null;
  created_at?: string | null;
}

export interface SubscriptionResponse {
  subscription: SubscriptionSnapshot;
  plan_options: PlanOption[];
  pending_request?: PendingRenewalRequest | null;
}

export interface SubscriptionRenewalRequest {
  plan_selection: string;
  custom_months?: number | null;
}
