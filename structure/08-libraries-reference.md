# NeetaQ — Libraries & Packages Reference (النهائي)

> [!IMPORTANT]
> مكتبة واحدة فقط لكل غرض — الأكثر استخداماً والأحدث والمتوافقة مع Laravel 12 + Next.js 19 + Filament 4.
> ✋ = الأفضل يدوياً بدون مكتبة.

---

## 🔧 Backend — Laravel 12

### Core (Official Laravel)

| Package             | الغرض                            |
| ------------------- | -------------------------------- |
| `laravel/octane`    | High-performance server (Swoole) |
| `laravel/reverb`    | WebSocket server رسمي من Laravel |
| `laravel/horizon`   | Queue dashboard + monitoring     |
| `laravel/pulse`     | Performance monitoring           |
| `laravel/telescope` | Debugging (dev only)             |
| `laravel/sanctum`   | Token authentication (built-in)  |

### Auth & Permissions

| Package                     | الغرض                                   |
| --------------------------- | --------------------------------------- |
| `spatie/laravel-permission` | Roles & Permissions (industry standard) |

### Data & Queries

| Package                              | الغرض                                                              |
| ------------------------------------ | ------------------------------------------------------------------ |
| `spatie/laravel-query-builder`       | بناء API queries (filter, sort, include) من الـ request            |
| `staudenmeir/eloquent-has-many-deep` | علاقات Eloquent عميقة (HasManyThrough متعدد)                       |
| ✋ DTOs                              | Readonly classes يدوي (أبسط وأنظف — موجود في `04-core-classes.md`) |
| ✋ Slugs                             | `Str::slug()` يدوي في Model boot (سطر واحد)                        |

### Audit Logging

| Package                    | الغرض                                         |
| -------------------------- | --------------------------------------------- |
| `owen-it/laravel-auditing` | تتبع تغييرات Models (old/new values) تلقائي   |
| ✋ Activity Log            | جدول `activity_log` يدوي (بسيط أكتر من مكتبة) |

### Gamification

| الطريقة               | السبب                                                                                                                                                                         |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ✋ **Custom بالكامل** | احتياجاتنا معقدة (XP + Levels + Badges + Streaks + Quests + Leaderboards per scope + coins) — المكتبات الجاهزة محدودة ومش هتغطي كل ده. النظام متكامل مع Domain Events بتاعتنا |

### Media & Files

| Package                       | الغرض                                                       |
| ----------------------------- | ----------------------------------------------------------- |
| `spatie/laravel-medialibrary` | رفع/تحويل/إدارة ملفات (industry standard)                   |
| `intervention/image`          | معالجة صور (resize, crop, watermark)                        |
| `pbmedia/laravel-ffmpeg`      | معالجة فيديو (compress, thumbnail) – لو هنستضيف فيديو local |

### Export

| Package                     | الغرض                     |
| --------------------------- | ------------------------- |
| `barryvdh/laravel-dompdf`   | تصدير PDF                 |
| `maatwebsite/laravel-excel` | تصدير/استيراد Excel و CSV |

### Security

| Package              | الغرض                                      |
| -------------------- | ------------------------------------------ |
| `spatie/laravel-csp` | Content Security Policy headers تلقائي     |
| `mews/purifier`      | تنظيف user input من XSS (HTMLPurifier)     |
| ✋ Rate Limiting     | Built-in في Laravel (`RateLimiter::for()`) |
| ✋ CORS              | Built-in في Laravel (`config/cors.php`)    |

### Backup & Health

| Package                 | الغرض                                      |
| ----------------------- | ------------------------------------------ |
| `spatie/laravel-backup` | نسخ احتياطي تلقائي (DB + files → S3/local) |
| `spatie/laravel-health` | Health checks (DB, Redis, Queue, Storage)  |

### API Documentation

| Package          | الغرض                                            |
| ---------------- | ------------------------------------------------ |
| `dedoc/scramble` | توليد OpenAPI docs تلقائي من الكود (zero config) |

### Developer Tools (Dev Only)

| Package                       | الغرض                                    |
| ----------------------------- | ---------------------------------------- |
| `barryvdh/laravel-ide-helper` | Autocomplete للـ Models/Facades في IDE   |
| `nunomaduro/larastan`         | Static analysis (bugs قبل ما تحصل)       |
| `pestphp/pest`                | Testing framework حديث (أسهل من PHPUnit) |

### Settings

| Package                   | الغرض                              |
| ------------------------- | ---------------------------------- |
| `spatie/laravel-settings` | إدارة settings من DB بدون hardcode |

---

## 🖥️ Filament 4 — Admin Panel

| Plugin                                         | الغرض                                          |
| ---------------------------------------------- | ---------------------------------------------- |
| `filament/filament`                            | Admin panel core                               |
| `bezhansalleh/filament-shield`                 | Roles & Permissions في Admin (مبني على Spatie) |
| `filament/spatie-laravel-media-library-plugin` | إدارة المديا داخل Admin                        |
| `filament/spatie-laravel-settings-plugin`      | إدارة Settings من Admin UI                     |
| `awcodes/filament-tiptap-editor`               | Rich text editor                               |
| `filament/spatie-laravel-translatable-plugin`  | ترجمة محتوى (لو احتجنا English مستقبلاً)       |

> [!NOTE]
> Filament Notifications وActions مدمجين في Core — مش محتاجين plugin إضافي.

---

## ⚛️ Frontend — Next.js 19

### UI Components (نظام واحد متكامل)

| Package                    | الغرض                                             |
| -------------------------- | ------------------------------------------------- |
| `shadcn/ui`                | Component library (يثبت Radix + Tailwind تلقائي)  |
| `lucide-react`             | أيقونات (الرسمية لـ shadcn)                       |
| `tailwind-merge`           | دمج Tailwind classes بذكاء (dependency لـ shadcn) |
| `clsx`                     | Conditional classNames (dependency لـ shadcn)     |
| `class-variance-authority` | Component variants (dependency لـ shadcn)         |
| `cmdk`                     | Command palette (⌘K) — بحث سريع                   |

### State Management

| Package                            | الغرض                                  |
| ---------------------------------- | -------------------------------------- |
| `@reduxjs/toolkit` + `react-redux` | Global state (Auth, UI, Notifications) |
| `redux-persist`                    | حفظ auth token في localStorage         |

### Data Fetching

| Package                          | الغرض                               |
| -------------------------------- | ----------------------------------- |
| `@tanstack/react-query`          | Server state + caching + pagination |
| `@tanstack/react-query-devtools` | مراقبة queries (dev only)           |
| `axios`                          | HTTP client                         |

### Forms

| Package               | الغرض                      |
| --------------------- | -------------------------- |
| `react-hook-form`     | Form management            |
| `@hookform/resolvers` | ربط Zod مع react-hook-form |
| `zod`                 | Schema validation          |

### Tables & Charts

| Package                 | الغرض                                           |
| ----------------------- | ----------------------------------------------- |
| `@tanstack/react-table` | Headless table (sorting, filtering, pagination) |
| `recharts`              | Charts (dashboard, reports, gamification stats) |

### Animation & Effects

| Package           | الغرض                                                    |
| ----------------- | -------------------------------------------------------- |
| `framer-motion`   | Animations (page transitions, modals, gamification)      |
| `canvas-confetti` | Confetti effect (level up, badge, نجاح امتحان) — 3KB فقط |
| `sonner`          | Toast notifications (الرسمية مع shadcn)                  |

### Realtime

| Package                      | الغرض                                                                                            |
| ---------------------------- | ------------------------------------------------------------------------------------------------ |
| `laravel-echo` + `pusher-js` | Laravel Echo client — الاتنين مطلوبين مع بعض (Echo هو الـ API، pusher-js هو transport لـ Reverb) |

### i18n & RTL

| Package            | الغرض                                                   |
| ------------------ | ------------------------------------------------------- |
| `next-intl`        | الأفضل للـ App Router (routing + formatting + messages) |
| ✋ Arabic Numerals | `Intl.NumberFormat('ar-EG')` built-in في JavaScript     |

### SEO

| Package               | الغرض                                             |
| --------------------- | ------------------------------------------------- |
| Built-in Metadata API | titles, OG tags, descriptions (ما في حاجة لمكتبة) |
| `next-sitemap`        | توليد sitemap.xml + robots.txt تلقائي             |
| ✋ JSON-LD            | كتابة structured data يدوي (أبسط من مكتبة)        |

### PWA

| Package                | الغرض                                     |
| ---------------------- | ----------------------------------------- |
| `@ducanh2912/next-pwa` | Service worker + offline + install prompt |

### Theme

| Package       | الغرض                              |
| ------------- | ---------------------------------- |
| `next-themes` | Light/Dark mode (متوافق مع shadcn) |

### Date & Time

| Package            | الغرض                                   |
| ------------------ | --------------------------------------- |
| `date-fns`         | Date utilities (الأخف — tree-shakeable) |
| `react-day-picker` | Date picker (shadcn يستخدمه)            |

### File Upload

| Package          | الغرض              |
| ---------------- | ------------------ |
| `react-dropzone` | Drag & drop upload |

### Media & Voice

| Package                | الغرض                               |
| ---------------------- | ----------------------------------- |
| `react-player`         | تشغيل فيديو (YouTube, Vimeo, local) |
| `wavesurfer.js`        | عرض waveform للرسائل الصوتية        |
| `react-media-recorder` | تسجيل صوت (إخطارات صوتية)           |

### QR Code (حضور)

| Package        | الغرض                     |
| -------------- | ------------------------- |
| `qrcode.react` | توليد QR (المدرس)         |
| `html5-qrcode` | مسح QR بالكاميرا (الطالب) |

### Testing

| Package                       | الغرض                       |
| ----------------------------- | --------------------------- |
| `vitest`                      | Unit testing (أسرع من Jest) |
| `@testing-library/react`      | Component testing           |
| `@testing-library/user-event` | محاكاة تفاعل المستخدم       |
| `msw`                         | Mock API requests           |
| `playwright`                  | E2E testing (browser)       |

### Developer Experience

| Package                       | الغرض                         |
| ----------------------------- | ----------------------------- |
| `prettier`                    | Code formatting               |
| `prettier-plugin-tailwindcss` | ترتيب Tailwind classes تلقائي |
| `husky`                       | Git hooks (pre-commit)        |
| `lint-staged`                 | Lint staged files فقط         |

---

## 📚 Documentation

| Package     | الغرض              |
| ----------- | ------------------ |
| `vitepress` | Documentation site |

---

## 📊 الملخص النهائي

| القسم              | عدد المكتبات   | بالإيد ✋                                          |
| ------------------ | -------------- | -------------------------------------------------- |
| Backend (Laravel)  | 20             | 5 (DTOs, Slugs, Activity Log, Rate Limiting, CORS) |
| Filament           | 6              | 0                                                  |
| Frontend (Next.js) | 35             | 3 (Arabic Numerals, JSON-LD, SEO Metadata)         |
| Documentation      | 1              | 0                                                  |
| Gamification       | 0              | ✋ Custom بالكامل                                  |
| **الإجمالي**       | **62 package** | **8 بالإيد**                                       |
