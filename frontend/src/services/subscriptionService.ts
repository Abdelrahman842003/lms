import { fetchApi } from '@/services/api/baseApi';
import type { SubscriptionResponse, SubscriptionRenewalRequest } from '@/types/subscription.types';

export async function getTeacherSubscription(): Promise<SubscriptionResponse> {
  return await fetchApi('/teacher/subscription');
}

export async function requestTeacherRenewal(data: SubscriptionRenewalRequest): Promise<unknown> {
  return await fetchApi('/teacher/subscription/renew', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getAcademySubscription(): Promise<SubscriptionResponse> {
  return await fetchApi('/academy/subscription');
}

export async function requestAcademyRenewal(data: SubscriptionRenewalRequest): Promise<unknown> {
  return await fetchApi('/academy/subscription/renew', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
