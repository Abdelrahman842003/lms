.PHONY: help build up down restart logs shell-backend shell-frontend migrate fresh test install clean

help: ## عرض المساعدة
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

build: ## بناء الـ containers
	docker compose build

up: ## تشغيل كل الخدمات
	docker compose up -d

down: ## إيقاف كل الخدمات
	docker compose down

restart: ## إعادة تشغيل الخدمات
	docker compose restart

logs: ## عرض logs لكل الخدمات
	docker compose logs -f

logs-octane: ## عرض logs للـ backend
	docker compose logs -f octane

logs-frontend: ## عرض logs للـ frontend
	docker compose logs -f frontend

logs-horizon: ## عرض logs للـ horizon
	docker compose logs -f horizon

shell-backend: ## الدخول لـ backend container
	docker compose exec octane sh

shell-frontend: ## الدخول لـ frontend container
	docker compose exec frontend sh

shell-mysql: ## الدخول لـ MySQL
	docker compose exec mysql mysql -u lms_user -p

migrate: ## تشغيل migrations
	docker compose exec octane php artisan migrate

fresh: ## إعادة بناء قاعدة البيانات
	docker compose exec octane php artisan migrate:fresh --seed

test: ## تشغيل الاختبارات
	docker compose exec octane php artisan test

octane-reload: ## إعادة تحميل Octane
	docker compose exec octane php artisan octane:reload

octane-status: ## حالة Octane
	docker compose exec octane php artisan octane:status

horizon-status: ## حالة Horizon
	docker compose exec octane php artisan horizon:status

install: ## تثبيت المشروع لأول مرة
	@echo "🚀 بدء التثبيت..."
	@echo "📦 بناء الـ containers..."
	docker compose build
	@echo "▶️  تشغيل الخدمات..."
	docker compose up -d
	@echo "⏳ انتظار MySQL..."
	sleep 10
	@echo "📥 تثبيت Backend dependencies..."
	docker compose exec octane composer install
	@echo "🔑 توليد APP_KEY..."
	docker compose exec octane php artisan key:generate
	@echo "⚡ تثبيت Octane..."
	docker compose exec octane php artisan octane:install --server=swoole
	@echo "📥 تثبيت Frontend dependencies..."
	docker compose exec frontend npm install
	@echo "🗄️  تشغيل Migrations..."
	docker compose exec octane php artisan migrate --force
	@echo "✅ التثبيت اكتمل!"
	@echo ""
	@echo "🌐 الوصول للتطبيق:"
	@echo "   Frontend: http://localhost:3000"
	@echo "   Backend API: http://localhost:8000"
	@echo "   Horizon: http://localhost:8000/horizon"
	@echo "   Telescope: http://localhost:8000/telescope"

clean: ## تنظيف كل شيء
	docker compose down -v
	rm -rf backend/vendor
	rm -rf frontend/node_modules
	rm -rf frontend/.next

prod-build: ## بناء للإنتاج
	docker compose -f docker-compose.prod.yml build

prod-up: ## تشغيل الإنتاج
	docker compose -f docker-compose.prod.yml up -d

prod-down: ## إيقاف الإنتاج
	docker compose -f docker-compose.prod.yml down

prod-logs: ## عرض logs الإنتاج
	docker compose -f docker-compose.prod.yml logs -f
