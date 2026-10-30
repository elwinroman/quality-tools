# Changelog

Todos los cambios relevantes del proyecto se documentan en este archivo.

El formato está inspirado en [Keep a Changelog](https://keepachangelog.com/) y el versionado debe mantenerse alineado entre `APP_VERSION`, `api/package.json` y `frontend/package.json` al publicar una versión.

## [2.1.0] - 2026-10-29

### Título de la versión

**Favoritos con alcance, trazas OTLP y despliegue seguro**

### Resumen ejecutivo

Esta versión incorpora favoritos con alcance global/servidor/base y su v2 de base de datos, un rediseño del frontend (navegación, temas, tabs y overviews), filtros de Query Store, cobertura de tests y CI para el frontend, y trazas OpenTelemetry con spans SQL legibles. El despliegue deja de recrear Valkey: exige que ya esté corriendo y reconstruye solo backend y frontend.

### Highlights

- **Favoritos con alcance:** el mismo objeto puede guardarse por alcance global, de servidor o de base, con unicidad por usuario + alcance + esquema + nombre y migración aditiva.
- **Observabilidad de trazas:** exportación OTLP opcional, redacción de `db.user`, SQL normalizado y nombres de span por verbo y destino.
- **Frontend renovado:** sidebar y header unificados, tabs persistentes, temas SQL/Monaco, overviews de SQL Definition y Usertable, buscadores y atajos.
- **Calidad:** suite de tests del frontend con Vitest, workflow de CI para frontend y backend, y mayor cobertura de DTOs, casos de uso y contratos HTTP.
- **Despliegue más seguro:** Valkey se trata como infraestructura preexistente y el deploy valida backend y frontend al finalizar.

### Added

- Favoritos con alcance global/servidor/base: tabla `dbo.FavoriteScope`, columnas y unicidad nuevas, endpoints y UI.
- Script `api/db/v2/01_MD.sql` con el estado estructural completo del alcance.
- Endpoint de opciones/filtros de Query Store y su consumo desde el frontend.
- Trazas OpenTelemetry: `OTEL_TRACES_ENABLED`, endpoint OTLP de trazas, redacción de `db.user` y resumen de spans SQL.
- Frontend: temas SQL y de editor, preferencia de tema, tabs persistentes, componentes compartidos de overview/relaciones/header, atajo `/` en buscadores y mejoras de sidebar.
- Infraestructura de tests del frontend, workflow de CI y cobertura adicional de API.

### Changed

- Contrato de favoritos: `PUT /upsert` pasa a `PUT /`; el borrado se resuelve con el mismo upsert y se retira `DELETE /:id`.
- Scripts de base de datos versionados en `api/db/v1/`; los nuevos cambios viven en `api/db/v2/`.
- Ejecución MSSQL centralizada, conexión singleton y errores crudos clasificados; normalización de fechas UTC.
- Autenticación: el servidor pasa a ser dueño de la base activa y se evita pisarla con cambios concurrentes; se preserva la expiración de sesión.
- Despliegue: Valkey debe estar corriendo; `setup/02_build_and_deploy.sh` reconstruye solo backend y frontend con `--no-deps` y verifica el estado final.
- Versión alineada a `2.1.0` en `APP_VERSION`, `api/package.json` y `frontend/package.json`.

### Fixed

- Navegación y búsqueda del frontend, colores de modo claro, switch de base en mobile y claves estables en búsquedas recientes.
- Formato de `float`, coerción numérica de DTOs, rechazo de esquema/objeto vacíos y validación del hash de usuario.
- Clasificación de errores de base de datos y traducción de errores de conexión en login.
- Formato de fechas ISO sin zona horaria anclado a UTC.

### Removed

- Adaptadores, utilidades y repositorios duplicados o muertos, consolidados en contratos y gateways.
- `DELETE /:id` de favoritos; el borrado se realiza con el upsert.

### Security

- Actualización de `mssql` a `11.0.2` por hardening de seguridad.
- Endurecimiento de DTOs de entrada y validaciones de parámetros.
- Revisión de permisos de los SP de metadatos: confirmar el retiro de `GRANT EXECUTE` a `Rol_QAConsulta` antes de desplegar.

### Operational notes

- Ejecutar `api/db/v2/01_MD.sql` antes del backend; es aditivo y no rompiente, pero requiere backup.
- Valkey debe estar corriendo antes de `setup/02_build_and_deploy.sh`.
- Mantener `OTEL_METRICS_ENABLED=true` para el dashboard de TPS; las trazas se habilitan con `OTEL_TRACES_ENABLED=true`.
- En métricas HTTP, los `OPTIONS` ya no se cuentan y se retiraron los labels de recurso `host.*`/`process.*`.

### Migration/upgrade checklist

- [ ] Hacer backup de la base.
- [ ] Ejecutar `api/db/v2/01_MD.sql`.
- [ ] Confirmar el cambio de permisos de `api/db/v1/03_SP_Produccion.sql` con el DBA.
- [ ] Configurar `OTEL_TRACES_ENABLED` y `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`; mantener `OTEL_METRICS_ENABLED=true`.
- [ ] Verificar que Valkey esté corriendo antes del deploy.
- [ ] Desplegar backend y frontend con el script actualizado.
- [ ] Verificar login, cambio de base, favoritos, trazas y métricas.
- [ ] Tag `v2.1.0` después del deploy.

### Compatibility and breaking changes

- **Favoritos:** consumidores de la API deben migrar de `PUT /upsert` a `PUT /` y del borrado por `DELETE /:id` al upsert.
- **Base de datos:** los scripts cambian de ruta a `api/db/v1/` y se agrega `api/db/v2/`; el despliegue debe ejecutar la v2.
- **Despliegue:** el script ya no crea Valkey; si no está corriendo, falla explícitamente.
- **Métricas:** dashboards que filtren por `host.*`/`process.*` o cuenten `OPTIONS` deben ajustarse.

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
- Se reemplazaron variables `LOKI_*` por configuración explícita `CONSOLE_LOG_LEVEL`, `LOG_EXPORT_LEVEL` y `OTEL_*`.

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
