# Estrategia de pruebas

La estrategia de calidad sigue una separación por responsabilidades: lógica aislada, reglas del servidor y comprobación completa de construcción. Está inspirada en la organización habitual de otros TFG web, pero adaptada a las necesidades de un juego 3D cooperativo.

## Objetivos

- Detectar regresiones en las reglas principales del juego.
- Comprobar casos correctos, límites y errores esperados.
- Mantener las pruebas rápidas e independientes de servicios externos siempre que sea posible.
- Poder ejecutar cliente y servidor por separado.
- Complementar la automatización con pruebas manuales para WebGL y multijugador.

## Pruebas del cliente

Ubicación: `frontend/test/unit/`.

| Área | Comportamiento comprobado |
| --- | --- |
| Inventario | Altas, duplicados, capacidad, selección, retirada, restauración y copias independientes. |
| Controles | Teclas pulsadas y liberadas, pérdida de foco y eliminación de listeners. |
| Colisiones | Límites, suelo, techo, objetos sólidos y paso por puertas. |
| Laberinto | Continuidad, reversibilidad y límites de la ruta oficial. |
| Pistas | Validación de entradas y progresión contextual de Mamá y Papá. |
| Audio | Volúmenes, sonido de éxito, recogida y cadencia de pasos. |
| Linterna | Requisito de inventario, encendido y seguimiento de cámara. |
| Idiomas | Cambio de idioma, evento de interfaz y fallbacks. |
| Estado y eventos | Almacenamiento, alternancia, notificación y limpieza. |

Ejecución:

```bash
cd frontend
npm test
```

Cobertura:

```bash
npm run test:coverage
```

Comprobación completa:

```bash
npm run check
```

## Pruebas del servidor

Ubicación: `backend/test/unit/`.

| Área | Comportamiento comprobado |
| --- | --- |
| Estado inicial | Estructura de partida e independencia entre instancias. |
| Autenticación | Sal aleatoria, verificación correcta e incorrecta y hashes mal formados. |
| Privacidad | Exclusión de credenciales en la representación pública del usuario. |
| Correo | Configuración obligatoria, escape HTML, cuerpo de texto y errores del proveedor. |
| Modelos | Roles, estados de partida, personajes y límites de huecos guardados. |

Las pruebas de correo sustituyen la petición externa por una respuesta controlada: no envían mensajes reales. Las validaciones de modelos tampoco escriben en PostgreSQL.

Ejecución:

```bash
cd backend
npm test
```

Cobertura:

```bash
npm run test:coverage
```

Comprobación completa:

```bash
npm run check
```

## Interpretación de la cobertura

El informe nativo de Node.js muestra la cobertura de los módulos cargados por la suite. Un porcentaje alto no implica que toda la aplicación esté cubierta: debe interpretarse junto con la lista de archivos incluida en el informe.

La cobertura sirve para localizar ramas no ejercitadas, no como sustituto de casos de prueba significativos.

## Validación manual recomendada

Algunas características dependen de renderizado WebGL, bloqueo del puntero, sonido del navegador y sincronización entre clientes. Antes de una entrega se recomienda comprobar:

1. Registro, inicio y cierre de sesión.
2. Creación de una partida y unión mediante código.
3. Selección exclusiva de Mamá y Papá.
4. Inicio únicamente cuando ambos jugadores están conectados.
5. Sincronización de movimientos, inventarios y puzles.
6. Reconexión y recuperación del punto de continuación.
7. Recorrido completo de los puzles en ambos personajes.
8. Sonido de éxito tras cada puzle.
9. Recogida, selección e inspección de todos los objetos.
10. Secuencia final sin personajes visibles ni saltos de imagen.
11. Cambio de idioma durante la partida.
12. Funcionamiento con distintos tamaños de pantalla.

## Incorporación de nuevos tests

- Añadir pruebas del cliente en `frontend/test/unit/`.
- Añadir pruebas del servidor en `backend/test/unit/`.
- Utilizar nombres terminados en `.test.js`.
- Mantener cada prueba independiente y restaurar cualquier variable global modificada.
- Evitar conexiones reales de red, correos o escrituras en producción.
- Incluir al menos un caso correcto y uno límite o de error para cada regla relevante.
- Ejecutar `npm run check` en ambos paquetes antes de integrar cambios.

