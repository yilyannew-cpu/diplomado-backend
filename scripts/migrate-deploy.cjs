/**
 * prisma migrate deploy con reintentos (Neon serverless).
 * Resuelve automáticamente P3009 (migraciones fallidas previas).
 */
const { execSync } = require('child_process');

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 8000;

function sleep(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    /* espera entre reintentos */
  }
}

function maskUrl(url) {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.username ? '***:***@' : ''}${parsed.host}${parsed.pathname}`;
  } catch {
    return '(url invalida)';
  }
}

function resolveMigrateUrl() {
  if (process.env.DIRECT_URL) {
    return { url: process.env.DIRECT_URL, source: 'DIRECT_URL' };
  }

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return null;

  if (dbUrl.includes('-pooler')) {
    return {
      url: dbUrl.replace(/-pooler/g, ''),
      source: 'DATABASE_URL sin -pooler (Neon direct)',
    };
  }

  return { url: dbUrl, source: 'DATABASE_URL' };
}

function withConnectTimeout(url) {
  if (/connect_timeout=/i.test(url)) return url;
  return `${url}${url.includes('?') ? '&' : '?'}connect_timeout=30`;
}

function prismaEnv(migrateUrl) {
  return { ...process.env, DATABASE_URL: migrateUrl };
}

function runPrisma(args, migrateUrl, options = {}) {
  const { capture = false } = options;

  return execSync(`npx prisma ${args}`, {
    encoding: 'utf8',
    shell: true,
    env: prismaEnv(migrateUrl),
    stdio: capture ? 'pipe' : 'inherit',
  });
}

function tryMigrateDeploy(migrateUrl) {
  try {
    runPrisma('migrate deploy', migrateUrl, { capture: true });
    return { ok: true };
  } catch (error) {
    const output = [
      error.stdout ?? '',
      error.stderr ?? '',
      error.message ?? '',
    ].join('\n');

    if (output.trim()) {
      console.error(output.trim());
    }

    return { ok: false, output };
  }
}

function extractFailedMigrationNames(output) {
  const names = new Set();
  const regex = /The `(\d+_[^`]+)` migration/g;
  let match = regex.exec(output);
  while (match) {
    names.add(match[1]);
    match = regex.exec(output);
  }
  return [...names];
}

function resolveFailedMigrations(migrateUrl, output) {
  if (!/P3009/.test(output)) return false;

  const names = extractFailedMigrationNames(output);
  if (names.length === 0) {
    console.warn('[migrate] P3009 detectado pero no se pudo leer el nombre de la migración');
    return false;
  }

  for (const name of names) {
    console.warn(`[migrate] P3009: reintentando migración fallida → ${name}`);
    runPrisma(`migrate resolve --rolled-back "${name}"`, migrateUrl);
  }

  return true;
}

const resolved = resolveMigrateUrl();

if (!resolved) {
  console.error('[migrate] Error: DATABASE_URL no está definida en Render');
  process.exit(1);
}

const migrateUrl = withConnectTimeout(resolved.url);

if (process.env.SKIP_MIGRATE === '1') {
  console.warn('[migrate] SKIP_MIGRATE=1 — migraciones omitidas');
  process.exit(0);
}

console.log(`[migrate] Fuente: ${resolved.source}`);
console.log(`[migrate] Host: ${maskUrl(migrateUrl)}`);

function runMigrate() {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`[migrate] Intento ${attempt}/${MAX_RETRIES}...`);

    let result = tryMigrateDeploy(migrateUrl);
    if (result.ok) {
      console.log('[migrate] OK — migraciones aplicadas');
      return;
    }

    if (resolveFailedMigrations(migrateUrl, result.output)) {
      console.log('[migrate] Reintentando deploy tras resolve rolled-back...');
      result = tryMigrateDeploy(migrateUrl);
      if (result.ok) {
        console.log('[migrate] OK — migraciones aplicadas');
        return;
      }
    }

    if (/was modified after it was applied/i.test(result.output)) {
      console.error('[migrate] Checksum de migración distinto (P3018). No se puede auto-reparar.');
      process.exit(1);
    }

    if (attempt === MAX_RETRIES) {
      console.error('[migrate] Falló después de todos los reintentos');
      process.exit(1);
    }

    console.warn(`[migrate] Error, reintentando en ${RETRY_DELAY_MS / 1000}s...`);
    sleep(RETRY_DELAY_MS);
  }
}

runMigrate();
