# Contribución al repositorio

## Reglas para el código
Para garantizar la consistencia en todo el código fuente, ten en cuenta estas reglas mientras trabajas:
- **El suite de tests debe seguir en verde.** No se mergea un PR con tests rojos.
- **Toda funcionalidad nueva o corrección de bug necesita un test unitario** que falle sin el cambio y pase con él. Un test que pasa antes y después no prueba nada.
- **No hace falta test cuando el cambio no altera comportamiento**: documentación, configuración, renombres o formato.
- Los tests viven en `api/test/spec/` y se ejecutan con `pnpm exec vitest run` desde `api/`.
- **Los tests importan el archivo concreto, nunca un barrel** como `@core/utils` o `@core/store`. Esos barrels alcanzan `valkey-client.ts`, que abre una conexión real a la caché al importarse, y `@/config/enviroment` puede terminar el proceso. Un test que importa un barrel deja de ser hermético.
- Todos los métodos de la API deben ser documentados
- Se recomienda seguir [Guia de Estilo de Javascript de Google](https://google.github.io/styleguide/jsguide.html)

## Directrices para commits
Se tiene recomendaciones muy precisas sobre el formato de los commits de git. Esto conduce a mensajes más legibles que son fáciles de seguir cuando se mira a través del historial del proyecto.

### Formato de mensaje de commits
Cada mensaje de confirmación consta de una cabecera, un cuerpo y un pie de página. La cabecera tiene un formato especial que incluye un tipo, un ámbito y un asunto:

```
<type>[<repo>](<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```
El **encabezado** es obligatorio, el **scope** del encabezado es obligatorio con algunas excepciones.

Ninguna línea del mensaje de confirmación puede tener más de 100 caracteres. Esto permite que el mensaje sea más fácil de leer en GitHub, así como en varias herramientas git.

Ejemplos:

```
docs(readme): documenta los nuevas rutas
```
```
feat(api): agrega la funcionalida de login
```
```
fix(frontend): soluciona bug  de frontend

The version in our package.json gets copied to the one we publish, and users need the latest of these.
```

### Reversión
Si la confirmación revierte una confirmación anterior, debe comenzar con `revert: ` seguido de la cabecera de la confirmación revertida. En el cuerpo debe decir: `Esto revierte la confirmación <hash>.`, donde el hash es el SHA de la confirmación que se revierte.

### Tipos (type)
Debe ser uno de los siguientes

* **feat**: Una nueva característica.
* **fix**: Una corrección de bug.
* **docs**: Cambios solo en la documentación.
* **style**: Cambios que no afectan el significado del código (espacios en blanco, formateo, punto y coma faltante, etc.).
* **refactor**: Un cambio de código que no arregla un bug ni agrega una característica.
* **perf**: Un cambio de código que mejora el rendimiento.
* **test**: Añadir pruebas faltantes o corregir pruebas existentes.
* **build**: Cambios en el sistema de build o en dependencias externas (swc, tsconfig, vite, lockfiles).
* **ci**: Cambios en la configuración de integración continua (workflows, pipelines).
* **chore**: Cambios a la configuración del build o herramientas auxiliares y librerías como documentación de generación.

### Scope
El scope o ámbito debe ser el nombre del módulo afectado (tal y como lo percibe la persona que lee el registro de cambios generado a partir de los git commits).

Hay dos ejes, y se elige según el tipo de cambio:

- **Funcionalidad**: cuando el cambio pertenece a una funcionalidad concreta, el scope es el nombre de esa funcionalidad, aunque toque api y frontend a la vez. Los nombres son los de los módulos bajo `api/src/modules/`:
  - `auth`
  - `busqueda-reciente`
  - `cli-crypto`
  - `favorito`
  - `health`
  - `observability`
  - `shared`
  - `sysobject`

  Si el módulo del api y la carpeta del frontend se llaman distinto, se usa el nombre de la funcionalidad tal como la nombra el equipo. Por ejemplo: `favorito` en el api contra `favoritos` en el frontend — se usa `favoritos`.

- **Capa**: cuando el cambio es transversal y no pertenece a una funcionalidad — build, CI, dependencias, configuración, herramientas — el scope es la capa:
  - `api`
  - `frontend`

  Ejemplos: `ci(api)`, `build(api)`, `chore(frontend)`.

Un cambio de funcionalidad que cruza api y frontend normalmente va en un solo commit con el scope de la funcionalidad: si se parte, el commit del api deja a un consumidor llamando a un contrato que todavía no existe.

Se puede omitir el scope cuando el cambio no pertenece a un módulo, por ejemplo archivos de raíz como `README.md`, `CHANGELOG.md`, `CONTRIBUTING.md` o `.github/`. En ese caso el encabezado queda como `docs: <subject>` o `ci: <subject>`.

### Referencia para contribuciones
Mas información: 
- [Angular Commits Message Guidelines](https://github.com/angular/angular/blob/22b96b9/CONTRIBUTING.md#-commit-message-guidelines)