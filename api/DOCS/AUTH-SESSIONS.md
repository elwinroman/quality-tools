# Arquitectura de sesiones Auth

## Objetivo

El sistema soporta sesiones independientes por dispositivo. Cada login crea una sesión propia y esa sesión define cuál es la base de datos activa para ese dispositivo.

No se soporta una base de datos distinta por pestaña o ventana del mismo navegador. El frontend comparte estado de autenticación en el navegador, por lo que varias pestañas usan la misma sesión.

## Identificadores

| Identificador              | Dónde vive           | Para qué sirve                    |
| -------------------------- | -------------------- | --------------------------------- |
| `userId`                   | JWT, logs, cache     | Identifica al usuario autenticado |
| `sessionId` / `session_id` | JWT, logs, cache     | Identifica la sesión/dispositivo  |
| `jti`                      | JWT, logs, blacklist | Identifica un token específico    |
| `correlationId`            | request/logs         | Identifica una request específica |

Relación principal:

```txt
JWT session_id == logger.session.id == Valkey auth:credentials:{userId}:{sessionId}
```

## Llaves en Valkey

### Credenciales activas

```txt
auth:credentials:{userId}:{sessionId}
```

Valor:

```json
{
  "host": "...",
  "database": "...",
  "user": "...",
  "password": "..."
}
```

Esta llave contiene solo datos necesarios para abrir conexión a SQL. No incluye `sessionId` ni `jti`.

### Blacklist de tokens

```txt
blacklist:{jti}
```

Valor:

```json
{
  "type": "access|refresh",
  "jti": "...",
  "user_id": 1
}
```

El TTL debe ser el tiempo restante de vida del token.

## Flujo de login

1. El usuario inicia sesión con credenciales SQL.
2. Se genera un `sessionId`.
3. Se crean access token y refresh token con `session_id`.
4. Se guardan las credenciales en:

```txt
auth:credentials:{userId}:{sessionId}
```

## Flujo de cambio de base de datos

1. El endpoint recibe el access token.
2. El token se valida y se extraen `user_id` y `session_id`.
3. Se construye la llave:

```txt
auth:credentials:{userId}:{sessionId}
```

4. Se conserva el TTL actual de la llave.
5. Se valida acceso a la nueva base de datos.
6. Se actualiza el valor JSON con el nuevo `database`.

Resultado: cambiar la base de datos en una PC no afecta a otra PC, porque cada dispositivo tiene un `sessionId` distinto.

## Logout e invalidación

Logout normal:

1. Agregar access token a `blacklist:{accessJti}`.
2. Agregar refresh token a `blacklist:{refreshJti}`.

Revocación por token:

1. Obtener el `jti`.
2. Guardar `blacklist:{jti}` con TTL hasta la expiración del token.

Revocación por sesión/dispositivo:

1. Eliminar `auth:credentials:{userId}:{sessionId}`.

Revocación global de un usuario:

1. Eliminar todas las llaves `auth:credentials:{userId}:*`.
2. El usuario deberá iniciar sesión otra vez en todos sus dispositivos.

## Logging

Los logs autenticados deben permitir distinguir sesión y token:

```json
{
  "user": {
    "userId": 1,
    "username": "usuario"
  },
  "auth": {
    "status": "authenticated"
  },
  "session": {
    "id": "p6OMeNDmFZAzABJzALexsw",
    "jti": "uuid-del-token",
    "type": "access"
  }
}
```

Usar:

- `session.id` para saber qué sesión/dispositivo ejecutó la acción.
- `session.jti` para saber qué token específico ejecutó la request.
- `correlationId` para rastrear una request específica.
- `auth.status` para distinguir requests anónimas, autenticadas o fallidas.
- `auth.reason` para distinguir fallos como token faltante, expirado, inválido, revocado o sin credenciales en cache.

## Decisiones de diseño

- `sessionId` va en la llave de cache, no dentro del JSON de credenciales.
- La base de datos activa es mutable y vive como valor dentro de `auth:credentials`.
- No hay compatibilidad con la llave antigua `auth:credentials:{userId}`.
- Tokens sin `session_id` se consideran inválidos.

---

**Última actualización:** 2026-06-25
