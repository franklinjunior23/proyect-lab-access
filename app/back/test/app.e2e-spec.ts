import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

// UIDs de tarjetas RFID simuladas
const UID_VALIDO   = 'AABB1122';
const UID_INVALIDO = 'DEADBEEF';

describe('LabGate — Simulación de acceso (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let userId: number;

  // ----------------------------------------------------------------
  // Setup: levantar la app y limpiar la BD de test
  // ----------------------------------------------------------------
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);

    // Limpiar datos de ejecuciones anteriores
    await prisma.accessLog.deleteMany();
    await prisma.user.deleteMany();
    await prisma.adminUser.deleteMany();
  });

  afterAll(async () => {
    await prisma.accessLog.deleteMany();
    await prisma.user.deleteMany();
    await prisma.adminUser.deleteMany();
    await app.close();
  });

  // ================================================================
  // 1. Autenticación del administrador
  // ================================================================
  describe('1 · Autenticación', () => {
    it('registra un nuevo admin', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ username: 'admin-test', password: 'pass123' })
        .expect(201);

      expect(res.body.username).toBe('admin-test');
    });

    it('inicia sesión y obtiene token JWT', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'admin-test', password: 'pass123' })
        .expect(201);

      expect(res.body.accessToken).toBeDefined();
      token = res.body.accessToken;
    });

    it('rechaza credenciales incorrectas', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'admin-test', password: 'wrong' })
        .expect(401);
    });
  });

  // ================================================================
  // 2. Gestión de usuarios RFID
  // ================================================================
  describe('2 · Gestión de usuarios', () => {
    it('crea un usuario con UID de tarjeta RFID', async () => {
      const res = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Ana García', uid: UID_VALIDO })
        .expect(201);

      expect(res.body.uid).toBe(UID_VALIDO);
      expect(res.body.active).toBe(true);
      userId = res.body.id;
    });

    it('rechaza UID duplicado', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Otro', uid: UID_VALIDO })
        .expect(409);
    });

    it('lista los usuarios registrados', async () => {
      const res = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.length).toBe(1);
      expect(res.body[0].name).toBe('Ana García');
    });
  });

  // ================================================================
  // 3. Simulación de tap RFID — acceso concedido
  // ================================================================
  describe('3 · Tap RFID — acceso concedido', () => {
    it('concede acceso a tarjeta registrada y activa', async () => {
      const res = await request(app.getHttpServer())
        .post('/access')
        .send({ uid: UID_VALIDO })
        .expect(201);

      expect(res.body.granted).toBe(true);
      expect(res.body.log.result).toBe('ACCESS_GRANTED');
      expect(res.body.log.uid).toBe(UID_VALIDO);
    });
  });

  // ================================================================
  // 4. Simulación de tap RFID — UID desconocido
  // ================================================================
  describe('4 · Tap RFID — UID desconocido', () => {
    it('deniega acceso a tarjeta no registrada', async () => {
      const res = await request(app.getHttpServer())
        .post('/access')
        .send({ uid: UID_INVALIDO })
        .expect(201);

      expect(res.body.granted).toBe(false);
      expect(res.body.log.result).toBe('ACCESS_DENIED');
      expect(res.body.log.description).toContain(UID_INVALIDO);
    });
  });

  // ================================================================
  // 5. Simulación de tap RFID — usuario desactivado
  // ================================================================
  describe('5 · Tap RFID — usuario inactivo', () => {
    it('desactiva al usuario', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/users/${userId}/toggle`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.active).toBe(false);
    });

    it('deniega acceso aunque el UID exista (usuario inactivo)', async () => {
      const res = await request(app.getHttpServer())
        .post('/access')
        .send({ uid: UID_VALIDO })
        .expect(201);

      expect(res.body.granted).toBe(false);
      expect(res.body.log.result).toBe('ACCESS_DENIED');
    });

    it('vuelve a conceder acceso al reactivar el usuario', async () => {
      await request(app.getHttpServer())
        .patch(`/users/${userId}/toggle`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const res = await request(app.getHttpServer())
        .post('/access')
        .send({ uid: UID_VALIDO })
        .expect(201);

      expect(res.body.granted).toBe(true);
    });
  });

  // ================================================================
  // 6. Verificación de logs
  // ================================================================
  describe('6 · Historial de accesos', () => {
    it('registró todos los intentos en la BD', async () => {
      const res = await request(app.getHttpServer())
        .get('/access/logs')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // concedido + denegado (desconocido) + denegado (inactivo) + concedido
      expect(res.body.length).toBe(4);
    });

    it('los logs incluyen el nombre del usuario cuando aplica', async () => {
      const res = await request(app.getHttpServer())
        .get('/access/logs')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const conUsuario = res.body.filter(
        (l: { user: { name: string } | null }) => l.user !== null,
      );
      expect(conUsuario.length).toBeGreaterThan(0);
      expect(conUsuario[0].user.name).toBe('Ana García');
    });

    it('requiere JWT para ver los logs', async () => {
      await request(app.getHttpServer()).get('/access/logs').expect(401);
    });
  });
});
