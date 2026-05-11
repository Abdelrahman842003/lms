# إعدادات الأتمتة في بيئة الإنتاج (Production Automation)

لضمان تشغيل جميع العمليات في الخلفية تلقائياً دون الحاجة لتشغيل الأوامر يدوياً، يجب إعداد **Supervisor** و **Cron Job**.

## 1. إعداد الـ Scheduler (Cron Job)

هذا الأمر مسؤول عن تشغيل جميع المهام المجدولة (مثل تنظيف الكاش، إغلاق المحاضرات المنتهية، إلخ) كل دقيقة.

أضف السطر التالي إلى ملف الـ crontab الخاص بالسيرفر (عن طريق أمر `crontab -e`):

```bash
* * * * * cd /var/www/backend && php artisan schedule:run >> /dev/null 2>&1
```
*(ملاحظة: استبدل `/var/www/backend` بالمسار الفعلي للمشروع على السيرفر)*

---

## 2. إعداد العمليات المستمرة (Supervisor)

يجب تثبيت Supervisor على السيرفر (`sudo apt install supervisor`). ثم قم بإنشاء ملف إعدادات جديد لكل عملية في المسار `/etc/supervisor/conf.d/`.

### أ. ملف إعدادات Laravel Horizon (لإدارة الكيوز)
`/etc/supervisor/conf.d/laravel-horizon.conf`

```ini
[program:laravel-horizon]
process_name=%(program_name)s
command=php /var/www/backend/artisan horizon
autostart=true
autorestart=true
user=www-data
redirect_stderr=true
stdout_logfile=/var/www/backend/storage/logs/horizon.log
stopwaitsecs=3600
```

### ب. ملف إعدادات Laravel Reverb (للبث المباشر WebSockets)
`/etc/supervisor/conf.d/laravel-reverb.conf`

```ini
[program:laravel-reverb]
process_name=%(program_name)s
command=php /var/www/backend/artisan reverb:start
autostart=true
autorestart=true
user=www-data
redirect_stderr=true
stdout_logfile=/var/www/backend/storage/logs/reverb.log
```

### ج. ملف إعدادات معالجة الطوابير الخاصة (Attendance & Exams)
`/etc/supervisor/conf.d/laravel-custom-queues.conf`

```ini
[program:attendance-processor]
command=php /var/www/backend/artisan attendance:process-queue --batch=50 --sleep=2
autostart=true
autorestart=true
user=www-data
stdout_logfile=/var/www/backend/storage/logs/attendance.log

[program:exams-processor]
command=php /var/www/backend/artisan exams:process-queue --batch=50 --sleep=2
autostart=true
autorestart=true
user=www-data
stdout_logfile=/var/www/backend/storage/logs/exams.log
```

### د. ملف إعدادات Laravel Octane (اختياري - إذا كنت تستخدمه في الإنتاج)
`/etc/supervisor/conf.d/laravel-octane.conf`

```ini
[program:laravel-octane]
process_name=%(program_name)s
command=php /var/www/backend/artisan octane:start --server=swoole --host=0.0.0.0 --port=8000 --workers=4 --task-workers=6
autostart=true
autorestart=true
user=www-data
redirect_stderr=true
stdout_logfile=/var/www/backend/storage/logs/octane.log
stopwaitsecs=3600
```

---

## 3. تفعيل الإعدادات

بعد إنشاء الملفات، قم بتشغيل الأوامر التالية:

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start all
```

الآن، كلما تعطلت أي عملية من هذه العمليات، سيقوم Supervisor بإعادة تشغيلها تلقائياً، وسيقوم Cron Job بتشغيل المهام الدورية كل دقيقة.
