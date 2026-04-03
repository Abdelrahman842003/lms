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
  price_per_storage_gb?: number;
  amount_due: number;
  amount_paid: number;
  storage?: StorageSnapshot | null;
}

export interface PendingRenewalRequest {
  id: string;
  month: string | null;
  amount_due: number;
  status: string;
  request_type?: 'renewal' | 'upgrade' | string;
  notes?: string | null;
  upgrade_seats_from?: number | null;
  upgrade_seats_to?: number | null;
  upgrade_storage_from_gb?: number | null;
  upgrade_storage_to_gb?: number | null;
  upgrade_price_difference?: number;
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
  upgrade_seats?: boolean;
  upgrade_storage?: boolean;
  new_seats_limit?: number | null;
  new_storage_limit_gb?: number | null;
}
