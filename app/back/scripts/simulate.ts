/**
 * simulate.ts — Simulación de uso real de LabGate
 *
 * Crea usuarios de prueba y simula una secuencia de taps RFID
 * como si la Raspberry Pi Pico W estuviera conectada.
 * Los eventos aparecen en tiempo real en el dashboard.
 *
 * Uso: pnpm simulate  (el backend debe estar corriendo en :3001)
 */

import 'dotenv/config';

const API = process.env.SIMULATE_API_URL ?? 'http://localhost:3001';
const DELAY_MS = 1200; // pausa entre taps para que se vean en el live feed

// ─── Usuarios ficticios con sus UIDs de tarjeta ───────────────────
const USUARIOS = [
  { name: 'Ana García',    uid: 'A1B2C3D4' },
  { name: 'Carlos López',  uid: 'E5F6A7B8' },
  { name: 'María Torres',  uid: 'C9D0E1F2' },
];

// ─── Secuencia de taps RFID a simular ─────────────────────────────
// null = UID desconocido (tarjeta no registrada)
const SECUENCIA: Array<string | null> = [
  'A1B2C3D4',   // Ana  → concedido
  'E5F6A7B8',   // Carlos → concedido
  'DEADBEEF',   // desconocido → denegado
  'C9D0E1F2',   // María → concedido
  'A1B2C3D4',   // Ana  → concedido
  'BABE0000',   // desconocido → denegado
  'E5F6A7B8',   // Carlos → concedido (luego lo desactivaremos)
  'C9D0E1F2',   // María → concedido
  'A1B2C3D4',   // Ana  → concedido
  'DEADBEEF',   // desconocido → denegado
];


// ─── Helpers ──────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function post<T>(path: string, body: unknown, token?: string): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return res.json() as Promise<T>;
}

async function patch<T>(path: string, token: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json() as Promise<T>;
}

async function get<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json() as Promise<T>;
}

function log(emoji: string, msg: string) {
  console.log(`${emoji}  ${msg}`);
}


// ─── Pasos de la simulación ────────────────────────────────────────

async function obtenerToken(): Promise<string> {
  log('🔐', 'Iniciando sesión como admin...');

  // Intentar login directo; si falla, registrar primero
  const loginRes = await post<{ accessToken?: string; message?: string }>(
    '/auth/login',
    { username: 'admin', password: 'admin123' },
  );

  if (loginRes.accessToken) {
    log('✅', 'Login exitoso');
    return loginRes.accessToken;
  }

  // El admin no existe todavía, registrarlo
  await post('/auth/register', { username: 'admin', password: 'admin123' });
  const retry = await post<{ accessToken: string }>(
    '/auth/login',
    { username: 'admin', password: 'admin123' },
  );
  log('✅', 'Admin registrado y logueado');
  return retry.accessToken;
}

async function crearUsuarios(token: string): Promise<Record<string, number>> {
  log('\n👥', 'Creando usuarios de prueba...');
  const ids: Record<string, number> = {};

  for (const u of USUARIOS) {
    // Evitar duplicados: primero listar y ver si ya existe
    const existentes = await get<Array<{ id: number; uid: string }>>('/users', token);
    const yaExiste = existentes.find((e) => e.uid === u.uid);

    if (yaExiste) {
      log('⏭ ', `${u.name} (${u.uid}) ya existe — omitiendo`);
      ids[u.uid] = yaExiste.id;
      continue;
    }

    const creado = await post<{ id: number }>('/users', u, token);
    ids[u.uid] = creado.id;
    log('➕', `Usuario creado: ${u.name}  [${u.uid}]`);
    await sleep(300);
  }

  return ids;
}

async function simularTaps() {
  log('\n📡', `Simulando ${SECUENCIA.length} taps RFID...`);
  log('   ', `Abre el dashboard en http://localhost:3000 para verlos en tiempo real\n`);
  await sleep(2000);

  for (const uid of SECUENCIA) {
    const uidReal = uid ?? 'CAFE' + Math.floor(Math.random() * 9999).toString(16).toUpperCase().padStart(4, '0');

    const res = await post<{ granted: boolean; log: { result: string; description: string } }>(
      '/access',
      { uid: uidReal },
    );

    const icono  = res.log.result === 'ACCESS_GRANTED' ? '🟢' : '🔴';
    const estado = res.log.result === 'ACCESS_GRANTED' ? 'CONCEDIDO' : 'DENEGADO ';
    log(icono, `[${uidReal}]  ${estado}  — ${res.log.description}`);

    await sleep(DELAY_MS);
  }
}

async function simularUsuarioInactivo(token: string, ids: Record<string, number>) {
  const carlos = USUARIOS.find((u) => u.name === 'Carlos López')!;
  const id = ids[carlos.uid];

  log('\n🔒', 'Desactivando a Carlos López para simular acceso denegado...');
  await patch(`/users/${id}/toggle`, token);
  await sleep(500);

  const res = await post<{ granted: boolean; log: { result: string; description: string } }>(
    '/access',
    { uid: carlos.uid },
  );
  const icono = res.log.result === 'ACCESS_GRANTED' ? '🟢' : '🔴';
  log(icono, `[${carlos.uid}]  ${res.log.result}  — ${res.log.description}`);

  await sleep(800);
  log('🔓', 'Reactivando a Carlos López...');
  await patch(`/users/${id}/toggle`, token);
}

async function mostrarResumen(token: string) {
  const logs = await get<Array<{ result: string }>>('/access/logs', token);
  const concedidos = logs.filter((l) => l.result === 'ACCESS_GRANTED').length;
  const denegados  = logs.filter((l) => l.result === 'ACCESS_DENIED').length;

  log('\n📊', '─────────── Resumen ───────────');
  log('   ', `Total de accesos registrados : ${logs.length}`);
  log('🟢', `Concedidos                   : ${concedidos}`);
  log('🔴', `Denegados                    : ${denegados}`);
  log('   ', '───────────────────────────────\n');
}


// ─── Main ──────────────────────────────────────────────────────────

async function main() {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║   LabGate — Simulador de acceso      ║');
  console.log('╚══════════════════════════════════════╝\n');

  try {
    const token = await obtenerToken();
    const ids   = await crearUsuarios(token);

    await simularTaps();
    await simularUsuarioInactivo(token, ids);
    await mostrarResumen(token);

    log('🎉', 'Simulación completada. Revisa el dashboard en http://localhost:3000\n');
  } catch (e) {
    console.error('\n❌ Error:', e);
    console.error('   ¿Está corriendo el backend? → pnpm back\n');
    process.exit(1);
  }
}

main();
