# Backend multijugador

Servidor Node.js con Express 5 para la API HTTP, Socket.IO para la comunicación en tiempo real y Sequelize 6 para acceder a PostgreSQL. Express y Socket.IO comparten el mismo servidor HTTP y puerto. `pg` se mantiene como controlador PostgreSQL utilizado por Sequelize.

## Arranque local

1. Desde la raíz del proyecto: `docker compose up -d postgres`
2. En otra terminal: `cd backend && cp .env.example .env && npm install`
3. Crear las tablas: `npm run migrate`
4. Arrancar el servidor: `npm run dev`

El servidor escucha en `http://localhost:3010` y Socket.IO usa el mismo puerto.
PostgreSQL del proyecto se publica en `localhost:5434` para no interferir con otras bases de datos locales que puedan usar `5432` o `5433`.

## Flujo actual

- `POST /api/rooms` con `{ "displayName": "Ana" }`: crea sala y sesión de jugador.
- `POST /api/rooms/:joinCode/join` con el nombre: añade otro jugador a la sala.
- Los jugadores eligen pasado o presente desde el lobby antes de empezar.
- Socket.IO recibe `auth: { roomId, playerToken }` al conectar.
- `game:action` valida, guarda y difunde cambios de estado a ambos jugadores.
- `player:movement` se reenvía en tiempo real, sin persistirse.

La primera regla entre tiempos ya incluida es abrir `bedroom-exit-door` en el pasado: desbloquea esa puerta en el presente.

## Modelos y migraciones

- `src/db.js`: conexión Sequelize configurada con `DATABASE_URL` y transacciones administradas.
- `src/models/index.js`: modelos User, GameRoom, RoomPlayer, GameState y GameEvent, asociados a las tablas existentes. Los atributos JavaScript usan camelCase y las columnas PostgreSQL mantienen snake_case.
- `migrations/*.js`: migraciones con funciones `up` y `down`. El ejecutor les pasa `queryInterface`, `Sequelize` y `{ transaction }`, y registra su aplicación en `SequelizeMeta` dentro de la misma transacción.

Ejecuta `npm run migrate` tanto en una instalación nueva como en una base creada con las anteriores migraciones SQL. Se conservan las tablas y los datos existentes; no se utiliza `sync({ force: true })` ni `sync({ alter: true })`. Las migraciones ya registradas no vuelven a ejecutarse.

`npm run migrate:undo` revierte la última migración. Puede eliminar datos al revertir la creación de tablas. La reversión de la selección de época exige que todos los jugadores tengan una época asignada; si no es así, falla sin aplicar cambios.

## Comprobación de sintaxis

`npm run check` comprueba la sintaxis del backend.
