/**
 * Instalación inicial del proyecto FFCore API.
 * Uso: npm run setup
 *      npm run setup:clean   (reinstala node_modules desde cero)
 */
const { spawnSync } = require('child_process');
const { existsSync, copyFileSync, rmSync } = require('fs');
const { join } = require('path');

const root = join(__dirname, '..');
const args = process.argv.slice(2);
const clean = args.includes('--clean');
const skipMigrate = args.includes('--skip-migrate');
const skipSeed = args.includes('--skip-seed');

function log(msg) {
  console.log(`\n▶ ${msg}`);
}

function fail(msg, code = 1) {
  console.error(`\n✗ ${msg}`);
  process.exit(code);
}

function run(command, commandArgs, { optional = false } = {}) {
  const display = [command, ...commandArgs].join(' ');
  console.log(`\n> ${display}`);

  const result = spawnSync(command, commandArgs, {
    cwd: root,
    stdio: 'inherit',
    shell: true,
    env: process.env,
  });

  if (result.status !== 0 && !optional) {
    fail(`Falló: ${display}`, result.status ?? 1);
  }

  return result.status === 0;
}

// --- Node.js 20+ ---
const nodeMajor = Number(process.versions.node.split('.')[0]);
if (nodeMajor < 20) {
  fail(`Se requiere Node.js 20 o superior. Versión actual: ${process.versions.node}`);
}

log('FFCore API — instalación de dependencias');

// --- .env ---
const envPath = join(root, '.env');
const envExamplePath = join(root, '.env.example');

if (!existsSync(envPath)) {
  if (!existsSync(envExamplePath)) {
    fail('No existe .env ni .env.example');
  }
  copyFileSync(envExamplePath, envPath);
  log('Creado .env desde .env.example — apunta a Postgres LOCAL (Docker)');
} else {
  log('.env encontrado');
}

// --- Guardrail: no usar Neon/producción en local ---
try {
  require('dotenv').config({ path: envPath });
} catch {
  // dotenv ya es dependencia; si falla, seguimos
}
const dbUrl = process.env.DATABASE_URL ?? '';
if (/neon\.tech|onrender\.com/i.test(dbUrl)) {
  fail(
    `DATABASE_URL apunta a la nube (Neon/producción).\n` +
      `  En local debes usar Postgres Docker: npm run db:up\n` +
      `  Copia .env.example → .env (ffcore@127.0.0.1:5432).\n` +
      `  Neon solo se configura en el dashboard de Render.`
  );
}
if (!dbUrl.includes('127.0.0.1') && !dbUrl.includes('localhost')) {
  console.warn(
    '\n⚠ DATABASE_URL no parece local (localhost/127.0.0.1). Revisa que no sea producción.\n'
  );
}

// --- Limpieza opcional (WSL/Windows mezclados) ---
if (clean) {
  log('Modo limpio: eliminando node_modules y caché de Prisma…');
  const paths = [
    join(root, 'node_modules'),
    join(root, 'node_modules', '.prisma'),
  ];
  for (const p of paths) {
    if (existsSync(p)) {
      rmSync(p, { recursive: true, force: true });
    }
  }
}

// --- npm install ---
log('Instalando paquetes npm…');
run('npm', ['install']);

// --- Prisma generate (no requiere BD) ---
log('Generando cliente Prisma…');
run('npm', ['run', 'prisma:generate']);

// --- Migraciones y seed (requieren PostgreSQL activo) ---
if (!skipMigrate) {
  log('Aplicando migraciones (requiere PostgreSQL y DATABASE_URL correctos)…');
  const migrated = run('npm', ['exec', '--', 'prisma', 'migrate', 'deploy'], { optional: true });

  if (!migrated) {
    console.error(`
✗ No se pudieron aplicar las migraciones.

Verifica (todo desde Ubuntu, donde está Docker):
  1. cd /mnt/c/Users/yilgr/OneDrive/Desktop/diplomado-backend
  2. npm run db:up
  3. cp .env.example .env   # ffcore@127.0.0.1:5432 — NO Neon
  4. npm run setup

Neon solo en Render. Luego: npm run setup de nuevo
`);
    process.exit(1);
  }
}

if (!skipSeed) {
  log('Cargando datos demo (seed)…');
  run('npm', ['run', 'prisma:seed']);
}

console.log(`
═══════════════════════════════════════════════════════════
✓ Instalación completada

Siguiente paso:
  npm run dev

API local:
  http://localhost:3000/api/v1/health

Login demo (tras seed):
  super@ffcore.co / demo

BD local: Docker Postgres (no Neon)
Producción: Neon vía variables en Render

Frontend (.env del front + Bun):
  VITE_API_URL=http://localhost:3000/api/v1
  bun run dev
═══════════════════════════════════════════════════════════
`);
