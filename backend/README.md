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

- Cada persona crea una cuenta con nombre, correo y contraseña, o inicia sesión con su cuenta existente.
- Cada cuenta dispone de tres huecos. En cada hueco puede crear una partida o unirse mediante un código.
- Los dos jugadores eligen pasado o presente desde el lobby antes de empezar.
- El estado compartido de los puzles y los inventarios se guarda tras cada acción.
- La posición, orientación, habitación, diario y pistas de cada jugador se guardan como un punto de continuación individual.
- Al volver a entrar desde un hueco se recuperan la partida, el mundo elegido y el punto exacto en el que se dejó.
- Socket.IO recibe `auth: { roomId, playerToken }` al conectar y valida la pertenencia del jugador a esa partida.

## Cuenta de administración

Las cuentas con rol `admin` ven un apartado privado de pruebas con acceso directo a cada habitación y mundo, a la sala de iconos y al final. Para crear o actualizar una cuenta administradora:

```sh
ADMIN_EMAIL=correo ADMIN_PASSWORD=contraseña-segura ADMIN_NAME=nombre npm run admin:create
```

Para cambiar el correo de una cuenta existente, se puede indicar además `ADMIN_PREVIOUS_EMAIL`.

La primera regla entre tiempos ya incluida es abrir `bedroom-exit-door` en el pasado: desbloquea esa puerta en el presente.

## Modelos y migraciones

- `src/db.js`: conexión Sequelize configurada con `DATABASE_URL` y transacciones administradas.
- `src/models/index.js`: modelos de cuentas, sesiones, partidas, jugadores, estado, eventos y puntos de continuación. Los atributos JavaScript usan camelCase y las columnas PostgreSQL mantienen snake_case.
- `migrations/*.js`: migraciones con funciones `up` y `down`. El ejecutor les pasa `queryInterface`, `Sequelize` y `{ transaction }`, y registra su aplicación en `SequelizeMeta` dentro de la misma transacción.

Ejecuta `npm run migrate` tanto en una instalación nueva como en una base creada con las anteriores migraciones SQL. Se conservan las tablas y los datos existentes; no se utiliza `sync({ force: true })` ni `sync({ alter: true })`. Las migraciones ya registradas no vuelven a ejecutarse.

`npm run migrate:undo` revierte la última migración. Puede eliminar datos al revertir la creación de tablas. La reversión de la selección de época exige que todos los jugadores tengan una época asignada; si no es así, falla sin aplicar cambios.

## Comprobación de sintaxis

`npm run check` comprueba la sintaxis del backend.
