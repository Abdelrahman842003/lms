#!/bin/bash

# Deploy script for production
echo "🚀 Deploying changes to production..."

# 1. Pull latest changes
echo "📥 Pulling latest code..."
git pull origin main

# 2. Clear caches inside the container
echo "🧹 Clearing caches..."
docker compose -f docker-compose.prod.yml exec -T octane php artisan config:clear
docker compose -f docker-compose.prod.yml exec -T octane php artisan route:clear
docker compose -f docker-compose.prod.yml exec -T octane php artisan cache:clear
docker compose -f docker-compose.prod.yml exec -T octane php artisan view:clear

# 3. Re-cache for production performance
echo "⚡ Optimizing..."
docker compose -f docker-compose.prod.yml exec -T octane php artisan config:cache
docker compose -f docker-compose.prod.yml exec -T octane php artisan route:cache
docker compose -f docker-compose.prod.yml exec -T octane php artisan view:cache

echo "✅ Deployment complete!"
