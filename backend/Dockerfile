# Stage 1: Build assets
FROM node:20-alpine AS assets-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Final image
FROM php:8.3-cli

# Install PHP extensions installer
COPY --from=mlocati/php-extension-installer /usr/bin/install-php-extensions /usr/local/bin/

# Install required PHP extensions for Laravel and Octane (Swoole)
RUN install-php-extensions \
    pdo_mysql \
    mbstring \
    zip \
    exif \
    pcntl \
    gd \
    intl \
    opcache \
    swoole \
    redis \
    bcmath

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/backend

# Copy application files
COPY . .

# Copy built assets from assets-builder stage
COPY --from=assets-builder /app/public/build ./public/build

# Install PHP dependencies
RUN composer install --no-interaction --optimize-autoloader --no-dev

# Set permissions for Laravel
RUN chown -R www-data:www-data /var/www/backend/storage /var/www/backend/bootstrap/cache

# Expose port 8000 for Octane
EXPOSE 8000

# Start Laravel Octane with Swoole with production optimizations
CMD ["php", "artisan", "octane:start", "--server=swoole", "--host=0.0.0.0", "--port=8000", "--workers=4", "--task-workers=6", "--max-requests=500"]
