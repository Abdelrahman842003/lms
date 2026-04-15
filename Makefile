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
	@docker compose --profile dev build
	@docker compose --profile dev up -d
	@# Step 3: Wait for MySQL
	@echo "⏳ Waiting for MySQL..."
	@sleep 10
	@echo "📦 Installing Backend dependencies..."
	@docker compose exec -T octane_dev composer install
	@echo "🗄️  Running Migrations..."
	@docker compose exec -T octane_dev php artisan migrate
	@echo ""
	@echo "✅ Local environment installed successfully!"
	@echo "🌐 Frontend: http://localhost:80"
	@echo ""

# Development commands
dev: ## Run development environment
	docker compose --profile dev up -d

down: ## Stop all services
	docker compose --profile dev down

restart: ## Restart services
	docker compose --profile dev restart

logs: ## Show logs
	docker compose --profile dev logs -f

migrate: ## Run migrations
	docker compose exec -T octane_dev php artisan migrate

fresh: ## Reset database
	docker compose exec -T octane_dev php artisan migrate:fresh --seed

status: ## Show service status
	docker compose --profile dev ps

clean: ## Clean all resources and volumes
	docker compose --profile dev down -v --remove-orphans
	@echo "🧹 All local resources cleaned."

help: ## Display help information
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'
