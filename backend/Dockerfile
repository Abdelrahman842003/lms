# Stage 1: Build assets (Vite/Mix)
FROM node:20-alpine AS assets-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Final image
FROM php:8.3-cli

# 1. Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    unzip \
    libpq-dev \
    libxml2-dev \
    && rm -rf /var/lib/apt/lists/*

# 2. Install extension installer
COPY --from=mlocati/php-extension-installer /usr/bin/install-php-extensions /usr/local/bin/

# 3. Install PHP Extensions (تقسيم المهام لتقليل الضغط على الرامات وضمان نجاح الـ Build)
RUN install-php-extensions pdo_mysql mbstring exif pcntl bcmath zip intl soap
RUN install-php-extensions gd opcache
RUN install-php-extensions redis swoole

# 4. Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/backend

# 5. تحسين الكاش لسرعة الـ Build (تحميل المكتبات أولاً)
COPY composer.json composer.lock ./
RUN composer install --no-interaction --no-dev --no-scripts --no-autoloader

# 6. نسخ باقي المشروع وAssets المبنية
COPY . .
COPY --from=assets-builder /app/public/build ./public/build

# 7. إنهاء تنصيب الكومبوزر وتظبط الصلاحيات
RUN composer install --no-interaction --optimize-autoloader --no-dev
RUN chown -R www-data:www-data /var/www/backend/storage /var/www/backend/bootstrap/cache

# 8. تنفيذ الـ Caching لزيادة الأداء في الـ Production
RUN php artisan config:cache && php artisan route:cache

EXPOSE 8005

# 9. إضافة الـ Healthcheck لضمان استقرار الـ Deployment على بورت 8005
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -f http://localhost:8005/health || exit 1

# 10. تشغيل Laravel Octane مع Swoole
CMD ["php", "artisan", "octane:start", "--server=swoole", "--host=0.0.0.0", "--port=8005", "--workers=4", "--task-workers=4", "--max-requests=500"]