# ==================== Base Stage ====================
FROM phpswoole/swoole:5.1-php8.3 AS base

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    libzip-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libwebp-dev \
    libicu-dev \
    ffmpeg \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions using the official installer script for reliability.
COPY --from=mlocati/php-extension-installer /usr/bin/install-php-extensions /usr/local/bin/
RUN install-php-extensions pdo_mysql mbstring exif pcntl bcmath gd zip redis intl opcache soap

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
ENV COMPOSER_MEMORY_LIMIT=-1
COPY composer.json composer.lock ./
# Using --ignore-platform-reqs to ensure build continues if there's a minor version mismatch
RUN composer install --no-dev --optimize-autoloader --no-scripts --no-interaction --ignore-platform-reqs
COPY . .

# ==================== Production Stage ====================
FROM base AS production
COPY --from=builder /var/www/backend /var/www/backend

# Set working directory
WORKDIR /var/www/backend

# Permissions setup (Done as root before switching user)
RUN chown -R www-data:www-data /var/www/backend \
    && chmod -R 775 /var/www/backend/storage \
    && chmod -R 775 /var/www/backend/bootstrap/cache

# Build-time environment variables
ARG APP_KEY
ENV APP_KEY=$APP_KEY

# Cache routes and views (BUT NOT CONFIG - to allow Coolify env vars at runtime)
RUN php artisan route:cache && php artisan view:cache

# Switch to non-root user for security
USER www-data

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
    CMD php artisan octane:status || exit 1

EXPOSE 8000
CMD ["php", "artisan", "octane:start", "--server=swoole", "--host=0.0.0.0", "--port=8000", "--workers=auto", "--max-requests=500"]
