# Revocación de Tokens Comprometidos

## Contexto

El sistema usa una blacklist basada en Redis/Valkey para invalidar tokens JWT. Cada request autenticado loguea el `session.id`, `jti`, `type` y `expirationCountdown` como parte del contexto de sesión, lo que permite rastrear y auditar tokens activos.

Para la arquitectura completa de sesiones y credenciales por dispositivo, ver [AUTH-SESSIONS.md](./AUTH-SESSIONS.md).

## Arquitectura actual

### Generación de tokens

- Cada token tiene un `jti` (JWT ID) único generado con `randomUUID()`
- Cada token tiene un `session_id` que identifica la sesión/dispositivo
- El `session_id` se usa como `session.id` en logs y como parte de la llave `auth:credentials:{userId}:{sessionId}`
- El `jti` se loguea en cada request autenticado a través del `LoggerRequestContext.session`
- El middleware `verifyTokenMiddleware` inyecta el contexto de sesión (`id`, `jti`, `type`, `expirationCountdown`) en el logger

### Blacklist

- **Key:** `blacklist:{jti}`
- **Value:** `{"type":"access|refresh","jti":"...","user_id":...}`
- **TTL:** Segundos restantes hasta expiración del token

### Mecanismo de invalidación automática

Los tokens se agregan a la blacklist automáticamente en dos casos:

1. **Logout normal:** Usuario cierra sesión ([logout.use-case.ts:17-26](../src/modules/auth/application/use-cases/logout.use-case.ts#L17-L26))
2. **Credenciales no encontradas:** Cuando Redis pierde las credenciales ([verify-access-token.use-case.ts:33-37](../src/modules/auth/application/use-cases/verify-access-token.use-case.ts#L33-L37))

## Solución para revocar tokens comprometidos

### Opción 1: Revocación por JTI desde Grafana Loki (RECOMENDADA si Loki está habilitado)

Si se tiene acceso a Grafana Loki, se puede obtener el `jti` de cualquier sesión activa sin necesidad de tener el token.

#### Paso 1: Buscar el JTI en Grafana (Explore > Loki)

```logql
{app="quality-tools-api"} | json | session_jti != "" | line_format "user={{.user_userId}} jti={{.session_jti}} type={{.session_type}}"
```

Para filtrar por usuario específico:

```logql
{app="quality-tools-api"} | json | user_userId = "123"
```

#### Paso 2: Extraer el JTI del log y calcular TTL

El campo `session_expirationCountdown` indica los segundos restantes **al momento del request**. Calcular el TTL actual:

```bash
# TTL actual ≈ expirationCountdown - (ahora - timestamp_del_log)
```

#### Paso 3: Agregar a blacklist

```bash
redis-cli SET "blacklist:{jti}" '{"type":"access_token","jti":"{jti}","user_id":{user_id}}' EX {ttl}
```

### Opción 2: Revocación manual por JTI (requiere el token)

Si se dispone del token comprometido:

#### Paso 1: Decodificar el token

```bash
# Usando Node.js
node -e "console.log(JSON.stringify(require('jsonwebtoken').decode('TOKEN_AQUI'), null, 2))"
```

O utilizar [jwt.io](https://jwt.io) para decodificar el token.

#### Paso 2: Extraer datos

```json
{
  "jti": "a1b2c3d4-...",
  "type": "access",
  "user_id": 123,
  "exp": 1738368000
}
```

#### Paso 3: Calcular TTL

```javascript
const ahora = Math.floor(Date.now() / 1000);
const ttl = decoded.exp - ahora;
```

#### Paso 4: Agregar a blacklist

```bash
redis-cli SET "blacklist:{jti}" '{"type":"access","jti":"{jti}","user_id":{user_id}}' EX {ttl}
```

**Ejemplo real:**

```bash
redis-cli SET "blacklist:a1b2c3d4-5678-90ab-cdef-123456789abc" '{"type":"access","jti":"a1b2c3d4-5678-90ab-cdef-123456789abc","user_id":123}' EX 3600
```

### Opción 3: Revocación nuclear (SIN el token ni Loki)

Si no se dispone del token pero se conoce el usuario afectado:

#### Paso 1: Obtener user_id

```sql
SELECT id, user, aliasHost FROM users WHERE user = 'nombre_usuario';
-- O por host
SELECT id, user, aliasHost FROM users WHERE aliasHost = 'SERVER01';
```

#### Paso 2: Eliminar credenciales de cache

Para una sesión/dispositivo específico:

```bash
redis-cli DEL "auth:credentials:{user_id}:{session_id}"
```

Para todas las sesiones del usuario:

```bash
redis-cli --scan --pattern "auth:credentials:{user_id}:*" | xargs redis-cli DEL
```

**Ejemplo:**

```bash
redis-cli DEL "auth:credentials:123:p6OMeNDmFZAzABJzALexsw"
```

#### Resultado

- Si se elimina `auth:credentials:{user_id}:{session_id}`, falla la siguiente request de esa sesión/dispositivo.
- Si se eliminan todas las llaves `auth:credentials:{user_id}:*`, fallan las siguientes requests de todas las sesiones del usuario.
- El sistema automáticamente invalida el token ([verify-access-token.use-case.ts:30-39](../src/modules/auth/application/use-cases/verify-access-token.use-case.ts#L30-L39))
- Se agrega a la blacklist automáticamente
- Se loguea la tentativa

**Ventajas:**

- No requiere el token
- Implementación inmediata
- Puede invalidar una sesión específica o todas las sesiones del usuario
- No requiere cambios en el código

**Desventajas:**

- Si se elimina una sesión específica, el usuario debe autenticarse nuevamente en ese dispositivo.
- Si se eliminan todas las sesiones, el usuario debe autenticarse nuevamente en todos sus dispositivos.

## Comunicación al usuario

"Se han revocado todas las sesiones activas por seguridad. Es necesario volver a autenticarse en todos los dispositivos."

## Verificación

Para verificar que un token se encuentra en la blacklist:

```bash
redis-cli GET "blacklist:{jti}"
```

Si devuelve un valor, el token ha sido revocado.

---

**Última actualización:** 2026-06-25
