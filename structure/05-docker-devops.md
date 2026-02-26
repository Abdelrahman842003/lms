# NeetaQ — Docker & DevOps

## Project Root Structure

```
neetaq/
├── backend/                  # Laravel 12
│   ├── Dockerfile
│   └── ...
├── frontend/                 # Next.js 19
│   ├── Dockerfile
│   └── ...
├── docker/
│   ├── nginx/
│   │   └── default.conf
│   ├── mysql/
│   │   └── my.cnf
│   └── redis/
│       └── redis.conf
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.docker
└── Makefile
```

---

## docker-compose.yml

```yaml
version: "3.8"

services:
  # ───── Backend (Laravel + Octane/Swoole) ─────
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: neetaq-backend
    restart: unless-stopped
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/var/www/html
      - backend-storage:/var/www/html/storage
    environment:
      - APP_ENV=local
      - DB_HOST=mysql
      - REDIS_HOST=redis
      - REVERB_HOST=reverb
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/health"]
      interval: 30s
      timeout: 5s
      retries: 3
    networks:
      - neetaq-network

  # ───── Queue Worker (Horizon) ─────
  horizon:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: neetaq-horizon
    restart: unless-stopped
    command: php artisan horizon
    volumes:
      - ./backend:/var/www/html
    depends_on:
      - mysql
      - redis
    networks:
      - neetaq-network

  # ───── Scheduler ─────
  scheduler:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: neetaq-scheduler
    restart: unless-stopped
    command: >
      sh -c "while true; do php artisan schedule:run --verbose --no-interaction; sleep 60; done"
    volumes:
      - ./backend:/var/www/html
    depends_on:
      - mysql
      - redis
    networks:
      - neetaq-network

  # ───── Reverb (WebSockets) ─────
  reverb:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: neetaq-reverb
    restart: unless-stopped
    command: php artisan reverb:start --host=0.0.0.0 --port=8080
    ports:
      - "8080:8080"
    volumes:
      - ./backend:/var/www/html
    depends_on:
      - redis
    networks:
      - neetaq-network

  # ───── Frontend (Next.js 19) ─────
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: neetaq-frontend
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules
      - /app/.next
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8000
      - NEXT_PUBLIC_REVERB_HOST=localhost
      - NEXT_PUBLIC_REVERB_PORT=8080
    depends_on:
      - backend
    networks:
      - neetaq-network

  # ───── MySQL ─────
  mysql:
    image: mysql:8.0
    container_name: neetaq-mysql
    restart: unless-stopped
    ports:
      - "3306:3306"
    environment:
      MYSQL_DATABASE: neetaq
      MYSQL_ROOT_PASSWORD: secret
      MYSQL_USER: neetaq_user
      MYSQL_PASSWORD: neetaq_pass
    volumes:
      - mysql-data:/var/lib/mysql
      - ./docker/mysql/my.cnf:/etc/mysql/conf.d/my.cnf
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - neetaq-network

  # ───── Redis ─────
  redis:
    image: redis:7-alpine
    container_name: neetaq-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3
    networks:
      - neetaq-network

  # ───── Adminer (Development DB Manager) ─────
  adminer:
    image: adminer:latest
    container_name: neetaq-adminer
    restart: unless-stopped
    ports:
      - "8888:8080"
    environment:
      ADMINER_DEFAULT_SERVER: mysql
    depends_on:
      - mysql
    networks:
      - neetaq-network
    profiles:
      - dev # docker compose --profile dev up

  # ───── Nginx (Reverse Proxy) ─────
  nginx:
    image: nginx:alpine
    container_name: neetaq-nginx
    restart: unless-stopped
    ports:
      - "80:80"
    volumes:
      - ./docker/nginx/default.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - backend
      - frontend
    networks:
      - neetaq-network

volumes:
  mysql-data:
  redis-data:
  backend-storage:
  backend-logs: # Persistent logs

networks:
  neetaq-network:
    driver: bridge
```

---

## Backend Dockerfile

```dockerfile
FROM php:8.3-cli

# System deps
RUN apt-get update && apt-get install -y \
    git unzip libzip-dev libpng-dev libjpeg-dev \
    libfreetype6-dev libonig-dev libxml2-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo_mysql zip gd mbstring xml bcmath pcntl

# Swoole for Octane
RUN pecl install swoole && docker-php-ext-enable swoole

# Redis extension
RUN pecl install redis && docker-php-ext-enable redis

# Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
COPY . .

RUN composer install --optimize-autoloader --no-dev

EXPOSE 8000
CMD ["php", "artisan", "octane:start", "--server=swoole", "--host=0.0.0.0", "--port=8000"]
```

---

## Frontend Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev"]
```

---

## Nginx Config

```nginx
# docker/nginx/default.conf
upstream backend {
    server backend:8000;
}
upstream frontend {
    server frontend:3000;
}
upstream reverb {
    server reverb:8080;
}

server {
    listen 80;
    server_name localhost;

    # API routes
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Admin panel (Filament)
    location /admin/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
    }

    # WebSocket (Reverb)
    location /app/ {
        proxy_pass http://reverb;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Frontend (Next.js)
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
    }
}
```

---

## Makefile (Shortcuts)

```makefile
up:
	docker compose up -d

down:
	docker compose down

build:
	docker compose build --no-cache

logs:
	docker compose logs -f

backend-shell:
	docker compose exec backend bash

frontend-shell:
	docker compose exec frontend sh

migrate:
	docker compose exec backend php artisan migrate

seed:
	docker compose exec backend php artisan db:seed

test:
	docker compose exec backend php artisan test

horizon:
	docker compose exec backend php artisan horizon

fresh:
	docker compose exec backend php artisan migrate:fresh --seed
```

---

## Scheduled Tasks (Cron via Scheduler container)

| Task                          | Schedule      | Job                           |
| ----------------------------- | ------------- | ----------------------------- |
| Check expiring subscriptions  | Daily 8:00 AM | `CheckExpiringSubscriptions`  |
| Process expired subscriptions | Daily 00:00   | `ProcessExpiredSubscriptions` |
| Activate scheduled lectures   | Every minute  | `ActivateScheduledLecture`    |
| Close expired lectures        | Every minute  | `CloseExpiredLecture`         |
| Generate recurring lectures   | Daily         | `GenerateRecurringLectures`   |
| Mark absentees after grace    | Every 30 min  | `MarkAbsenteesAfterGrace`     |
| Recalculate leaderboards      | Every 3 hours | `RecalculateLeaderboard`      |
| Reset daily voice quotas      | Daily 00:00   | `ResetVoiceQuotas`            |
| Notify subscription renewal   | Daily 9:00 AM | `NotifySubscriptionRenewal`   |
| Purge old activity logs       | Weekly Sunday | `PurgeOldActivities`          |

---

## Environment Variables (.env.docker)

```env
APP_NAME=NeetaQ
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost

DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=neetaq
DB_USERNAME=neetaq_user
DB_PASSWORD=neetaq_pass

REDIS_HOST=redis
REDIS_PORT=6379

CACHE_DRIVER=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis

BROADCAST_DRIVER=reverb
REVERB_APP_ID=neetaq
REVERB_APP_KEY=neetaq-key
REVERB_APP_SECRET=neetaq-secret
REVERB_HOST=reverb
REVERB_PORT=8080

OCTANE_SERVER=swoole
```
