/**
 * Crea/actualiza el superadmin demo (idempotente, NO borra datos).
 * Para producción/Docker (sin tsx):
 *   node scripts/ensure-superadmin.cjs
 *
 * Credenciales:
 *   super@ffcore.co / demo
 *   Portal: /login/gobernanza
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const EMAIL = 'super@ffcore.co';
const PASSWORD = 'demo';
const USER_ID = 'usr-super';

async function main() {
  const prisma = new PrismaClient();

  try {
    // Comprueba que las migraciones ya crearon la tabla users
    await prisma.$queryRaw`SELECT 1 FROM users LIMIT 1`;
  } catch (e) {
    console.error('[superadmin] ERROR: la tabla "users" no existe.');
    console.error('[superadmin] Primero aplica migraciones:');
    console.error('  npx prisma migrate deploy');
    console.error('[superadmin] Las migraciones están en: prisma/migrations/ (15 carpetas en el repo).');
    await prisma.$disconnect();
    process.exit(1);
  }

  try {
    const passwordHash = await bcrypt.hash(PASSWORD, 10);

    await prisma.user.upsert({
      where: { email: EMAIL },
      create: {
        id: USER_ID,
        name: 'Super Admin',
        email: EMAIL,
        password_hash: passwordHash,
        role: 'superadmin',
        status: 'Activo',
        phone: '+573005550001',
      },
      update: {
        name: 'Super Admin',
        password_hash: passwordHash,
        role: 'superadmin',
        status: 'Activo',
      },
    });

    console.log('[superadmin] OK');
    console.log(`  Email:    ${EMAIL}`);
    console.log(`  Password: ${PASSWORD}`);
    console.log('  Portal:   /login/gobernanza');
  } catch (e) {
    console.error('[superadmin] Error al crear usuario:', e.message ?? e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
