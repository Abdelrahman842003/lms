# QUALITY_REPORT

**تاريخ التدقيق:** 2026-02-15  
**نوع التدقيق:** Fresh Full Audit (Strict)  
**المرجع المعماري:** `docs/compliance/*.md`  

## Stack Summary
- **Backend:** Laravel 12 + PHP 8.2 + Sanctum + Octane
- **Frontend:** Next.js App Router + React 18 + TypeScript
- **Infra:** Docker Compose + Nginx + MySQL + Redis

## [Compliance Report]

| الملف/المجلد | حالة المطابقة | ملاحظات التصحيح |
|---|---|---|
| `backend/app/Http/Controllers` | Partial | يوجد Controllers سميكة وبها business logic/transformations مباشرة داخل الـController بدل service/resource مثل `backend/app/Http/Controllers/Academy/StudentController.php:56` و`backend/app/Http/Controllers/Academy/StudentController.php:163`، واستعلامات DB مباشرة مثل `backend/app/Http/Controllers/Teacher/GradeController.php:55`. |
| `backend/app/Services` | Partial | البنية موجودة بشكل جيد، لكن يوجد تكرار عالي المخاطر لنفس الخدمة باسمين ومسارين (`backend/app/Services/PointService.php` و`backend/app/Services/Infrastructure/PointService.php`) ما يسبب drift وصعوبة صيانة. |
| `backend/app/DTOs` | Compliant | وجود DTOs منظمة حسب الـmodules (`backend/app/DTOs/*`) ومتسقة مع النمط العام. |
| `backend/app/Http/Requests` | Partial | FormRequests مستخدمة بشكل واسع، لكن ما زال هناك inline validation في Controllers مثل `backend/app/Http/Controllers/Admin/AcademyController.php:113` و`backend/app/Http/Controllers/Teacher/StudentController.php:51`. |
| `backend/app/Http/Resources` | Partial | Resources موجودة، لكن عدة endpoints تُرجع arrays يدوية بدل Resource mapping موحد (مثال `backend/app/Http/Controllers/Teacher/StudentController.php:181`). |
| `backend/app/Policies` | Compliant | سياسات موجودة ومربوطة فعليًا (`backend/app/Providers/AppServiceProvider.php:46` إلى `backend/app/Providers/AppServiceProvider.php:49`) مع استخدام Gate في Controllers مثل `backend/app/Http/Controllers/Teacher/GradeController.php:83`. |
| `backend/routes/api.php` | Partial | versioning موجود (`/api/v1`) لكن naming للـauth endpoints غير متسق (مثل `/v1/admin/login` في `backend/routes/api.php:27` مقابل `/v1/login/teacher` في `backend/routes/api.php:208`). |
| `backend/database/migrations` | Non-Compliant | rollback غير متسق في migration الأداء: `down()` يحذف مؤشرات لم ينشئها `up()` (`backend/database/migrations/2026_02_07_000001_add_performance_indexes.php:177`, `:178`) ما يهدد rollback. |
| `backend/config` | Compliant | تنظيم إعدادات Laravel قياسي وكامل. |
| `frontend/src/app` | Compliant | الالتزام بـ App Router واضح، ولا يوجد `frontend/pages/` في الشجرة الحالية. |
| `frontend/src/components` | Partial | وجود مكونات كبيرة جدًا (مثل `frontend/src/components/dashboard/Navbar.tsx` ~881 سطر) + ازدواجية نفس المسؤولية (`frontend/src/components/MaintenanceGuard.tsx` و`frontend/src/components/providers/MaintenanceGuard.tsx`). |
| `frontend/src/hooks` | Partial | hooks موجودة لكن يوجد تجميع mixed concerns داخل `frontend/src/hooks/index.ts` بدل فصل hook لكل ملف feature واضح. |
| `frontend/src/services` | Non-Compliant | Fragmentation عالي: coexistence بين `fetchApi/apiClient` وبين direct `axios` + تكرار خدمات (مثل `frontend/src/services/academyService.ts` مع `frontend/src/services/academy/*`). |
| `frontend/src/contexts` | Partial | تعدد طبقات auth contexts (`AuthContext`, `CoreAuthContext`, `EnhancedAuthContext`) يزيد التعقيد واحتمال الانحراف بين السلوك الفعلي والمرغوب. |
| `frontend/src/lib/axios.ts` | Non-Compliant | يعتمد على `localStorage` token مباشرة (`frontend/src/lib/axios.ts:18`) رغم وجود token manager/client أحدث. |
| `frontend/src/lib/apiClient.ts` | Partial | client حديث ومتماسك نسبيًا، لكنه غير معتمد كنقطة وحيدة للاتصال API بسبب استمرار مسارات legacy. |
| `backend/Dockerfile` | Compliant | multi-stage + non-root runtime (`backend/Dockerfile:40`) + healthcheck (`backend/Dockerfile:43`). |
| `frontend/Dockerfile` | Compliant | non-root runtime (`frontend/Dockerfile:64`) وبناء multi-stage أفضل من ملف prod الآخر. |
| `frontend/Dockerfile.prod` | Non-Compliant | runner stage يعمل root (لا يوجد `USER`) (`frontend/Dockerfile.prod:37`-`:50`) + `npm install` بدل `npm ci` (`frontend/Dockerfile.prod:4`). |
| `docker-compose.yml` | Non-Compliant | يحتوي defaults ضعيفة للسرية (`docker-compose.yml:9`, `:11`, `:84`) + hardcoded Firebase public config (`docker-compose.yml:242`-`:248`, `:267`-`:273`). |
| `docker-compose.prod.yml` | Partial | استخدام Docker secrets جيد (`docker-compose.prod.yml:3`-`:23`)، لكن يوجد تعطيل TLS verification (`docker-compose.prod.yml:280`) + mount مباشر لملف secret (`docker-compose.prod.yml:105`). |
| `nginx/conf.d/default.conf` | Compliant | headers أمنية موجودة (`nginx/conf.d/default.conf:94`-`:99`) + HTTPS redirect. |
| `docs/ROLLBACK.md` | Partial | يحتوي أمر destructive (`docs/ROLLBACK.md:85`) + health endpoint غير مطابق لتعريف Laravel health الحالي (`docs/ROLLBACK.md:99` مقابل `backend/bootstrap/app.php:14`). |
| `docs/compliance/*` | Partial | يوجد Documentation Drift واضح: الادعاء بعدم وجود Policies في `docs/compliance/BACKEND_COMPLIANCE.md:22` بينما السياسات موجودة ومفعلة فعليًا (`backend/app/Providers/AppServiceProvider.php:46`). |

---

## [Quality Issues]

### QI-01
- **Severity:** Critical
- **Domain:** Backend
- **File/Line:** `backend/database/migrations/2026_02_07_000001_add_performance_indexes.php:177`, `backend/database/migrations/2026_02_07_000001_add_performance_indexes.php:178`
- **Issue:** `down()` يحاول حذف indexes (`students_teacher_status_index`, `students_phone_index`) لم يتم إنشاؤها داخل `up()` لنفس migration.
- **Impact:** فشل rollback في بيئات الإنتاج/الـCI وتعطيل الاسترجاع الآمن عند incident.
- **Fix Direction:** اجعل `down()` يعكس `up()` بدقة (drop only what was created in this migration).

### QI-02
- **Severity:** Critical
- **Domain:** Docker
- **File/Line:** `secrets/cloudflare_kv_api_token.txt`, `secrets/cloudflare_r2_secret_access_key.txt`, `secrets/firebase_project_id.txt` (tracked via `git ls-files`)
- **Issue:** ملفات secrets ما زالت tracked داخل git index.
- **Impact:** تسرب credentials واحتمالية compromise دائم حتى مع وجود `.gitignore` لاحقًا.
- **Fix Direction:** rotate secrets فورًا + إزالة الملفات من التاريخ (`git filter-repo`/BFG) + enforce secret scanning في CI.

### QI-03
- **Severity:** Critical
- **Domain:** Frontend
- **File/Line:** `frontend/src/lib/tokenManager.ts:114`, `backend/routes/api.php:391`, `backend/routes/api.php:395`, `backend/app/Http/Controllers/Api/RefreshTokenController.php:20`
- **Issue:** endpoint تحديث التوكن تحت `auth:sanctum` ويتطلب token ability، بينما refresh request من الـfrontend لا يرسل Bearer token للـrefresh ويعتمد فقط على cookies.
- **Impact:** refresh flow هش/قابل للفشل المتكرر (401 loop/logout storms) خاصة عند انتهاء access token.
- **Fix Direction:** توحيد contract: إما refresh token كـBearer واضح، أو backend cookie-based refresh endpoint مستقل لا يعتمد `auth:sanctum` التقليدي.

### QI-04
- **Severity:** Critical
- **Domain:** Docker
- **File/Line:** `docker-compose.prod.yml:280`
- **Issue:** تعيين `NODE_TLS_REJECT_UNAUTHORIZED=0` في production frontend service.
- **Impact:** تعطيل التحقق من TLS وفتح باب MITM على outbound HTTPS calls.
- **Fix Direction:** إزالة المتغير فورًا وإصلاح سبب شهادة/CA بدل bypass.

### QI-05
- **Severity:** Medium
- **Domain:** Frontend
- **File/Line:** `frontend/src/lib/axios.ts:18`, `frontend/src/services/academyService.ts:12`, `frontend/src/components/auth/withTeacherAuth.tsx:22`, `frontend/src/services/notificationService.ts:90`
- **Issue:** اعتماد واسع على `localStorage` token رغم وجود token manager/client حديث.
- **Impact:** surface أعلى لـXSS token theft + سلوك auth غير متسق بين الشاشات.
- **Fix Direction:** حصر كل طلبات API عبر client موحد وإلغاء الوصول المباشر لـ`localStorage` token.

### QI-06
- **Severity:** Medium
- **Domain:** Backend
- **File/Line:** `backend/app/Http/Controllers/Academy/StudentController.php:233`
- **Issue:** استخدام `Log::error` بدون import (`use Illuminate\Support\Facades\Log;`) في نفس الملف.
- **Impact:** عند دخول مسار catch قد يظهر خطأ Class resolution بدل logging الصحيح.
- **Fix Direction:** إضافة import الصحيح أو استخدام `\Log::error` بشكل موحد.

### QI-07
- **Severity:** Medium
- **Domain:** Backend
- **File/Line:** `backend/app/Http/Controllers/Academy/StudentController.php:56`, `backend/app/Http/Controllers/Teacher/StudentController.php:181`
- **Issue:** data shaping/aggregation كبير داخل Controllers بدل resources/services.
- **Impact:** ضعف SRP، صعوبة الاختبار، زيادة احتمالات regression عند أي تعديل سلوكي.
- **Fix Direction:** نقل mapping إلى Resource classes أو dedicated transformer services.

### QI-08
- **Severity:** Medium
- **Domain:** Backend
- **File/Line:** `backend/app/Http/Controllers/Admin/AcademyController.php:113`, `backend/app/Http/Controllers/Admin/AcademyController.php:163`, `backend/app/Http/Controllers/Teacher/StudentController.php:51`
- **Issue:** استمرار inline validation في Controllers بدل FormRequest pattern الموحد.
- **Impact:** قواعد validation موزعة، صعوبة إعادة الاستخدام والتدقيق الأمني.
- **Fix Direction:** استبدال جميع `request->validate` بـFormRequests متخصصة لكل use case.

### QI-09
- **Severity:** Medium
- **Domain:** Frontend
- **File/Line:** `frontend/src/services/academyService.ts:1`, `frontend/src/services/academy/teachersService.ts:1`, `frontend/src/services/academy/secretariesService.ts:1`
- **Issue:** duplication/overlap بين monolithic academy service والـmodular academy services.
- **Impact:** تضارب مصدر الحقيقة، تكرار bugs، صعوبة التتبع والاختبار.
- **Fix Direction:** إعلان مسار واحد رسمي (`services/academy/*`) وإخراج legacy facade فقط للتوافق ثم حذفه تدريجيًا.

### QI-10
- **Severity:** Medium
- **Domain:** Frontend
- **File/Line:** `frontend/src/contexts/AuthContext.tsx:1`, `frontend/src/contexts/CoreAuthContext.tsx:1`, `frontend/src/contexts/EnhancedAuthContext.tsx:1`
- **Issue:** ثلاث طبقات auth context متداخلة مع مخازن مختلفة (memory/localStorage/cookies).
- **Impact:** race conditions وسلوك auth غير متوقع بين الصفحات والـmiddleware.
- **Fix Direction:** توحيد auth state machine في provider واحد + adapters للتوافق المؤقت.

### QI-11
- **Severity:** Medium
- **Domain:** Docker
- **File/Line:** `frontend/Dockerfile.prod:37`, `frontend/Dockerfile.prod:50`
- **Issue:** stage التشغيل في Dockerfile.prod لا يحدد non-root user.
- **Impact:** زيادة أثر أي اختراق للحاوية في بيئة production.
- **Fix Direction:** إضافة مستخدم non-root في runner stage (`USER nextjs` مع chown للملفات).

### QI-12
- **Severity:** Medium
- **Domain:** Backend
- **File/Line:** `backend/routes/api.php:27`, `backend/routes/api.php:208`, `backend/routes/api.php:306`, `backend/routes/api.php:351`
- **Issue:** naming غير متسق في auth endpoints (`/admin/login` مقابل `/login/teacher`/`/login/student`).
- **Impact:** API surface غير متوقع وصعوبة التوثيق/SDK generation.
- **Fix Direction:** توحيد naming convention role-first (`/v1/{role}/login`) أو auth-first بشكل موحد.

### QI-13
- **Severity:** Low
- **Domain:** Frontend
- **File/Line:** `frontend/src/components/MaintenanceGuard.tsx:11`, `frontend/src/components/providers/MaintenanceGuard.tsx:8`, `frontend/src/app/layout.tsx:12`
- **Issue:** نسختان من `MaintenanceGuard` بسلوك مختلف؛ المستخدمة في layout هي النسخة الأبسط فقط.
- **Impact:** التباس للمطورين وخطر استدعاء النسخة الخطأ.
- **Fix Direction:** حذف/دمج النسخة غير المستخدمة وتثبيت contract واحد.

### QI-14
- **Severity:** Low
- **Domain:** Backend
- **File/Line:** `backend/app/Services/PointService.php:21`, `backend/app/Services/Infrastructure/PointService.php:21`
- **Issue:** تكرار كامل لخدمة نقاط في مسارين مختلفين.
- **Impact:** صيانة مضاعفة واحتمال drift في تغييرات لاحقة.
- **Fix Direction:** اعتماد نسخة واحدة مع alias deprecation منظم.

### QI-15
- **Severity:** Low
- **Domain:** Docker
- **File/Line:** `docs/ROLLBACK.md:85`, `docs/ROLLBACK.md:99`, `backend/bootstrap/app.php:14`
- **Issue:** وثيقة rollback تحتوي أمرًا destructive (`git reset --hard`) + healthcheck URL غير متوافق مع health route الحالي (`/up`).
- **Impact:** احتمالية فقدان تغييرات أثناء incident + تشخيص خاطئ للحالة الصحية بعد rollback.
- **Fix Direction:** إزالة reset hard من playbook واستبدال health probe بالمسار الصحيح.

---

## [Optimization Suggestions]

### Backend
| المشكلة المستهدفة | التحسين المقترح | الأثر المتوقع | الجهد | الأولوية |
|---|---|---|---|---|
| Controller thickness | نقل الـdata mapping الضخم من Controllers إلى Resources/Transformers + unit tests لها | Maintainability + أقل regressions | Medium | High |
| Inline validations | استكمال FormRequest coverage لكل endpoints المتبقية | Security + Consistency | Medium | High |
| Duplicate services | إلغاء `App\Services\PointService` أو `App\Services\Infrastructure\PointService` والاكتفاء بواحدة | Maintainability | Low | Medium |
| API path inconsistency | توحيد naming convention وتحديث OpenAPI/README | DX + API clarity | Medium | Medium |
| Migration safety | إضافة policy تدقيق migrations (up/down parity) مع smoke rollback في CI | Reliability | Medium | High |

### Frontend
| المشكلة المستهدفة | التحسين المقترح | الأثر المتوقع | الجهد | الأولوية |
|---|---|---|---|---|
| Token source inconsistency | حصر auth token lifecycle عبر `tokenManager` + `apiClient` فقط | Security + Stability | Medium | High |
| Service fragmentation | اعتماد `services/academy/*` كنقطة رسمية وترك facade legacy مؤقتًا | Maintainability | Medium | High |
| Auth context sprawl | دمج auth providers في provider واحد (single state machine) | Reliability + Debuggability | High | Medium |
| Large page/components | تقسيم ملفات >500 سطر إلى container/presentational + hooks | Maintainability + Testability | Medium | Medium |
| Guard duplication | توحيد MaintenanceGuard وإزالة النسخة غير المستخدمة | Clarity | Low | Low |

### Docker/Infra
| المشكلة المستهدفة | التحسين المقترح | الأثر المتوقع | الجهد | الأولوية |
|---|---|---|---|---|
| Secrets exposure | purge history + rotate + CI secret scanning | Security | Medium | Critical |
| TLS bypass | إزالة `NODE_TLS_REJECT_UNAUTHORIZED=0` | Security | Low | Critical |
| Root container in prod frontend | إضافة non-root user في `frontend/Dockerfile.prod` | Security | Low | High |
| Dev compose weak defaults | إزالة default secrets (`:-secret`) واستخدام `.env.example` واضح | Security hygiene | Low | Medium |
| Secret mount strategy | تجنب bind-mount للـsecret عند توفر Docker secrets (prod) | Security | Low | Medium |

---

## [Refactored Snippets]

### 1) Migration rollback parity (كارثي)
**Source:** `backend/database/migrations/2026_02_07_000001_add_performance_indexes.php:176`

**Before**
```php
Schema::table('students', function (Blueprint $table) {
    $table->dropIndex('students_teacher_status_index');
    $table->dropIndex('students_phone_index');
    $table->dropIndex('students_created_at_index');
    $table->dropIndex('students_name_index');
});
```

**After**
```php
Schema::table('students', function (Blueprint $table) {
    // Drop only indexes created in this migration's up()
    $table->dropIndex('students_created_at_index');
    $table->dropIndex('students_name_index');
});
```

**Why Better**
- يمنع فشل rollback الناتج عن dropIndex لمؤشرات لم تُنشأ في نفس migration.
- يجعل `down()` عاكسًا دقيقًا لـ`up()`.

### 2) توحيد API client بدل axios المباشر + localStorage token
**Source:** `frontend/src/services/academyService.ts:12`, `frontend/src/lib/axios.ts:18`

**Before**
```ts
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

const response = await axios.get(`${API_BASE_URL}/academy/teachers`, {
  headers: getAuthHeaders(),
});
```

**After**
```ts
import { apiClient } from '@/lib/apiClient';

export async function getAcademyTeachers(params: { page?: number; per_page?: number }) {
  return apiClient.get('/academy/teachers', { params });
}
```

**Why Better**
- يزيل تكرار auth/header logic.
- يضمن سلوك موحد (CSRF/refresh/academy-context/error handling).

### 3) تخفيف Controller وتحويل mapping إلى Resource
**Source:** `backend/app/Http/Controllers/Academy/StudentController.php:56`

**Before**
```php
$data = $students->through(function ($student) {
    // long business/data transformation block
    return [/* ... */];
});
```

**After**
```php
// Controller
return $this->successResponse(
    AcademyStudentResource::collection($students)->response()->getData(true)
);

// Resource (single responsibility)
class AcademyStudentResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            // computed fields here
        ];
    }
}
```

**Why Better**
- يفصل presentation logic عن orchestration.
- يقلل حجم وتعقيد الـController ويرفع قابلية الاختبار.

### 4) Refresh token contract واضح (frontend/backend)
**Source:** `frontend/src/lib/tokenManager.ts:114`, `backend/app/Http/Controllers/Api/RefreshTokenController.php:20`

**Before**
```ts
await fetch(`${apiUrl}/refresh-token`, {
  method: 'POST',
  credentials: 'include',
});
```
```php
if (!$user->currentAccessToken()->can('issue-access-token')) {
    return $this->errorResponse('Invalid token type. Refresh token required.', 403);
}
```

**After (Contract Direction)**
```ts
// Frontend: call dedicated refresh endpoint with explicit refresh contract
await fetch(`${apiUrl}/refresh-token`, {
  method: 'POST',
  credentials: 'include',
  headers: { 'Accept': 'application/json' },
});
```
```php
// Backend direction: endpoint validates refresh-token from dedicated cookie/token source,
// then issues a new short-lived access token without depending on expired access token context.
```

**Why Better**
- يكسر dependency غير الموثوقة على access-token context أثناء refresh.
- يقلل فرص 401 loops.

---

## Test Cases and Scenarios (Validation Matrix)

1. **Backend auth flow**
- سيناريو: `login -> me -> refresh-token -> logout` لكل role.
- التحقق: لا يوجد 401 loop، والـrefresh يعمل بعد انتهاء access token.

2. **Migration safety**
- سيناريو: `php artisan migrate` ثم `php artisan migrate:rollback --step=1` على قاعدة نظيفة.
- التحقق: rollback يمر بدون SQL errors لمؤشرات غير موجودة.

3. **API contract consistency**
- سيناريو: عينة endpoints عبر Admin/Teacher/Student.
- التحقق: envelope موحد (`status`, `status_code`, `message`, `data`).

4. **Frontend token source consistency**
- سيناريو: تشغيل شاشات teacher/admin/academy الأساسية.
- التحقق: عدم الاعتماد على `localStorage.getItem('token')` خارج طبقة auth client.

5. **Docker security checks**
- سيناريو: فحص `docker-compose*.yml` وDockerfiles.
- التحقق: لا root runtime في production، لا TLS bypass، لا secrets hardcoded.

6. **Infra readiness**
- سيناريو: `docker compose config` وstartup smoke.
- التحقق: services critical لديها healthchecks فعالة ومسارات جاهزية صحيحة.

---

## Appendix: Documentation Drift vs `docs/compliance`

- `docs/compliance/BACKEND_COMPLIANCE.md:22` يذكر غياب Laravel Policies، بينما الواقع يحتوي Policies + Gate binding (`backend/app/Providers/AppServiceProvider.php:46`).
- `docs/compliance/INFRA_COMPLIANCE.md:170` يذكر غياب healthchecks في compose، بينما healthchecks موجودة في `docker-compose.yml` (`:18`, `:36`, `:95`, `:280`) و`docker-compose.prod.yml` (`:62`, `:79`, `:158`, `:245`).
- `docs/compliance/INFRA_COMPLIANCE.md:218` يذكر غياب nginx security headers، بينما headers موجودة فعليًا (`nginx/conf.d/default.conf:94`-`:99`).
- `docs/compliance/FRONTEND_COMPLIANCE.md` هو قالب غير معبأ فعليًا (placeholder) وليس نتيجة تدقيق نهائية (`docs/compliance/FRONTEND_COMPLIANCE.md:3`, `:9`).

