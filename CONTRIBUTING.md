# Guía de contribución — FFCore Backend

Flujo obligatorio del equipo:

```
dev-{nombre}  →  develop  →  main  →  Render (producción)
```

**Nunca** mergear `dev-{nombre}` directo a `main`.

---

## Antes de empezar una tarea

```bash
git checkout develop
git pull origin develop
git checkout dev-tu-nombre
git merge develop
```

---

## Antes de abrir PR a `develop`

- [ ] `npm install`
- [ ] `npx prisma generate` (si hubo cambios en schema)
- [ ] `npm run build` sin errores
- [ ] `npx tsc --noEmit` sin errores
- [ ] Endpoint probado (Postman / curl)
- [ ] Si agregaste endpoint → actualizar doc en `docs/`

---

## Reglas Prisma (críticas)

| Hacer | No hacer |
|-------|----------|
| Crear migración nueva con `npx prisma migrate dev` | Editar migraciones ya aplicadas en Neon |
| Mismo `schema.prisma` en todas las ramas tras merge | Tipos distintos entre ramas (ej. String vs enum) |
| `prisma generate` después de cada pull con cambios en schema | Mergear schema sin migración |
| Coordinar con el líder antes de `prisma db seed` en Neon | Seed en producción sin avisar |

---

## Merge a `main` (solo desde `develop`)

Requisitos:

1. PR a `develop` revisado y aprobado
2. Build local OK
3. Sin conflictos en `prisma/schema.prisma` ni `prisma/migrations/`
4. Smoke test post-deploy: `GET /api/v1/health`, login admin, `POST /orders`

---

## Variables Render (producción)

| Variable | Uso |
|----------|-----|
| `DATABASE_URL` | Neon pooled (`-pooler`) |
| `DIRECT_URL` | Neon directa (migraciones) |
| `JWT_SECRET` | Auth |
| `CORS_ORIGIN` | Frontend |

---

## Documentación vigente

- `docs/API-PANEL-ADMIN-RESTAURANTE.md` — panel admin
- `docs/API-CLIENTE-FLUJO-MINIMO.md` — portal cliente
- `docs/DEPLOY-RENDER.md` — despliegue

---

## Convención de commits

```
feat(orders): descripción
fix(prisma): descripción
chore(docs): descripción
```

---

## Contacto

Dudas de arquitectura, migraciones o deploy → líder técnico antes de mergear a `main`.
