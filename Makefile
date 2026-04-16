.PHONY: help dev install clean logs shell migrate fresh restart down status

# ===========================================
# 🚀 LMS Local Development - Makefile
# ===========================================

# Installation for local development
install: ## Install the project for local development
	@echo ""
	@echo "🎯 LMS Local Installation"
	@echo "========================="
	@echo ""
	@# Step 1: Setup .env
	@if [ ! -f .env ]; then \
		echo "📄 Creating .env file from .env.example..."; \
		cp .env.example .env; \
	fi
	@# Step 2: Build and start
	@echo "🏗️  Building and starting Docker containers..."
	@docker compose -f docker-compose.dev.yml build
	@docker compose -f docker-compose.dev.yml up -d
	@# Step 3: Wait for MySQL
	@echo "⏳ Waiting for MySQL..."
	@sleep 10
	@echo "📦 Installing Backend dependencies..."
	@docker compose -f docker-compose.dev.yml exec -T octane_dev composer install
	@echo "🗄️  Running Migrations..."
	@docker compose -f docker-compose.dev.yml exec -T octane_dev php artisan migrate
	@echo ""
	@echo "✅ Local environment installed successfully!"
	@echo "🌐 Frontend: http://localhost:3000"
	@echo "🌐 Backend:  http://localhost:8000"
	@echo ""

# Development commands
dev: ## Run development environment
	docker compose -f docker-compose.dev.yml up -d

down: ## Stop all services
	docker compose -f docker-compose.dev.yml down

restart: ## Restart services
	docker compose -f docker-compose.dev.yml restart

logs: ## Show logs
	docker compose -f docker-compose.dev.yml logs -f

migrate: ## Run migrations
	docker compose -f docker-compose.dev.yml exec -T octane_dev php artisan migrate

fresh: ## Reset database
	docker compose -f docker-compose.dev.yml exec -T octane_dev php artisan migrate:fresh --seed

status: ## Show service status
	docker compose -f docker-compose.dev.yml ps

clean: ## Clean all resources and volumes
	docker compose -f docker-compose.dev.yml down -v --remove-orphans
	@echo "🧹 All local resources cleaned."

help: ## Display help information
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'
