---
title: Local Development
description: Step-by-step development setup with hot reload and debugging
---

# Local Development Guide

Complete guide for setting up a local development environment with hot reload, debugging, and best practices.

## Prerequisites Check

```bash
# Verify Docker installation
docker --version
docker compose version

# Verify ports are available
sudo lsof -i :3307 || echo "✓ Port 3307 available"
sudo lsof -i :8000 || echo "✓ Port 8000 available"
sudo lsof -i :3000 || echo "✓ Port 3000 available"
sudo lsof -i :8080 || echo "✓ Port 8080 available"
```

## Step-by-Step Setup

### 1. Initial Setup

```bash
# Clone repository
git clone <repository-url> neetaq
cd neetaq

# Set up environment files
cp .env.development .env
cp backend/.env.example backend/.env

# Generate APP_KEY
echo "APP_KEY=base64:$(openssl rand -base64 32)" >> backend/.env
```

### 2. Start Infrastructure

```bash
# Start database and cache first
docker compose up -d mysql redis

# Wait for MySQL to be healthy
docker compose ps mysql
# Should show "healthy" status

# Check MySQL logs if needed
docker compose logs mysql -f
```

### 3. Initialize Database

```bash
# Start octane temporarily for migrations
docker compose up -d octane

# Run migrations
docker compose exec octane php artisan migrate

# Seed with demo data
docker compose exec octane php artisan db:seed --class=DemoSeeder

# Or minimal setup
docker compose exec octane php artisan db:seed --class=AdminSeeder
```

### 4. Start All Services

```bash
# Start remaining services
docker compose up -d horizon reverb scheduler frontend nginx

# Verify all services are running
docker compose ps
```

## Hot Reload Configuration

### Backend (Laravel Octane)

The development Dockerfile enables automatic reloading:

```dockerfile
# backend/Dockerfile.dev
ENV SWOOLE_HTTP_WATCH=true
ENV SWOOLE_HTTP_WORKERS=auto
```

PHP files are automatically reloaded when changed. No container restart needed.

### Frontend (Next.js)

```yaml
# docker-compose.yml
frontend:
  environment:
    - WATCHPACK_POLLING=true
  volumes:
    - ./frontend:/app
    - /app/node_modules
```

Changes to React components trigger instant browser refresh.

## Development Workflow

### Daily Start

```bash
# Quick start (if containers exist)
make up
# OR
docker compose start

# Watch logs
docker compose logs -f octane frontend
```

### Making Code Changes

#### Backend Changes

1. Edit files in `backend/app/`
2. Octane automatically reloads
3. Test via API endpoint

```bash
# Test API endpoint
curl http://localhost:8000/api/v1/health

# Or use the browser
open http://localhost:8000/api/v1/admin/login
```

#### Frontend Changes

1. Edit files in `frontend/src/`
2. Next.js HMR updates browser automatically
3. Check browser console for errors

### Database Changes

```bash
# Create migration
docker compose exec octane php artisan make:migration add_field_to_table

# Edit: backend/database/migrations/xxxx_add_field_to_table.php

# Run migration
docker compose exec octane php artisan migrate

# Rollback if needed
docker compose exec octane php artisan migrate:rollback
```

### Adding Dependencies

#### Backend (Composer)

```bash
# Install package
docker compose exec octane composer require vendor/package

# Update composer.lock
docker compose exec octane composer update

# Install from lock file
docker compose exec octane composer install
```

#### Frontend (NPM)

```bash
# Install package
docker compose exec frontend npm install package-name

# Install dev dependency
docker compose exec frontend npm install -D package-name

# Update packages
docker compose exec frontend npm update
```

## Debugging

### Laravel Telescope

::: tip Development Tool
Telescope provides insight into requests, exceptions, database queries, and more.
:::

Access at: `http://localhost:8000/telescope`

Enabled by default in development via `TELESCOPE_ENABLED=true`

### Debugging PHP with Xdebug

::: warning TODO
Xdebug configuration needs to be added to Dockerfile.dev
:::

```dockerfile
# Add to backend/Dockerfile.dev
RUN pecl install xdebug \
    && docker-php-ext-enable xdebug

# Configure xdebug
COPY docker/xdebug.ini /usr/local/etc/php/conf.d/xdebug.ini
```

### Viewing Logs

```bash
# All services
docker compose logs -f

# Filter by service
docker compose logs -f octane
docker compose logs -f horizon
docker compose logs -f frontend

# Filter by keyword
docker compose logs octane | grep ERROR
```

### Database Inspection

```bash
# Connect to MySQL
docker compose exec mysql mysql -u lms_user -p lms

# Run queries
SHOW TABLES;
DESCRIBE users;
SELECT * FROM admins LIMIT 5;

# Exit
EXIT;
```

### Redis Inspection

```bash
# Connect to Redis
docker compose exec redis redis-cli

# Common commands
KEYS *              # List all keys
GET key_name        # Get value
DEL key_name        # Delete key
FLUSHALL            # Clear all (⚠️ DANGER)

# Exit
EXIT
```

### Queue Monitoring

```bash
# Check queue status
docker compose exec octane php artisan horizon:status

# View failed jobs
docker compose exec octane php artisan queue:failed

# Retry failed job
docker compose exec octane php artisan queue:retry 1

# Retry all failed
docker compose exec octane php artisan queue:retry all
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port
sudo lsof -i :8000

# Kill process
sudo kill -9 <PID>

# Or use different port in docker-compose.yml
```

### Container Won't Start

```bash
# Check logs
docker compose logs <service-name>

# Check for errors
docker compose logs <service-name> | grep ERROR

# Restart with fresh build
docker compose up -d --build <service-name>
```

### Database Connection Failed

```bash
# Verify MySQL is running
docker compose ps mysql

# Check MySQL logs
docker compose logs mysql

# Test connection
docker compose exec mysql mysqladmin ping

# Reset database (⚠️ destroys data)
docker compose down -v
docker compose up -d mysql
```

### Permission Denied Errors

```bash
# Fix storage permissions
docker compose exec octane chown -R www-data:www-data storage/
docker compose exec octane chmod -R 775 storage/

# Fix bootstrap cache
docker compose exec octane chmod -R 775 bootstrap/cache/
```

### CORS Errors

```bash
# Clear config cache
docker compose exec octane php artisan config:clear

# Verify CORS config
docker compose exec octane cat config/cors.php
```

## Testing

### Running Backend Tests

```bash
# Run all tests
docker compose exec octane php artisan test

# Run specific test
docker compose exec octane php artisan test --filter=UserTest

# Run with coverage
docker compose exec octane php artisan test --coverage
```

### Running Frontend Tests

```bash
# Jest unit tests
docker compose exec frontend npm run test

# Jest watch mode
docker compose exec frontend npm run test:watch

# Playwright E2E tests
docker compose exec frontend npm run test:e2e
```

## Performance Optimization

### Enable OPcache (Development)

```ini
; In php.ini or opcache.ini
opcache.enable=1
opcache.memory_consumption=256
opcache.max_accelerated_files=10000
opcache.revalidate_freq=0  ; Check every request (dev only)
```

### Optimize Composer Autoloader

```bash
docker compose exec octane composer dump-autoload --optimize
```

### Frontend Build Analysis

```bash
# Analyze bundle size
docker compose exec frontend npm run analyze
```

## Best Practices

### 1. Use Make Commands

```bash
# Instead of long docker commands
make migrate      # vs docker compose exec octane php artisan migrate
make cache-clear  # vs docker compose exec octane php artisan cache:clear
```

### 2. Keep Containers Running

Don't stop containers between small changes. Use hot reload.

### 3. Regular Cleanup

```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Full cleanup (⚠️ careful)
docker system prune -a --volumes
```

### 4. Environment Consistency

```bash
# Always use docker exec instead of local commands
# ❌ Don't
cd backend && php artisan migrate

# ✅ Do
docker compose exec octane php artisan migrate
```

## IDE Configuration

### PHPStorm / IntelliJ

1. **PHP Interpreter**: Configure Docker Compose interpreter
2. **Path Mappings**: Map local `backend` to `/var/www/backend`
3. **Xdebug**: Set up remote debugging

### VS Code

Recommended extensions:
- PHP Intelephense
- Docker
- ESLint
- Prettier
- Tailwind CSS IntelliSense

## References

- [`docker-compose.yml`](/docker-compose.yml)
- [`Makefile`](/Makefile)
- [`backend/Dockerfile.dev`](/backend/Dockerfile.dev)
- [`frontend/Dockerfile.dev`](/frontend/Dockerfile.dev)

## TODO

- [ ] Add Xdebug configuration
- [ ] Document PHPStorm setup
- [ ] Add Git hooks configuration
- [ ] Document pre-commit checks
- [ ] Add debugging recipes for common issues
