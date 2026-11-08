# Cliente web

Cliente de *La casa entre dos mundos*, un escape room cooperativo en primera persona. React gestiona las pantallas y menús, mientras que Three.js construye la casa, sus objetos interactivos y los puzles. Socket.IO mantiene sincronizados a Mamá y Papá durante la partida.

La documentación general, la instalación completa y la explicación de la experiencia se encuentran en el [README principal](../README.md).

## Funcionalidades

- Registro, inicio de sesión y recuperación de contraseña.
- Menú principal, tres huecos de guardado y sala de espera cooperativa.
- Selección exclusiva de Mamá o Papá.
- Casa tridimensional explorable en primera persona.
- Inventario, inspección de objetos, diario narrativo y pistas contextuales.
- Sincronización de movimientos, objetos, inventarios y puzles.
- Ajustes persistentes de audio, sensibilidad e idioma.
- Interfaces en español, inglés y francés.
- Menú de administración con recorridos de prueba y previsualización del final.

## Tecnologías

- React 19 y React DOM.
- Vite 7.
- Three.js, `three-mesh-bvh` y `three-bvh-csg`.
- Socket.IO Client.
- Tailwind CSS y PostCSS.
- Lucide React.
- ESLint, `node:test`, `tsx` y c8 para calidad y pruebas.

## Organización

```text
frontend/
├── public/                    # Audio, imágenes, modelos, texturas y marca
├── src/
│   ├── components/            # Acceso, menús, lobby, HUD y overlays
│   │   └── menu/settings/     # Paneles de sonido, juego e idioma
│   ├── game/
│   │   ├── controllers/       # Control del jugador y sincronización
│   │   ├── ending/            # Recorrido y salida final
│   │   ├── hints/             # Selección contextual de pistas
│   │   └── managers/          # Entidades, colisiones, eventos e interacción
│   ├── services/              # API HTTP y dirección de Socket.IO
│   ├── translations/          # Textos en español, inglés y francés
│   └── world/
│       ├── objects/           # Mobiliario, decoración y utilidades de malla
│       ├── puzzles/           # Puzles agrupados por habitación
│       └── rooms/             # Construcción y configuración de cada estancia
└── test/
    ├── integration/           # Construcción conjunta del nivel
    ├── unit/                  # Componentes y lógica aislada
    └── helpers/               # Simulaciones del navegador
```

## Arranque local

El servidor debe estar disponible antes de entrar en una partida multijugador. Desde este directorio:

```bash
npm install
npm run dev
```

Vite muestra la dirección local, normalmente `http://localhost:5173`.

En desarrollo, el cliente utiliza `http://localhost:3010` para la API y Socket.IO. Para usar otro servidor puede crearse un archivo `.env.local`:

```env
VITE_API_URL=http://localhost:3010
VITE_SOCKET_URL=http://localhost:3010
```

`VITE_API_URL` define el origen de las peticiones HTTP. `VITE_SOCKET_URL` permite configurar por separado la conexión en tiempo real.

## Comandos

| Comando | Finalidad |
| --- | --- |
| `npm run dev` | Inicia Vite con recarga en caliente. |
| `npm run build` | Genera la versión de producción en `dist/`. |
| `npm run preview` | Sirve localmente la compilación de producción. |
| `npm run lint` | Ejecuta ESLint. |
| `npm test` | Ejecuta las pruebas unitarias y de integración. |
| `npm run test:coverage` | Genera informes de cobertura en texto y HTML. |
| `npm run check` | Ejecuta lint, pruebas y compilación de producción. |

## Modo de pruebas

Durante el desarrollo se pueden abrir recorridos locales sin crear una sala ni conectar un segundo navegador:

```text
http://localhost:5173/?character=mum
http://localhost:5173/?character=dad
http://localhost:5173/?test=icons
http://localhost:5173/?test=ending
```

Los recorridos de `mum` y `dad` permiten visitar toda la casa con el personaje elegido. Las rutas solo se aceptan en modo de desarrollo. Las cuentas administradoras también pueden abrirlas desde el menú de pruebas.

## Pruebas

La suite comprueba componentes React, inventario, entrada de teclado, controladores, audio, colisiones, traducciones, pistas, creación del mundo, comportamiento del mobiliario y secuencia final.

```bash
npm test
npm run test:coverage
npm run check
```

El renderizado WebGL, el bloqueo del puntero, el audio del navegador y la sincronización entre dos clientes también requieren una comprobación manual. La estrategia completa se describe en [docs/TESTING.md](../docs/TESTING.md).

## Producción

```bash
npm run build
npm run preview
```

La configuración de Vercel se encuentra en `vercel.json`. Las rutas `/api/*` se reescriben hacia el servidor desplegado y el resto de rutas sirven la aplicación de página única. La conexión Socket.IO de producción puede definirse con `VITE_SOCKET_URL`.
