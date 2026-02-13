# تقرير جودة الكود — مراجعة ملف بملف

**تاريخ المراجعة**: 2026-02-13  
**المعيار المرجعي**: `docs/compliance/` Rules  
**النطاق**: Backend (66 controller, services, Docker) + Frontend (108 pages, 78 components, 31 services)

---

## ملخص تنفيذي

- ✅ **مشاكل محلولة مسبقاً**: 4 بنود في تقرير الـ Compliance كانت مسجلة كمشاكل لكن **تم حلها في الكود الفعلي**
- 🔴 **مشاكل فعلية محتاجة تعديل**: 10 بنود
- 📊 **نسبة الامتثال الفعلية**: ~80%

---

## القسم ١: بنود الـ Compliance المحلولة مسبقاً ✅

> [!NOTE]
> هذه المشاكل مسجلة في `docs/compliance/` لكن الكود الفعلي يثبت إنها **مش مشكلة**.

### ✅ 1. `withCredentials` في API Client (Compliance #5 Frontend)

**الادعاء**: `services/api/client.ts` مفقود `withCredentials`  
**الحقيقة**: [baseApi.ts](file:///home/abdelrahman/projects/New%20Folder/frontend/src/services/api/baseApi.ts#L177-L181) يستخدم `credentials: 'include'` في كل request عبر `fetchApi()`.

```typescript
// baseApi.ts line 177-181
let response = await fetch(url, {
  ...options,
  headers,
  credentials: "include", // ✅ موجود فعلاً
});
```

---

### ✅ 2. TypeScript Strict Mode (Compliance #9 Frontend)

**الادعاء**: `tsconfig.json` ليس في strict mode  
**الحقيقة**: [tsconfig.json](file:///home/abdelrahman/projects/New%20Folder/frontend/tsconfig.json#L18) يحتوي على `"strict": true`.

```json
{
  "compilerOptions": {
    "strict": true, // ✅ مفعّل
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

---

### ✅ 3. مجلد `pages/` لا يزال موجود (Compliance #1 Frontend)

**الادعاء**: مجلد `pages/` ممكن يكون موجود (نمط Next.js القديم)  
**الحقيقة**: لا يوجد مجلد `pages/` في الـ frontend. المشروع يستخدم **App Router فقط** (مجلد `app/`).

---

### ✅ 4. Frontend Dockerfile بدون USER directive (Compliance #2 Infra)

**الادعاء**: كل Dockerfiles تعمل كـ root  
**الحقيقة**: [frontend/Dockerfile](file:///home/abdelrahman/projects/New%20Folder/frontend/Dockerfile#L56-L64) يحتوي على:

```dockerfile
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
# ...
USER nextjs  # ✅ غير root
```

---

## القسم ٢: مشاكل فعلية في الباك اند 🔴

### 🔴 BK-01: غياب Laravel Policies — Authorization مبعثر في Controllers

**الخطورة**: عالية  
**الملفات المتأثرة**: 6+ controllers في `Teacher/`  
**عدد الحالات**: 19+ inline authorization check

| Controller                                                                                                                                             | عدد الحالات | الأسطر                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- | ------------------------------------ |
| [LectureController.php](file:///home/abdelrahman/projects/New%20Folder/backend/app/Http/Controllers/Teacher/LectureController.php)                     | 8           | L62, 73, 88, 101, 115, 129, 158, 238 |
| [ExamController.php](file:///home/abdelrahman/projects/New%20Folder/backend/app/Http/Controllers/Teacher/ExamController.php)                           | 4           | L32, 113, 126, 174                   |
| [GroupController.php](file:///home/abdelrahman/projects/New%20Folder/backend/app/Http/Controllers/Teacher/GroupController.php)                         | 3           | L43, 98, 113                         |
| [GradeController.php](file:///home/abdelrahman/projects/New%20Folder/backend/app/Http/Controllers/Teacher/GradeController.php)                         | 2           | L82, 97                              |
| [LectureAttendanceController.php](file:///home/abdelrahman/projects/New%20Folder/backend/app/Http/Controllers/Teacher/LectureAttendanceController.php) | 2           | L25, 37                              |

**النمط المتكرر**:

```php
if ($model->teacher_id !== $this->getTeacherFromRequest($request)->id) {
    return $this->errorResponse('Unauthorized', 403);
}
```

**المشكلة**:

- Authorization logic مبعثر في 19+ مكان
- سهل ننسى نضيف الـ check في method جديد
- مش قابل للاختبار بشكل مستقل
- لا يوجد مجلد `app/Policies/` أصلاً

**الحل المقترح**: إنشاء Policies لكل Model (`GradePolicy`, `LecturePolicy`, `ExamPolicy`, `GroupPolicy`)  
**الجهد المقدر**: 3-5 أيام

---

### 🔴 BK-02: Backend Dockerfile بدون USER directive

**الخطورة**: عالية (أمان)  
**الملف**: [backend/Dockerfile](file:///home/abdelrahman/projects/New%20Folder/backend/Dockerfile)

على الرغم من وجود `chown -R www-data:www-data`، لا يوجد `USER www-data` directive. الـ container يعمل كـ **root**.

```dockerfile
# Line 35-37: صلاحيات فقط بدون تبديل المستخدم
RUN chown -R www-data:www-data /var/www/backend
# ❌ مفيش USER directive
```

**الحل**: إضافة `USER www-data` قبل `CMD`

---

### 🟡 BK-03: بعض Controllers ثقيل (Business Logic في Controller)

**الخطورة**: متوسطة  
**مثال**: [GradeController.php store()](file:///home/abdelrahman/projects/New%20Folder/backend/app/Http/Controllers/Teacher/GradeController.php#L40-L78)

```php
// L50-67: Business logic مباشرة في الـ Controller
if ($academyId && $academyId !== 'independent') {
    $teacherBelongsToAcademy = DB::table('academy_teacher')
        ->where('teacher_id', $teacher->id)
        ->where('academy_id', $academyId)
        ->where('is_active', true)
        ->exists();
    // ... validation logic
}
```

**لازم** يكون في Service أو Action.

---

### 🟡 BK-04: عدد قليل من Tests

**الخطورة**: متوسطة  
**عدد Test files**: 8 فقط (4 Feature, 1 Unit, 1 Pest config, 1 TestCase، 1 Notification test)

```
tests/
├── Feature/
│   ├── AcademyLectureVisibilityTest.php
│   ├── ExampleTest.php
│   ├── RolesAndPermissionsTest.php
│   └── TeacherPermissionsTest.php
├── Unit/
│   ├── ExampleTest.php
│   └── Notifications/StudentAbsentNotificationTest.php
├── Pest.php
└── TestCase.php
```

**لا يوجد tests لـ**: Controllers, Services, DTOs, Authorization  
**الهدف**: 80%+ coverage

---

## القسم ٣: مشاكل فعلية في الفرونت اند 🔴

### 🔴 FE-01: استخدام مفرط لـ `any` في Services

**الخطورة**: عالية  
**عدد الحالات**: 25+  
**الملفات المتأثرة**:

| ملف                                                                                                                                 | عدد `any` | أمثلة                                              |
| ----------------------------------------------------------------------------------------------------------------------------------- | --------- | -------------------------------------------------- |
| [academyService.ts](file:///home/abdelrahman/projects/New%20Folder/frontend/src/services/academyService.ts)                         | 10+       | `data: any`, `filters: any`, `permissions?: any[]` |
| [adminService.ts](file:///home/abdelrahman/projects/New%20Folder/frontend/src/services/admin/adminService.ts)                       | 3         | `data: any`, `meta: any`                           |
| [lectureService.ts](file:///home/abdelrahman/projects/New%20Folder/frontend/src/services/lectureService.ts)                         | 2         | `Promise<any>`, `as any`                           |
| [groupService.ts](file:///home/abdelrahman/projects/New%20Folder/frontend/src/services/groupService.ts)                             | 3         | `Promise<any>`, `students: any[]`                  |
| [gradeService.ts](file:///home/abdelrahman/projects/New%20Folder/frontend/src/services/gradeService.ts)                             | 1         | `Promise<any>`                                     |
| [notificationService.ts](file:///home/abdelrahman/projects/New%20Folder/frontend/src/services/notificationService.ts)               | 2         | `[key: string]: any`, `error: any`                 |
| [attendanceService.ts](file:///home/abdelrahman/projects/New%20Folder/frontend/src/services/academy/attendanceService.ts)           | 2         | `params: any`                                      |
| [gradesService.ts](file:///home/abdelrahman/projects/New%20Folder/frontend/src/services/academy/gradesService.ts)                   | 1         | `params: any`                                      |
| [secretariesService.ts](file:///home/abdelrahman/projects/New%20Folder/frontend/src/services/academy/secretariesService.ts)         | 2         | `permissions?: any[]`                              |
| [groupsService.ts (teacher)](file:///home/abdelrahman/projects/New%20Folder/frontend/src/services/teacher/modules/groupsService.ts) | 1         | `students: any[]`                                  |
| [gradesService.ts (teacher)](file:///home/abdelrahman/projects/New%20Folder/frontend/src/services/teacher/modules/gradesService.ts) | 1         | `students: any[]`                                  |

**الحل**: استبدال كل `any` بـ TypeScript interfaces/types محددة

---

### 🟡 FE-02: عدم وجود Unit Tests

**الخطورة**: متوسطة  
**الوضع الحالي**: **صفر** test files في الفرونت (`package.test.json` هو config file فقط)

---

### 🟡 FE-03: Debug Logs في Production Code

**الخطورة**: متوسطة  
**الملف**: [baseApi.ts](file:///home/abdelrahman/projects/New%20Folder/frontend/src/services/api/baseApi.ts#L175)

```typescript
// Line 175: ❌ Debug log في production
console.log("[DEBUG] API Request:", options.method || "GET", url);

// Line 229: ❌ Debug error log
console.error("[DEBUG] API ERROR:", response.status, url, arabicMessage);
```

**الحل**: استخدام conditional logging أو logger service

---

## القسم ٤: مشاكل فعلية في الـ Infrastructure 🔴

### 🔴 INF-01: غياب Security Headers في nginx

**الخطورة**: عالية  
**الملف**: [default.conf](file:///home/abdelrahman/projects/New%20Folder/nginx/conf.d/default.conf)

الـ nginx config **لا يحتوي** على أي security headers:

| Header مفقود                       | المخاطرة              |
| ---------------------------------- | --------------------- |
| `X-Content-Type-Options: nosniff`  | MIME-sniffing attacks |
| `X-Frame-Options: DENY`            | Clickjacking          |
| `X-XSS-Protection: 1; mode=block`  | XSS                   |
| `Strict-Transport-Security` (HSTS) | SSL downgrade         |
| `Content-Security-Policy`          | Script injection      |
| `Referrer-Policy`                  | Referrer leakage      |

---

### 🟡 INF-02: Firebase credentials مكشوفة في docker-compose.yml

**الخطورة**: متوسطة  
**الملف**: [docker-compose.yml](file:///home/abdelrahman/projects/New%20Folder/docker-compose.yml#L236-L242)

```yaml
# Lines 236-242: ❌ Credentials ثابتة في الملف
NEXT_PUBLIC_FIREBASE_API_KEY: AIzaSyDuWnTpPZDolIt20XyB0h9ylWzDCs0H_b4
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: neetaq-54091.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID: neetaq-54091
NEXT_PUBLIC_FIREBASE_APP_ID: 1:962831721396:web:99b9ffc5296043dd2b88e1
```

> [!IMPORTANT]
> الـ `docker-compose.prod.yml` يتعامل مع هذا صح باستخدام `${NEXT_PUBLIC_FIREBASE_API_KEY}` environment variables. المشكلة في ملف الـ development فقط.

---

### 🟡 INF-03: Healthchecks ناقصة لبعض Services

**الخطورة**: متوسطة

| Service   | docker-compose.yml | docker-compose.prod.yml |
| --------- | ------------------ | ----------------------- |
| mysql     | ✅                 | ✅                      |
| redis     | ✅                 | ✅                      |
| octane    | ❌                 | ✅                      |
| reverb    | ❌                 | ✅                      |
| horizon   | ❌                 | ❌                      |
| scheduler | ❌                 | ❌                      |
| nginx     | ❌                 | ❌                      |
| frontend  | ❌                 | ❌                      |

---

## القسم ٥: ملاحظات إيجابية ✅

| #   | بند                                                          | الحالة |
| --- | ------------------------------------------------------------ | ------ |
| 1   | `declare(strict_types=1)` في كل ملفات PHP                    | ✅     |
| 2   | DTO Pattern (GradeData, ExamData, LectureData)               | ✅     |
| 3   | FormRequests (StoreGradeRequest, UpdateExamRequest, etc.)    | ✅     |
| 4   | Service Layer (GradeService, LectureService, ExamService)    | ✅     |
| 5   | API Resources (GradeResource, ExamResource, LectureResource) | ✅     |
| 6   | App Router فقط (مفيش pages/)                                 | ✅     |
| 7   | TypeScript strict mode مفعّل                                 | ✅     |
| 8   | `credentials: 'include'` في API client                       | ✅     |
| 9   | Frontend Dockerfile يعمل كـ non-root (nextjs user)           | ✅     |
| 10  | Multi-stage Docker builds                                    | ✅     |
| 11  | Docker Secrets في Production compose                         | ✅     |
| 12  | Octane + Swoole للأداء                                       | ✅     |
| 13  | CSRF token handling                                          | ✅     |
| 14  | Token refresh mechanism                                      | ✅     |
| 15  | SSL/TLS configuration في nginx                               | ✅     |

---

## ملخص الأولويات

### فوري (هذا الأسبوع)

1. **INF-01**: إضافة security headers في nginx (2 ساعة)
2. **BK-02**: إضافة `USER www-data` في backend Dockerfile (30 دقيقة)
3. **FE-03**: إزالة debug logs من `baseApi.ts` (15 دقيقة)

### قريب (السبرنت القادم)

4. **BK-01**: إنشاء Laravel Policies (3-5 أيام)
5. **FE-01**: استبدال `any` types بـ proper interfaces (2-3 أيام)
6. **INF-03**: إضافة healthchecks للـ services المتبقية (2 ساعة)

### بعيد (Backlog)

7. **BK-03**: تنحيف Controllers (1-2 يوم)
8. **BK-04**: كتابة Backend tests (5+ أيام)
9. **FE-02**: كتابة Frontend tests (5+ أيام)
10. **INF-02**: نقل credentials من docker-compose.yml لـ env vars (1 ساعة)

---

## تحديث تقرير الـ Compliance

> [!WARNING]
> يجب تحديث `docs/compliance/COMPLIANCE_SUMMARY.md` و `FRONTEND_COMPLIANCE.md` لإزالة البنود المحلولة مسبقاً (القسم ١ أعلاه). هذه البنود تعطي انطباع خاطئ عن حالة الكود.

| بند محلول                | ملف الـ Compliance                             |
| ------------------------ | ---------------------------------------------- |
| withCredentials مفقود    | `FRONTEND_COMPLIANCE.md` Violation #5          |
| TypeScript Not Strict    | `FRONTEND_COMPLIANCE.md` Violation #9          |
| Pages Directory Exists   | `FRONTEND_COMPLIANCE.md` Violation #1          |
| Frontend Dockerfile Root | `INFRA_COMPLIANCE.md` Violation #2 (partially) |

---

**تم إنشاء التقرير**: 2026-02-13  
**المراجعة القادمة**: بعد تطبيق الإصلاحات ذات الأولوية الفورية
