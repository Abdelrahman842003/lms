# QUALITY_REMEDIATION_STATUS

**تاريخ التحديث:** 2026-02-15

## Status Legend
- `Done`: تم التنفيذ بالكامل داخل الكود/الوثائق.
- `Partial`: تم تنفيذ جزء فعلي مع بقاء عناصر تشغيلية/مرحلية.
- `Pending`: لم يبدأ التنفيذ.

## QI Tracking

| QI | الحالة | الدليل (Files) | ملاحظات |
|---|---|---|---|
| QI-01 | Done | `backend/database/migrations/2026_02_07_000001_add_performance_indexes.php` | تم إصلاح `down()` ليحذف فقط indexes التي أنشأها `up()`. |
| QI-02 | Partial | `.gitignore`, `.github/workflows/security-infra.yml`, `secrets/README.md` | إزالة الملفات الحساسة المتتبعة من الشجرة الحالية + إضافة gitleaks. ما زال مطلوبًا: تدوير المفاتيح + تنظيف history عبر `git filter-repo`/BFG. |
| QI-03 | Done | `backend/routes/api.php`, `backend/app/Http/Controllers/Api/RefreshTokenController.php`, `frontend/src/lib/tokenManager.ts`, `frontend/src/config/api-config.ts`, `backend/app/Services/Guardian/GuardianAuthService.php`, `backend/app/Http/Controllers/Guardian/AuthController.php` | إضافة canonical refresh endpoint `/api/v1/auth/refresh` + alias legacy + flow مبني على refresh token من cookie/bearer. |
| QI-04 | Done | `docker-compose.prod.yml` | إزالة `NODE_TLS_REJECT_UNAUTHORIZED=0` من production compose. |
| QI-05 | Partial | `frontend/src/lib/axios.ts`, `frontend/src/services/academyService.ts`, `frontend/src/components/auth/withTeacherAuth.tsx`, `frontend/src/components/auth/withAcademyAuth.tsx`, `frontend/src/components/auth/withAdminAuth.tsx`, `frontend/src/services/roles.ts`, `frontend/src/services/notificationService.ts`, `frontend/src/services/lectureService.ts`, `frontend/src/components/dashboard/NotificationDropdown.tsx`, `frontend/src/components/dashboard/NotificationsSection.tsx` | تقليل مباشر لقراءات `localStorage token` في الطبقات المركزية. ما زالت توجد قراءات مباشرة في بعض الصفحات الفردية legacy. |
| QI-06 | Done | `backend/app/Http/Controllers/Academy/StudentController.php` | إضافة `Log` import وتوحيد الاستخدام. |
| QI-07 | Partial | `backend/app/Http/Resources/Academy/AcademyStudentResource.php`, `backend/app/Http/Controllers/Academy/StudentController.php` | نقل mapping الرئيسي لقائمة الطلاب إلى Resource. ما زال هناك mapping إضافي في مسارات أخرى يحتاج استكمال. |
| QI-08 | Partial | `backend/app/Http/Requests/Admin/Academy/AddSecretaryRequest.php`, `backend/app/Http/Requests/Admin/Academy/UpdatePlanRequest.php`, `backend/app/Http/Requests/Teacher/Student/SearchByPhoneRequest.php`, `backend/app/Http/Requests/Academy/Student/SearchByPhoneRequest.php`, `backend/app/Http/Controllers/Admin/AcademyController.php`, `backend/app/Http/Controllers/Teacher/StudentController.php`, `backend/app/Http/Controllers/Academy/StudentController.php` | استبدال inline validations في المسارات المستهدفة. يوجد inline validations أخرى خارج نطاق QI الحالي تحتاج موجة تالية. |
| QI-09 | Partial | `frontend/src/services/academyService.ts` | تحويل `academyService` إلى facade انتقالي في auth/header source، مع بقاء جزء من المنطق monolithic لحين تفكيك كامل إلى `services/academy/*`. |
| QI-10 | Partial | `frontend/src/contexts/EnhancedAuthContext.tsx` (مرجع استخدام حالي) | الاستهلاك العام يستخدم `EnhancedAuthContext` بالفعل، لكن لم يتم بعد إلغاء/دمج كل المسارات legacy (`AuthContext`, `CoreAuthContext`) بالكامل. |
| QI-11 | Done | `frontend/Dockerfile.prod` | استخدام `npm ci` + إنشاء non-root user وتشغيل `USER nextjs` مع `--chown` للملفات المنسوخة. |
| QI-12 | Done | `backend/routes/api.php`, `frontend/src/config/api-config.ts` | إضافة aliases role-first (`/teacher/login`, `/student/login`, `/parent/login`) مع الحفاظ على المسارات القديمة للتوافق. |
| QI-13 | Done | `frontend/src/components/MaintenanceGuard.tsx`, `frontend/src/components/providers/MaintenanceGuard.tsx` | إزالة النسخة المكررة غير المستخدمة والاعتماد على guard واحد مستخدم في `layout.tsx`. |
| QI-14 | Done | `backend/app/Services/PointService.php`, `backend/app/Services/Infrastructure/PointService.php` | تحويل `App\Services\PointService` إلى alias متوافق للخدمة الرسمية في `Infrastructure` بدل ازدواج التنفيذ. |
| QI-15 | Done | `docs/ROLLBACK.md` | حذف توصية `git reset --hard` من playbook واستبدال health check endpoint إلى `/up`. |

## Added Quality Gates (CI)
- `/.github/workflows/backend-quality.yml`
- `/.github/workflows/frontend-quality.yml`
- `/.github/workflows/security-infra.yml`

## Operational Follow-ups (Required)
1. تدوير كل المفاتيح التي كانت موجودة في `secrets/*`.
2. تنظيف تاريخ git من أي secrets سابقة عبر `git filter-repo` أو BFG.
3. نشر aliases/deprecation notice في API changelog قبل إزالة endpoints legacy.
