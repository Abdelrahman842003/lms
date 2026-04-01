---
title: Subscriptions & Billing
description: Subscription management, payment processing, and invoice generation
---

# Subscriptions & Billing

## Subscription Service

**Source:** `frontend/src/services/subscriptionService.ts`

| Function | Endpoint | Description |
|----------|----------|-------------|
| Get teacher subscription | `GET /teacher/subscription` | Teacher subscription details |
| Get academy subscription | `GET /academy/subscription` | Academy subscription details |
| Teacher renewal request | `POST /teacher/subscription/renew` | Request subscription renewal |
| Academy renewal request | `POST /academy/subscription/renew` | Request subscription renewal |

## Subscription Types

**Source:** `frontend/src/types/subscription.types.ts`

| Type | Description |
|------|-------------|
| `SubscriptionSnapshot` | Current subscription status, plan type, seats, pricing |
| `PlanOption` | Available subscription plans |
| `PendingRenewalRequest` | Pending renewal requests |
| `StorageSnapshot` | Storage usage data |
| `SubscriptionRenewalRequest` | Renewal request payload |

## Payment Service

**Source:** `frontend/src/services/paymentService.ts`

| Function | Endpoint | Description |
|----------|----------|-------------|
| Get payments | `GET /api/teacher/payments` | Payment list with pagination |
| Get pending payments | `GET /api/teacher/payments/pending` | Pending payments |
| Get statistics | `GET /api/teacher/payments/statistics` | Payment statistics |
| Create payment | `POST /api/teacher/payments` | Create new payment |
| Confirm payment (student) | `POST /api/student/payments/confirm` | Student payment confirmation |
| Get pending (student) | `GET /api/student/payments/pending` | Student pending payments |

## PDF Invoice Generation

**Source:** `frontend/src/utils/generateInvoicePDF.ts`

Browser-based PDF generation for invoices:

- HTML-based rendering in hidden iframe
- Arabic RTL formatting with Arabic fonts
- Plan type badges (basic, standard, premium)
- Old plan prorating section for comparisons
- Number-to-Arabic-words conversion for amounts

## Subscription Components

| Component | Description |
|-----------|-------------|
| `SubscriptionRenewalModal` | Modal for requesting subscription renewal |
| `PaymentConfirmBanner` | Banner showing payment confirmation status |
| `PaymentCodeDisplay` | Payment code display component |
| `NewPaymentModal` | Modal for creating new payments |

## Routes

| Path | Description |
|------|-------------|
| `/teacher/subscription` | Teacher subscription management |
| `/teacher/students/[id]/payment` | Student payment management |
| `/academy/subscription` | Academy subscription management |
| `/academy/billing` | Academy billing & payments |
| `/academy/students/[id]/payment` | Academy student payment |
