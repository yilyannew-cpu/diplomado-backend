/**
 * Arranque local con Postgres en Docker (un solo comando).
 *
 *   npm run local          → BD Docker + .env local + migrate + seed
 *   npm run local:dev      → lo anterior + npm run dev
 *
 * No afecta Render. Neon solo se usa en producción (dashboard).
 */
const { spawnSync, spawn } = require('child_process');
const { existsSync, copyFileSync, readFileSync } = require('fs');
const { join } = require('path');

const root = join(__dirname, '..');
const envPath = join(root, '.env');
const envExamplePath = join(root, '.env.example');
const args = process.argv.slice(2);
const withDev = args.includes('--dev');

function sleep(ms) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    /* wait */
  }
}

function log(msg) {
  console.log(`\n▶ ${msg}`);
}

function fail(msg, code = 1) {
  console.error(`\n✗ ${msg}`);
  process.exit(code);
}

function run(command, commandArgs, { optional = false, env = process.env } = {}) {
  const display = [command, ...commandArgs].join(' ');
  console.log(`\n> ${display}`);
  const result = spawnSync(command, commandArgs, {
    cwd: root,
    stdio: 'inherit',
    shell: true,
    env,
  });
  if (result.status !== 0 && !optional) {
    fail(`Falló: ${display}`, result.status ?? 1);
  }
  return result.status === 0;
}

function dockerAvailable() {
  const r = spawnSync('docker', ['info'], {
    cwd: root,
    stdio: 'pipe',
    shell: true,
  });
  return r.status === 0;
}

function ensureLocalEnv() {
  if (!existsSync(envExamplePath)) {
    fail('Falta .env.example en el repo');
  }

  if (!existsSync(envPath)) {
    copyFileSync(envExamplePath, envPath);
    log('Creado .env desde .env.example (Postgres local Docker)');
    return;
  }

  const content = readFileSync(envPath, 'utf8');
  if (/neon\.tech|onrender\.com/i.test(content)) {
    copyFileSync(envExamplePath, envPath);
    log('Tu .env apuntaba a Neon/producción → reemplazado por .env.example (local)');
    return;
  }

  if (!/127\.0\.0\.1|localhost/i.test(content)) {
    console.warn('\n⚠ .env no parece local. Se deja como está; revisa DATABASE_URL.\n');
  } else {
    log('.env local OK');
  }
}

function waitForPostgres(maxAttempts = 30) {
  log('Esperando a que Postgres (Docker) acepte conexiones…');
  for (let i = 1; i <= maxAttempts; i++) {
    const r = spawnSync(
      'docker',
      ['exec', 'ffcore-db', 'pg_isready', '-U', 'ffcore', '-d', 'ffcore'],
      { cwd: root, stdio: 'pipe', shell: true },
    );
    if (r.status === 0) {
      console.log(`  listo (intento ${i}/${maxAttempts})`);
      return;
    }
    sleep(1000);
  }
  fail(
    'Postgres no respondió a tiempo.\n' +
      '  Verifica Docker: docker ps\n' +
      '  Logs: docker logs ffcore-db',
  );
}

// --- Node 20+ ---
const nodeMajor = Number(process.versions.node.split('.')[0]);
if (nodeMajor < 20) {
  fail(`Se requiere Node.js 20+. Actual: ${process.versions.node}`);
}

console.log(`
═══════════════════════════════════════════════════════════
  FFCore — entorno LOCAL (Docker Postgres ≠ Neon prod)
═══════════════════════════════════════════════════════════
`);

if (!dockerAvailable()) {
  fail(
    'Docker no está disponible en este terminal.\n\n' +
      '  • Windows + Docker Desktop: abre PowerShell y vuelve a intentar.\n' +
      '  • Docker solo en Ubuntu/WSL: entra con `wsl` y corre `npm run local` ahí.\n' +
      '  • Sin Docker: instala Postgres y configura .env a mano (ver docs/DEPLOY-LOCAL.md).',
  );
}

ensureLocalEnv();

log('Levantando contenedor Postgres (docker-compose.yml)…');
run('docker', ['compose', 'up', '-d']);

waitForPostgres();

log('Instalando dependencias + migraciones + seed…');
run('node', ['scripts/setup.cjs']);

console.log(`
═══════════════════════════════════════════════════════════
✓ Base de datos LOCAL lista (contenedor ffcore-db)

  API:     http://localhost:3000/api/v1/health
  Login:   super@ffcore.co / demo
  Postgres: 127.0.0.1:5432  user/pass/db = ffcore

  Siguiente:
    npm run dev

  Parar BD:
    npm run db:down
═══════════════════════════════════════════════════════════
`);

if (withDev) {
  log('Iniciando API (npm run dev)…');
  const child = spawn('npm', ['run', 'dev'], {
    cwd: root,
    stdio: 'inherit',
    shell: true,
    env: process.env,
  });
  child.on('exit', (code) => process.exit(code ?? 0));
}
