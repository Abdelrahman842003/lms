---
title: Deployment
description: Production deployment guide with Docker Compose and best practices
---

# Deployment Guide

Complete guide for deploying the Neetaq platform to production using Docker Compose.

## Pre-Deployment Checklist

### 1. Security Verification

- [ ] `APP_DEBUG=false` in production environment
- [ ] `APP_KEY` is strong and unique (32+ random characters)
- [ ] `TELESCOPE_ENABLED=false`
- [ ] Database passwords are strong
- [ ] Redis password is set
- [ ] SSL certificates are valid
- [ ] Firebase credentials are secured
- [ ] Cloudflare R2 keys are secured

### 2. Environment Preparation

```bash
# Required files
checklist=(
  ".env.production"
  "docker-compose.prod.yml"
  "secrets/firebase_credentials.json"
  "secrets/cloudflare_r2_access_key_id.txt"
  "secrets/cloudflare_r2_secret_access_key.txt"
  "nginx/ssl/fullchain.pem"
  "nginx/ssl/privkey.pem"
)

for file in "${checklist[@]}"; do
  if [[ -f "$file" ]]; then
    echo "✓ $file exists"
  else
    echo "✗ $file MISSING"
  fi
done
```

### 3. Server Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 2 cores | 4+ cores |
| RAM | 4 GB | 8+ GB |
| Disk | 50 GB SSD | 100+ GB SSD |
| Network | 100 Mbps | 1 Gbps |

### 4. Required Software

- Docker Engine 24.0+
- Docker Compose 2.20+
- Git
- make (optional)

## Production Configuration

### Environment Variables

Create `.env.production`:

```bash
# Application
APP_ENV=production
APP_DEBUG=false
APP_KEY=<generate-strong-key>
APP_URL=https://neetaq.com

# Database
DB_HOST=mysql
DB_DATABASE=lms_prod
DB_USERNAME=lms_user
DB_PASSWORD=<strong-password>
DB_ROOT_PASSWORD=<strong-root-password>

# Redis
REDIS_PASSWORD=<strong-password>

# Octane
SWOOLE_HTTP_WORKERS=4
SWOOLE_HTTP_TASK_WORKERS=6
SWOOLE_HTTP_WATCH=false
SWOOLE_HTTP_MAX_REQUEST=500

# Security
TELESCOPE_ENABLED=false
SESSION_SECURE_COOKIE=true
```

### Docker Secrets Setup

```bash
# Create secrets directory
mkdir -p secrets

# Set proper permissions
chmod 700 secrets

# Add secret files
echo "your-firebase-credentials" > secrets/firebase_credentials.json
echo "your-access-key" > secrets/cloudflare_r2_access_key_id.txt
echo "your-secret-key" > secrets/cloudflare_r2_secret_access_key.txt
echo "your-bucket-name" > secrets/cloudflare_r2_bucket.txt
echo "your-endpoint" > secrets/cloudflare_r2_endpoint.txt
echo "your-public-url" > secrets/cloudflare_r2_public_url.txt
```

## Deployment Steps

### 1. Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

### 2. Application Deployment

```bash
# Clone repository
git clone <repository-url> neetaq
cd neetaq

# Checkout production branch
git checkout main

# Copy production environment
cp .env.production .env

# Build and start services
docker compose -f docker-compose.prod.yml up -d --build
```

### 3. Database Initialization

```bash
# Run migrations
docker compose -f docker-compose.prod.yml exec octane php artisan migrate --force

# Run seeders (if needed)
docker compose -f docker-compose.prod.yml exec octane php artisan db:seed --class=RolesAndPermissionsSeeder --force
```

### 4. SSL Certificate Setup

Using Let's Encrypt with Certbot:

```bash
# Install Certbot
docker run -it --rm \
  -v "$(pwd)/nginx/ssl:/etc/letsencrypt" \
  -v "$(pwd)/nginx/conf.d:/etc/nginx/conf.d" \
  certbot/certbot certonly \
  --standalone \
  -d neetaq.com \
  -d www.neetaq.com

# Or manual certificate placement
cp /path/to/fullchain.pem nginx/ssl/
cp /path/to/privkey.pem nginx/ssl/
```

## Zero-Downtime Deployment

### Rolling Update Strategy

```bash
#!/bin/bash
# deploy.sh - Zero-downtime deployment script

set -e

echo "🚀 Starting deployment..."

# 1. Pull latest code
git pull origin main

# 2. Build new images without affecting running containers
docker compose -f docker-compose.prod.yml build --no-cache

# 3. Run migrations (before switching traffic)
docker compose -f docker-compose.prod.yml run --rm octane php artisan migrate --force

# 4. Rolling update: Update one service at a time
echo "🔄 Updating Octane..."
docker compose -f docker-compose.prod.yml up -d --no-deps --scale octane=2 octane
sleep 10
docker compose -f docker-compose.prod.yml up -d --no-deps --scale octane=1 octane

echo "🔄 Updating Frontend..."
docker compose -f docker-compose.prod.yml up -d --no-deps frontend

echo "🔄 Updating Workers..."
docker compose -f docker-compose.prod.yml up -d --no-deps horizon scheduler

echo "🔄 Updating Reverb..."
docker compose -f docker-compose.prod.yml up -d --no-deps reverb

echo "✅ Deployment complete!"

# 5. Verify health
sleep 5
docker compose -f docker-compose.prod.yml ps
```

### Health Check Before Switching

```bash
# Check if new containers are healthy
health_check() {
  local service=$1
  local retries=10
  local delay=5
  
  for i in $(seq 1 $retries); do
    status=$(docker inspect --format='{{.State.Health.Status}}' "lms_${service}")
    if [[ "$status" == "healthy" ]]; then
      echo "✓ $service is healthy"
      return 0
    fi
    echo "Waiting for $service... ($i/$retries)"
    sleep $delay
  done
  
  echo "✗ $service failed health check"
  return 1
}

health_check octane
health_check frontend
```

## Backup Strategy

### Database Backup

```bash
#!/bin/bash
# backup.sh - Daily database backup

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/mysql"
mkdir -p $BACKUP_DIR

# Create backup
docker compose -f docker-compose.prod.yml exec -T mysql \
  mysqldump -u root -p"${DB_ROOT_PASSWORD}" lms_prod \
  | gzip > "$BACKUP_DIR/lms_prod_$DATE.sql.gz"

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "✅ Backup completed: lms_prod_$DATE.sql.gz"
```

### File Backup

```bash
#!/bin/bash
# backup-files.sh - Backup uploaded files

DATE=$(date +%Y%m%d)
BACKUP_DIR="/backups/files"
mkdir -p $BACKUP_DIR

# Backup storage directory
tar -czf "$BACKUP_DIR/storage_$DATE.tar.gz" backend/storage/app/

# Sync to S3/R2 (if using local storage)
# aws s3 sync backend/storage/app/ s3://bucket/backups/

echo "✅ Files backup completed"
```

## Monitoring

### Health Check Endpoint

```bash
# Check application health
curl -f https://neetaq.com/health || echo "Health check failed"

# Check API health
curl -f https://neetaq.com/api/v1/health || echo "API health check failed"
```

### Container Monitoring

```bash
# View resource usage
docker stats --no-stream

# Check logs
docker compose -f docker-compose.prod.yml logs -f --tail=100 octane

# Check for errors
docker compose -f docker-compose.prod.yml logs | grep ERROR
```

### Log Aggregation

Send logs to external service:

```yaml
# Add to docker-compose.prod.yml
services:
  octane:
    logging:
      driver: "json-file"
      options:
        max-size: "100m"
        max-file: "5"
    # OR use external logging
    # logging:
    #   driver: syslog
    #   options:
    #     syslog-address: "tcp://logs.papertrailapp.com:12345"
```

## Scaling

### Horizontal Scaling

```bash
# Scale Horizon workers
docker compose -f docker-compose.prod.yml up -d --scale horizon=5

# Scale Octane (requires load balancer)
docker compose -f docker-compose.prod.yml up -d --scale octane=3
```

### Vertical Scaling

Update resource limits in `docker-compose.prod.yml`:

```yaml
services:
  octane:
    deploy:
      resources:
        limits:
          cpus: '4.0'
          memory: 4G
  
  mysql:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 4G
```

## Maintenance Mode

```bash
# Enable maintenance mode
docker compose -f docker-compose.prod.yml exec octane php artisan down

# With custom message
docker compose -f docker-compose.prod.yml exec octane php artisan down \
  --message="Scheduled maintenance in progress" \
  --retry=300

# Disable maintenance mode
docker compose -f docker-compose.prod.yml exec octane php artisan up
```

## Rollback Procedure

```bash
#!/bin/bash
# rollback.sh - Emergency rollback

echo "⚠️ Initiating rollback..."

# 1. Revert to previous git commit
git log --oneline -5
git revert HEAD --no-edit

# 2. Rebuild with previous code
docker compose -f docker-compose.prod.yml up -d --build

# 3. Check health
sleep 10
docker compose -f docker-compose.prod.yml ps

echo "✅ Rollback complete"
```

## Security Hardening

### 1. Firewall Configuration

```bash
# UFW setup
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

### 2. Fail2Ban

```bash
# Install fail2ban
sudo apt install fail2ban

# Configure for Docker
sudo tee /etc/fail2ban/jail.local <<EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
action = iptables-multiport[name=ReqLimit, port="http,https", protocol=tcp]
logpath = /var/log/nginx/error.log
EOF

sudo systemctl restart fail2ban
```

### 3. Docker Security

```bash
# Run Docker Bench for Security
docker run -it --net host --pid host --userns host --cap-add audit_control \
  -e DOCKER_CONTENT_TRUST=$DOCKER_CONTENT_TRUST \
  -v /etc:/etc:ro \
  -v /usr/bin/docker-containerd:/usr/bin/docker-containerd:ro \
  -v /usr/bin/docker-runc:/usr/bin/docker-runc:ro \
  -v /usr/lib/systemd:/usr/lib/systemd:ro \
  -v /var/lib:/var/lib:ro \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  --label docker_bench_security \
  docker/docker-bench-security
```

## Troubleshooting Production

### High Memory Usage

```bash
# Check memory usage by container
docker stats --no-stream --format "table {{.Container}}\t{{.MemUsage}}"

# Restart problematic service
docker compose -f docker-compose.prod.yml restart octane

# Clear caches
docker compose -f docker-compose.prod.yml exec octane php artisan cache:clear
```

### Database Connection Issues

```bash
# Check MySQL status
docker compose -f docker-compose.prod.yml ps mysql

# Check connection count
docker compose -f docker-compose.prod.yml exec mysql mysql -e "SHOW STATUS LIKE 'Threads_connected';"

# Restart MySQL (last resort)
docker compose -f docker-compose.prod.yml restart mysql
```

## References

- [`docker-compose.prod.yml`](/docker-compose.prod.yml)
- [`deploy.sh`](/deploy.sh)
- [`nginx/conf.d/default.conf`](/nginx/conf.d/default.conf)

## TODO

- [ ] Add CI/CD pipeline documentation (GitHub Actions/GitLab CI)
- [ ] Document Kubernetes deployment
- [ ] Add automated security scanning
- [ ] Document disaster recovery procedures
- [ ] Add load balancer configuration (HAProxy/Traefik)
