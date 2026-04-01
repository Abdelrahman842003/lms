---
title: Components Reference
description: Complete catalog of all frontend components organized by domain
---

# Components Reference

## Auth Components

**Directory:** `frontend/src/components/auth/`

| Component | Description |
|-----------|-------------|
| `AuthButton` | Authentication action button |
| `AuthInput` | Styled input for auth forms |
| `LoginCard` | Login form card |
| `LoginContainer` | Login page container |
| `RequireAuth` | Route guard — redirects to login if unauthenticated |
| `UserTypeSelector` | Role selection on login |
| `withAcademyAuth` | HOC for academy-scoped pages |
| `withTeacherAuth` | HOC for teacher-scoped pages |

## Dashboard Components

**Directory:** `frontend/src/components/dashboard/`

| Component | Description |
|-----------|-------------|
| `AcademyLectureSessionsModal` | Academy view of lecture sessions |
| `AcademySelector` | Academy selection dropdown for teachers |
| `AcademyStatsCharts` | Academy dashboard charts |
| `AttendanceDetailsModal` | Detailed attendance view |
| `DashboardCard` | Generic dashboard card |
| `DashboardLayout` | Dashboard page layout wrapper |
| `DataTable` | Generic data table with pagination |
| `ExamCard` | Exam summary card |
| `FeatureCard` | Feature showcase card |
| `LectureCard` | Lecture summary card |
| `LectureSessionsModal` | Teacher lecture sessions view |
| `ManualAttendanceModal` | Manual attendance by phone number |
| `Navbar` | Top navigation bar with role-based items |
| `NavbarOverlayDropdown` | Navbar dropdown overlay |
| `NotificationDropdown` | Notification bell dropdown |
| `NotificationPermissionModal` | Notification permission request |
| `NotificationsSection` | Notifications list section |
| `QRCodeModal` | QR code display for attendance |
| `QRScannerModal` | QR code camera scanner |
| `ScanAttendanceModal` | Integrated attendance scan with API |
| `SectionHeader` | Section header component |
| `Sidebar` | Navigation sidebar with role-based menu |
| `StatCard` | Statistics display card |
| `StudentAttendanceSection` | Student attendance history |
| `TeacherSelectionDropdown` | Teacher selector for students |
| `TeacherStatsCharts` | Teacher dashboard charts |
| `VideoCard` | Video summary card |

## Video Components

**Directory:** `frontend/src/components/video/`

| Component | Description |
|-----------|-------------|
| `SecureVideoPlayer` | Video player with watermark and progress tracking |
| `VideoCard` | Video card for listings |
| `VideoCommentsSection` | Hierarchical comment system with replies |
| `VideoQuizManager` | Teacher/academy quiz management |
| `VideoQuizStudent` | Student quiz taking interface |
| `VideoUploadForm` | Multi-phase video upload form |
| `WatermarkOverlay` | Rotating student info watermark |

## Report Components

**Directory:** `frontend/src/components/reports/`

| Component | Description |
|-----------|-------------|
| `DrilldownTable` | Dynamic column table from server schema |
| `KpiCard` | Key performance indicator card |
| `AlertsRecommendations` | Alert and recommendation panel |
| `AttendanceDetailTable` | Attendance detail data table |
| `AttendancePerformance` | Attendance analytics chart |
| `GroupBreakdown` | Group performance breakdown |
| `IncomeTrends` | Income trend chart |
| `MonthlyIncomeTable` | Monthly income data table |
| `ReportFilters` | Report filter controls |
| `ReportSkeletons` | Loading skeletons for reports |
| `StudentActivityTable` | Student activity data table |
| `StudentActivity` | Student activity metrics |
| `SubscriptionCapacity` | Subscription usage display |
| `TeacherSnapshot` | Teacher overview snapshot |

## UI Components

**Directory:** `frontend/src/components/ui/`

| Component | Description |
|-----------|-------------|
| `AvatarUpload` | Avatar image upload with crop |
| `Badge` | Status badge |
| `Button` | Primary button component |
| `ConfirmationModal` | Confirmation dialog |
| `CreativeDatePicker` | Custom date picker |
| `FilePicker` | File selection component |
| `FormModal` | Modal with form layout |
| `Icon` | Icon wrapper |
| `ImageCropModal` | Image cropping modal |
| `Input` | Text input component |
| `LoadingSpinner` | Loading indicator |
| `MonthDropdown` | Month selection dropdown |
| `NotificationDetailsModal` | Notification detail view |
| `NotificationModal` | Notification display modal |
| `PerformanceMonitor` | Performance metrics display |
| `Select` | Dropdown select component |
| `Skeleton` | Content placeholder skeleton |
| `Textarea` | Multi-line text input |

## Special Components

**Directory:** `frontend/src/components/`

| Component | Description |
|-----------|-------------|
| `ErrorBoundary` | React error boundary with fallback UI |
| `Filter` | Wrapper for Select filter component |
| `InstallPrompt` | PWA install prompt handler |
| `LandingPage` | Landing/home page component |
| `MaintenanceGuard` | Maintenance mode overlay |
| `NotificationSettings` | Browser notification permission settings |
| `PaymentConfirmBanner` | Payment confirmation status banner |
| `PdfViewerCore` | PDF viewer core component |
| `PdfViewerModal` | PDF viewer in modal |
| `SeasonalDecorations` | Theme-aware seasonal decorations with animations |
| `ServiceWorkerCleanup` | PWA service worker cleanup handler |
