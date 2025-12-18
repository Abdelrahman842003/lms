.PHONY: help dev prod install clean logs shell migrate fresh restart down status

# ===========================================
# 🚀 LMS Docker Deployment - One Command Setup
# ===========================================

help: ## عرض المساعدة
	@echo ""
	@echo "📦 LMS Docker Deployment"
	@echo "========================"
	@echo ""
	@echo "🔹 make dev        - تشغيل بيئة التطوير (أمر واحد يعمل كل شيء)"
	@echo "🔹 make prod       - تشغيل بيئة الإنتاج (أمر واحد يعمل كل شيء)"
	@echo ""
	@echo "🔹 make status     - عرض حالة الخدمات"
	@echo "🔹 make logs       - عرض logs كل الخدمات"
	@echo "🔹 make down       - إيقاف كل الخدمات"
	@echo "🔹 make restart    - إعادة تشغيل"
	@echo "🔹 make clean      - حذف كل شيء وإعادة البناء"
	@echo ""
	@echo "🔹 make shell      - دخول Backend container"
	@echo "🔹 make migrate    - تشغيل migrations جديدة"
	@echo ""

# ===========================================
# 🔧 Development - أمر واحد للتطوير
# ===========================================
dev: ## تشغيل بيئة التطوير كاملة بأمر واحد
	@echo ""
	@echo "🚀 بدء تشغيل بيئة التطوير..."
	@echo "================================"
	@echo ""
	@# Step 1: Setup .env
	@if [ ! -f .env ]; then \
		echo "📄 إنشاء ملف .env من .env.development..."; \
		cp .env.development .env; \
	fi
	@# Generate APP_KEY if not set
	@if ! grep -q "^APP_KEY=base64:" .env 2>/dev/null; then \
		echo "🔑 توليد APP_KEY..."; \
		APP_KEY=$$(openssl rand -base64 32); \
		if grep -q "^APP_KEY=" .env; then \
			sed -i "s|^APP_KEY=.*|APP_KEY=base64:$$APP_KEY|" .env; \
		else \
			echo "APP_KEY=base64:$$APP_KEY" >> .env; \
		fi; \
	fi
	@# Step 2: Build and start
	@echo "🏗️  بناء وتشغيل Docker containers..."
	@docker compose build --quiet
	@docker compose up -d
	@# Step 3: Wait for MySQL
	@echo "⏳ انتظار MySQL..."
	@sleep 15
	@while ! docker compose exec -T mysql mysqladmin ping -h localhost --silent 2>/dev/null; do \
		echo "   MySQL still starting..."; \
		sleep 5; \
	done
	@echo "   ✅ MySQL جاهز"
	@# Step 4: Backend setup
	@echo "📦 تثبيت Backend dependencies..."
	@docker compose exec -T octane composer clear-cache 2>/dev/null || true
	@docker compose exec -T octane composer install --no-interaction --prefer-dist || docker compose exec -T octane composer install --no-interaction
	@# Step 5: Migrations
	@echo "🗄️  تشغيل Migrations..."
	@docker compose exec -T octane php artisan migrate --force
	@# Step 6: Laravel optimizations
	@echo "⚡ تحسين Laravel..."
	@docker compose exec -T octane php artisan config:cache 2>/dev/null || true
	@docker compose exec -T octane php artisan route:cache 2>/dev/null || true
	@# Done
	@echo ""
	@echo "============================================"
	@echo "✅ تم التشغيل بنجاح!"
	@echo "============================================"
	@echo ""
	@echo "🌐 Frontend:  http://localhost:3000"
	@echo "🔌 Backend:   http://localhost:8000"
	@echo "📡 WebSocket: http://localhost:8080"
	@echo ""
	@docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
	@echo ""

# ===========================================
# 🏭 Production - أمر واحد للإنتاج
# ===========================================
prod: ## تشغيل بيئة الإنتاج كاملة بأمر واحد
	@echo ""
	@echo "🚀 بدء تشغيل بيئة الإنتاج..."
	@echo "================================"
	@echo ""
	@# Step 1: Check .env.production exists
	@if [ ! -f .env.production ]; then \
		echo "❌ Error: .env.production not found!"; \
		echo "   Please create .env.production with production settings."; \
		exit 1; \
	fi
	@# Copy to .env
	@echo "📄 نسخ .env.production..."
	@cp .env.production .env
	@# Step 2: Generate APP_KEY if not set
	@if ! grep -q "^APP_KEY=base64:" .env 2>/dev/null; then \
		echo "🔑 توليد APP_KEY..."; \
		APP_KEY=$$(openssl rand -base64 32); \
		if grep -q "^APP_KEY=" .env; then \
			sed -i "s|^APP_KEY=.*|APP_KEY=base64:$$APP_KEY|" .env; \
		else \
			echo "APP_KEY=base64:$$APP_KEY" >> .env; \
		fi; \
	fi
	@# Step 3: Setup secrets
	@echo "🔐 توليد Docker Secrets..."
	@chmod +x setup-secrets.sh
	@./setup-secrets.sh
	@# Step 4: Build and start production
	@echo "🏗️  بناء وتشغيل Production containers..."
	@docker compose -f docker-compose.prod.yml build --quiet
	@docker compose -f docker-compose.prod.yml up -d
	@# Step 5: Wait for MySQL
	@echo "⏳ انتظار MySQL..."
	@sleep 20
	@while ! docker compose -f docker-compose.prod.yml exec -T mysql mysqladmin ping -h localhost --silent 2>/dev/null; do \
		echo "   MySQL still starting..."; \
		sleep 5; \
	done
	@echo "   ✅ MySQL جاهز"
	@# Step 6: Backend setup
	@echo "📦 تثبيت Backend dependencies..."
	@docker compose -f docker-compose.prod.yml exec -T octane composer install --no-dev --no-interaction --optimize-autoloader
	@# Step 7: Migrations
	@echo "🗄️  تشغيل Migrations..."
	@docker compose -f docker-compose.prod.yml exec -T octane php artisan migrate --force
	@# Step 8: Production optimizations
	@echo "⚡ تحسين Laravel للإنتاج..."
	@docker compose -f docker-compose.prod.yml exec -T octane php artisan config:cache
	@docker compose -f docker-compose.prod.yml exec -T octane php artisan route:cache
	@docker compose -f docker-compose.prod.yml exec -T octane php artisan view:cache
	@docker compose -f docker-compose.prod.yml exec -T octane php artisan event:cache
	@# Done
	@echo ""
	@echo "============================================"
	@echo "✅ Production تم التشغيل بنجاح!"
	@echo "============================================"
	@echo ""
	@docker compose -f docker-compose.prod.yml ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
	@echo ""

# ===========================================
# 🛠️ Utility Commands
# ===========================================

status: ## عرض حالة الخدمات
	@docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

logs: ## عرض logs كل الخدمات
	@docker compose logs -f

logs-backend: ## عرض logs Backend فقط
	@docker compose logs -f octane

logs-frontend: ## عرض logs Frontend فقط
	@docker compose logs -f frontend

down: ## إيقاف كل الخدمات
	@docker compose down
	@echo "✅ تم إيقاف كل الخدمات"

restart: ## إعادة تشغيل الخدمات
	@docker compose restart
	@echo "✅ تم إعادة التشغيل"

shell: ## دخول Backend container
	@docker compose exec octane sh

shell-mysql: ## دخول MySQL
	@docker compose exec mysql mysql -u lms_user -p

migrate: ## تشغيل migrations جديدة
	@docker compose exec octane php artisan migrate --force
	@echo "✅ تم تشغيل Migrations"

fresh: ## إعادة بناء قاعدة البيانات (⚠️ يحذف كل البيانات)
	@echo "⚠️  Warning: سيتم حذف كل البيانات!"
	@read -p "متأكد؟ (y/N) " confirm && [ "$$confirm" = "y" ] || exit 1
	@docker compose exec octane php artisan migrate:fresh --seed --force
	@echo "✅ تم إعادة بناء قاعدة البيانات"

clean: ## حذف كل شيء وإعادة البناء
	@echo "🧹 تنظيف كل شيء..."
	@docker compose down -v --remove-orphans
	@rm -rf backend/vendor 2>/dev/null || true
	@rm -rf frontend/node_modules 2>/dev/null || true
	@rm -rf frontend/.next 2>/dev/null || true
	@echo "✅ تم التنظيف"

# ===========================================
# 🔄 Production Maintenance
# ===========================================

prod-down: ## إيقاف Production
	@docker compose -f docker-compose.prod.yml down

prod-logs: ## عرض logs Production
	@docker compose -f docker-compose.prod.yml logs -f

prod-restart: ## إعادة تشغيل Production
	@docker compose -f docker-compose.prod.yml restart
