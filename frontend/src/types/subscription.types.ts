export interface StorageSnapshot {
  storage_limit_minutes: number;
  storage_used_minutes: number;
  delivery_limit_minutes: number;
  delivery_used_minutes: number;
  storage_percentage: number;
  delivery_percentage: number;
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
  price_per_storage_minute: number;
  price_per_delivery_minute: number;
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
  upgrade_storage_minutes_from?: number | null;
  upgrade_storage_minutes_to?: number | null;
  upgrade_delivery_minutes_from?: number | null;
  upgrade_delivery_minutes_to?: number | null;
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
  new_storage_minutes_limit?: number | null;
  new_delivery_minutes_limit?: number | null;
}
