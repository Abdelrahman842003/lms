.PHONY: help dev prod install clean logs shell migrate fresh restart down status

# ===========================================
# 🚀 LMS Docker Deployment - One Command Setup
# ===========================================

# ===========================================
# 🎯 Install - Unified Installation Command
# ===========================================
install: ## Install the project (interactive environment selection)
	@echo ""
	@echo "🎯 LMS Installation Wizard"
	@echo "=========================="
	@echo ""
	@echo "Choose environment type:"
	@echo "  1) local      - Local development environment"
	@echo "  2) production - Production environment"
	@echo ""
	@read -p "Your choice (1 or 2): " choice; \
	if [ "$$choice" = "1" ] || [ "$$choice" = "local" ]; then \
		$(MAKE) _install-local; \
	elif [ "$$choice" = "2" ] || [ "$$choice" = "production" ]; then \
		read -p "Enter domain (e.g., example.com): " domain; \
		$(MAKE) _install-production DOMAIN=$$domain; \
	else \
		echo "❌ Invalid choice!"; \
		exit 1; \
	fi

_install-local: ## Install development environment
	@echo ""
	@echo "🚀 Starting local development environment installation..."
	@echo "======================================="
	@echo ""
	@# Step 1: Setup .env
	@if [ ! -f .env ]; then \
		echo "📄 Creating .env file from .env.development..."; \
		cp .env.development .env; \
	fi
	@# Generate APP_KEY if not set
	@if ! grep -q "^APP_KEY=base64:" .env 2>/dev/null; then \
		echo "🔑 Generating APP_KEY..."; \
		APP_KEY=$$(openssl rand -base64 32); \
		if grep -q "^APP_KEY=" .env; then \
			sed -i "s|^APP_KEY=.*|APP_KEY=base64:$$APP_KEY|" .env; \
		else \
			echo "APP_KEY=base64:$$APP_KEY" >> .env; \
		fi; \
	fi
	@# Step 2: Build and start
	@echo "🏗️  Building and starting Docker containers..."
	@docker compose build
	@docker compose up -d
	@# Step 3: Wait for MySQL
	@echo "⏳ Waiting for MySQL..."
	@sleep 15
	@while ! docker compose exec -T mysql mysqladmin ping -h localhost --silent 2>/dev/null; do \
		echo "   MySQL still starting..."; \
		sleep 5; \
	done
	@echo "   ✅ MySQL is ready"
	@# Step 4: Backend setup
	@echo "📦 Installing Backend dependencies..."
	@docker compose exec -T octane composer clear-cache 2>/dev/null || true
	@docker compose exec -T -e COMPOSER_MEMORY_LIMIT=-1 octane composer install --no-dev --no-interaction --prefer-dist || docker compose exec -T -e COMPOSER_MEMORY_LIMIT=-1 octane composer install --no-dev --no-interaction
	@# Step 5: Migrations
	@echo "🗄️  Running Migrations..."
	@docker compose exec -T octane php artisan migrate --force
	@# Step 6: Laravel optimizations
	@echo "⚡ Optimizing Laravel..."
	@docker compose exec -T octane php artisan config:cache 2>/dev/null || true
	@docker compose exec -T octane php artisan route:cache 2>/dev/null || true
	@# Done
	@echo ""
	@echo "============================================"
	@echo "✅ Development environment installed successfully!"
	@echo "============================================"
	@echo ""
	@echo "🌐 Frontend:  http://localhost:3000"
	@echo "🔌 Backend:   http://localhost:8000"
	@echo "📡 WebSocket: http://localhost:8080"
	@echo ""
	@docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
	@echo ""

_install-production: ## Install production environment (requires DOMAIN)
	@echo ""
	@echo "🛑 Stopping any running development containers..."
	@$(MAKE) down > /dev/null 2>&1 || true
	@echo "🚀 Starting production environment installation..."
	@echo "Domain: $(DOMAIN)"
	@echo "================================"
	@echo ""
	@# Check required files
	@if [ ! -f .env.production ]; then \
		echo "❌ Error: .env.production not found!"; \
		exit 1; \
	fi
	@# Step 1: Copy and update .env
	@echo "📄 Setting up .env file..."
	@cp .env.production .env
	@# Update domain in .env
	@if [ -n "$(DOMAIN)" ]; then \
		sed -i "s|APP_URL=.*|APP_URL=https://$(DOMAIN)|" .env; \
		sed -i "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=https://$(DOMAIN)|" .env; \
		echo "✅ Domain updated: $(DOMAIN)"; \
	fi
	@# Step 2: Generate APP_KEY if not set
	@if ! grep -q "^APP_KEY=base64:" .env 2>/dev/null; then \
		echo "🔑 Generating APP_KEY..."; \
		APP_KEY=$$(openssl rand -base64 32); \
		if grep -q "^APP_KEY=" .env; then \
			sed -i "s|^APP_KEY=.*|APP_KEY=base64:$$APP_KEY|" .env; \
		else \
			echo "APP_KEY=base64:$$APP_KEY" >> .env; \
		fi; \
	fi
	@# Step 3: Generate secure passwords if placeholders
	@echo "🔐 Generating secure passwords..."
	@if grep -q "CHANGE_THIS" .env; then \
		DB_PASS=$$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24); \
		ROOT_PASS=$$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24); \
		REDIS_PASS=$$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24); \
		sed -i "s|CHANGE_THIS_DB_PASSWORD|$$DB_PASS|g" .env; \
		sed -i "s|CHANGE_THIS_ROOT_PASSWORD|$$ROOT_PASS|g" .env; \
		sed -i "s|CHANGE_THIS_REDIS_PASSWORD|$$REDIS_PASS|g" .env; \
		echo "   ✅ Passwords generated"; \
	fi
	@# Step 4: Generate Reverb keys
	@echo "📡 Generating Reverb keys..."
	@if ! grep -q "^REVERB_APP_ID=" .env; then \
		REVERB_ID=$$(openssl rand -hex 8); \
		REVERB_KEY=$$(openssl rand -hex 16); \
		REVERB_SECRET=$$(openssl rand -hex 32); \
		echo "REVERB_APP_ID=$$REVERB_ID" >> .env; \
		echo "REVERB_APP_KEY=$$REVERB_KEY" >> .env; \
		echo "REVERB_APP_SECRET=$$REVERB_SECRET" >> .env; \
		echo "REVERB_PUBLIC_HOST=$(DOMAIN)" >> .env; \
	fi
	@# Step 5: Setup secrets
	@echo "🔐 Setting up Docker Secrets..."
	@chmod +x setup-secrets.sh 2>/dev/null || true
	@./setup-secrets.sh 2>/dev/null || true
	@# Step 5.5: Setup SSL for Nginx
	@echo "🔒 Checking SSL certificates..."
	@mkdir -p nginx/ssl
	@if [ ! -f nginx/ssl/fullchain.pem ] || [ ! -f nginx/ssl/privkey.pem ]; then \
		echo "⚠️  SSL certificates not found, generating self-signed certificates..."; \
		openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
			-keyout nginx/ssl/privkey.pem \
			-out nginx/ssl/fullchain.pem \
			-subj "/C=US/ST=State/L=City/O=LMS/OU=IT/CN=$(DOMAIN)"; \
		echo "   ✅ Self-signed SSL certificates generated for $(DOMAIN)"; \
	fi
	@# Step 6: Build and start production
	@echo "🏗️  Building and starting production containers..."
	@docker compose -f docker-compose.prod.yml build
	@docker compose -f docker-compose.prod.yml up -d
	@# Step 7: Wait for MySQL
	@echo "⏳ Waiting for MySQL..."
	@sleep 20
	@while ! docker compose -f docker-compose.prod.yml exec -T mysql mysqladmin ping -h localhost --silent 2>/dev/null; do \
		echo "   MySQL still starting..."; \
		sleep 5; \
	done
	@echo "   ✅ MySQL is ready"
	@# Step 8: Migrations
	@echo "🗄️  Running Migrations..."
	@docker compose -f docker-compose.prod.yml exec -T octane php artisan migrate --force
	@# Step 9: Production optimizations
	@echo "⚡ Optimizing Laravel for production..."
	@docker compose -f docker-compose.prod.yml exec -T octane php artisan config:cache
	@docker compose -f docker-compose.prod.yml exec -T octane php artisan route:cache
	@docker compose -f docker-compose.prod.yml exec -T octane php artisan view:cache
	@docker compose -f docker-compose.prod.yml exec -T octane php artisan event:cache
	@# Done
	@echo ""
	@echo "============================================"
	@echo "✅ Production environment installed successfully!"
	@echo "============================================"
	@echo ""
	@echo "🌐 Website: https://$(DOMAIN)"
	@echo ""
	@docker compose -f docker-compose.prod.yml ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
	@echo ""

help: ## Display help information
	@echo ""
	@echo "📦 LMS Docker Deployment"
	@echo "========================"
	@echo ""
	@echo "🎯 make install    - Install project (interactive environment selection)"
	@echo ""
	@echo "🔹 make dev        - Run development environment (one command setup)"
	@echo "🔹 make prod       - Run production environment (one command setup)"
	@echo ""
	@echo "🔹 make status     - Show service status"
	@echo "🔹 make logs       - Show logs for all services"
	@echo "🔹 make down       - Stop all services"
	@echo "🔹 make restart    - Restart services"
	@echo "🔹 make clean      - Clean all resources and
