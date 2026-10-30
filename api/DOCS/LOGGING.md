# Convención de Logging

## Principios

1. **Solo en use-cases:** Los logs INFO del happy path se colocan únicamente en la capa de aplicación (use-cases). No en controllers, ni repositorios, ni middlewares.
2. **Un log por operación completada:** Se loguea al final del use-case, después de que la operación principal se completó exitosamente.
3. **Contexto estructurado:** Siempre incluir datos relevantes como segundo parámetro (objeto), nunca concatenar strings.
4. **Señal sobre ruido:** Solo loguear lo que aporta valor para debugging, auditoría o métricas en Grafana.

## Formato del mensaje

```
[MODULO] acción descriptiva
```

- **MODULO:** Nombre del módulo en MAYÚSCULAS. Corresponde al nombre del directorio del módulo en `src/modules/`.
- **Acción:** Verbo en pasado + sustantivo. Describe QUÉ pasó, no qué se va a hacer.

### Ejemplos válidos

```typescript
logger.info("[sysobject] Bbject retrieved", {
  objectId,
  objectName,
  type,
  schema,
});
logger.info("[sysobject] Suggestions retrieved", {
  searchTerm,
  type,
  resultsCount,
});
logger.info("[auth] User logged in", { userId, database });
logger.info("[auth] Token refreshed", { userId });
logger.info("[auth] Session closed", { userId });
```

### Ejemplos inválidos

```typescript
// MAL: sin módulo
logger.info("object retrieved");

// MAL: acción en presente/futuro
logger.info("[sysobject] retrieving object");
logger.info("[sysobject] will retrieve object");

// MAL: concatenando strings en vez de contexto estructurado
logger.info(`[sysobject] object ${name} retrieved`);

// MAL: log sin contexto
logger.info("[sysobject] object retrieved");

// MAL: inconsistencia en casing del módulo
logger.info("[SysObject] object retrieved");
logger.info("[sysobject] object retrieved");
```

## Contexto estructurado

El segundo parámetro de `logger.info()` es un objeto con datos relevantes para filtrar en Grafana Loki.

### Campos recomendados por tipo de operación

| Operación         | Campos recomendados                                    |
| ----------------- | ------------------------------------------------------ |
| Lectura por ID    | `objectId`, `objectName`, `type`, `schema`, `database` |
| Búsqueda/listado  | `searchTerm`, `type`, `resultsCount`                   |
| Creación          | `objectId`, `objectName`                               |
| Autenticación     | `userId`, `database`                                   |
| Logout/revocación | `userId`                                               |

### Reglas del contexto

- **Nombres en camelCase** (consistente con el codebase)
- **No incluir datos sensibles:** contraseñas, tokens, credenciales
- **Incluir conteos** cuando la operación devuelve colecciones (`resultsCount`, `rolesCount`, `columnsCount`)
- **Incluir flags booleanos** cuando cambian el comportamiento (`isProduction`, `isAnonymous`)

## Niveles de log

| Nivel   | Cuándo usar                           | Ejemplo                             |
| ------- | ------------------------------------- | ----------------------------------- |
| `debug` | Información detallada para desarrollo | Queries SQL, payloads internos      |
| `info`  | Happy path completado                 | Operación exitosa con contexto      |
| `warn`  | Situación inesperada pero recuperable | Token revocado en uso, cache miss   |
| `error` | Error que afecta la operación         | Error de BD, servicio externo caído |
| `fatal` | Error que detiene la aplicación       | No se puede conectar a BD al inicio |

## Configuración recomendada para producción

```env
# Logging de la aplicación
CONSOLE_LOGS_ENABLED=true
CONSOLE_LOG_LEVEL=warn

# Observabilidad OpenTelemetry
OTEL_DEPLOYMENT_ENV=production
OTEL_LOGS_ENABLED=true
LOG_EXPORT_LEVEL=info

# Error tracking
SENTRY_REPORTING_ENABLED=true
```

| Destino | Nivel recomendado | Propósito |
| ------- | ----------------- | --------- |
| Consola | `warn` | Diagnóstico inmediato sin escribir cada operación exitosa en `stdout` |
| OTLP/Loki | `info` | Operación, correlación y análisis histórico mediante exportación por lotes |
| Sentry | Errores capturados | Agrupación, stack traces y alertas de errores accionables |

`CONSOLE_LOG_LEVEL` y `LOG_EXPORT_LEVEL` son umbrales explícitos e independientes. Sus defaults son `warn` e `info`, respectivamente. Los eventos descartados se filtran antes de construir y serializar el contexto del request.

No usar `OTEL_LOG_LEVEL` para este propósito: OpenTelemetry reserva esa variable para controlar sus diagnósticos internos y puede imprimir payloads del exportador en la consola.

Si las pruebas de carga muestran latencia por `stdout`, establecer `CONSOLE_LOGS_ENABLED=false`. Esto no desactiva OTLP/Loki ni Sentry, y se conservan los mensajes directos de emergencia cuando falla la propia infraestructura de observabilidad.

## Trazas (OpenTelemetry)

Las trazas se exportan por OTLP/HTTP y se habilitan con `OTEL_TRACES_ENABLED=true`. Con el flag en `false` (default) el SDK no registra un `TracerProvider` global, por lo que el costo es cero.

| Variable | Default | Propósito |
| --- | --- | --- |
| `OTEL_TRACES_ENABLED` | `false` | Habilita la exportación de spans por OTLP |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` | vacío | Endpoint propio de traces; si no se define se usa `${OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces` |

La instrumentación automática de `http`, `express` y `tedious (vía mssql)` produce un span por request HTTP con las queries SQL como spans hijos. En spans de base de datos, `db.statement` y `db.query.text` se normalizan a una sola línea y el nombre resume el verbo y primer destino (por ejemplo, `SELECT sys.database_permissions`) para evitar nombres como `execSql <base>`. El texto SQL se conserva (`db.statement`, `db.query.text`): las queries del repo son parametrizadas (`@idUsuario`, `@scopeId`, `@serverName`), así que se exporta la forma de la query y no los valores. Antes de exportar solo se redacta `db.user`, el login de conexión, que es constante y no aporta al diagnóstico. Los spans de middleware de Express (`query`, `expressInit`, parsers) se ignoran; se conservan los de router y request handler. Se desactivan las instrumentaciones de `dns` y `net` (generan un span por resolución DNS y por conexión TCP) y se descarta el preflight CORS (`OPTIONS`): no aportan al diagnóstico y ensucian la lista de traces. El resto de los atributos de recurso que agregaba la autodetección del SDK (`process.command_args`, `process.executable.*`, `host.*`) también se desactiva con `autoDetectResources: false`. No se generan spans de use-case: la capa de aplicación no se modifica.

## Queries útiles en Grafana Loki (LogQL)

### Filtrar por módulo

```logql
{app="quality-tools-api"} | json | message =~ `\[SYSOBJECT\].*`
```

### Filtrar por acción específica

```logql
{app="quality-tools-api"} | json | message = "[SYSOBJECT] object retrieved"
```

### Buscar operaciones de un usuario

```logql
{app="quality-tools-api"} | json | user_userId = "123"
```

### Ver búsquedas con más de 50 resultados

```logql
{app="quality-tools-api"} | json | message = "[SYSOBJECT] suggestions retrieved" | resultsCount > 50
```

## Integración con LoggerRequestContext

Los logs INFO automáticamente incluyen el contexto del request gracias a `AsyncLocalStorage`:

- `correlationId` - ID único del request
- `method` - Método HTTP
- `url` - URL del request
- `auth.status` - Estado de autenticación (`anonymous`, `authenticated` o `failed`)
- `auth.reason` - Motivo del fallo cuando `auth.status` es `failed`
- `user.userId` - ID del usuario autenticado
- `user.username` - Nombre del usuario autenticado
- `session.id` - ID de sesión/dispositivo (`session_id` del JWT)
- `session.jti` - JWT ID del token
- `session.type` - Tipo de token (`access` o `refresh`)

Estos campos NO necesitan agregarse manualmente en el contexto del `logger.info()`. Ya están disponibles en cada log.

Para trazabilidad de sesiones, ver [AUTH-SESSIONS.md](./AUTH-SESSIONS.md).

## Módulos existentes

| Módulo            | Prefijo               | Ejemplo                                 |
| ----------------- | --------------------- | --------------------------------------- |
| Sysobject         | `[SYSOBJECT]`         | `[SYSOBJECT] object retrieved`          |
| Auth              | `[AUTH]`              | `[AUTH] user logged in`                 |
| Búsqueda reciente | `[BUSQUEDA-RECIENTE]` | `[BUSQUEDA-RECIENTE] search registered` |

Al agregar un nuevo módulo, registrarlo en esta tabla.

---

**Última actualización:** 2026-10-26
