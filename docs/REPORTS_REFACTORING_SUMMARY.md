# Reports System Refactoring Summary

## Overview
Complete refactoring of the reports system to integrate `subscription_fee` (السعر المدفوع للمنصة) as the primary metric, following the SUBSCRIPTION_SYSTEM_CHANGES.md specification.

## Key Changes

### 1. Backend - DTOs (Data Transfer Objects)

#### Files Created/Modified:
- [`backend/app/DTO/Reports/TeacherReportSummaryData.php`](backend/app/DTO/Reports/TeacherReportSummaryData.php)
- [`backend/app/DTO/Reports/AcademyReportSummaryData.php`](backend/app/DTO/Reports/AcademyReportSummaryData.php)
- [`backend/app/DTO/Reports/AdminReportSummaryData.php`](backend/app/DTO/Reports/AdminReportSummaryData.php)
- [`backend/app/DTO/Reports/TeacherReportData.php`](backend/app/DTO/Reports/TeacherReportData.php)
- [`backend/app/DTO/Reports/ReportPeriodData.php`](backend/app/DTO/Reports/ReportPeriodData.php)

#### Key Features:
- `subscription_fee` as primary metric in all summary DTOs
- Teachers: 60 EGP/student/month
- Academies: 40 EGP/student/month
- Immutable readonly DTOs for type safety
- Factory methods for creating from arrays

### 2. Backend - ReportService

#### File: [`backend/app/Services/Admin/ReportService.php`](backend/app/Services/Admin/ReportService.php)

#### Improvements:
- Uses DTOs for all report responses
- Eager loading to prevent N+1 queries:
  ```php
  $teacher->load(['students', 'secretaries', 'activeEnrollments']);
  ```
- `subscription_fee` calculation from database stored value
- Backward compatibility maintained

### 3. Backend - ReportController

#### File: [`backend/app/Http/Controllers/Admin/ReportController.php`](backend/app/Http/Controllers/Admin/ReportController.php)

#### Pattern: Thin Controller
- Unified `generate()` endpoint with match expression
- Legacy endpoints maintained for backward compatibility
- Uses `GenerateReportRequest` for validation

### 4. Backend - FormRequest Validation

#### File: [`backend/app/Http/Requests/Admin/Report/GenerateReportRequest.php`](backend/app/Http/Requests/Admin/Report/GenerateReportRequest.php)

#### Features:
- Arabic validation messages
- Period preset support
- Date range validation
- Conditional validation rules based on report type

### 5. Frontend - Zod Schemas

#### File: [`frontend/src/schemas/report.schema.ts`](frontend/src/schemas/report.schema.ts)

#### Schemas Created:
- `TeacherReportSummarySchema` - with subscription_fee
- `AcademyReportSummarySchema` - with subscription_fee
- `AdminReportSummarySchema` - with total_subscription_fees
- `TeacherReportResponseSchema`
- `AcademyReportResponseSchema`
- `AdminReportResponseSchema`
- Utility functions for calculations

### 6. Frontend - TypeScript Types

#### Files Updated:
- [`frontend/src/types/admin.types.ts`](frontend/src/types/admin.types.ts)
- [`frontend/src/types/teacher.types.ts`](frontend/src/types/teacher.types.ts)

#### Types Added:
- `TeacherReportSummary` with subscription_fee
- `AcademyReportSummary` with subscription_fee
- `AdminReportSummary` with total_subscription_fees
- `TeacherListItem` with subscription_fee
- `AcademyListItem` with subscription_fee

### 7. Frontend - ReportService

#### File: [`frontend/src/services/admin/reportService.ts`](frontend/src/services/admin/reportService.ts)

#### Features:
- Zod validation for all API responses
- Error handling with custom `ReportError` class
- Date range helpers
- PDF download utilities

### 8. Frontend - Report Pages

#### Files Updated:
- [`frontend/src/app/admin/reports/page.tsx`](frontend/src/app/admin/reports/page.tsx)
- [`frontend/src/app/teacher/reports/page.tsx`](frontend/src/app/teacher/reports/page.tsx)
- [`frontend/src/app/academy/reports/page.tsx`](frontend/src/app/academy/reports/page.tsx)

#### Features:
- URL-driven filters for admin reports
- `subscription_fee` prominently displayed in summary cards
- Financial details showing subscription_fee breakdown

### 9. Frontend - i18n Translations

#### Files Created:
- [`frontend/src/i18n/config.ts`](frontend/src/i18n/config.ts)
- [`frontend/src/i18n/messages/ar.json`](frontend/src/i18n/messages/ar.json)
- [`frontend/src/i18n/messages/en.json`](frontend/src/i18n/messages/en.json)
- [`frontend/src/i18n/index.ts`](frontend/src/i18n/index.ts)
- [`frontend/src/hooks/useTranslation.ts`](frontend/src/hooks/useTranslation.ts)

#### Translation Keys Added:
```json
{
  "reports.financial.subscription_fee": "السعر المدفوع للمنصة",
  "reports.financial.subscription_fee_description": "المبلغ المستحق للمنصة...",
  "reports.financial.subscription_fee_teacher": "60 جنيه × عدد الطلاب",
  "reports.financial.subscription_fee_academy": "40 جنيه × عدد الطلاب"
}
```

### 10. Testing

#### Frontend Tests: [`frontend/src/schemas/__tests__/report.schema.test.ts`](frontend/src/schemas/__tests__/report.schema.test.ts)
- Comprehensive Zod schema validation tests
- subscription_fee calculation tests
- Utility function tests

#### Backend Tests: [`backend/tests/Feature/ReportServiceTest.php`](backend/tests/Feature/ReportServiceTest.php)
- Teacher report subscription_fee tests
- Academy report subscription_fee tests
- Admin report total_subscription_fees tests
- Eager loading verification
- Payment tracking tests

## Subscription Fee Calculation Rules

### Teachers:
- Base Rate: 60 EGP/student/month
- Uses `teacher->subscription_fee` if set
- Falls back to: `billable_months × price_per_student × student_count`

### Academies:
- Base Rate: 40 EGP/student/month
- Uses `academy->subscription_fee` if set
- Falls back to: `billable_months × price_per_student × student_count`

### Admin (Platform):
- Total = Sum of all teacher and academy subscription fees
- Academy Subscriptions: Students in academies × 40 EGP
- Independent Subscriptions: Students with independent teachers × 60 EGP

## API Endpoints

### New Unified Endpoint:
```
POST /api/admin/reports/generate
Body: { report_type, teacher_id?, academy_id?, period_preset, start_date?, end_date? }
```

### Legacy Endpoints (Backward Compatible):
```
GET /api/admin/reports/teachers-list
GET /api/admin/reports/academies-list
GET /api/admin/reports/teachers/{teacher}/report
GET /api/admin/reports/academies/{academy}/report
GET /api/admin/reports/admin/report
GET /api/admin/reports/teachers/{teacher}/pdf
GET /api/admin/reports/academies/{academy}/pdf
GET /api/admin/reports/admin/pdf
```

## Migration Notes

1. **Database**: Ensure `subscription_fee` column exists in `teachers` and `academies` tables
2. **Existing Data**: Run recalculation commands if needed:
   ```bash
   php artisan subscriptions:recalculate
   ```
3. **Frontend**: No breaking changes; new fields are additive

## Verification Checklist

- [x] DTOs created with subscription_fee
- [x] ReportService updated to use DTOs
- [x] ReportController using thin controller pattern
- [x] Eager loading implemented
- [x] Zod schemas created with subscription_fee
- [x] TypeScript types updated
- [x] Frontend reportService created
- [x] Report pages updated
- [x] i18n translations added
- [x] Backend tests written
- [x] Frontend tests written
- [x] Backward compatibility maintained
