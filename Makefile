# =============================================================================
# FFCore API — atajos locales (Docker)
# No se usa en Render.
# =============================================================================

COMPOSE := docker compose -f docker-compose.local.yml

.PHONY: fire up down restart logs rebuild seed catalogs shell ps help

## Levanta Postgres + API en local (build si hace falta)
fire: up

up:
	@echo ""
	@echo "  ▶ FFCore local — modo Docker"
	@echo "  API:      http://localhost:3000"
	@echo "  Health:   http://localhost:3000/api/v1/health"
	@echo "  Postgres: localhost:5432 (ffcore / ffcore)"
	@echo ""
	$(COMPOSE) up --build -d
	@echo ""
	@echo "  Listo. Logs: make logs  |  Parar: make down"
	@echo ""

## Solo arrancar sin rebuild
start:
	$(COMPOSE) up -d

## Parar y quitar contenedores (conserva volumen de BD)
down:
	$(COMPOSE) down

## Parar y borrar volúmenes (BD limpia)
clean:
	$(COMPOSE) down -v

## Rebuild de la imagen API
rebuild:
	$(COMPOSE) build --no-cache api
	$(COMPOSE) up -d

## Reiniciar solo la API
restart:
	$(COMPOSE) restart api

## Logs en vivo
logs:
	$(COMPOSE) logs -f api

## Estado de contenedores
ps:
	$(COMPOSE) ps

## Seed completo (wipe + catálogos + superadmin)
seed:
	$(COMPOSE) exec api npx prisma db seed

## Solo catálogos de selects (idempotente, no borra datos)
catalogs:
	$(COMPOSE) exec api node scripts/ensure-catalogs.cjs

## Shell dentro del contenedor API
shell:
	$(COMPOSE) exec api sh

help:
	@echo ""
	@echo "  make fire     → build + levantar API y Postgres en local"
	@echo "  make down     → parar contenedores"
	@echo "  make clean    → parar y borrar datos de BD local"
	@echo "  make logs     → ver logs de la API"
	@echo "  make seed     → wipe + catálogos + super@ffcore.co / demo"
	@echo "  make catalogs → solo catálogos de selects (idempotente)"
	@echo "  make shell    → entrar al contenedor API"
	@echo "  make rebuild  → rebuild sin caché"
	@echo ""
