# 🏗️ Feature Implementation Template

> استخدم هذا القالب لبناء أي Feature جديدة في المشروع

---

## 📁 بنية الملفات المطلوبة

```
app/
├── Http/
│   ├── Controllers/{Module}/
│   │   └── {Feature}Controller.php
│   ├── Requests/{Module}/
│   │   ├── Store{Feature}Request.php
│   │   └── Update{Feature}Request.php
│   └── Resources/{Module}/
│       └── {Feature}Resource.php
├── DTOs/{Module}/
│   └── {Feature}Data.php
├── Services/{Module}/
│   └── {Feature}Service.php
├── Models/
│   └── {Feature}.php
├── Observers/
│   └── {Feature}Observer.php (إذا لزم)
└── Exceptions/
    └── {Feature}NotFoundException.php (إذا لزم)
```

---

## ✅ Checklist للـ Feature الجديدة

### 1. 📝 Model

- [ ] إنشاء Migration مع indexes للحقول المستخدمة في البحث
- [ ] `$fillable` محددة بدقة
- [ ] `casts()` للحقول (dates, booleans, arrays)
- [ ] Relationships معرفة
- [ ] `scopeFilter()` للفلترة

### 2. 📨 Form Requests

- [ ] `StoreRequest` و `UpdateRequest` منفصلين
- [ ] `authorize()` للتحقق من الصلاحيات
- [ ] `rules()` مع validations كاملة
- [ ] `messages()` برسائل عربية
- [ ] `prepareForValidation()` إذا لزم

### 3. 📦 DTO (Data Transfer Object)

```php
<?php
declare(strict_types=1);

readonly class FeatureData
{
    public function __construct(
        public string $name,
        public ?string $description,
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            name: $request->validated('name'),
            description: $request->validated('description'),
        );
    }

    public function toArray(): array
    {
        return [...];
    }
}
```

### 4. 🔧 Service

- [ ] Constructor injection للـ dependencies
- [ ] Methods: `getAll()`, `create()`, `update()`, `delete()`
- [ ] Transactions للعمليات المعقدة
- [ ] Throw Exceptions بدلاً من return false

### 5. 🎮 Controller

```php
<?php
declare(strict_types=1);

class FeatureController extends Controller
{
    public function __construct(
        private FeatureService $service
    ) {}

    public function store(StoreRequest $request): JsonResponse
    {
        $data = FeatureData::fromRequest($request);
        $feature = $this->service->create($data);
        return $this->successResponse(
            new FeatureResource($feature),
            'تم الإنشاء بنجاح',
            201
        );
    }
}
```

### 6. 📤 API Resource

- [ ] استخدام `whenLoaded()` للـ relationships
- [ ] Key mapping ثابت (لا يتغير حتى لو تغير اسم العمود)
- [ ] `declare(strict_types=1)`

### 7. ⚠️ Exception (إذا لزم)

```php
<?php
declare(strict_types=1);

class FeatureNotFoundException extends ApiException
{
    protected int $statusCode = 404;
    protected string $errorType = 'feature_not_found';

    public function __construct(string $message = 'العنصر غير موجود')
    {
        parent::__construct($message);
    }
}
```

### 8. 🔔 Observer (للـ Caching)

```php
<?php
declare(strict_types=1);

class FeatureObserver
{
    public function __construct(private CacheService $cache) {}

    public function saved(Feature $feature): void
    {
        $this->cache->forgetFeature($feature->id);
    }

    public function deleted(Feature $feature): void
    {
        $this->cache->forgetFeature($feature->id);
    }
}
```

> ⚠️ لا تنسى تسجيل الـ Observer في `AppServiceProvider`

---

## 🔒 Standards

| المعيار            | الوصف                                           |
| ------------------ | ----------------------------------------------- |
| `strict_types`     | في بداية كل ملف PHP                             |
| `ApiResponseTrait` | استخدام `successResponse()` و `errorResponse()` |
| Naming             | PascalCase للـ Classes، camelCase للـ methods   |
| Arabic Messages    | جميع رسائل المستخدم بالعربية                    |
| Return Types       | تحديد نوع الـ return لكل method                 |

---

## 📊 مثال Route

```php
Route::prefix('features')->group(function () {
    Route::get('/', [FeatureController::class, 'index']);
    Route::post('/', [FeatureController::class, 'store']);
    Route::get('/{feature}', [FeatureController::class, 'show']);
    Route::put('/{feature}', [FeatureController::class, 'update']);
    Route::delete('/{feature}', [FeatureController::class, 'destroy']);
});
```
