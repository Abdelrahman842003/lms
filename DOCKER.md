# 🐳 Docker Setup Guide - LMS Project

## Quick Start

### First Time Setup

```bash
make install
```

This will:

- Build all Docker containers
- Install backend dependencies (Composer)
- Install frontend dependencies (npm)
- Generate Laravel APP_KEY
- Install Laravel Octane
- Run database migrations

### Daily Development

```bash
# Start all services
make up

# Stop all services
make down

# View logs
make logs
```

---

## Available Commands

### Basic Operations

| Command              | Description          |
| -------------------- | -------------------- |
| `make up`            | Start all services   |
| `make down`          | Stop all services    |
| `make restart`       | Restart all services |
| `make build`         | Rebuild containers   |
| `make logs`          | View all logs        |
| `make logs-octane`   | View backend logs    |
| `make logs-frontend` | View frontend logs   |

### Development

| Command               | Description               |
| --------------------- | ------------------------- |
| `make shell-backend`  | Enter backend container   |
| `make shell-frontend` | Enter frontend container  |
| `make migrate`        | Run migrations            |
| `make fresh`          | Fresh database with seeds |
| `make test`           | Run tests                 |

### Octane & Horizon

| Command               | Description          |
| --------------------- | -------------------- |
| `make octane-reload`  | Reload Octane        |
| `make octane-status`  | Check Octane status  |
| `make horizon-status` | Check Horizon status |

### Production

| Command           | Description          |
| ----------------- | -------------------- |
| `make prod-build` | Build for production |
| `make prod-up`    | Start production     |
| `make prod-down`  | Stop production      |
| `make prod-logs`  | View production logs |

---

## Access URLs

### Development

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api
- **Horizon Dashboard**: http://localhost:8000/horizon
- **Telescope**: http://localhost:8000/telescope

### Production (with Nginx)

- **All traffic**: http://localhost (Port 80)
- **SSL**: https://localhost (Port 443)

---

## Services Overview

| Service  | Container Name | Port    | Description          |
| -------- | -------------- | ------- | -------------------- |
| MySQL    | lms_mysql      | 3306    | Database             |
| Redis    | lms_redis      | 6379    | Cache & Queues       |
| Octane   | lms_octane     | 8000    | Laravel Backend      |
| Horizon  | lms_horizon    | -       | Queue Worker         |
| Frontend | lms_frontend   | 3000    | Next.js App          |
| Nginx    | lms_nginx      | 80, 443 | Reverse Proxy (Prod) |

---

## Environment Files

### Development

Use `.env.development`:

- Telescope enabled
- Debug mode on
- File watching enabled
- Auto workers

### Production

Use `.env.production`:

- Telescope disabled
- Debug mode off
- Fixed worker count
- Optimized settings

---

## Common Tasks

### Run Artisan Commands

```bash
docker-compose exec octane php artisan <command>
```

### Run npm Commands

```bash
docker-compose exec frontend npm run <command>
```

### Access MySQL

```bash
make shell-mysql
# Or manually:
docker-compose exec mysql mysql -u lms_user -p
```

### Clear Laravel Caches

```bash
docker-compose exec octane php artisan cache:clear
docker-compose exec octane php artisan config:clear
docker-compose exec octane php artisan route:clear
docker-compose exec octane php artisan view:clear
```

### Rebuild Everything

```bash
make clean
make install
```

---

## Troubleshooting

### Port Already in Use

```bash
# Find what's using the port
sudo lsof -i :8000
sudo lsof -i :3000

# Kill the process or change ports in docker-compose.yml
```

### Permission Issues

```bash
docker-compose exec octane chmod -R 777 storage bootstrap/cache
```

### Octane Not Responding

```bash
make octane-reload
# Or restart the container
docker-compose restart octane
```

### Database Connection Failed

```bash
# Check if MySQL is ready
docker-compose exec mysql mysqladmin ping -h localhost

# Wait a bit longer for MySQL to start
sleep 10
make migrate
```

### Frontend Not Hot Reloading

Make sure `WATCHPACK_POLLING=true` is set in docker-compose.yml

---

## Performance Tips

### Development

- Use volume mounts for hot reload
- Enable Telescope for debugging
- Use `--watch` flag for Octane

### Production

- Use multi-stage builds
- Disable Telescope
- Set fixed worker counts
- Enable all Laravel caches
- Use Nginx for static files

---

## Health Checks

All services have health checks configured:

```bash
# Check Octane
docker-compose exec octane php artisan octane:status

# Check MySQL
docker-compose exec mysql mysqladmin ping

# Check Redis
docker-compose exec redis redis-cli ping
```

---

## Deployment

### Production Deployment

1. Update `.env.production` with real values
2. Build production containers:
   ```bash
   make prod-build
   ```
3. Start production:
   ```bash
   make prod-up
   ```
4. Run migrations:
   ```bash
   docker-compose -f docker-compose.prod.yml exec octane php artisan migrate --force
   ```

### Zero-Downtime Reload

```bash
docker-compose -f docker-compose.prod.yml exec octane php artisan octane:reload
```

---

## Notes

- **Telescope** is only enabled in development
- **Octane** uses Swoole for 3-5x performance boost
- **Horizon** manages all background jobs
- **Nginx** handles SSL and static files in production
- All containers restart automatically unless stopped

---

## Support

For issues or questions, check:

1. Container logs: `make logs`
2. Octane status: `make octane-status`
3. Health checks: See section above
