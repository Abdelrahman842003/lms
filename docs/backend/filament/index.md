---
title: Filament Admin Panel
description: Administration panel configuration, resources, settings, widgets, and custom components
---

# Filament Admin Panel

The Neetaq platform uses Filament to provide a full-featured admin panel for platform operators. The panel is fully localized in Arabic with RTL support.

## Overview

- **Path**: `/admin`
- **Guard**: `admin`
- **Brand**: "إدارة المنصة" (Platform Management)
- **RTL Support**: Full Arabic RTL layout with Tajawal font
- **Plugins**: Spatie Backup, Spatie Health, Activity Log

## How to Access

| Property | Value |
|----------|-------|
| URL | `/admin` |
| Guard | `admin` |
| Login | Username-based |
| Rate Limiting | 5 attempts before lockout |

## Dashboard

The admin dashboard provides an at-a-glance view of platform activity.

### Widgets

| Widget | Type | Description |
|--------|------|-------------|
| StatsOverviewWidget | Stats | Total Academies, Teachers, Students, Active Subscriptions with monthly trend charts |
| RecentAcademiesWidget | Table | Last 5 academies showing avatar, name, phone, and status |
| AcademyDistributionChart | Doughnut Chart | Distribution of academies by subscription plan |
| AcademyStatsWidget | Stats | Total, Active, Inactive, and Expired academy counts |

All dashboard widgets poll every **30 seconds** for live updates.

### Stats Overview Widget

The main stats widget displays four key metrics:

- **Total Academies** — with monthly trend chart
- **Total Teachers** — with monthly trend chart
- **Total Students** — with monthly trend chart
- **Active Subscriptions** — with monthly trend chart

### Recent Academies Widget

A compact table showing the last 5 registered academies with:

- Avatar thumbnail
- Academy name
- Phone number
- Account status

## Resources

All resources are organized under two navigation groups:

- **إدارة المستخدمين** (User Management)
- **الصلاحيات والأدوار** (Permissions & Roles)
- **إدارة المحتوى** (Content Management)

### Resource Reference

#### AcademyResource

| Property | Value |
|----------|-------|
| Model | `Academy` |
| Icon | `heroicon-o-building-library` |
| Navigation Group | إدارة المستخدمين |

**Key Features**:

- Subscription management (status, plan, renewal dates)
- Student seat limits and storage quota configuration
- Logo upload with image validation
- Embedded `TeachersRelationManager` for managing academy-teacher assignments

---

#### AdminResource

| Property | Value |
|----------|-------|
| Model | `Admin` |
| Icon | `heroicon-o-shield-check` |
| Navigation Group | إدارة المستخدمين |

**Key Features**:

- Role assignment via dropdown
- Self-delete protection — prevents admins from deleting their own account

---

#### TeacherResource

| Property | Value |
|----------|-------|
| Model | `Teacher` |
| Icon | `heroicon-o-academic-cap` |
| Navigation Group | إدارة المستخدمين |

**Key Features**:

- Academy assignments management (link teachers to academies)
- Subscription plan selection with the following options:

| Plan | Arabic Label |
|------|-------------|
| `trial` | تجريبي |
| `monthly` | شهري |
| `quarterly` | ربع سنوي |
| `semi-annual` | نصف سنوي |
| `annual` | سنوي |
| `custom` | مخصص |

- Student limit configuration
- Status management (active, suspended, etc.)

---

#### StudentResource

| Property | Value |
|----------|-------|
| Model | `Student` |
| Icon | `heroicon-o-users` |
| Navigation Group | إدارة المستخدمين |

**Key Features**:

- Parent phone field — auto-creates a `Guardian` record if one does not exist for the provided phone number
- Academic information (grade, education type)
- Gender, education type, and location fields
- Embedded `AttendanceRelationManager` for attendance records
- Embedded `ExamsRelationManager` for exam results

---

#### SecretaryResource

| Property | Value |
|----------|-------|
| Model | `Secretary` |
| Icon | `heroicon-o-clipboard-document-list` |
| Navigation Group | إدارة المستخدمين |

**Key Features**:

- Academy and teacher assignments
- Status toggle (active/inactive)

---

#### GuardianResource

| Property | Value |
|----------|-------|
| Model | `Guardian` |
| Icon | `heroicon-o-user-group` |
| Navigation Group | إدارة المستخدمين |

**Key Features**:

- Associated student count display
- Avatar support

---

#### SubscriptionResource

| Property | Value |
|----------|-------|
| Model | `Subscription` |
| Icon | `heroicon-o-credit-card` |
| Navigation Group | إدارة المستخدمين |

**Key Features**:

- Subscriber type: `teacher` or `academy`
- Seat management (allocated vs. used)
- Payment tracking (amount, method, status)
- Renewal approval workflow

---

#### RoleResource

| Property | Value |
|----------|-------|
| Model | `Role` |
| Icon | `heroicon-o-shield-check` |
| Navigation Group | الصلاحيات والأدوار |

**Key Features**:

- Permission assignment organized by group
- Protected role names that cannot be renamed or deleted (e.g., `super-admin`)

---

#### PermissionResource

| Property | Value |
|----------|-------|
| Model | `Permission` |
| Icon | `heroicon-o-lock-closed` |
| Navigation Group | الصلاحيات والأدوار |

**Key Features**:

- Read-only display (permissions are managed via code/seeders)
- Guard type filtering

---

#### VideoResource

| Property | Value |
|----------|-------|
| Model | `Video` |
| Icon | `heroicon-o-film` |
| Navigation Group | إدارة المحتوى |

**Key Features**:

- Scheduling (publish date/time configuration)
- Processing status tracking (pending, processing, ready, failed)
- Performance metrics (views, watch time, completion rate)

---

#### VideoUploadSessionResource

| Property | Value |
|----------|-------|
| Model | `VideoUploadSession` |
| Icon | `heroicon-o-arrow-up-tray` |
| Navigation Group | إدارة المحتوى |

**Key Features**:

- Upload monitoring (active sessions, failures)
- Progress tracking with percentage and chunk information

## Settings Pages

Settings are organized into dedicated pages accessible from the sidebar.

### SystemSettingsPage

| Property | Value |
|----------|-------|
| Icon | `heroicon-o-globe-alt` |

**Configuration Sections**:

- **WhatsApp** — WhatsApp integration number and message templates
- **SEO** — Title, description, keywords, Open Graph tags, Twitter Card tags
- **Geo Targeting** — Default country and region settings
- **Seasonal Theme** — Enable/disable seasonal branding with custom colors and dates

---

### NotificationSettingsPage

| Property | Value |
|----------|-------|
| Icon | `heroicon-o-bell` |

**Configuration Sections**:

- **Channels** — Toggle internal (in-app) and external (push/SMS) notifications
- **Category Controls** — Disable notifications by category (e.g., exams, subscriptions, system)
- **User Type Overrides** — Disable specific notification types per user role

---

### SubscriptionSettingsPage

| Property | Value |
|----------|-------|
| Icon | `heroicon-o-ticket` |

**Configuration Sections**:

- **Trial** — Default trial period in days
- **Pricing**:

| Plan | Teacher Price | Academy Price |
|------|--------------|---------------|
| Monthly | 60 JOD | 40 JOD |

- **Storage Limits** — Default storage quota per subscription tier

---

### VideoSettingsPage

| Property | Value |
|----------|-------|
| Icon | `heroicon-o-film` |

**Configuration Sections**:

- **Upload** — Cloudflare R2 direct upload configuration
- **Playback** — Signed URL TTL for video streaming
- **Watermark** — Enable/disable watermark overlay on videos
- **Tracking** — View tracking and analytics configuration
- **File Constraints** — Allowed file types, maximum file size, resolution limits

---

### GoogleAnalyticsSettingsPage

| Property | Value |
|----------|-------|
| Icon | `heroicon-o-chart-bar` |

**Configuration Sections**:

- **Property ID** — Google Analytics Measurement ID
- **Service Account** — JSON credentials for server-side analytics reporting

---

### IntegrationSettingsPage

| Property | Value |
|----------|-------|
| Icon | `heroicon-o-puzzle-piece` |

**Configuration Sections**:

- **Firebase** — Project credentials, FCM configuration
- **Cloudflare R2** — Bucket name, endpoint, access keys
- **Cloudflare KV** — Namespace IDs for caching and feature flags

---

### ReportsPage

| Property | Value |
|----------|-------|
| Icon | `heroicon-o-document-chart-bar` |

**Configuration Sections**:

- **Report Filters** — Date range, entity type, status filters
- **Generation** — On-demand report generation
- **Export** — PDF export with Arabic-friendly formatting

## Custom Components

### ArabicKeyValue

A custom Filament `KeyValue` component that provides:

- Full RTL text direction support
- Arabic placeholder text for keys and values
- Consistent styling with the rest of the Arabic admin panel

This component is used across settings pages and resource forms where structured key-value input is required in an RTL context.

## Resources Table (Quick Reference)

| Resource | Model | Icon | Nav Group | Key Features |
|----------|-------|------|-----------|--------------|
| `AcademyResource` | Academy | `heroicon-o-building-library` | إدارة المستخدمين | Subscription mgmt, student limits, storage quotas, logo upload, TeachersRelationManager |
| `AdminResource` | Admin | `heroicon-o-shield-check` | إدارة المستخدمين | Role assignment, self-delete protection |
| `TeacherResource` | Teacher | `heroicon-o-academic-cap` | إدارة المستخدمين | Academy assignments, subscription plans, student limits, status management |
| `StudentResource` | Student | `heroicon-o-users` | إدارة المستخدمين | Parent phone (auto-creates guardian), academic info, gender/education/location, AttendanceRelationManager, ExamsRelationManager |
| `SecretaryResource` | Secretary | `heroicon-o-clipboard-document-list` | إدارة المستخدمين | Academy/teacher assignments, status toggle |
| `GuardianResource` | Guardian | `heroicon-o-user-group` | إدارة المستخدمين | Student count, avatar |
| `SubscriptionResource` | Subscription | `heroicon-o-credit-card` | إدارة المستخدمين | Subscriber type (teacher/academy), seat management, payment tracking, renewal approval |
| `RoleResource` | Role | `heroicon-o-shield-check` | الصلاحيات والأدوار | Permission assignment by group, protected names |
| `PermissionResource` | Permission | `heroicon-o-lock-closed` | الصلاحيات والأدوار | Read-only display, guard filtering |
| `VideoResource` | Video | `heroicon-o-film` | إدارة المحتوى | Scheduling, processing status, performance metrics |
| `VideoUploadSessionResource` | VideoUploadSession | `heroicon-o-arrow-up-tray` | إدارة المحتوى | Upload monitoring, progress tracking |

## Settings Pages (Quick Reference)

| Page | Icon | Features |
|------|------|----------|
| SystemSettingsPage | `heroicon-o-globe-alt` | WhatsApp, SEO (title/desc/keywords/OG/Twitter), geo targeting, seasonal theme |
| NotificationSettingsPage | `heroicon-o-bell` | Toggle internal/external, disable by category/user |
| SubscriptionSettingsPage | `heroicon-o-ticket` | Trial days, pricing (teacher 60 JOD, academy 40 JOD monthly), storage limits |
| VideoSettingsPage | `heroicon-o-film` | R2 direct upload, playback TTL, watermark, tracking, file types, limits |
| GoogleAnalyticsSettingsPage | `heroicon-o-chart-bar` | Property ID, service account JSON |
| IntegrationSettingsPage | `heroicon-o-puzzle-piece` | Firebase, Cloudflare R2, Cloudflare KV |
| ReportsPage | `heroicon-o-document-chart-bar` | Report filters, generation, PDF export |

## References

- [`backend/app/Providers/Filament/AdminPanelProvider.php`](/backend/app/Providers/Filament/AdminPanelProvider.php)
- [`backend/app/Filament/Resources/`](/backend/app/Filament/Resources/)
- [`backend/app/Filament/Pages/`](/backend/app/Filament/Pages/)
- [`backend/app/Filament/Widgets/`](/backend/app/Filament/Widgets/)
- [`backend/app/Filament/Components/`](/backend/app/Filament/Components/)

## TODO

- [ ] Document Filament plugin configurations (Backup, Health, Activity Log)
- [ ] Add resource form schema details for each resource
- [ ] Document relation manager configurations
- [ ] Add navigation sorting and grouping customization
- [ ] Document batch actions and bulk operations
