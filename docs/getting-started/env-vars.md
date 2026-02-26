---
title: Environment Variables
description: Complete reference for all environment variables in Neetaq platform
---

# Environment Variables Reference

Complete table of all environment variables used across the Neetaq platform.

## Application Configuration

| Variable | Default | Description | Required |
|----------|---------|-------------|----------|
| `APP_NAME` | "LMS" | Application name displayed in notifications | No |
| `APP_ENV` | local | Environment: `local`, `staging`, `production` | Yes |
| `APP_DEBUG` | true | Enable debug mode (disable in prod) | Yes |
| `APP_KEY` | - | Application encryption key (32 chars) | **Yes** |
| `APP_URL` | http://localhost:8000 | Base URL for the application | Yes |

::: danger Production Security
Never set `APP_DEBUG=true` in production. Always use a strong, randomly generated `APP_KEY`.
:::

## Database Configuration

| Variable | Default | Description | Required |
|----------|---------|-------------|----------|
| `DB_CONNECTION` | mysql | Database driver | Yes |
| `DB_HOST` | mysql | Database host (use service name in Docker) | Yes |
| `DB_PORT` | 3306 | Database port | Yes |
| `DB_DATABASE` | lms | Database name | Yes |
| `DB_USERNAME` | lms_user | Database username | Yes |
| `DB_PASSWORD` | secret | Database password | **Yes** |
| `DB_ROOT_PASSWORD` | - | MySQL root password (production) | Prod Only |

### Docker-Specific Notes

```bash
# Development (docker-compose.yml)
DB_HOST=mysql        # Service name, not localhost
DB_PORT=3306         # Internal Docker port

# External Access
MYSQL_PORT=3307      # Mapped to host port 3307
```

## Redis Configuration

| Variable | Default | Description | Required |
|----------|---------|-------------|----------|
| `REDIS_HOST` | redis | Redis host (service name in Docker) | Yes |
| `REDIS_PORT` | 6379 | Redis port | Yes |
| `REDIS_PASSWORD` | null | Redis password (required in prod) | Prod Only |
| `REDIS_DB` | 0 | Default database | No |

### Cache & Session Drivers

| Variable | Default | Description |
|----------|---------|-------------|
| `CACHE_DRIVER` | redis | Cache storage driver |
| `CACHE_STORE` | redis | Cache store (Laravel 11+) |
| `QUEUE_CONNECTION` | redis | Queue driver |
| `SESSION_DRIVER` | redis | Session storage driver |
| `SESSION_LIFETIME` | 120 | Session lifetime in minutes |

## Laravel Octane Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `OCTANE_SERVER` | swoole | Octane server: `swoole`, `frankenphp` |
| `SWOOLE_HTTP_HOST` | 0.0.0.0 | Swoole bind address |
| `SWOOLE_HTTP_PORT` | 8000 | Swoole HTTP port |
| `SWOOLE_HTTP_WORKERS` | auto | Number of worker processes |
| `SWOOLE_HTTP_TASK_WORKERS` | auto | Number of task workers |
| `SWOOLE_HTTP_WATCH` | true | Auto-reload on file changes (dev) |
| `SWOOLE_HTTP_MAX_REQUEST` | 500 | Max requests per worker |

### Development vs Production

```bash
# Development
SWOOLE_HTTP_WORKERS=auto
SWOOLE_HTTP_WATCH=true
SWOOLE_HTTP_MAX_REQUEST=500

# Production
SWOOLE_HTTP_WORKERS=4
SWOOLE_HTTP_TASK_WORKERS=6
SWOOLE_HTTP_WATCH=false
SWOOLE_HTTP_MAX_REQUEST=500
```

## Laravel Reverb (WebSocket)

| Variable | Default | Description |
|----------|---------|-------------|
| `BROADCAST_CONNECTION` | reverb | Broadcasting driver |
| `REVERB_APP_ID` | 1000001 | Reverb application ID |
| `REVERB_APP_KEY` | y2vqna5uho5zsdz6kdyz | Public app key |
| `REVERB_APP_SECRET` | secret | Secret for signing |
| `REVERB_HOST` | reverb | Reverb service host |
| `REVERB_PORT` | 8080 | WebSocket port |
| `REVERB_SCHEME` | http | Connection scheme: `http`, `https` |

### Public Reverb Configuration (Frontend)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_REVERB_APP_KEY` | Public key for browser connection |
| `NEXT_PUBLIC_REVERB_HOST` | Host for browser connection |
| `NEXT_PUBLIC_REVERB_PORT` | Port for browser connection |
| `NEXT_PUBLIC_REVERB_SCHEME` | Scheme for browser connection |

## Firebase Configuration

### Backend

| Variable | Description | Required |
|----------|-------------|----------|
| `FIREBASE_PROJECT_ID` | Firebase project ID | For FCM |
| `FIREBASE_DATABASE_URL` | Realtime database URL | Optional |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to service account JSON | **For FCM** |

### Frontend (Public)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | App ID |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | Web Push VAPID key |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Analytics measurement ID |

## Cloudflare R2 (Media Storage)

| Variable | Description |
|----------|-------------|
| `CLOUDFLARE_R2_ACCESS_KEY_ID` | R2 access key |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | R2 secret key |
| `CLOUDFLARE_R2_BUCKET` | Bucket name |
| `CLOUDFLARE_R2_ENDPOINT` | R2 endpoint URL |
| `CLOUDFLARE_R2_PUBLIC_URL` | Public CDN URL |

### Using Docker Secrets (Production)

In production, these are mounted as Docker secrets:

```yaml
# docker-compose.prod.yml
secrets:
  cloudflare_r2_access_key_id:
    file: ./secrets/cloudflare_r2_access_key_id.txt
```

## Cloudflare KV (Optional)

| Variable | Description |
|----------|-------------|
| `CLOUDFLARE_KV_ACCOUNT_ID` | Cloudflare account ID |
| `CLOUDFLARE_KV_NAMESPACE_ID` | KV namespace ID |
| `CLOUDFLARE_KV_API_TOKEN` | API token with KV access |

## Frontend Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | http://localhost:8000 | Backend API URL |
| `INTERNAL_API_URL` | http://octane:8000/api | Internal Docker API URL |
| `NODE_ENV` | development | Node environment |

## Telescope (Development Only)

| Variable | Default | Description |
|----------|---------|-------------|
| `TELESCOPE_ENABLED` | true | Enable Telescope debugging |

::: warning Production
Always set `TELESCOPE_ENABLED=false` in production to prevent data leakage.
:::

## Security & Session

| Variable | Default | Description |
|----------|---------|-------------|
| `SANCTUM_STATEFUL_DOMAINS` | localhost | Allowed domains for Sanctum |
| `SESSION_SECURE_COOKIE` | false | Secure cookie flag (enable in prod) |
| `SESSION_SAME_SITE` | lax | Same-site cookie policy |

## Mail Configuration (Optional)

| Variable | Description |
|----------|-------------|
| `MAIL_MAILER` | Mail driver: `smtp`, `log` |
| `MAIL_HOST` | SMTP host |
| `MAIL_PORT` | SMTP port |
| `MAIL_USERNAME` | SMTP username |
| `MAIL_PASSWORD` | SMTP password |
| `MAIL_ENCRYPTION` | TLS/SSL |
| `MAIL_FROM_ADDRESS` | From email address |
| `MAIL_FROM_NAME` | From name |

## Complete Environment File Templates

### Development (.env.development)

```bash
# Application
APP_NAME="LMS"
APP_ENV=local
APP_DEBUG=true
APP_KEY=
APP_URL=http://localhost:8000

# Database
DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=lms
DB_USERNAME=lms_user
DB_PASSWORD=secret

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=null

# Cache & Queue
CACHE_DRIVER=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis
SESSION_LIFETIME=120

# Broadcasting
BROADCAST_CONNECTION=reverb
REVERB_APP_ID=1000001
REVERB_APP_KEY=y2vqna5uho5zsdz6kdyz
REVERB_APP_SECRET=secret
REVERB_HOST=reverb
REVERB_PORT=8080
REVERB_SCHEME=http

# Octane
OCTANE_SERVER=swoole
SWOOLE_HTTP_HOST=0.0.0.0
SWOOLE_HTTP_PORT=8000
SWOOLE_HTTP_WORKERS=auto
SWOOLE_HTTP_TASK_WORKERS=auto
SWOOLE_HTTP_WATCH=true

# Telescope
TELESCOPE_ENABLED=true

# Firebase
GOOGLE_APPLICATION_CREDENTIALS=/var/www/backend/storage/firebase-credentials.json
FIREBASE_PROJECT_ID=neetaq-54091

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Production

::: tip Security Best Practices
- Use Docker secrets for sensitive values
- Generate strong random keys
- Enable HTTPS-only cookies
- Set appropriate worker counts based on CPU cores
:::

```bash
# Application
APP_ENV=production
APP_DEBUG=false
APP_KEY=<strong-random-key>
APP_URL=https://neetaq.com

# Database
DB_HOST=mysql
DB_DATABASE=lms
DB_USERNAME=lms_user
DB_PASSWORD=<strong-password>
DB_ROOT_PASSWORD=<strong-root-password>

# Redis
REDIS_PASSWORD=<strong-password>

# Octane
SWOOLE_HTTP_WORKERS=4
SWOOLE_HTTP_TASK_WORKERS=6
SWOOLE_HTTP_WATCH=false

# Security
TELESCOPE_ENABLED=false
SESSION_SECURE_COOKIE=true
```

## References

- [`.env.development`](/.env.development)
- [`.env.production`](/.env.production)
- [`backend/config/app.php`](/backend/config/app.php)
- [`backend/config/database.php`](/backend/config/database.php)
- [`backend/config/broadcasting.php`](/backend/config/broadcasting.php)

## TODO

- [ ] Add AWS S3 configuration variables
- [ ] Document OneSignal-specific variables
- [ ] Add rate limiting configuration
- [ ] Document logging configuration options
