# Despliegue en Render + Neon (gratis)

Guía para publicar **FFCore API** en [Render](https://render.com) con PostgreSQL en [Neon](https://neon.tech).

---

## Requisitos previos

- Cuenta en [GitHub](https://github.com) con el código del backend subido
- Cuenta en [Neon](https://neon.tech) (PostgreSQL gratis)
- Cuenta en [Render](https://render.com) (Web Service gratis)

---

## Paso 1 — Base de datos en Neon (gratis)

1. Entra a [neon.tech](https://neon.tech) → **Sign up**
2. **New Project** → nombre: `ffcore`
3. Copia la **Connection string** (modo `Pooled` o `Direct`; usa **SSL**)
4. Debe verse algo así:

```
postgresql://usuario:password@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

5. En Neon, crea la base `ffcore` si el string apunta a `neondb` por defecto, o renombra en el dashboard.

### Migrar y seed desde tu PC (una sola vez)

En PowerShell, en la carpeta del proyecto:

```powershell
$env:DATABASE_URL="postgresql://...@ep-xxx.neon.tech/ffcore?sslmode=require"
npx prisma migrate deploy
npx prisma db seed
```

Verifica usuarios demo con `npx prisma studio` o el SQL de Neon.

---

## Paso 2 — Subir código a GitHub

Si aún no está en GitHub:

```powershell
cd C:\Users\yilgr\OneDrive\Desktop\diplomado-backend
git init
git add .
git commit -m "feat: FFCore API Fase 1 lista para Render"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/ffcore-api.git
git push -u origin main
```

**No subas `.env`** (ya está en `.gitignore`).

---

## Paso 3 — Crear Web Service en Render

1. [dashboard.render.com](https://dashboard.render.com) → **New +** → **Web Service**
2. Conecta tu repositorio de GitHub (`ffcore-api` o `diplomado-backend`)
3. Configura:

| Campo | Valor |
|-------|--------|
| **Name** | `ffcore-api` |
| **Region** | Oregon (US West) o el más cercano |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | `npm install --include=dev && npm run build:render` |
| **Start Command** | `npm start` |
| **Instance Type** | **Free** |

4. **Environment Variables** (Add Environment Variable):

| Key | Value |
|-----|--------|
| `DATABASE_URL` | Connection string de Neon (con `?sslmode=require`) |
| `JWT_SECRET` | Clave aleatoria de 32+ caracteres |
| `JWT_EXPIRES_IN` | `8h` |
| `CORS_ORIGIN` | `https://tu-front.vercel.app` (y `http://localhost:8081` si pruebas local) |
| `NODE_ENV` | `production` |

> Render asigna `PORT` automáticamente; no hace falta definirlo.

5. **Advanced** → Health Check Path: `/api/v1/health`
6. Clic en **Create Web Service**

Render construirá y desplegará. La primera vez puede tardar 5–10 minutos.

---

## Paso 4 — Obtener URL de la API

Cuando el deploy termine en verde, verás algo como:

```
https://ffcore-api.onrender.com
```

Prueba en el navegador:

```
https://ffcore-api.onrender.com/api/v1/health
```

Login:

```powershell
Invoke-RestMethod -Method POST -Uri "https://ffcore-api.onrender.com/api/v1/auth/login" `
  -ContentType "application/json" `
  -Body '{"email":"super@ffcore.co","password":"demo"}'
```

---

## Paso 5 — Conectar el frontend (Vercel)

En el proyecto frontend, variable de entorno:

```env
VITE_API_URL=https://ffcore-api.onrender.com/api/v1
```

Redeploy del front en Vercel.

En el backend (Render), asegúrate de que `CORS_ORIGIN` incluya la URL exacta del front:

```env
CORS_ORIGIN=https://tu-app.vercel.app,http://localhost:8081
```

---

## Opción rápida: Blueprint con `render.yaml`

El repo incluye `render.yaml`. En Render:

1. **New +** → **Blueprint**
2. Conecta el repo
3. Render leerá `render.yaml` y creará el servicio
4. Completa manualmente `DATABASE_URL` y `CORS_ORIGIN` cuando te lo pida

---

## Limitaciones del plan Free de Render

| Comportamiento | Detalle |
|----------------|---------|
| **Sleep** | Tras ~15 min sin tráfico, el servicio se duerme |
| **Cold start** | Primer request tras dormir: 30–60 segundos |
| **750 h/mes** | Suficiente para diplomado/demo |

**Tip para demo:** abre `/api/v1/health` 1 minuto antes de presentar.

---

## Comandos útiles del proyecto

| Comando | Uso |
|---------|-----|
| `npm run build` | Compilar TypeScript + Prisma Client |
| `npm run start:render` | Migrar + arrancar (usa Render) |
| `npm run dev` | Desarrollo local |

---

## Solución de problemas

### Deploy falla en build (`Could not find a declaration file for module 'express'`)

Render con `NODE_ENV=production` no instala `devDependencies` por defecto. El build necesita TypeScript y `@types/*`.

**Solución:** Build Command debe ser:

```bash
npm install --include=dev && npm run build:render
```

### Deploy falla en build (otros)

- Revisa logs en Render → **Logs**
- Verifica que `package.json` tenga `"build": "prisma generate && tsc"`

### `Can't reach database server`

- `DATABASE_URL` debe ser de **Neon**, no `127.0.0.1`
- Incluye `?sslmode=require`

### CORS error desde Vercel

- `CORS_ORIGIN` debe coincidir exactamente con la URL del front (sin `/` final)
- Ejemplo: `https://ffcore.vercel.app`

### Login 500 en producción

- Ejecuta `npx prisma migrate deploy` y `npx prisma db seed` contra Neon
- Revisa que `JWT_SECRET` tenga 32+ caracteres

### Servicio muy lento

- Plan free duerme; es normal. Considera un ping a `/health` antes de la demo.

---

## Checklist final

- [ ] Neon creado + `migrate deploy` + `db seed`
- [ ] Repo en GitHub sin `.env`
- [ ] Web Service en Render (Free)
- [ ] Variables de entorno configuradas
- [ ] `/api/v1/health` responde 200
- [ ] Login `super@ffcore.co` / `demo` funciona
- [ ] Front en Vercel con `VITE_API_URL` apuntando a Render
- [ ] `CORS_ORIGIN` con URL de Vercel
