# Changelog

Todos los cambios relevantes del proyecto se documentan en este archivo.

El formato está inspirado en [Keep a Changelog](https://keepachangelog.com/) y el versionado debe mantenerse alineado entre `APP_VERSION`, `api/package.json` y `frontend/package.json` al publicar una versión.

## [2.0.0] - 2026-07-14

### Título de la versión

**Plataforma observable, sesiones aisladas y exploración SQL por referencias**

### Resumen ejecutivo

Esta versión convierte a Quality Tools en una plataforma más operable y segura: reemplaza la integración directa con Loki por observabilidad basada en OpenTelemetry, agrega endpoints de estado, aísla las credenciales de base de datos por `sessionId` para soportar uso multidispositivo y mejora la exploración de objetos SQL con rutas estables, dependencias, referencias y fallback de metadatos.

También incorpora cambios operativos relevantes: reorganización de archivos de entorno, builds Docker con `pnpm` fijado, política explícita para scripts de instalación de dependencias y alineación de versión a `2.0.0` en despliegue, API y frontend.

### Highlights

- **Observabilidad moderna:** logs y métricas de API migran a OpenTelemetry/OTLP; la aplicación deja de enviar logs directamente con `pino-loki`.
- **Operación verificable:** nuevo módulo de health/status para revisar servicios críticos e integraciones como Valkey, Sentry y OTLP.
- **Autenticación multidispositivo:** las credenciales de base de datos quedan aisladas por `sessionId`, evitando colisiones entre sesiones del mismo usuario.
- **Exploración SQL más útil:** navegación por `schema + name`, soporte para dependencias/referencias y fallback cuando SQL Server devuelve metadatos incompletos.
- **Builds más controlados:** backend y frontend declaran `packageManager: pnpm@11.13.0`; el frontend queda con lockfile exclusivo de `pnpm`.

### Added

#### Observabilidad y operación

- Se agregó infraestructura de observabilidad en la API con OpenTelemetry para logs y métricas.
- Se agregó exportación OTLP para logs y métricas HTTP/runtime hacia el collector configurado.
- Se agregaron endpoints `/status/live` y `/status/ready` para consultar el estado de la aplicación y dependencias operativas.
- Se documentaron variables OpenTelemetry y el flujo esperado para enviar logs al collector y desde allí a Loki.
- Se agregó cierre ordenado de telemetría para permitir flush de logs y métricas durante `SIGINT`/`SIGTERM`.

#### Autenticación y sesiones

- Se agregó `sessionId` a tokens de acceso y refresh, con validación explícita al decodificar.
- Se agregó aislamiento de credenciales de base de datos por sesión en caché.
- Se agregó soporte documentado para sesiones multidispositivo y revocación por sesión.
- Se agregó contexto de logging de autenticación para intentos con token revocado, credenciales faltantes y refresh exitoso.

#### Exploración de objetos SQL

- Se agregaron endpoints para obtener dependencias y referencias de objetos SQL.
- Se agregó búsqueda/consulta por `schema` y `name`, reemplazando la dependencia de rutas por `id` para objetos SQL.
- Se agregó soporte para objetos SQL tipo `IF` (Inline Functions).
- Se agregó fallback a `sys.sql_expression_dependencies` cuando `sys.dm_sql_referenced_entities` o `sys.dm_sql_referencing_entities` no pueden devolver metadatos completos.
- Se agregó visualización de dependencias/referencias en frontend y refresco manual de objetos en SQL Definition y Usertable.
- Se agregó visualización de índices deshabilitados en la vista de Usertable.

#### Base de datos y experiencia de usuario

- Se agregó filtro para evitar traer snapshots reales y bases internas de SQL Server en el listado de bases de datos.
- Se agregó toggle para incluir bases `SI_BDFinFiles%` en selectores cuando sea necesario.
- Se agregó prevención de refresh concurrente del access token en el frontend.
- Se agregó página de Issues y nuevos íconos/estilos asociados a estados de error y navegación.

#### Build, paquetes y configuración

- Se agregó `pnpm-workspace.yaml` en API y frontend para declarar dependencias con scripts de instalación permitidos.
- Se agregó política de seguridad de `pnpm` para no habilitar build scripts de dependencias de forma global o implícita.
- Se agregó `.gitattributes` para normalizar finales de línea a LF.
- Se agregó alineación de versión: `APP_VERSION=2.0.0`, `api/package.json` en `2.0.0` y `frontend/package.json` en `2.0.0`.

### Changed

#### Observabilidad

- Se migró el logging de una integración directa `pino-loki` a una arquitectura basada en OpenTelemetry.
- Se reorganizó el logger bajo el módulo `observability`, conservando logging local con `pino` y agregando exportación OTLP cuando está habilitada.
- Se desacopló el contexto de logger de los casos de uso mediante adaptadores de observabilidad.
- Se reemplazaron variables `LOKI_*` por configuración `LOG_LEVEL` y `OTEL_*`.

#### Configuración y despliegue

- Se reorganizaron los archivos de entorno por responsabilidad:
  - `.env.local` para desarrollo local.
  - `.env.backend` para backend en Docker/producción.
  - `.env.compose` para puertos, dominio y versión de imagen.
  - `.env.valkey` para Valkey.
- Se renombraron las plantillas de entorno a archivos `.example` específicos por responsabilidad.
- Se actualizó Docker Compose para consumir `.env.backend`, `.env.compose` y `.env.valkey` según corresponda.
- Se agregaron límites de CPU/memoria para servicios Docker (`backend`, `frontend`, `valkey`).
- Se actualizaron scripts de generación de entorno, deploy y rollback para usar la nueva estructura de archivos.
- Se actualizaron Dockerfiles de API y frontend para builds reproducibles con `pnpm` fijado.
- Se actualizaron configuraciones TypeScript/SWC/VS Code para compatibilidad y consistencia.

#### Frontend y navegación

- Se mejoró la navegación de objetos SQL usando rutas estables por `schema` y `name`.
- Se actualizaron pantallas de SQL Definition y Usertable para cargar datos por nombre estable y exponer acciones de refresco.
- Se ajustó el selector de bases de datos para soportar el nuevo filtrado y el toggle de `SI_BDFinFiles%`.
- Se estandarizó el frontend para usar `pnpm-lock.yaml` como lockfile único.

#### Nomenclatura y documentación

- Se actualizaron referencias de preproducción a producción donde correspondía.
- Se actualizaron README y documentación de API para reflejar observabilidad, sesiones y nuevos archivos de entorno.

### Fixed

- Se corrigió una condición de carrera por refresh concurrente de access token en frontend.
- Se corrigió la colisión de credenciales entre sesiones del mismo usuario al cambiar/usar bases de datos en múltiples dispositivos.
- Se corrigió la revocación/validación de refresh tokens para considerar `sessionId` y tokens revocados.
- Se corrigió el soporte de objetos SQL tipo `IF` en búsquedas y carga de definición.
- Se corrigió la recarga innecesaria de objeto al cambiar de base de datos.
- Se corrigió un error de modal en búsqueda.
- Se corrigió el build Docker del frontend actualizando `pnpm-lock.yaml` y agregando la dependencia `globals` requerida por ESLint.
- Se corrigió el build Docker del backend ante la política más estricta de scripts de instalación de `pnpm`.
- Se corrigieron advertencias de TypeScript relacionadas con opciones de configuración deprecadas.
- Se corrigió la documentación/uso del script de rollback para apuntar a `setup/03_rollback.sh`.

### Removed

- Se eliminó `pino-loki` como dependencia de la API.
- Se eliminó la integración directa de la aplicación con Loki; el camino esperado pasa por OpenTelemetry Collector.
- Se eliminó el logger legacy bajo `api/src/core/logger`.
- Se eliminó el registro de acceso de login en `dbo.LogAcceso` desde la API.
- Se eliminó `frontend/package-lock.json` para evitar mezcla de gestores de paquetes en el frontend.
- Se eliminó el fallback local de la API a `.env`/`.env.development`; ahora el desarrollo local carga `.env.local`.

### Security

- Las credenciales de base de datos en caché ahora se separan por `sessionId`, reduciendo riesgo de fuga cruzada entre sesiones del mismo usuario.
- Los access/refresh tokens requieren `sessionId` válido al decodificarse.
- La revocación de tokens queda asociada al `jti` y se documenta el comportamiento por sesión.
- La política de `pnpm` evita aceptar scripts de instalación de dependencias de forma implícita durante builds.
- La separación de archivos de entorno reduce el riesgo de usar credenciales o configuración de producción en desarrollo local por accidente.

### Operational notes

- **Versión:** esta release queda alineada en `APP_VERSION=2.0.0`, `api/package.json` `2.0.0` y `frontend/package.json` `2.0.0`.
- **OpenTelemetry:** para enviar logs o métricas fuera del proceso deben configurarse `OTEL_LOGS_ENABLED`, `OTEL_METRICS_ENABLED`, `OTEL_DEPLOYMENT_ENV` y endpoints OTLP válidos.
- **Loki:** la API ya no debe configurarse con `LOKI_*`; Loki queda detrás del pipeline de collector/observabilidad.
- **Health checks:** los endpoints `/status/live` y `/status/ready` permiten revisar estado de servicios, pero deben validarse en el ambiente real con la configuración final.
- **Entornos:** ejecutar `setup/00_generate_environment.sh` crea los nuevos archivos `.env.local`, `.env.backend`, `.env.compose` y `.env.valkey` sin sobrescribir archivos existentes.
- **Docker:** `docker-compose.yml` ahora aplica límites de recursos y usa `.env.backend` para backend, no `.env`.
- **pnpm:** API y frontend declaran `pnpm@11.13.0`; evitar `npm install` en frontend para no regenerar `package-lock.json`.
- **Base de datos:** el selector excluye snapshots/bases internas y permite incluir `SI_BDFinFiles%` solo cuando el usuario lo habilita.

### Migration/upgrade checklist

- [ ] Crear o actualizar archivos reales desde las nuevas plantillas: `.env.local.example`, `.env.backend.example`, `.env.compose.example` y `.env.valkey.example`.
- [ ] Migrar valores existentes de `.env`, `.env.development`, `.env.docker` y `.env.valkey` a los nuevos archivos según responsabilidad, sin copiar secretos a documentación o commits.
- [ ] Confirmar que `.env.compose` define `APP_VERSION=2.0.0` antes de construir/desplegar imágenes.
- [ ] Revisar que `api/package.json` y `frontend/package.json` permanezcan en versión `2.0.0` para esta publicación.
- [ ] Reemplazar variables `LOKI_*` por `OTEL_*` y validar conectividad con el OpenTelemetry Collector.
- [ ] Verificar `/status/live` y `/status/ready` en el ambiente objetivo después del deploy.
- [ ] Instalar dependencias con `pnpm` en API y frontend; no regenerar `frontend/package-lock.json`.
- [ ] Reconstruir imágenes Docker con los scripts actualizados o con `docker compose --env-file .env.compose --env-file .env.valkey up -d --build`.
- [ ] Validar login, refresh token, logout/revocación y cambio de base en al menos dos sesiones/dispositivos del mismo usuario.
- [ ] Validar navegación de SQL Definition/Usertable con rutas por `schema` + `name`, incluyendo objetos tipo `IF`.
- [ ] Validar dependencias/referencias SQL en objetos con metadatos completos y en objetos donde SQL Server pueda requerir fallback.

### Compatibility and breaking changes

- **Variables de entorno:** cambio operativo incompatible si el ambiente sigue usando `.env`, `.env.development` o `.env.docker` como fuente principal.
- **Logging:** dashboards o despliegues que dependían de `LOKI_*`/`pino-loki` deben migrar al pipeline OpenTelemetry Collector → Loki.
- **Tokens:** access/refresh tokens emitidos antes de esta versión no contienen `sessionId`; se debe forzar nuevo login tras el despliegue.
- **Rutas SQL:** consumidores de API que usaban rutas por `id` para objetos SQL deben migrar a rutas por `schema` y `name`.
- **Login access log:** reportes o auditorías que dependían de `dbo.LogAcceso` ya no recibirán registros generados por la API.
- **Gestor de paquetes:** el frontend queda como proyecto `pnpm`-only; `package-lock.json` ya no forma parte del flujo esperado.
