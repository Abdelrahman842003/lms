# Multi-stage build للـ Production
FROM phpswoole/swoole:5.1-php8.3 AS base

# تثبيت dependencies النظام
RUN apt-get update && apt-get install -y \
    git curl libpng-dev libonig-dev libxml2-dev \
    zip unzip libzip-dev libpq-dev \
    libjpeg-dev libfreetype6-dev libwebp-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# تثبيت Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/backend

# ==================== Builder Stage ====================
FROM base AS builder

COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-scripts --no-interaction

COPY . .

# Optimize Laravel
RUN php artisan config:cache \
    && php artisan route:cache \
    && php artisan view:cache \
    && php artisan event:cache

# ==================== Production Stage ====================
FROM base AS production

# نسخ من builder
COPY --from=builder /var/www/backend /var/www/backend

# إعطاء صلاحيات
RUN chown -R www-data:www-data /var/www/backend \
    && chmod -R 755 /var/www/backend/storage \
    && chmod -R 755 /var/www/backend/bootstrap/cache

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
    CMD php artisan octane:status || exit 1

EXPOSE 8000

# Production command
CMD ["php", "artisan", "octane:start", \
     "--server=swoole", \
     "--host=0.0.0.0", \
     "--port=8000", \
     "--workers=4", \
     "--task-workers=6", \
     "--max-requests=500"]
