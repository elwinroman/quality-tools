# Sql Snap Monitor

Aplicacion web para gestionar tareas de Quality Assurance. Permite realizar consultas de definiciones SQL a una base de datos de pruebas y compararlos con la base de datos de pre-produccion, obtener el diccionario de las tablas de usuario, etc. Construida con Node.js y React.

## Caracteristicas
- Login a una base de datos con usuario SQL (soporte solo a SQL Server).
- Busqueda de definiciones SQL (procedimientos almacenados, vistas, funciones, etc).
- Comparacion de definiciones SQL con una base de datos de alineacion.
- Busqueda de tablas de usuario y visualizacion de su diccionario.

## Requisitos previos
- [Node.js](https://nodejs.org/) >= 20.0.18
- [pnpm](https://pnpm.io/) >= 9.0.0
- [Docker](https://www.docker.com/) (solo para produccion)

## Estructura del monorepo
```
quality-tools/
├── .env.local            # Desarrollo local
├── .env.backend          # Backend en Docker/produccion
├── .env.compose          # Variables de docker compose
├── .env.valkey           # Variables del servicio Valkey
├── docker-compose.yml
├── api/                  # Backend (Node.js + Express)
└── frontend/             # Frontend (React + Vite)
```

## Variables de entorno

El proyecto usa archivos de entorno separados por responsabilidad. Esto evita que desarrollo local herede valores de Docker/produccion por accidente.

| Archivo | Uso | Lo consume |
|---|---|---|
| `.env.local` | Desarrollo local. Credenciales planas y URLs locales. | Backend local y frontend local |
| `.env.backend` | Backend en Docker/produccion. Credenciales encriptadas. | Servicio `backend` de Docker Compose |
| `.env.compose` | Puertos, dominio y version de imagen. | Docker Compose y scripts de deploy |
| `.env.valkey` | Puerto/password del servicio Valkey. | Servicio `valkey` de Docker Compose |

Plantillas disponibles:

| Plantilla | Genera |
|---|---|
| `.env.local.example` | `.env.local` |
| `.env.backend.example` | `.env.backend` |
| `.env.compose.example` | `.env.compose` |
| `.env.valkey.example` | `.env.valkey` |

```bash
# Genera todos los archivos reales si no existen
bash setup/00_generate_environment.sh
```

El backend local carga solo `.env.local`. No hay fallback silencioso a `.env.backend`.

### Configuracion general (Docker Compose)

| Variable | Descripcion | Ejemplo |
|---|---|---|
| `BACKEND_PORT` | Puerto externo del backend en Docker | `3000` |
| `CLIENT_PORT` | Puerto externo del frontend en Docker | `80` |
| `DOMAIN` | Dominio o IP del servidor de despliegue. Se usa como `ALLOWED_ORIGINS` por defecto | `http://192.168.1.68` |

### Base de datos de pre-produccion (alineacion)

| Variable | Descripcion |
|---|---|
| `PREPROD_DBSERVER` | Servidor SQL Server. En Docker: `host.docker.internal` |
| `PREPROD_DBNAME` | Nombre de la base de datos |
| `PREPROD_DBUSERNAME` | Usuario (encriptado en produccion) |
| `PREPROD_DBPASSWORD` | Contrasena (encriptada en produccion) |

### Base de datos de la aplicacion

| Variable | Descripcion |
|---|---|
| `DBSERVER` | Servidor SQL Server. En Docker: `host.docker.internal` |
| `DBNAME` | Nombre de la base de datos |
| `DBUSERNAME` | Usuario (encriptado en produccion) |
| `DBPASSWORD` | Contrasena (encriptada en produccion) |

### Backend

| Variable | Descripcion | Default |
|---|---|---|
| `NODE_ENV` | Entorno de ejecucion (`development`, `production`, `test`) | `development` |
| `PORT` | Puerto del servidor backend | `3000` |
| `ALLOWED_ORIGINS` | Origenes permitidos (CORS), separados por comas | `DOMAIN:CLIENT_PORT` |
| `JWT_SECRET` | Clave secreta para firmar/verificar tokens JWT | - |
| `PASS_PHRASE` | Clave para encriptar/desencriptar credenciales (AES-256-GCM) | - |
| `TIMEZONE_DATABASE` | Zona horaria de la base de datos | `America/Lima` |

### JWT Token TTL

| Variable | Descripcion | Default |
|---|---|---|
| `JWT_ACCESS_TOKEN_TTL` | Tiempo de vida del access token (segundos) | `900` (15 min) |
| `JWT_REFRESH_TOKEN_TTL` | Tiempo de vida del refresh token (segundos) | `2592000` (30 dias) |

**Referencia de tiempos:**

| Tiempo | Segundos |
|---|---|
| 15 minutos | `900` |
| 30 minutos | `1800` |
| 1 hora | `3600` |
| 1 dia | `86400` |
| 7 dias | `604800` |
| 30 dias | `2592000` |

### Sentry (error tracking)

| Variable | Descripcion | Default |
|---|---|---|
| `SENTRY_REPORTING_ENABLED` | Habilita/deshabilita el envio de errores (`true`/`false`) | **obligatorio** |
| `SENTRY_DNS` | URL DSN proporcionada por Sentry | - |

### Loki (logging centralizado)

| Variable | Descripcion | Default |
|---|---|---|
| `LOKI_REPORTING_ENABLED` | Habilita/deshabilita el envio de logs (`true`/`false`) | **obligatorio** |
| `LOKI_HOST` | URL de la instancia de Loki (obligatorio si `LOKI_REPORTING_ENABLED=true`) | - |
| `LOKI_USERNAME` | Usuario para autenticacion basica (nginx) | - |
| `LOKI_PASSWORD` | Contrasena para autenticacion basica (nginx) | - |
| `LOKI_LOG_LEVEL` | Nivel minimo de log (`debug`, `info`, `warn`, `error`, `fatal`) | `info` |

### Cache (Valkey/Redis)

| Variable | Descripcion | Default |
|---|---|---|
| `CACHE_HOST` | Host del servidor de cache | - |
| `CACHE_PORT` | Puerto del servidor de cache | `6379` |
| `CACHE_PASSWORD` | Contrasena de autenticacion | - |
| `BUSQUEDA_RECIENTE_CACHE_TTL` | TTL de cache para busquedas recientes (segundos) | `86400` (24h) |

### Frontend

| Variable | Descripcion | Ejemplo |
|---|---|---|
| `VITE_API_URL` | URL base de la API a la que el frontend envia solicitudes | `http://localhost:3000` |

> **Nota:** Vite solo expone variables con prefijo `VITE_`. Las demas variables de `.env.local` son invisibles para el frontend.

## Como levantar

### Desarrollo local

```bash
# Instalar dependencias
cd api && pnpm install
cd ../frontend && pnpm install

# Levantar backend (desde api/)
pnpm run dev

# Levantar frontend (desde frontend/)
pnpm run dev
```

### Produccion con Docker (scripts de setup)

El directorio `setup/` contiene scripts numerados que representan el flujo completo de despliegue. Ejecutalos en orden desde la raiz del monorepo.

#### Paso 0: Generar archivos de entorno

```bash
bash setup/00_generate_environment.sh
```

Copia los archivos `.example` para generar `.env.local`, `.env.backend`, `.env.compose` y `.env.valkey`. Usa `cp -n`, asi que **no sobreescribe** archivos existentes. Despues de ejecutarlo, edita las credenciales en cada archivo antes de continuar.

#### Paso 1: Encriptar credenciales

```bash
bash setup/01_encrypt_credentials.sh
```

Ejecuta el CLI de criptografia del backend (`pnpm run cli:crypto`). Esto genera las credenciales encriptadas (AES-256-GCM) que se usan en produccion. Requiere tener las dependencias del backend instaladas (`cd api && pnpm install`).

#### Paso 2: Build y deploy

```bash
# Usa APP_VERSION definida en .env.compose
bash setup/02_build_and_deploy.sh

# O especifica una version manualmente
bash setup/02_build_and_deploy.sh 2.1.0
```

Detiene los contenedores de backend y frontend (preserva Valkey/Redis), hace rebuild de las imagenes y redeploy con Docker Compose. Al finalizar muestra el estado de los contenedores.

#### Paso 3: Rollback

```bash
bash setup/03_rollback.sh <version>
```

Hace rollback a una version anterior **sin rebuild**, usando una imagen Docker que ya exista localmente. Si se ejecuta sin argumentos, muestra las imagenes disponibles.

#### Comandos Docker utiles

```bash
# Detener servicios
docker compose down

# Ver contenedores activos
docker compose ps
```

### Exponer puertos en la red (modo desarrollo)

Para permitir conexiones desde direcciones externas:
```bash
# Backend
pnpm run dev -- --host

# Frontend
pnpm run dev -- --host
```

## Errores conocidos

### env.sh con terminaciones CRLF (Fixed)
Si el archivo `frontend/env.sh` tiene terminaciones de linea CRLF (Windows), Docker puede fallar al ejecutarlo. Esto se soluciono usando `dos2unix` directamente en el Dockerfile del frontend.

## Documentacion adicional
- **Backend**: Consulta [api/README.md](api/README.md) para CLI de criptografia, tests y configuracion del editor.
- **Frontend**: Consulta [frontend/README.md](frontend/README.md) para plugins de VSCode y configuracion del editor.
- **API Swagger**: Una vez levantado el backend, accede a `http://localhost:3000/api/docs`
