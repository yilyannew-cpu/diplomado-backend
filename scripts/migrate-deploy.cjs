/**
 * prisma migrate deploy con reintentos (Neon serverless).
 * Prioridad: DIRECT_URL → DATABASE_URL sin -pooler → DATABASE_URL
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

function printDirectUrlHelp() {
  console.error(`
[migrate] === Cómo configurar DIRECT_URL en Render + Neon ===

1. Entra a https://console.neon.tech y abre tu proyecto.
2. Ve a "Connection Details" (Detalles de conexión).
3. Activa "Connection pooling" → copia esa URL en Render como DATABASE_URL.
4. Desactiva "Connection pooling" → copia esa URL en Render como DIRECT_URL.
5. En Render: ffcore-api → Environment → Add Environment Variable
     Key:   DIRECT_URL
     Value: postgresql://... (URL directa, SIN "-pooler" en el host)
6. Guarda cambios (Render redeploya solo).

Ambas URLs deben ser del mismo branch (ej. "main").
`);
}

function runPrisma(args, migrateUrl) {
  execSync(`npx prisma ${args}`, {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, DATABASE_URL: migrateUrl },
  });
}

const resolved = resolveMigrateUrl();

if (!resolved) {
  console.error('[migrate] Error: DATABASE_URL no está definida en Render');
  printDirectUrlHelp();
  process.exit(1);
}

const migrateUrl = withConnectTimeout(resolved.url);

if (process.env.SKIP_MIGRATE === '1') {
  console.warn('[migrate] SKIP_MIGRATE=1 — migraciones omitidas');
  process.exit(0);
}

console.log(`[migrate] Fuente: ${resolved.source}`);
console.log(`[migrate] Host: ${maskUrl(migrateUrl)}`);

if (!process.env.DIRECT_URL && !migrateUrl.includes('-pooler')) {
  console.log('[migrate] Conexión directa derivada automáticamente');
} else if (!process.env.DIRECT_URL) {
  console.warn('[migrate] AVISO: configura DIRECT_URL en Render para mayor estabilidad');
}

function runMigrate() {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[migrate] Intento ${attempt}/${MAX_RETRIES}...`);
      runPrisma('migrate deploy', migrateUrl);
      console.log('[migrate] OK — migraciones aplicadas');
      return;
    } catch (error) {
      const msg = error?.message ?? String(error);

      if (/was modified after it was applied/i.test(msg)) {
        console.error('[migrate] Migración editada después de aplicarse (checksum). Contacta soporte o usa prisma migrate resolve.');
      }

      if (attempt === MAX_RETRIES) {
        console.error('[migrate] Falló después de todos los reintentos');
        printDirectUrlHelp();
        process.exit(1);
      }

      console.warn(`[migrate] Error, reintentando en ${RETRY_DELAY_MS / 1000}s...`);
      sleep(RETRY_DELAY_MS);
    }
  }
}

runMigrate();
