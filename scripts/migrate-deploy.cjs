/**
 * Ejecuta prisma migrate deploy con reintentos (Neon serverless).
 * Usa DIRECT_URL si existe, o DATABASE_URL como fallback.
 */
const { execSync } = require('child_process');

const migrateUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 8000;

if (!migrateUrl) {
  console.error('[migrate] Error: DATABASE_URL o DIRECT_URL debe estar definida');
  process.exit(1);
}

console.log(`[migrate] Usando ${process.env.DIRECT_URL ? 'DIRECT_URL' : 'DATABASE_URL'}`);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runMigrate() {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[migrate] Intento ${attempt}/${MAX_RETRIES}...`);
      execSync('npx prisma migrate deploy', {
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: migrateUrl },
      });
      console.log('[migrate] OK');
      return;
    } catch (error) {
      if (attempt === MAX_RETRIES) {
        console.error('[migrate] Falló después de todos los reintentos');
        process.exit(1);
      }
      console.warn(`[migrate] Error, reintentando en ${RETRY_DELAY_MS / 1000}s...`);
      await sleep(RETRY_DELAY_MS);
    }
  }
}

runMigrate();
