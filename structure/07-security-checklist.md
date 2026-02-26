# NeetaQ — Security Checklist الأمني الشامل

> [!CAUTION]
> هذا الملف يحتوي على جميع القواعد الأمنية الإلزامية. لا يتم تسليم أي فيتشر بدون تطبيق هذه القواعد.

---

## 1. Authentication (المصادقة)

### OTP Security

| القاعدة              | التفاصيل                              |
| -------------------- | ------------------------------------- |
| Rate limit إرسال OTP | 3 محاولات / دقيقة لكل رقم             |
| Rate limit تحقق OTP  | 5 محاولات / 5 دقائق لكل رقم           |
| OTP expiry           | 5 دقائق                               |
| OTP length           | 4-6 أرقام (قابل للتعديل من Admin)     |
| Lockout              | بعد 10 محاولات فاشلة ← block 30 دقيقة |
| OTP storage          | Redis مع TTL — ممنوع DB               |
| OTP logging          | ممنوع تسجيل قيمة OTP في logs          |

### Device/Session Management

| القاعدة             | التفاصيل                                         |
| ------------------- | ------------------------------------------------ |
| تسجيل الجهاز        | كل login = device record (fingerprint + IP + UA) |
| عرض الأجهزة         | المستخدم يرى قائمة أجهزته النشطة                 |
| إلغاء جهاز          | المستخدم يقدر يلغي session من جهاز معين          |
| إلغاء الكل          | زرار "تسجيل خروج من كل الأجهزة"                  |
| Concurrent sessions | حد أقصى 3 أجهزة (قابل للتعديل من Admin)          |
| Session lifetime    | Token expiry: 30 يوم (configurable)              |
| Session refresh     | Token يتجدد كل 7 أيام                            |

### Token Management (Sanctum)

- Token per device (مش token واحد لكل user)
- Revoke on password change
- Revoke on suspicious activity
- Abilities/scopes حسب الـ role

---

## 2. Authorization (الصلاحيات)

### RBAC Rules (Spatie)

| الدور       | القواعد                               |
| ----------- | ------------------------------------- |
| Super Admin | كل الصلاحيات — لا يتم حذفه            |
| Admin       | صلاحيات محددة من Super Admin          |
| Org Admin   | يرى فقط بيانات Organization الخاصة به |
| Teacher     | يرى فقط طلابه/مجموعاته/امتحاناته      |
| Secretary   | صلاحيات مخصصة حسب التعيين             |
| Student     | يرى فقط بيانات المدرسين المشترك معهم  |
| Parent      | يرى فقط بيانات أبنائه                 |

### Scoping Rules (لازم في كل Query)

```php
// كل query لازم تكون محددة بالـ owner
// ممنوع: Lecture::all()
// صحيح: Lecture::where('teacher_id', $teacher->id)->get()
```

### Policy Checklist

- [ ] كل Controller method له `authorize()` أو Policy
- [ ] كل API endpoint محمي بـ middleware
- [ ] Enrollment status يتحقق قبل أي عملية
- [ ] Subscription status يتحقق قبل أي عملية

---

## 3. API Security

### Rate Limiting (لكل endpoint)

| Endpoint Group   | الحد      | العقوبة      |
| ---------------- | --------- | ------------ |
| Auth (OTP/Login) | 5/min     | Block 30 min |
| General API      | 60/min    | 429 response |
| File upload      | 10/min    | 429 response |
| Announcements    | 5/hour    | 429 response |
| Exam submit      | 1/attempt | Reject       |
| Reports export   | 3/hour    | Queue + 429  |

### CORS Configuration

```php
// config/cors.php
'allowed_origins' => [
    env('FRONTEND_URL', 'http://localhost:3000'),
],
'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
'allowed_headers' => ['Content-Type', 'Authorization', 'Accept-Language'],
'max_age' => 3600,
'supports_credentials' => true,
```

### CSP Headers (في Middleware)

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-{random}';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  media-src 'self' blob:;
  connect-src 'self' wss: https:;
  frame-ancestors 'none';
```

### Input Validation Rules

- Backend: FormRequest لكل endpoint — ممنوع validation في Controller
- Frontend: Zod schema لكل form
- Backend: `strip_tags()` أو `HtmlPurifier` لأي user input يُعرض
- File names: sanitize + rename (UUID)
- SQL: Eloquent فقط — ممنوع raw queries إلا في Reports مع bindings

---

## 4. Exam Anti-Cheat (منع الغش)

| الإجراء              | التطبيق                                 |
| -------------------- | --------------------------------------- |
| Random questions     | بنك أسئلة + عدد عشوائي من كل topic      |
| Shuffle options      | ترتيب الاختيارات مختلف لكل طالب         |
| Device binding       | Attempt مربوط بـ device fingerprint     |
| Single session       | منع فتح الامتحان على جهازين             |
| Tab switch detection | Frontend يرسل signal + counter          |
| Suspicious flagging  | tab_switches > 3 = flagged للمراجعة     |
| Watermark            | اسم الطالب شفاف على واجهة الامتحان      |
| Time limit           | Server-side enforcement (مش client فقط) |
| IP logging           | تسجيل IP + User-Agent لكل attempt       |
| One attempt          | منع إعادة المحاولة (configurable)       |
| Auto-submit          | عند انتهاء الوقت = submit تلقائي        |
| Audit trail          | كل action في الامتحان مسجل              |

---

## 5. File Upload Security

| القاعدة          | التفاصيل                                           |
| ---------------- | -------------------------------------------------- |
| MIME validation  | Server-side — ممنوع الاعتماد على extension فقط     |
| Max size         | PDF: 10MB, Image: 5MB, Video: 500MB (configurable) |
| Allowed types    | pdf, jpg, png, webp, mp4, webm                     |
| Storage          | Private disk — ممنوع public access مباشر           |
| Access           | Signed URLs مع expiry (15 دقيقة)                   |
| File names       | UUID rename — ممنوع أسماء المستخدم                 |
| Virus scan       | اختياري (ClamAV) لو متاح                           |
| Upload path      | خارج web root                                      |
| Voice recordings | Max 60 seconds + WAV/MP3 only                      |

---

## 6. Data Protection (حماية البيانات)

### Encryption

| البيانات      | النوع                    |
| ------------- | ------------------------ |
| Passwords     | bcrypt (Laravel default) |
| API tokens    | SHA-256 hash             |
| OTP           | ممنوع تخزين دائم         |
| DB connection | TLS في Production        |
| Redis         | Password protected       |
| Backups       | Encrypted at rest        |

### Audit Logging (إلزامي)

| الحدث                            | يُسجل                 |
| -------------------------------- | --------------------- |
| Login/Logout                     | ✅ + IP + device      |
| Password change                  | ✅                    |
| Role/Permission change           | ✅                    |
| Subscription create/renew/expire | ✅                    |
| Enrollment create/suspend        | ✅                    |
| Exam start/submit                | ✅                    |
| Announcement sent                | ✅ + recipients count |
| Student data export              | ✅ + who requested    |
| Admin settings change            | ✅ + old/new values   |
| File upload/delete               | ✅                    |

### Data Retention

| البيانات             | المدة                        |
| -------------------- | ---------------------------- |
| Audit logs           | سنة واحدة (ثم أرشيف أو حذف)  |
| Activity logs        | 90 يوم (ثم حذف تلقائي)       |
| Exam attempts        | دائم (أرشيف)                 |
| Notifications        | 6 شهور (ثم حذف)              |
| Voice messages       | 30 يوم (ثم حذف من Storage)   |
| Soft-deleted records | 90 يوم grace ثم force delete |

---

## 7. Infrastructure Security

### Docker

- [ ] لا تستخدم `latest` tag في production
- [ ] Secrets في `.env` — ممنوع في Dockerfile
- [ ] Non-root user داخل containers
- [ ] Read-only filesystem حيث أمكن
- [ ] Network isolation بين services

### MySQL

- [ ] Dedicated user (مش root) للتطبيق
- [ ] Strong password (min 16 chars)
- [ ] Disable remote root access
- [ ] Binary logs للـ point-in-time recovery
- [ ] Automated daily backups

### Redis

- [ ] Password required (`requirepass`)
- [ ] Bind to internal network only
- [ ] Disable dangerous commands (`FLUSHALL`, `KEYS`)
- [ ] Maxmemory policy: `allkeys-lru`

### Nginx

- [ ] Hide server version
- [ ] Rate limiting on `/api/`
- [ ] Request size limit (50MB)
- [ ] Security headers (X-Frame-Options, X-Content-Type-Options, HSTS)

---

## 8. Monitoring & Alerting

| الأداة            | الغرض                                      |
| ----------------- | ------------------------------------------ |
| Laravel Pulse     | أداء التطبيق (slow queries, jobs)          |
| Laravel Horizon   | مراقبة Queues (failures, throughput)       |
| Laravel Telescope | Debug (development فقط)                    |
| Sentry (مستقبلي)  | Error tracking + alerting                  |
| Log aggregation   | Centralized logs (file → future: ELK/Loki) |

### Alerts المطلوبة

| الحدث                           | الإجراء              |
| ------------------------------- | -------------------- |
| Queue failure rate > 5%         | إشعار فوري للـ Admin |
| Login failures > 50/hour        | تحقق من DDoS         |
| Subscription mass expiry        | تقرير يومي           |
| Disk usage > 80%                | إشعار                |
| Response time > 2s              | تحقق من performance  |
| Exam suspicious flags > 10/exam | مراجعة المدرس        |

---

## 9. Frontend Security

| القاعدة         | التفاصيل                                              |
| --------------- | ----------------------------------------------------- |
| Token storage   | `httpOnly` cookie أو encrypted localStorage           |
| XSS prevention  | React auto-escaping + ممنوع `dangerouslySetInnerHTML` |
| CSRF            | Sanctum handles مع `withCredentials`                  |
| Sensitive data  | ممنوع في URL params أو localStorage plain             |
| Console logging | ممنوع في production                                   |
| Source maps     | ممنوع في production                                   |
| Dependencies    | `npm audit` أسبوعي                                    |

---

## 10. Checklist قبل كل Release

- [ ] كل endpoint ليه rate limiting
- [ ] كل endpoint ليه authorization
- [ ] كل input validated (backend + frontend)
- [ ] كل file upload validated (MIME + size)
- [ ] Audit logs شغالين
- [ ] Unit tests passing 100%
- [ ] No `dd()` / `dump()` / `console.log()` في code
- [ ] No hardcoded secrets
- [ ] CORS configured correctly
- [ ] CSP headers active
- [ ] Database indexes verified
- [ ] Queue workers healthy
- [ ] Backup verified
