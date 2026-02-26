---
title: Available Scripts
description: Commands from package.json, Makefile, and Docker Compose
---

# Available Scripts

Complete reference of all available commands for development, building, and deployment.

## Root Level Commands

### Make Commands

The project includes a `Makefile` for common operations:

| Command | Description |
|---------|-------------|
| `make up` | Start all Docker containers |
| `make down` | Stop all Docker containers |
| `make build` | Build/rebuild all containers |
| `make restart` | Restart all services |
| `make logs` | Follow logs from all services |
| `make ps` | List running containers |
| `make shell` | Open shell in octane container |
| `make tinker` | Run Laravel Tinker |
| `make migrate` | Run database migrations |
| `make seed` | Run database seeders |
| `make fresh` | Fresh migrate with seeding |
| `make cache-clear` | Clear all Laravel caches |
| `make test` | Run PHPUnit tests |
| `make npm-install` | Install frontend dependencies |
| `make npm-build` | Build frontend for production |
| `make npm-dev` | Start frontend dev server |

### NPM Scripts (Root)

Defined in [`package.json`](/package.json):

```bash
# Start both frontend and backend dev servers
npm run dev

# Build both workspaces
npm run build
```

## Docker Compose Commands

### Development Environment

```bash
# Start all services
docker compose up -d

# Start with build
docker compose up -d --build

# Start specific service
docker compose up -d octane
docker compose up -d frontend

# Stop all services
docker compose down

# Stop and remove volumes (reset data)
docker compose down -v

# View logs
docker compose logs -f
docker compose logs -f octane
docker compose logs -f frontend

# Scale services
docker compose up -d --scale horizon=3

# Execute command in container
docker compose exec octane php artisan migrate
docker compose exec frontend npm install
```

### Production Environment

```bash
# Deploy production stack
docker compose -f docker-compose.prod.yml up -d

# Production with build
docker compose -f docker-compose.prod.yml up -d --build

# View production logs
docker compose -f docker-compose.prod.yml logs -f

# Update production (zero-downtime)
docker compose -f docker-compose.prod.yml up -d --no-deps --build octane
```

## Backend Commands (Artisan)

### Database Operations

```bash
# Run migrations
docker compose exec octane php artisan migrate

# Fresh start (drop all tables and migrate)
docker compose exec octane php artisan migrate:fresh

# Fresh with seeding
docker compose exec octane php artisan migrate:fresh --seed

# Rollback last batch
docker compose exec octane php artisan migrate:rollback

# Reset all migrations
docker compose exec octane php artisan migrate:reset

# Check migration status
docker compose exec octane php artisan migrate:status

# Create migration
docker compose exec octane php artisan make:migration create_users_table
```

### Seeding

```bash
# Run all seeders
docker compose exec octane php artisan db:seed

# Run specific seeder
docker compose exec octane php artisan db:seed --class=AdminSeeder
docker compose exec octane php artisan db:seed --class=RolesAndPermissionsSeeder
docker compose exec octane php artisan db:seed --class=DemoSeeder

# Fresh with specific seeder
docker compose exec octane php artisan migrate:fresh --seed --seeder=OnlyAdminSeeder
```

### Cache Management

```bash
# Clear application cache
docker compose exec octane php artisan cache:clear

# Clear config cache
docker compose exec octane php artisan config:clear

# Clear route cache
docker compose exec octane php artisan route:clear

# Clear view cache
docker compose exec octane php artisan view:clear

# Clear all caches
docker compose exec octane php artisan optimize:clear

# Cache for production
docker compose exec octane php artisan config:cache
docker compose exec octane php artisan route:cache
docker compose exec octane php artisan view:cache
docker compose exec octane php artisan optimize
```

### Octane Commands

```bash
# Start Octane server (if not using docker)
docker compose exec octane php artisan octane:start

# Stop Octane server
docker compose exec octane php artisan octane:stop

# Reload workers
docker compose exec octane php artisan octane:reload

# Check status
docker compose exec octane php artisan octane:status

# Benchmark
docker compose exec octane php artisan octane:benchmark
```

### Horizon (Queue)

```bash
# Horizon is auto-started in container
# Check status
docker compose exec octane php artisan horizon:status

# Pause processing
docker compose exec octane php artisan horizon:pause

# Continue processing
docker compose exec octane php artisan horizon:continue

# Terminate gracefully
docker compose exec octane php artisan horizon:terminate

# View dashboard (if exposed)
# http://localhost:8000/horizon
```

### Reverb (WebSocket)

```bash
# Reverb is auto-started in container
# Start manually
docker compose exec octane php artisan reverb:start

# Start with specific host/port
docker compose exec octane php artisan reverb:start --host=0.0.0.0 --port=8080
```

### Maintenance Mode

```bash
# Enable maintenance mode
docker compose exec octane php artisan down

# With custom message
docker compose exec octane php artisan down --message="Upgrading database" --retry=60

# Allow specific IPs
docker compose exec octane php artisan down --allow=127.0.0.1 --allow=192.168.1.1

# Disable maintenance mode
docker compose exec octane php artisan up
```

### Testing

```bash
# Run all tests
docker compose exec octane php artisan test

# Run with coverage
docker compose exec octane php artisan test --coverage

# Run specific test
docker compose exec octane php artisan test --filter=UserTest

# Run Pest tests
docker compose exec octane ./vendor/bin/pest
```

### Code Generation

```bash
# Create controller
docker compose exec octane php artisan make:controller Api/UserController

# Create model
docker compose exec octane php artisan make:model User

# Create model with migration and factory
docker compose exec octane php artisan make:model User -mf

# Create middleware
docker compose exec octane php artisan make:middleware CheckAge

# Create request
docker compose exec octane php artisan make:request StoreUserRequest

# Create resource
docker compose exec octane php artisan make:resource UserResource

# Create job
docker compose exec octane php artisan make:job ProcessPodcast

# Create notification
docker compose exec octane php artisan make:notification InvoicePaid

# Create event
docker compose exec octane php artisan make:event PodcastProcessed

# Create listener
docker compose exec octane php artisan make:listener SendPodcastNotification
```

## Frontend Commands (NPM)

### Development

```bash
# Install dependencies
docker compose exec frontend npm install

# Start development server
docker compose exec frontend npm run dev

# With hot reload (already enabled)
docker compose exec frontend npm run dev
```

### Building

```bash
# Build for production
docker compose exec frontend npm run build

# Analyze bundle
docker compose exec frontend npm run analyze
```

### Testing

```bash
# Run Jest tests
docker compose exec frontend npm run test

# Run Jest in watch mode
docker compose exec frontend npm run test:watch

# Run Playwright E2E tests
docker compose exec frontend npm run test:e2e

# Run linting
docker compose exec frontend npm run lint

# Fix linting issues
docker compose exec frontend npm run lint:fix
```

### Type Checking

```bash
# TypeScript check
docker compose exec frontend npm run type-check
```

## Database Direct Access

### MySQL

```bash
# Connect to MySQL
docker compose exec mysql mysql -u lms_user -p lms

# Run SQL file
docker compose exec -T mysql mysql -u lms_user -p lms < script.sql

# Export database
docker compose exec mysql mysqldump -u lms_user -p lms > backup.sql

# Import database
docker compose exec -T mysql mysql -u lms_user -p lms < backup.sql
```

### Redis

```bash
# Connect to Redis
docker compose exec redis redis-cli

# Check keys
docker compose exec redis redis-cli KEYS '*'

# Flush all data (⚠️ DANGER)
docker compose exec redis redis-cli FLUSHALL
```

## Utility Scripts

### Deploy Script

```bash
# Run deployment script
./deploy.sh
```

### Setup R2 Storage

```bash
# Setup Cloudflare R2
cd backend && bash ../setup_r2.sh
```

## Quick Reference Card

### Daily Development

```bash
# Start day
make up

# Watch logs
make logs

# Run migrations after pull
make migrate

# Clear caches
make cache-clear

# End day
make down
```

### Debugging

```bash
# Check container status
docker compose ps

# View service logs
docker compose logs -f [service]

# Shell into container
docker compose exec [service] sh

# Check resource usage
docker stats
```

### Reset Everything

```bash
# ⚠️ WARNING: This will delete all data
docker compose down -v
docker compose up -d --build
make fresh
```

## References

- [`Makefile`](/Makefile)
- [`package.json`](/package.json)
- [`backend/package.json`](/backend/package.json)
- [`frontend/package.json`](/frontend/package.json)
- [`docker-compose.yml`](/docker-compose.yml)

## TODO

- [ ] Document CI/CD pipeline commands
- [ ] Add backup/restore scripts
- [ ] Document SSL certificate renewal
- [ ] Add monitoring/health check commands
