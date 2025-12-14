# Laravel 12 Backend Development Guide - LMS Project

## 📋 نظرة عامة

هذا المستند هو الدليل الرسمي لتطوير الباك اند في مشروع نظام إدارة التعليم (LMS). يجب اتباع كل المعايير والمبادئ الموضحة هنا عند كتابة أي كود جديد.

---

## 🎯 المبادئ الأساسية

### 1. SOLID Principles

يجب تطبيق مبادئ SOLID في كل الكود:

#### Single Responsibility Principle (SRP)

- كل Class يجب أن يكون له مسؤولية واحدة فقط
- **Controllers**: فقط معالجة HTTP requests والتوجيه للـ Services
- **Services**: Business logic فقط
- **Actions**: عمليات atomic محددة
- **FormRequests**: Validation فقط
- **Resources**: تحويل البيانات للـ JSON

#### Open/Closed Principle (OCP)

- الكود مفتوح للإضافة، مغلق للتعديل
- استخدم **Factory Pattern** و **Strategy Pattern** لإضافة features جديدة بدون تعديل الكود القديم
- مثال: `NotificationFactory` يسمح بإضافة قنوات جديدة (SMS, Email, Push) بدون تعديل الكود الحالي

#### Dependency Inversion Principle (DIP)

- اعتمد على Abstractions (Interfaces) مش Concrete classes
- استخدم Dependency Injection

---

## 🏗️ معمارية المشروع (Architecture)

### هيكل الملفات القياسي

```
app/
├── Actions/              # عمليات atomic محددة
│   └── Teacher/
│       ├── GenerateStudentUsername.php
│       ├── GenerateStudentPassword.php
│       └── ValidateGroupGrade.php
├── Factories/            # Factory classes
│   └── NotificationFactory.php
├── Http/
│   ├── Controllers/      # فقط HTTP handling
│   │   ├── Admin/
│   │   ├── Teacher/
│   │   ├── Student/
│   │   └── Secretary/
│   ├── Requests/         # كل الـ validation
│   │   ├── Admin/
│   │   ├── Teacher/
│   │   ├── Student/
│   │   └── Auth/
│   └── Resources/        # JSON response transformation
├── Interfaces/           # Contracts/Interfaces
│   └── NotificationChannelInterface.php
├── Models/              # Eloquent models
├── Services/            # Business logic
│   ├── Admin/
│   ├── Teacher/
│   ├── Student/
│   └── Notifications/
└── Traits/
    └── ApiResponseTrait.php
```

---

## 📝 معايير كتابة الكود

### Controllers

**✅ صح:**

```php
public function store(StoreStudentRequest $request)
{
    $teacher = $request->user();
    $student = $this->studentService->createStudent($teacher, $request->validated());

    return $this->successResponse([
        'student' => new StudentResource($student),
        'message' => 'تم إضافة الطالب بنجاح'
    ], 201);
}
```

**❌ غلط:**

```php
public function store(Request $request)
{
    $request->validate([...]);  // Validation في Controller
    $student = Student::create([...]); // Business logic في Controller
    return response()->json([...]); // مش مستخدم ApiResponseTrait
}
```

### FormRequests

**كل validation يجب أن يكون في FormRequest:**

```php
class StoreStudentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
        ];
    }

    public function prepareForValidation()
    {
        // تنظيف البيانات هنا
        $this->merge([
            'name' => strip_tags($this->input('name')),
        ]);
    }
}
```

### Services

**كل Business Logic في Services:**

```php
class StudentService
{
    public function createStudent(Teacher $teacher, array $data): Student
    {
        return $teacher->students()->create([
            'name' => $data['name'],
            'username' => $data['username'],
            'password' => Hash::make($data['password']),
            // ...
        ]);
    }
}
```

### Actions

**للعمليات الـ atomic المستقلة:**

```php
class GenerateStudentUsername
{
    public function execute(string $name, Teacher $teacher): string
    {
        $slug = $this->arabicToSlug($name);
        $baseSlug = $slug;
        $counter = 1;

        while ($teacher->students()->where('username', $slug)->exists()) {
            $slug = $baseSlug . $counter;
            $counter++;
        }

        return $slug;
    }
}
```

---

## 🔄 استجابات الـ API (API Responses)

### ApiResponseTrait

**استخدم دائماً `ApiResponseTrait` في كل الـ Controllers:**

```php
class Controller
{
    use ApiResponseTrait;
}
```

#### Success Response

```php
return $this->successResponse($data, $message = 'Success', $code = 200);
```

#### Error Response

```php
return $this->errorResponse($message, $code = 400, $errors = null);
```

**مثال:**

```php
// Success
return $this->successResponse([
    'student' => $student,
], 'تم إضافة الطالب بنجاح', 201);

// Error
return $this->errorResponse('Unauthorized', 403);
```

---

## 🔐 معالجة الأخطاء (Error Handling)

### ✅ استخدم ApiResponseTrait

```php
if ($lecture->teacher_id !== $request->user()->id) {
    return $this->errorResponse('Unauthorized', 403);
}
```

### ❌ تجنب abort() أو response()->json() المباشر

```php
// لا تستخدم:
abort(403);
return response()->json(['error' => 'Unauthorized'], 403);
```

---

## 📦 Notification System (قابل للتوسع)

### إضافة قناة إشعارات جديدة

#### 1. أنشئ Strategy Class جديد

```php
class SmsChannelStrategy implements NotificationChannelInterface
{
    public function send(Collection $recipients, string $title, string $message, array $data = []): void
    {
        // SMS sending logic
    }
}
```

#### 2. سجله في Factory

```php
// في NotificationFactory::make()
'sms' => new SmsChannelStrategy(),
```

**هذا كل شيء! لا حاجة لتعديل أي كود آخر.**

---

## ✅ Checklist قبل Commit أي كود

- [ ] كل الـ validation في FormRequests؟
- [ ] كل الـ business logic في Services؟
- [ ] استخدمت `ApiResponseTrait` للـ responses؟
- [ ] لا يوجد `abort()` أو `response()->json()` مباشر؟
- [ ] Controller "skinny" وفقط يوجه للـ Service؟
- [ ] استخدمت Dependency Injection للـ Services؟
- [ ] الكود يتبع PSR-12 coding standards؟
- [ ] أضفت type hints للـ parameters والـ return types؟

---

## 🔍 أمثلة واقعية من المشروع

### مثال كامل: إضافة طالب جديد

#### 1. FormRequest

```php
// app/Http/Requests/Teacher/Student/StoreStudentRequest.php
class StoreStudentRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'parent_phone' => 'nullable|string|max:20',
            'gender' => 'required|in:male,female',
            'grade_id' => 'nullable|exists:grades,id',
            'group_id' => 'nullable|exists:groups,id',
        ];
    }
}
```

#### 2. Controller

```php
// app/Http/Controllers/Teacher/StudentController.php
class StudentController extends Controller
{
    public function __construct(
        protected StudentService $studentService,
        protected GenerateStudentUsername $generateUsername,
        protected GenerateStudentPassword $generatePassword,
    ) {}

    public function store(StoreStudentRequest $request)
    {
        $teacher = $request->user();
        $validated = $request->validated();

        $validated['username'] = $this->generateUsername->execute($validated['name'], $teacher);
        $validated['password'] = $this->generatePassword->execute($validated['name'], $validated['phone']);

        $student = $this->studentService->createStudent($teacher, $validated);

        return $this->successResponse([
            'student' => new StudentResource($student),
        ], 'تم إضافة الطالب بنجاح', 201);
    }
}
```

#### 3. Service

```php
// app/Services/Teacher/StudentService.php
class StudentService
{
    public function createStudent(Teacher $teacher, array $data): Student
    {
        return $teacher->students()->create([
            'name' => $data['name'],
            'username' => $data['username'],
            'password' => Hash::make($data['password']),
            'phone' => $data['phone'] ?? null,
            'parent_phone' => $data['parent_phone'] ?? null,
            'gender' => $data['gender'] ?? 'male',
            'grade_id' => $data['grade_id'] ?? null,
            'group_id' => $data['group_id'] ?? null,
        ]);
    }
}
```

---

## 🚀 الخطوات القادمة (Future Improvements)

### 1. Policies للـ Authorization

بدلاً من:

```php
if ($lecture->teacher_id !== $request->user()->id) {
    return $this->errorResponse('Unauthorized', 403);
}
```

استخدم Policy:

```php
$this->authorize('update', $lecture);
```

### 2. Events & Listeners

لفصل side effects عن business logic:

```php
event(new StudentCreated($student));
```

### 3. Repository Pattern (اختياري)

لفصل data access logic عن business logic.

### 4. API versioning

```
/api/v1/students
/api/v2/students
```

---

## 📚 مصادر إضافية

- [Laravel 12 Documentation](https://laravel.com/docs/12.x)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [PSR-12 Coding Standard](https://www.php-fig.org/psr/psr-12/)

---

## 🤝 المساهمة في المشروع

عند إضافة feature جديد:

1. راجع هذا الملف أولاً
2. اتبع نفس الـ patterns الموجودة
3. أضف FormRequest إذا كان فيه validation
4. ضع business logic في Service
5. استخدم ApiResponseTrait
6. اختبر الكود
7. راجع الـ Checklist

---

**آخر تحديث:** ديسمبر 2025  
**الإصدار:** 1.0
