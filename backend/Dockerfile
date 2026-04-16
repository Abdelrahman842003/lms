# ==================== Base Stage ====================
FROM phpswoole/swoole:5.1-php8.3 AS base

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git curl libpng-dev libonig-dev libxml2-dev \
    zip unzip libzip-dev libpq-dev \
    libjpeg-dev libfreetype6-dev libwebp-dev \
    ffmpeg \
    && docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip \
    && pecl install redis && docker-php-ext-enable redis \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/backend

# ==================== Development Stage ====================
FROM base AS development
COPY composer.json composer.lock ./
RUN composer install --no-interaction --no-scripts
EXPOSE 8000
CMD ["php", "artisan", "octane:start", "--server=swoole", "--host=0.0.0.0", "--port=8000", "--watch"]

# ==================== Builder Stage ====================
FROM base AS builder
COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-scripts --no-interaction
COPY . .

# ==================== Production Stage ====================
FROM base AS production
COPY --from=builder /var/www/backend /var/www/backend

# Permissions setup
RUN chown -R www-data:www-data /var/www/backend \
    && chmod -R 755 /var/www/backend/storage \
    && chmod -R 755 /var/www/backend/bootstrap/cache

# Only cache routes and views at build time. 
# Config MUST be cached at runtime or not at all to read Coolify env vars.
RUN php artisan route:cache && php artisan view:cache

USER www-data
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
    CMD php artisan octane:status || exit 1

EXPOSE 8000
CMD ["php", "artisan", "octane:start", "--server=swoole", "--host=0.0.0.0", "--port=8000", "--workers=4", "--task-workers=6", "--max-requests=500"]
