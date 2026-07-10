/**
 * Ejecuta prisma migrate deploy con reintentos (Neon serverless).
 * Usa DIRECT_URL, o deriva URL directa desde DATABASE_URL Neon (sin -pooler).
 */
const { execSync } = require('child_process');
const path = require('path');

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 8000;

function sleep(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    /* espera activa entre reintentos */
  }
}

function resolveMigrateUrl() {
  if (process.env.DIRECT_URL) {
    return process.env.DIRECT_URL;
  }

  const url = process.env.DATABASE_URL;
  if (!url) return null;

  if (url.includes('-pooler')) {
    const direct = url.replace(/-pooler/g, '');
    console.warn('[migrate] DIRECT_URL no configurada; usando DATABASE_URL sin pooler (Neon direct)');
    return direct;
  }

  return url;
}

function withConnectTimeout(url) {
  if (/connect_timeout=/i.test(url)) return url;
  return `${url}${url.includes('?') ? '&' : '?'}connect_timeout=30`;
}

const migrateUrl = withConnectTimeout(resolveMigrateUrl());

if (!migrateUrl) {
  console.error('[migrate] Error: define DATABASE_URL (y opcional DIRECT_URL) en Render');
  process.exit(1);
}

if (process.env.SKIP_MIGRATE === '1') {
  console.warn('[migrate] SKIP_MIGRATE=1 — migraciones omitidas');
  process.exit(0);
}

console.log(`[migrate] URL: ${process.env.DIRECT_URL ? 'DIRECT_URL' : 'DATABASE_URL (directa)'}`);

const prismaBin = path.join(__dirname, '..', 'node_modules', '.bin', 'prisma');

function runMigrate() {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[migrate] Intento ${attempt}/${MAX_RETRIES}...`);
      execSync(`"${prismaBin}" migrate deploy`, {
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: migrateUrl },
      });
      console.log('[migrate] OK');
      return;
    } catch (error) {
      const msg = error?.message ?? String(error);
      if (/was modified after it was applied/i.test(msg)) {
        console.error(
          '[migrate] Checksum de migración distinto. En Neon SQL Editor ejecuta:\n' +
            '  npx prisma migrate resolve --applied "20260709180000_panel_admin_restaurante"\n' +
            'o restaura el checksum en _prisma_migrations.',
        );
      }
      if (attempt === MAX_RETRIES) {
        console.error('[migrate] Falló después de todos los reintentos');
        process.exit(1);
      }
      console.warn(`[migrate] Error, reintentando en ${RETRY_DELAY_MS / 1000}s...`);
      sleep(RETRY_DELAY_MS);
    }
  }
}

runMigrate();
