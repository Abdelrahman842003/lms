# Cloudflare R2 & KV Setup Guide

## نظرة عامة

دليل شامل لإعداد Cloudflare R2 (Object Storage) و KV (Key-Value Store) لنظام رفع الصور.

---

## 1. إعداد Cloudflare R2

### خطوة 1: إنشاء R2 Bucket

1. سجّل الدخول إلى [Cloudflare Dashboard](https://dash.cloudflare.com)
2. اذهب إلى **R2** من القائمة الجانبية
3. اضغط على **Create Bucket**
4. أدخل اسم الـ Bucket (مثال: `lms-avatars`)
5. اختر المنطقة الجغرافية المناسبة
6. اضغط **Create Bucket**

### خطوة 2: إنشاء R2 API Token

1. في صفحة R2، اذهب إلى **Manage R2 API Tokens**
2. اضغط **Create API Token**
3. أدخل اسم للـ Token (مثال: `LMS Avatar Upload`)
4. اختر الصلاحيات:
    - **Permissions**: Object Read & Write
    - **Specify bucket**: اختر الـ bucket الذي أنشأته
5. اضغط **Create API Token**
6. احفظ المعلومات التالية:
    - Access Key ID
    - Secret Access Key
    - Endpoint URL (مثال: `https://<account-id>.r2.cloudflarestorage.com`)

### خطوة 3: إعداد Public Access (اختياري)

لعرض الصور مباشرة:

1. اذهب إلى الـ Bucket
2. اضغط على **Settings**
3. في قسم **Public Access**:
    - فعّل **Allow Access**
    - احفظ الـ Public URL (مثال: `https://pub-xxxxx.r2.dev`)

---

## 2. إعداد Cloudflare KV

### خطوة 1: إنشاء KV Namespace

1. في Cloudflare Dashboard، اذهب إلى **Workers & Pages**
2. اختر **KV** من القائمة
3. اضغط **Create Namespace**
4. أدخل اسم الـ Namespace (مثال: `lms-avatar-metadata`)
5. اضغط **Add**
6. احفظ **Namespace ID**

### خطوة 2: إنشاء API Token للـ KV

1. اذهب إلى **My Profile** > **API Tokens**
2. اضغط **Create Token**
3. اختر **Custom Token**
4. إعدادات الـ Token:
    - **Token name**: `LMS KV Access`
    - **Permissions**:
        - Account > Workers KV Storage > Edit
    - **Account Resources**: Include > Your Account
5. اضغط **Continue to Summary** ثم **Create Token**
6. احفظ الـ API Token

### خطوة 3: الحصول على Account ID

1. اذهب إلى **Overview** في Dashboard
2. في الجانب الأيمن، انسخ **Account ID**

---

## 3. إعداد Laravel

### خطوة 1: تحديث ملف `.env`

أضف المتغيرات التالية إلى ملف `.env`:

```env
# Cloudflare R2
CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key_id
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_access_key
CLOUDFLARE_R2_BUCKET=lms-avatars
CLOUDFLARE_R2_ENDPOINT=https://your_account_id.r2.cloudflarestorage.com
CLOUDFLARE_R2_PUBLIC_URL=https://pub-xxxxx.r2.dev

# Cloudflare KV
CLOUDFLARE_KV_ACCOUNT_ID=your_account_id
CLOUDFLARE_KV_NAMESPACE_ID=your_namespace_id
CLOUDFLARE_KV_API_TOKEN=your_kv_api_token
```

### خطوة 2: تشغيل Migration

```bash
cd backend
php artisan migrate
```

هذا سيضيف حقل `avatar_key` إلى جداول `teachers`, `students`, `secretaries`.

### خطوة 3: تأكد من تثبيت المكتبات

```bash
composer require intervention/image:^3.0 guzzlehttp/guzzle:^7.8
```

---

## 4. اختبار النظام

### اختبار الاتصال بـ R2

قم بإنشاء ملف اختبار `test-r2.php`:

```php
<?php
require __DIR__.'/vendor/autoload.php';

use Illuminate\Support\Facades\Storage;

// Test R2 connection
try {
    Storage::disk('r2')->put('test.txt', 'Hello R2');
    echo "✅ R2 connection successful!\n";

    $exists = Storage::disk('r2')->exists('test.txt');
    echo $exists ? "✅ File exists in R2\n" : "❌ File not found\n";

    Storage::disk('r2')->delete('test.txt');
    echo "✅ File deleted successfully\n";
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
```

ثم شغّله:

```bash
php artisan tinker
```

```php
Storage::disk('r2')->put('test.txt', 'Hello R2');
Storage::disk('r2')->exists('test.txt');
Storage::disk('r2')->delete('test.txt');
```

### اختبار الاتصال بـ KV

في Laravel Tinker:

```php
$kvService = app(\App\Services\CloudflareKVService::class);
$kvService->set('test_key', ['message' => 'Hello KV']);
$result = $kvService->get('test_key');
dd($result); // Should show: ['message' => 'Hello KV']
```

---

## 5. استخدام API

### رفع صورة

```bash
curl -X POST http://localhost:8000/api/avatar/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "avatar=@/path/to/image.jpg"
```

**Response:**

```json
{
    "success": true,
    "message": "Avatar uploaded successfully",
    "data": {
        "url": "https://pub-xxxxx.r2.dev/avatars/teacher_1_1234567890_abcd.webp",
        "key": "teacher_1_avatar"
    }
}
```

### عرض الصورة

```bash
curl -X GET http://localhost:8000/api/avatar \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**

```json
{
    "success": true,
    "data": {
        "url": "https://pub-xxxxx.r2.dev/avatars/teacher_1_1234567890_abcd.webp"
    }
}
```

### حذف الصورة

```bash
curl -X DELETE http://localhost:8000/api/avatar \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**

```json
{
    "success": true,
    "message": "Avatar deleted successfully"
}
```

---

## 6. استكشاف الأخطاء

### خطأ: "Access Denied"

-   تحقق من صلاحيات الـ API Token
-   تأكد من أن الـ Token يملك صلاحية Read & Write

### خطأ: "Bucket not found"

-   تحقق من اسم الـ Bucket في `.env`
-   تأكد من أن الـ Endpoint URL صحيح

### خطأ: "KV namespace not found"

-   تحقق من الـ Namespace ID
-   تأكد من الـ API Token يملك صلاحية KV Storage

### الصور لا تظهر

-   تأكد من تفعيل Public Access على الـ R2 Bucket
-   تحقق من الـ `CLOUDFLARE_R2_PUBLIC_URL` في `.env`

---

## 7. الأمان

### Best Practices

1. **لا تشارك الـ Tokens**: احتفظ بها في `.env` ولا ترفعها على Git
2. **استخدم HTTPS**: دائماً استخدم HTTPS للـ endpoints
3. **قيّد الصلاحيات**: أعط الـ Token أقل صلاحيات ممكنة
4. **تجديد Tokens**: جدد الـ API Tokens بشكل دوري
5. **مراقبة الاستخدام**: راقب استخدام R2 و KV من Dashboard

### CORS Configuration (إذا لزم)

إذا كنت تستخدم R2 مباشرة من Frontend، أضف CORS:

1. في R2 Bucket Settings
2. أضف CORS Rule:

```json
[
    {
        "AllowedOrigins": ["https://yourdomain.com"],
        "AllowedMethods": ["GET"],
        "AllowedHeaders": ["*"]
    }
]
```

---

## 8. التكاليف

### Cloudflare R2

-   **Storage**: $0.015/GB/month
-   **Class A Operations** (Write): $4.50/million
-   **Class B Operations** (Read): $0.36/million
-   **Free Tier**: 10 GB storage, 1 million Class A, 10 million Class B

### Cloudflare KV

-   **Storage**: $0.50/GB/month
-   **Reads**: $0.50/10 million
-   **Writes**: $5.00/million
-   **Free Tier**: Included with Workers plan

---

## 9. المراجع

-   [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
-   [Cloudflare KV Documentation](https://developers.cloudflare.com/kv/)
-   [Laravel Filesystem Documentation](https://laravel.com/docs/filesystem)
-   [Intervention Image Documentation](https://image.intervention.io/v3)
