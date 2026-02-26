---
title: Quick Start
description: Docker-first setup guide for Neetaq Educational Platform development
---

# Quick Start Guide

Get the Neetaq Educational Platform running locally in minutes using Docker.

## Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Docker Engine | 24.0+ | Required for containerization |
| Docker Compose | 2.20+ | For multi-container orchestration |
| Git | 2.30+ | For repository cloning |
| Node.js | 20+ | Optional: for local frontend dev |
| PHP | 8.3+ | Optional: for local backend dev |

::: tip System Resources
Minimum recommended specs:
- **RAM**: 4GB (8GB+ recommended)
- **CPU**: 2 cores
- **Disk**: 20GB free space
:::

## 1. Clone the Repository

```bash
git clone <repository-url> neetaq
cd neetaq
```

## 2. Environment Setup

### Copy Environment Files

```bash
# Backend environment
cp backend/.env.example backend/.env

# Development environment (root)
cp .env.development .env
```

### Generate Application Key

```bash
# Add to your .env file or generate:
docker run --rm -v $(pwd)/backend:/app -w /app php:8.3-cli \
  php -r "echo 'APP_KEY=' . base64_encode(random_bytes(32)) . PHP_EOL;"
```

### Configure Firebase (Optional)

For push notifications, place your Firebase credentials:

```bash
# Download from Firebase Console → Project Settings → Service Accounts
# Place at:
secrets/neetaq-54091-firebase-adminsdk-fbsvc-b830b7b75f.json
```

## 3. Start Development Environment

### Using Make (Recommended)

```bash
# Start all services
make up

# Or with explicit command
docker compose -f docker-compose.yml up -d
```

### Manual Docker Compose

```bash
# Build and start all containers
docker compose up -d --build

# Watch logs
docker compose logs -f

# Check status
docker compose ps
```

## 4. Initialize Database

```bash
# Run migrations and seeders
docker compose exec octane php artisan migrate:fresh --seed

# Or seed specific data
docker compose exec octane php artisan db:seed --class=AdminSeeder
docker compose exec octane php artisan db:seed --class=DemoSeeder
```

### Available Seeders

| Seeder | Purpose |
|--------|---------|
| `AdminSeeder` | Creates super admin user |
| `RolesAndPermissionsSeeder` | Sets up RBAC |
| `DemoSeeder` | Sample data for testing |
| `AcademySeeder` | Creates academy records |
| `OnlyAdminSeeder` | Minimal admin-only setup |

## 5. Access the Application

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Next.js development server |
| Backend API | http://localhost:8000 | Laravel Octane API |
| WebSocket | ws://localhost:8080 | Laravel Reverb |
| Nginx | http://localhost | Reverse proxy (prod-like) |

### Default Credentials

::: warning Development Only
These credentials are for local development only. Change immediately in production!
:::

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@neetaq.com | password |
| Demo Teacher | teacher@neetaq.com | password |
| Demo Student | student@neetaq.com | password |

## 6. Development Workflow

### Hot Reload

Both frontend and backend support hot reload:

- **Frontend**: Changes auto-refresh at `localhost:3000`
- **Backend**: Octane watches for PHP changes and auto-reloads

### Running Artisan Commands

```bash
# Inside the octane container
docker compose exec octane php artisan <command>

# Examples
docker compose exec octane php artisan cache:clear
docker compose exec octane php artisan config:clear
docker compose exec octane php artisan route:list
docker compose exec octane php artisan tinker
```

### Running Composer/NPM

```bash
# Composer (backend)
docker compose exec octane composer install
docker compose exec octane composer require <package>

# NPM (frontend)
docker compose exec frontend npm install
docker compose exec frontend npm run build
```

## 7. Service Management

### Individual Service Control

```bash
# Restart specific service
docker compose restart octane
docker compose restart frontend
docker compose restart mysql

# View service logs
docker compose logs -f octane
docker compose logs -f frontend

# Scale workers
docker compose up -d --scale horizon=3
```

### Database Access

```bash
# MySQL CLI
docker compose exec mysql mysql -u lms_user -p lms

# Redis CLI
docker compose exec redis redis-cli

# Export database
docker compose exec mysql mysqldump -u lms_user -p lms > backup.sql
```

## Troubleshooting

### Container Won't Start

```bash
# Check for port conflicts
sudo lsof -i :3307  # MySQL
sudo lsof -i :8000  # Octane
sudo lsof -i :3000  # Frontend
sudo lsof -i :8080  # Reverb

# Reset everything
docker compose down -v
docker compose up -d --build
```

### Database Connection Issues

```bash
# Verify MySQL is healthy
docker compose ps mysql

# Check logs
docker compose logs mysql

# Force recreate
docker compose up -d --force-recreate mysql
```

### Permission Errors

```bash
# Fix storage permissions (Linux/Mac)
docker compose exec octane chown -R www-data:www-data storage/
docker compose exec octane chmod -R 775 storage/
```

### CORS Issues

If experiencing CORS errors:

1. Verify `APP_URL` in `.env` matches your access URL
2. Check `config/cors.php` allowed origins
3. Clear config cache: `docker compose exec octane php artisan config:clear`

## Next Steps

- [Environment Variables Reference](/getting-started/env-vars)
- [Available Scripts](/getting-started/scripts)
- [Docker Development Guide](/docker/local-dev)
- [Backend Architecture](/backend/architecture)

## References

- [`docker-compose.yml`](/docker-compose.yml)
- [`Makefile`](/Makefile)
- [`backend/.env.example`](/backend/.env.example)
- [`.env.development`](/.env.development)

## TODO

- [ ] Add Windows-specific instructions
- [ ] Document WSL2 setup for Windows
- [ ] Add IDE debugging configuration (Xdebug)
- [ ] Document SSL certificate setup for local HTTPS
