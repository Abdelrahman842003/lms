# Stage 1: Build assets
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
    && rm -rf /var/lib/apt/lists/*

# 2. Install extension installer
COPY --from=mlocati/php-extension-installer /usr/bin/install-php-extensions /usr/local/bin/

# 3. Install Extensions (تقسيم المهام لتقليل الضغط على الرام)
RUN install-php-extensions pdo_mysql mbstring exif pcntl bcmath
RUN install-php-extensions zip gd opcache
RUN install-php-extensions intl
# Swoole أتقل واحد، خليه في خطوة لوحده تماماً
RUN install-php-extensions swoole 

# 4. Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/backend
COPY . .
COPY --from=assets-builder /app/public/build ./public/build

RUN composer install --no-interaction --optimize-autoloader --no-dev
RUN chown -R www-data:www-data /var/www/backend/storage /var/www/backend/bootstrap/cache

EXPOSE 8000

CMD ["php", "artisan", "octane:start", "--server=swoole", "--host=0.0.0.0", "--port=8000", "--workers=4", "--task-workers=6", "--max-requests=500"]