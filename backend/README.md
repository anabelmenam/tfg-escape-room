# Backend multijugador

Servidor Node.js con Express 5 para la API HTTP, Socket.IO para la comunicación en tiempo real y Sequelize 6 para acceder a PostgreSQL. Express y Socket.IO comparten el mismo servidor HTTP y puerto. `pg` se mantiene como controlador PostgreSQL utilizado por Sequelize.

La presentación general, el arranque conjunto y las instrucciones de juego se encuentran en el [README principal](../README.md).

## Responsabilidades

- Registrar usuarios, autenticar sesiones y recuperar contraseñas.
- Gestionar los tres huecos de guardado de cada cuenta.
- Crear partidas y permitir que el segundo jugador se una mediante un código.
- Coordinar la selección de Mamá y Papá y el comienzo de la sesión.
- Validar las acciones antes de modificar el estado compartido.
- Sincronizar movimientos, inventarios, objetos, puzles y temporizador.
- Guardar el punto de continuación individual de cada jugador.
- Proporcionar operaciones privadas de administración.

## Arranque local

1. Desde la raíz del proyecto: `docker compose up -d postgres`
2. En otra terminal: `cd backend && cp .env.example .env && npm install`
3. Crear las tablas: `npm run migrate`
4. Arrancar el servidor: `npm run dev`

Al utilizar PostgreSQL mediante el archivo `docker-compose.yml`, debe
configurarse la conexión local en `backend/.env`:

```env
DATABASE_URL=postgres://escape_room:escape_room@localhost:5434/escape_room
FRONTEND_ORIGIN=http://localhost:5173
```

El servidor escucha en `http://localhost:3010` y Socket.IO usa el mismo puerto.
PostgreSQL del proyecto se publica en `localhost:5434` para no interferir con otras bases de datos locales que puedan usar `5432` o `5433`.

## Flujo actual

- Cada persona crea una cuenta con nombre, correo y contraseña, o inicia sesión con su cuenta existente.
- Cada cuenta dispone de tres huecos. En cada hueco puede crear una partida o unirse mediante un código.
- Los dos jugadores eligen a mamá o papá desde el lobby antes de empezar.
- El estado compartido de los puzles y los inventarios se guarda tras cada acción.
- La posición, orientación, habitación, diario y pistas de cada jugador se guardan como un punto de continuación individual.
- Al volver a entrar desde un hueco se recuperan la partida, el personaje elegido y el punto exacto en el que se dejó.
- Socket.IO recibe `auth: { roomId, playerToken }` al conectar y valida la pertenencia del jugador a esa partida.

## Cuenta de administración

Las cuentas con rol `admin` ven un apartado privado de pruebas con acceso directo a cada habitación y personaje, a la sala de iconos y al final. Para crear o actualizar una cuenta administradora:

```sh
ADMIN_EMAIL=correo ADMIN_PASSWORD=contraseña-segura ADMIN_NAME=nombre npm run admin:create
```

Para cambiar el correo de una cuenta existente, se puede indicar además `ADMIN_PREVIOUS_EMAIL`.

La primera regla cooperativa ya incluida es abrir `bedroom-exit-door` con mamá: desbloquea esa puerta para papá.

## Organización del código

- `src/server.js`: compone Express y Socket.IO, monta los módulos y arranca el servidor.
- `src/routes/`: agrupa las rutas HTTP de autenticación, administración y partidas.
- `src/services/roomService.js`: contiene las operaciones de salas, jugadores, lobby y comienzo de partida.
- `src/services/gameSessionService.js`: aplica acciones, sincroniza el temporizador y persiste puntos de continuación.
- `src/sockets/gameSocket.js`: autentica las conexiones y registra los eventos de tiempo real.
- `src/serverUtils.js`: reúne las utilidades compartidas por los módulos del servidor.

Esta separación mantiene el punto de entrada reducido y permite probar las reglas de dominio sin tener que iniciar el servidor completo.

## Modelos y migraciones

- `src/db.js`: conexión Sequelize configurada con `DATABASE_URL` y transacciones administradas.
- `src/models/index.js`: modelos de cuentas, sesiones, partidas, jugadores, estado, eventos y puntos de continuación. Los atributos JavaScript usan camelCase y las columnas PostgreSQL mantienen snake_case.
- `migrations/*.js`: migraciones con funciones `up` y `down`. El ejecutor les pasa `queryInterface`, `Sequelize` y `{ transaction }`, y registra su aplicación en `SequelizeMeta` dentro de la misma transacción.

Ejecuta `npm run migrate` tanto en una instalación nueva como en una base creada con las anteriores migraciones SQL. Se conservan las tablas y los datos existentes. No se utiliza `sync({ force: true })` ni `sync({ alter: true })`. Las migraciones ya registradas no vuelven a ejecutarse.

`npm run migrate:undo` revierte la última migración. Puede eliminar datos al revertir la creación de tablas. La migración que convierte la nomenclatura antigua a personajes no se revierte para evitar perder progreso.

## Recuperación de contraseña

El envío se realiza con Brevo. Configura `FRONTEND_ORIGIN`, `BREVO_API_KEY`, `EMAIL_FROM_ADDRESS` y `EMAIL_FROM_NAME` según el ejemplo de `.env.example`. El enlace enviado caduca a los 20 minutos, solo puede usarse una vez y al cambiar la contraseña se cierran las sesiones anteriores.

El comando `npm start` aplica automáticamente las migraciones pendientes antes de iniciar el servidor.

## Pruebas y comprobaciones

Las pruebas unitarias cubren autenticación, modelos, estado inicial, correo y reglas de dominio. Las pruebas de integración arrancan la aplicación de forma controlada para comprobar las rutas HTTP y la comunicación mediante Socket.IO.

```bash
npm test
```

Para generar el informe de cobertura y exigir un mínimo del 85 % de líneas:

```bash
npm run test:coverage
```

La comprobación completa valida la sintaxis de los módulos y las migraciones antes de ejecutar toda la suite:

```bash
npm run check
```

El informe HTML de cobertura se genera en `coverage/`.

## Comandos

| Comando | Finalidad |
| --- | --- |
| `npm run dev` | Aplica migraciones y arranca el servidor en modo observación. |
| `npm start` | Aplica migraciones y arranca el servidor para producción. |
| `npm test` | Ejecuta las pruebas unitarias y de integración. |
| `npm run test:coverage` | Genera cobertura y exige al menos un 85 % de líneas. |
| `npm run check` | Valida sintaxis, migraciones y toda la suite. |
| `npm run migrate` | Aplica las migraciones pendientes. |
| `npm run migrate:undo` | Revierte la última migración. |
| `npm run admin:create` | Crea o actualiza una cuenta administradora. |
