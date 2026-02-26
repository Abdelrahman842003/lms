# NeetaQ — Core Classes (أمثلة كود مفصلة)

## 1. API Response Trait (الريسبونس الموحد)

```php
<?php
// app/Support/Traits/ApiResponse.php

namespace App\Support\Traits;

use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

trait ApiResponse
{
    protected function ok(
        mixed $data = null,
        string $message = 'تمت العملية بنجاح',
        int $code = Response::HTTP_OK
    ): JsonResponse {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $data,
        ], $code);
    }

    protected function created(mixed $data = null, string $message = 'تم الإنشاء بنجاح'): JsonResponse
    {
        return $this->ok($data, $message, Response::HTTP_CREATED);
    }

    protected function fail(
        string $message = 'حدث خطأ',
        mixed $errors = null,
        int $code = Response::HTTP_BAD_REQUEST
    ): JsonResponse {
        return response()->json([
            'success' => false,
            'message' => $message,
            'errors'  => $errors,
        ], $code);
    }

    protected function paginated(
        mixed $paginator,
        mixed $resource,
        string $message = 'تم الجلب بنجاح'
    ): JsonResponse {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $resource,
            'meta'    => [
                'current_page' => $paginator->currentPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
                'last_page'    => $paginator->lastPage(),
            ],
        ]);
    }

    protected function noContent(string $message = 'تمت العملية بنجاح'): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
        ], Response::HTTP_NO_CONTENT);
    }
}
```

---

## 2. Repository Contract + Eloquent (مثال: Enrollments)

```php
<?php
// app/Domains/Enrollments/Repositories/Contracts/EnrollmentRepository.php

namespace App\Domains\Enrollments\Repositories\Contracts;

use App\Domains\Enrollments\DTOs\CreateEnrollmentDTO;
use App\Domains\Enrollments\Models\Enrollment;
use Illuminate\Pagination\LengthAwarePaginator;

interface EnrollmentRepository
{
    public function create(CreateEnrollmentDTO $dto): Enrollment;
    public function findActiveByStudentTeacher(int $studentId, int $teacherId, ?int $orgId): ?Enrollment;
    public function suspend(Enrollment $enrollment, ?string $reason): Enrollment;
    public function getByGroup(int $groupId, int $perPage = 15): LengthAwarePaginator;
    public function countActiveByTeacher(int $teacherId): int;
}
```

```php
<?php
// app/Domains/Enrollments/Repositories/Eloquent/EloquentEnrollmentRepository.php

namespace App\Domains\Enrollments\Repositories\Eloquent;

use App\Domains\Enrollments\DTOs\CreateEnrollmentDTO;
use App\Domains\Enrollments\Models\Enrollment;
use App\Domains\Enrollments\Repositories\Contracts\EnrollmentRepository;
use Illuminate\Pagination\LengthAwarePaginator;

final class EloquentEnrollmentRepository implements EnrollmentRepository
{
    public function create(CreateEnrollmentDTO $dto): Enrollment
    {
        return Enrollment::query()->create($dto->toArray());
    }

    public function findActiveByStudentTeacher(int $studentId, int $teacherId, ?int $orgId): ?Enrollment
    {
        return Enrollment::query()
            ->where('student_id', $studentId)
            ->where('teacher_id', $teacherId)
            ->when($orgId, fn($q) => $q->where('organization_id', $orgId))
            ->where('status', 'active')
            ->first();
    }

    public function suspend(Enrollment $enrollment, ?string $reason): Enrollment
    {
        $enrollment->update([
            'status'             => 'suspended',
            'suspension_reason'  => $reason,
        ]);
        return $enrollment->refresh();
    }

    public function getByGroup(int $groupId, int $perPage = 15): LengthAwarePaginator
    {
        return Enrollment::query()
            ->where('group_id', $groupId)
            ->where('status', 'active')
            ->with(['student.user'])
            ->paginate($perPage);
    }

    public function countActiveByTeacher(int $teacherId): int
    {
        return Enrollment::query()
            ->where('teacher_id', $teacherId)
            ->where('status', 'active')
            ->count();
    }
}
```

---

## 3. DTO + Enum

```php
<?php
// app/Support/Enums/EnrollmentStatus.php

namespace App\Support\Enums;

enum EnrollmentStatus: string
{
    case ACTIVE = 'active';
    case SUSPENDED = 'suspended';
    case EXPIRED = 'expired';
    case BLOCKED_BY_PLAN = 'blocked_by_plan';
}
```

```php
<?php
// app/Domains/Enrollments/DTOs/CreateEnrollmentDTO.php

namespace App\Domains\Enrollments\DTOs;

use App\Support\Enums\EnrollmentStatus;
use Carbon\CarbonImmutable;

final readonly class CreateEnrollmentDTO
{
    public function __construct(
        public int $studentId,
        public int $teacherId,
        public int $groupId,
        public ?int $organizationId,
        public string $periodType,
        public CarbonImmutable $startsAt,
        public ?CarbonImmutable $endsAt,
        public EnrollmentStatus $status = EnrollmentStatus::ACTIVE,
    ) {}

    public function toArray(): array
    {
        return [
            'student_id'      => $this->studentId,
            'teacher_id'      => $this->teacherId,
            'group_id'        => $this->groupId,
            'organization_id' => $this->organizationId,
            'period_type'     => $this->periodType,
            'starts_at'       => $this->startsAt,
            'ends_at'         => $this->endsAt,
            'status'          => $this->status->value,
        ];
    }

    public static function fromRequest(array $validated): self
    {
        return new self(
            studentId:      $validated['student_id'],
            teacherId:      $validated['teacher_id'],
            groupId:        $validated['group_id'],
            organizationId: $validated['organization_id'] ?? null,
            periodType:     $validated['period_type'],
            startsAt:       CarbonImmutable::parse($validated['starts_at']),
            endsAt:         isset($validated['ends_at'])
                                ? CarbonImmutable::parse($validated['ends_at'])
                                : null,
        );
    }
}
```

---

## 4. Service/Action (Business Logic)

```php
<?php
// app/Domains/Enrollments/Actions/CreateEnrollmentAction.php

namespace App\Domains\Enrollments\Actions;

use App\Domains\Enrollments\DTOs\CreateEnrollmentDTO;
use App\Domains\Enrollments\Events\StudentEnrolled;
use App\Domains\Enrollments\Models\Enrollment;
use App\Domains\Enrollments\Repositories\Contracts\EnrollmentRepository;
use App\Domains\Subscriptions\Specifications\SeatAvailable;
use App\Domains\Subscriptions\Specifications\PlanActive;
use App\Support\Exceptions\DomainException;
use App\Support\Exceptions\SeatLimitException;
use Illuminate\Support\Facades\DB;

final class CreateEnrollmentAction
{
    public function __construct(
        private EnrollmentRepository $enrollments,
        private SeatAvailable $seatAvailable,
        private PlanActive $planActive,
    ) {}

    public function execute(CreateEnrollmentDTO $dto): Enrollment
    {
        return DB::transaction(function () use ($dto) {
            // 1. Check plan is active
            if (! $this->planActive->isSatisfiedBy($dto->teacherId, $dto->organizationId)) {
                throw new DomainException('الباقة غير نشطة أو منتهية.');
            }

            // 2. Check seat limit
            if (! $this->seatAvailable->isSatisfiedBy($dto->teacherId, $dto->organizationId)) {
                throw new SeatLimitException('تم الوصول للحد الأقصى من المقاعد.');
            }

            // 3. Prevent duplicates
            $existing = $this->enrollments->findActiveByStudentTeacher(
                $dto->studentId, $dto->teacherId, $dto->organizationId
            );
            if ($existing) {
                throw new DomainException('الطالب مشترك بالفعل مع هذا المدرس.');
            }

            // 4. Create enrollment
            $enrollment = $this->enrollments->create($dto);

            // 5. Fire event (gamification, seat allocation, etc.)
            event(new StudentEnrolled($enrollment));

            return $enrollment;
        });
    }
}
```

---

## 5. Form Request (Validation)

```php
<?php
// app/Domains/Enrollments/Http/Requests/CreateEnrollmentRequest.php

namespace App\Domains\Enrollments\Http\Requests;

use App\Support\Enums\PeriodType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateEnrollmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create-enrollment');
    }

    public function rules(): array
    {
        return [
            'student_id'      => ['required', 'integer', 'exists:students,id'],
            'teacher_id'      => ['required', 'integer', 'exists:teachers,id'],
            'group_id'        => ['required', 'integer', 'exists:groups,id'],
            'organization_id' => ['nullable', 'integer', 'exists:organizations,id'],
            'period_type'     => ['required', Rule::enum(PeriodType::class)],
            'starts_at'       => ['required', 'date'],
            'ends_at'         => ['nullable', 'date', 'after:starts_at'],
        ];
    }

    public function messages(): array
    {
        return [
            'student_id.required' => 'الطالب مطلوب.',
            'student_id.exists'   => 'الطالب غير موجود.',
            'teacher_id.required' => 'المدرس مطلوب.',
            'group_id.required'   => 'المجموعة مطلوبة.',
        ];
    }
}
```

---

## 6. API Resource (ما يرجع بالظبط)

```php
<?php
// app/Domains/Enrollments/Http/Resources/EnrollmentResource.php

namespace App\Domains\Enrollments\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EnrollmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'student'         => [
                'id'   => $this->student->id,
                'name' => $this->student->user->name,
            ],
            'teacher_id'      => $this->teacher_id,
            'group'           => [
                'id'   => $this->group->id,
                'name' => $this->group->name,
                'type' => $this->group->type,
            ],
            'status'          => $this->status,
            'period_type'     => $this->period_type,
            'starts_at'       => $this->starts_at?->format('Y-m-d'),
            'ends_at'         => $this->ends_at?->format('Y-m-d'),
            'is_expiring'     => $this->ends_at?->diffInDays(now()) <= 3,
        ];
    }
}
```

---

## 7. Controller (Thin)

```php
<?php
// app/Domains/Enrollments/Http/Controllers/EnrollmentController.php

namespace App\Domains\Enrollments\Http\Controllers;

use App\Domains\Enrollments\Actions\CreateEnrollmentAction;
use App\Domains\Enrollments\DTOs\CreateEnrollmentDTO;
use App\Domains\Enrollments\Http\Requests\CreateEnrollmentRequest;
use App\Domains\Enrollments\Http\Resources\EnrollmentResource;
use App\Support\Traits\ApiResponse;
use Illuminate\Routing\Controller;

class EnrollmentController extends Controller
{
    use ApiResponse;

    public function store(
        CreateEnrollmentRequest $request,
        CreateEnrollmentAction $action
    ) {
        $dto = CreateEnrollmentDTO::fromRequest($request->validated());
        $enrollment = $action->execute($dto);

        return $this->created(
            new EnrollmentResource($enrollment),
            'تم تسجيل الطالب بنجاح.'
        );
    }
}
```

---

## 8. Error Handling (Modern Try-Catch)

```php
<?php
// app/Support/Helpers/general.php

use App\Support\Traits\ApiResponse;

if (! function_exists('rescue_api')) {
    /**
     * Modern error handling wrapper
     */
    function rescue_api(callable $callback, string $fallbackMessage = 'حدث خطأ غير متوقع.')
    {
        try {
            return $callback();
        } catch (\App\Support\Exceptions\DomainException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        } catch (\Throwable $e) {
            report($e);
            return response()->json([
                'success' => false,
                'message' => $fallbackMessage,
            ], 500);
        }
    }
}
```

---

## 9. Auth Flow (Backend - OTP based)

```php
<?php
// app/Domains/Auth/Actions/SendOtpAction.php

namespace App\Domains\Auth\Actions;

use App\Domains\Users\Models\User;
use Illuminate\Support\Facades\Cache;

final class SendOtpAction
{
    public function execute(string $phone): void
    {
        $otp = random_int(1000, 9999);

        Cache::put("otp:{$phone}", $otp, now()->addMinutes(5));

        // TODO: Send via SMS gateway (Adapter pattern)
        // $this->smsAdapter->send($phone, "رمز التحقق: {$otp}");
    }
}
```

```php
<?php
// app/Domains/Auth/Actions/VerifyOtpAction.php

namespace App\Domains\Auth\Actions;

use App\Domains\Auth\DTOs\LoginDTO;
use App\Domains\Users\Models\User;
use App\Support\Exceptions\DomainException;
use Illuminate\Support\Facades\Cache;

final class VerifyOtpAction
{
    public function execute(LoginDTO $dto): array
    {
        $cachedOtp = Cache::get("otp:{$dto->phone}");

        if (! $cachedOtp || $cachedOtp != $dto->otp) {
            throw new DomainException('رمز التحقق غير صحيح أو منتهي.');
        }

        $user = User::where('phone', $dto->phone)->firstOrFail();

        Cache::forget("otp:{$dto->phone}");

        $token = $user->createToken('neetaq')->plainTextToken;

        return [
            'user'  => $user,
            'token' => $token,
            'role'  => $user->roles->first()?->name,
        ];
    }
}
```

---

## 10. Service Provider (Binding Interfaces)

```php
<?php
// app/Providers/RepositoryServiceProvider.php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class RepositoryServiceProvider extends ServiceProvider
{
    private array $bindings = [
        \App\Domains\Enrollments\Repositories\Contracts\EnrollmentRepository::class
            => \App\Domains\Enrollments\Repositories\Eloquent\EloquentEnrollmentRepository::class,
        // Add more bindings per domain...
    ];

    public function register(): void
    {
        foreach ($this->bindings as $contract => $implementation) {
            $this->app->bind($contract, $implementation);
        }
    }
}
```

---

## 11. Unit Test Examples

```php
<?php
// tests/Unit/Domains/Enrollments/CreateEnrollmentActionTest.php

namespace Tests\Unit\Domains\Enrollments;

use App\Domains\Enrollments\Actions\CreateEnrollmentAction;
use App\Domains\Enrollments\DTOs\CreateEnrollmentDTO;
use App\Domains\Enrollments\Models\Enrollment;
use App\Domains\Enrollments\Repositories\Contracts\EnrollmentRepository;
use App\Domains\Subscriptions\Specifications\PlanActive;
use App\Domains\Subscriptions\Specifications\SeatAvailable;
use App\Support\Exceptions\DomainException;
use Carbon\CarbonImmutable;
use Mockery;
use Tests\TestCase;

class CreateEnrollmentActionTest extends TestCase
{
    private CreateEnrollmentAction $action;
    private $mockRepo;
    private $mockSeat;
    private $mockPlan;

    protected function setUp(): void
    {
        parent::setUp();

        $this->mockRepo = Mockery::mock(EnrollmentRepository::class);
        $this->mockSeat = Mockery::mock(SeatAvailable::class);
        $this->mockPlan = Mockery::mock(PlanActive::class);

        $this->action = new CreateEnrollmentAction(
            $this->mockRepo,
            $this->mockSeat,
            $this->mockPlan
        );
    }

    public function test_it_creates_enrollment_successfully(): void
    {
        $dto = $this->makeDTO();

        $this->mockPlan->shouldReceive('isSatisfiedBy')->andReturnTrue();
        $this->mockSeat->shouldReceive('isSatisfiedBy')->andReturnTrue();
        $this->mockRepo->shouldReceive('findActiveByStudentTeacher')->andReturnNull();
        $this->mockRepo->shouldReceive('create')->andReturn(new Enrollment());

        $result = $this->action->execute($dto);
        $this->assertInstanceOf(Enrollment::class, $result);
    }

    public function test_it_throws_when_plan_inactive(): void
    {
        $this->expectException(DomainException::class);
        $this->expectExceptionMessage('الباقة غير نشطة');

        $this->mockPlan->shouldReceive('isSatisfiedBy')->andReturnFalse();
        $this->action->execute($this->makeDTO());
    }

    public function test_it_throws_when_already_enrolled(): void
    {
        $this->expectException(DomainException::class);
        $this->expectExceptionMessage('مشترك بالفعل');

        $this->mockPlan->shouldReceive('isSatisfiedBy')->andReturnTrue();
        $this->mockSeat->shouldReceive('isSatisfiedBy')->andReturnTrue();
        $this->mockRepo->shouldReceive('findActiveByStudentTeacher')
            ->andReturn(new Enrollment());

        $this->action->execute($this->makeDTO());
    }

    private function makeDTO(): CreateEnrollmentDTO
    {
        return new CreateEnrollmentDTO(
            studentId: 1,
            teacherId: 1,
            groupId: 1,
            organizationId: null,
            periodType: 'monthly',
            startsAt: CarbonImmutable::now(),
            endsAt: CarbonImmutable::now()->addMonth(),
        );
    }
}
```

---

## 12. Libraries Reference

| Category        | Package                       | Purpose                  |
| --------------- | ----------------------------- | ------------------------ |
| **Server**      | `laravel/octane` + Swoole     | High-performance HTTP    |
| **Realtime**    | `laravel/reverb`              | WebSockets               |
| **Queues**      | `laravel/horizon`             | Queue monitoring         |
| **Monitoring**  | `laravel/pulse`               | Performance insights     |
| **Auth**        | `laravel/sanctum`             | API token authentication |
| **Permissions** | `spatie/laravel-permission`   | Roles & Permissions      |
| **Audit**       | `owen-it/laravel-auditing`    | Audit logging            |
| **Media**       | `spatie/laravel-medialibrary` | File/media management    |
| **Excel**       | `maatwebsite/laravel-excel`   | Excel export (مستقبلي)   |
| **PDF**         | `barryvdh/laravel-dompdf`     | PDF export               |
| **Admin**       | `filament/filament` v4        | Admin panel              |
| **Frontend**    | `shadcn/ui`                   | UI components            |
| **Themes**      | `next-themes`                 | Light/Dark mode          |
| **State**       | `@reduxjs/toolkit`            | State management         |
| **Data**        | `@tanstack/react-query`       | Server state + caching   |
| **Forms**       | `react-hook-form` + `zod`     | Form handling            |
| **Docs**        | `vitepress`                   | Documentation site       |
