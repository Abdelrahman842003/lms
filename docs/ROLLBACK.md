# Rollback Documentation

This document describes how to rollback deployments for the LMS platform.

## Docker Deployment Rollback

### Quick Rollback (Using Previous Image)

```bash
# 1. Stop current containers
docker compose -f docker-compose.prod.yml down

# 2. Pull previous image version (when using versioned tags)
docker compose -f docker-compose.prod.yml pull

# 3. Start with previous version
docker compose -f docker-compose.prod.yml up -d

# 4. Verify health
docker compose -f docker-compose.prod.yml ps
```

### Full Rollback Steps

#### 1. Backend (Laravel)

```bash
# Rollback last migration batch
docker exec lms_octane php artisan migrate:rollback --step=1

# Clear all caches
docker exec lms_octane php artisan cache:clear
docker exec lms_octane php artisan config:clear
docker exec lms_octane php artisan route:clear
docker exec lms_octane php artisan view:clear

# Restart Octane to reload code
docker exec lms_octane php artisan octane:reload
```

#### 2. Frontend (Next.js)

```bash
# Rebuild with previous code
cd frontend
git checkout <previous-commit-hash>
docker compose -f docker-compose.prod.yml build frontend
docker compose -f docker-compose.prod.yml up -d frontend
```

#### 3. Database Rollback

```bash
# Rollback specific number of migration batches
docker exec lms_octane php artisan migrate:rollback --step=<N>

# Or rollback to a specific migration
docker exec lms_octane php artisan migrate:rollback --path=database/migrations/<migration_file>.php

# Verify migration status
docker exec lms_octane php artisan migrate:status
```

#### 4. Redis/Cache Rollback

```bash
# Flush all cache
docker exec lms_redis redis-cli FLUSHALL

# Or flush specific database
docker exec lms_redis redis-cli -n 0 FLUSHDB  # Cache
docker exec lms_redis redis-cli -n 1 FLUSHDB  # Sessions
```

## Git-Based Rollback

```bash
# Find the commit to rollback to
git log --oneline -10

# Create a revert commit (safer than reset)
git revert <commit-hash>

# Or reset to a previous state (destructive)
git reset --hard <commit-hash>

# Rebuild and deploy
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

## Health Checks After Rollback

```bash
# Check all services are healthy
docker compose -f docker-compose.prod.yml ps

# Test backend health endpoint
curl -f http://localhost:8000/health

# Test frontend
curl -f http://localhost:3000/

# Check backend logs for errors
docker logs lms_octane --tail=50

# Check frontend logs
docker logs lms_frontend --tail=50

# Verify database connectivity
docker exec lms_octane php artisan tinker --execute="DB::connection()->getPdo(); echo 'DB OK';"
```

## Emergency Contacts

- **Backend Issues**: Check `storage/logs/laravel.log`
- **Frontend Issues**: Check container logs with `docker logs lms_frontend`
- **Database Issues**: Check MySQL logs with `docker logs lms_mysql`
