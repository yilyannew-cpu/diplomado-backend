/**
 * Ejecuta prisma migrate deploy usando DIRECT_URL (Neon direct) si existe,
 * o DATABASE_URL como fallback. Evita exigir DIRECT_URL en schema.prisma.
 */
const { execSync } = require('child_process');

const migrateUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!migrateUrl) {
  console.error('Error: DATABASE_URL o DIRECT_URL debe estar definida');
  process.exit(1);
}

console.log(`[migrate] Usando ${process.env.DIRECT_URL ? 'DIRECT_URL' : 'DATABASE_URL'}`);

execSync('npx prisma migrate deploy', {
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL: migrateUrl },
});
