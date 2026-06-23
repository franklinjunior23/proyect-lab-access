# LabGate — Sistema IoT de Control de Acceso a Laboratorio

Proyecto final del curso de Fundamentos de Programación. Sistema inteligente de control de acceso para un laboratorio, con hardware real, firmware en MicroPython, API REST y dashboard web en tiempo real.

## Estructura del repositorio

```
proyect-Lab-access/
├── firmware/               ← MicroPython para Raspberry Pi Pico W
│   ├── config.py           ← pines, URL, WiFi, tiempos (fuente única de verdad)
│   ├── wifi_manager.py
│   ├── leds.py
│   ├── buzzer.py
│   ├── servo.py
│   ├── sensor.py
│   ├── rfid.py
│   ├── http_client.py
│   └── main.py
├── app/
│   ├── back/               ← API REST NestJS + Prisma + SQLite
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── seed.ts
│   │   │   └── migrations/
│   │   ├── prisma.config.ts
│   │   ├── src/
│   │   │   ├── generated/prisma/   ← cliente Prisma generado (no editar)
│   │   │   ├── prisma/             ← PrismaModule + PrismaService (LibSQL adapter)
│   │   │   ├── auth/               ← JWT login/register, JwtStrategy, JwtAuthGuard
│   │   │   ├── users/              ← CRUD usuarios RFID
│   │   │   ├── access/             ← validación RFID + logs
│   │   │   ├── events/             ← SSE stream en tiempo real
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   └── .env
│   └── ui/                 ← Dashboard Next.js 16 + Tailwind + TypeScript
│       ├── src/
│       │   ├── app/
│       │   │   ├── (auth)/login/       ← pantalla de login
│       │   │   └── (dashboard)/
│       │   │       ├── dashboard/      ← stats + live feed SSE
│       │   │       ├── users/          ← CRUD usuarios RFID
│       │   │       └── logs/           ← historial filtrable
│       │   ├── features/
│       │   │   ├── auth/hooks/useAuth.ts
│       │   │   ├── access/hooks/useAccessLogs.ts + useLiveFeed.ts
│       │   │   ├── access/components/LiveFeed.tsx + LogTable.tsx
│       │   │   ├── users/hooks/useUsers.ts
│       │   │   └── users/components/UserTable.tsx + UserForm.tsx
│       │   ├── components/ui/      ← Badge, Button, Card (globales)
│       │   └── lib/
│       │       ├── api.ts          ← fetch wrapper con JWT automático
│       │       └── socket.ts       ← cliente SSE (EventSource)
│       └── .env.local
├── package.json            ← raíz del monorepo pnpm
└── pnpm-workspace.yaml
```

## Hardware

| Componente | Función | Pin Pico W |
|---|---|---|
| Raspberry Pi Pico W | Microcontrolador principal con Wi-Fi | — |
| Lector RFID MFRC522 | Lee tarjetas vía SPI0 | SCK=18, MOSI=19, MISO=16, CS=17, RST=20 |
| Servomotor SG90 | Abre/cierra la tranca de la puerta | GP12 |
| Buzzer Activo | Feedback sonoro | GP13 |
| LED Verde | Acceso concedido | GP15 |
| LED Rojo | Acceso denegado | GP14 |
| Sensor HC-SR04 | Detecta puerta abierta | TRIG=GP3, ECHO=GP2 |

## Stack de Software

| Capa | Tecnología |
|---|---|
| Firmware | MicroPython (Pico W) |
| Backend/API | NestJS 11 (TypeScript) |
| ORM | Prisma 7 + driver adapter LibSQL |
| Base de datos | SQLite `dev.db` (dev) |
| Frontend | Next.js 16 + React 19 + Tailwind 4 |
| Tiempo real | SSE — `@Sse()` en NestJS, `EventSource` en Next.js |
| Auth | JWT (`@nestjs/jwt`) + bcrypt — modelo `AdminUser` |
| Gestor de paquetes | pnpm 11 (monorepo workspace) |

## Puertos

| Servicio | Puerto |
|---|---|
| Backend (NestJS) | **3001** |
| Frontend (Next.js) | **3000** |

## Credenciales por defecto

| Campo | Valor |
|---|---|
| Usuario | `admin` |
| Contraseña | `admin123` |

> Creadas por `prisma/seed.ts`. Correr con `pnpm --filter back seed`.

## Comandos útiles

```bash
# Desde la raíz — levantar todo
pnpm dev

# Solo backend
pnpm back

# Solo frontend
pnpm ui

# Formatear ambos proyectos
pnpm format

# Tests unitarios del backend (12 tests)
pnpm --filter back test

# Seed de la BD
pnpm --filter back seed

# Nueva migración de Prisma
cd app/back && npx prisma migrate dev --name nombre
```

## Endpoints del backend

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| POST | `/auth/login` | Login → devuelve `accessToken` | No |
| POST | `/auth/register` | Crear admin | No |
| GET | `/users` | Listar usuarios RFID | JWT |
| GET | `/users/:id` | Ver usuario | JWT |
| POST | `/users` | Crear usuario RFID | JWT |
| PATCH | `/users/:id` | Editar usuario | JWT |
| PATCH | `/users/:id/toggle` | Activar/desactivar | JWT |
| DELETE | `/users/:id` | Eliminar | JWT |
| POST | `/access` | Validar UID RFID (Pico W) | No |
| GET | `/access/logs` | Historial de accesos | JWT |
| GET | `/events` | Stream SSE en tiempo real | No |

## Modelos de base de datos (Prisma)

> Estándar: todos los campos en inglés. El frontend formatea los labels.

```prisma
model User {
  id        Int         @id @default(autoincrement())
  name      String
  uid       String      @unique
  active    Boolean     @default(true)
  createdAt DateTime    @default(now())
  accesses  AccessLog[]
}

model AccessLog {
  id          Int      @id @default(autoincrement())
  uid         String
  result      Result
  description String?
  timestamp   DateTime @default(now())
  userId      Int?
  user        User?    @relation(fields: [userId], references: [id])
}

model AdminUser {
  id        Int      @id @default(autoincrement())
  username  String   @unique
  password  String
  createdAt DateTime @default(now())
}

enum Result {
  ACCESS_GRANTED
  ACCESS_DENIED
}
```

## Flujo principal

1. Pico W conecta al WiFi → llama a `wifi_manager.conectar_wifi()`
2. Loop principal detecta tarjeta con `rfid.detectar_tarjeta()`
3. Lee UID con `rfid.leer_uid()` → envía `POST /access` vía `http_client`
4. Backend valida UID en BD con Prisma → registra en `AccessLog` → emite evento SSE
5. **Si concedido** → `servo.abrir()`, `leds.indicar_concedido()`, `buzzer.beep_concedido()`
6. **Si denegado** → `leds.indicar_denegado()`, `buzzer.beep_denegado()`
7. `sensor.puerta_abierta()` monitorea HC-SR04 → `buzzer.beep_alerta()` si pasa el umbral
8. Dashboard recibe el evento SSE en tiempo real → actualiza live feed

## Arquitectura del backend (modular NestJS)

```
Controller → Service → Repository → PrismaService → LibSQL → dev.db
```

Cada dominio (`auth`, `users`, `access`, `events`) tiene su propio módulo. `PrismaModule` es global.

## Firmware — Dependencias entre módulos

```
config.py          ← sin imports propios
wifi_manager       ← config
leds / buzzer / servo / sensor / rfid  ← config
http_client        ← config
main               ← todos los anteriores
```

## Restricciones de rúbrica (firmware MicroPython) ✅

- `if/else` — en `main.py` (resultado del acceso), `sensor.py` (distancia), `wifi_manager.py`
- `while` — loop principal en `main.py`, polling en `rfid.py`, timeout en `wifi_manager.py`
- `for` — conversión de UID en `rfid.py`, lectura de FIFO, `beep_alerta()` en `buzzer.py`
- Funciones modulares — cada archivo expone funciones pequeñas y enfocadas
- Código comentado — cada función documentada, cada sección con cabecera

## Decisiones técnicas clave

- **SSE sobre WebSockets**: comunicación unidireccional suficiente para notificaciones. `EventSource` nativo del browser, sin librerías extra.
- **LibSQL adapter (Prisma 7)**: Prisma 7 eliminó la URL del schema y requiere driver adapter. Se usa `@prisma/adapter-libsql` para SQLite local.
- **Prisma output local** (`src/generated/prisma`): pnpm no hoistea `.prisma/client` correctamente en workspaces; generar a ruta local resuelve el problema de tipos.
- **Puerto 3001 para el backend**: Next.js ocupa el 3000 por defecto; NestJS se mueve al 3001 para evitar conflicto en `pnpm dev`.
- **config.py como fuente única**: todos los pines y constantes del firmware viven en un solo archivo; cambiar un pin no requiere tocar múltiples módulos.
