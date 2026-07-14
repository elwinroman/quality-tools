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

**Última actualización:** 2026-06-25
