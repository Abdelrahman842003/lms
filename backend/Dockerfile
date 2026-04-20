# backend/Dockerfile
FROM phpswoole/swoole:5.1-php8.3 AS production

# Set working directory
WORKDIR /var/www/backend

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
    supervisor \
    mariadb-client \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions using mlocati/php-extension-installer
COPY --from=mlocati/php-extension-installer /usr/bin/install-php-extensions /usr/local/bin/
RUN install-php-extensions pdo_mysql mbstring exif pcntl bcmath gd zip redis intl opcache soap

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copy application files
COPY . .

# Copy Supervisor configuration
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Install production dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction --ignore-platform-reqs

# Set permissions
RUN chown -R www-data:www-data /var/www/backend \
    && chmod -R 775 /var/www/backend/storage \
    && chmod -R 775 /var/www/backend/bootstrap/cache

# Create log files for supervisor
RUN mkdir -p /var/log/supervisor && touch /var/log/supervisor/supervisord.log && chown www-data:www-data /var/log/supervisor/supervisord.log

# Expose ports (8000 for Octane, 8080 for Reverb)
EXPOSE 8000 8080

# Default command: Start Supervisor (runs Octane + Horizon)
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
