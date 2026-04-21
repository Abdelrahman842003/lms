# Stage 1: Build assets (Vite/Mix)
FROM node:20-alpine AS assets-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Final image (استخدام Alpine عشان يطابق البيئة اللي عندك)
FROM php:8.3-cli-alpine

# 1. تثبيت أدوات النظام باستخدام apk (لأن النظام Alpine)
RUN apk add --no-cache \
    curl \
    wget \
    git \
    unzip \
    libpq-dev \
    libxml2-dev \
    libzip-dev \
    oniguruma-dev \
    linux-headers

# 2. Install extension installer
COPY --from=mlocati/php-extension-installer /usr/bin/install-php-extensions /usr/local/bin/

# 3. Install PHP Extensions (Swoole & Redis مهمين لـ Octane)
RUN install-php-extensions pdo_mysql mbstring exif pcntl bcmath zip intl soap gd opcache redis swoole

# 4. Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/backend

# 5. Caching Composer dependencies
COPY composer.json composer.lock ./
RUN composer install --no-interaction --no-dev --no-scripts --no-autoloader

# 6. Copy Project & Assets
COPY . .
COPY --from=assets-builder /app/public/build ./public/build

# 7. Finalize Composer & Permissions
RUN composer install --no-interaction --optimize-autoloader --no-dev
RUN chown -R www-data:www-data /var/www/backend/storage /var/www/backend/bootstrap/cache

# 8. إضافة مسار الـ Healthcheck يدوياً لو مش موجود (اختياري بس بيضمن النجاح)
RUN echo "<?php echo 'OK';" > /var/www/backend/public/health-check.php

EXPOSE 8005


# 10. تشغيل الـ Migrations مع الـ Server في أمر واحد لضمان استقرار الداتابيز
CMD php artisan config:cache && \
    php artisan route:cache && \
    php artisan octane:start --server=swoole --host=0.0.0.0 --port=8005 --workers=4 --task-workers=4 --max-requests=500