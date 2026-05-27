# Backend (API)

## Requisitos previos
- [Node.js](https://nodejs.org/) >= 20.0.18
- [pnpm](https://pnpm.io/) >= 9.0.0

## Instalacion

```bash
cd api
pnpm install
```

## Variables de entorno

Las variables de entorno se gestionan desde el **archivo `.env` en la raiz del monorepo**. Consulta [README.md](../README.md#variables-de-entorno) para la documentacion completa.

## Como empezar

### Desarrollo
```bash
pnpm run dev
```

### Pre-produccion
```bash
pnpm run build
pnpm run start
```

### Exponer puerto en la red
```bash
pnpm run dev -- --host
# o
pnpm run start -- --host
```

### Documentacion de la API (Swagger)
Una vez levantada la aplicacion, accede a:
```
http://localhost:3000/api/docs
```

### Produccion con Docker
Ver [README.md](../README.md#produccion-con-docker) de la raiz del repositorio.

## CLI de Criptografia

Herramienta de linea de comandos para encriptar y desencriptar credenciales de forma segura usando AES-256-GCM. Util para generar valores encriptados que se usan en las variables de entorno de produccion.

### Uso
```bash
pnpm run cli:crypto
```

La CLI presenta un menu interactivo:
- **Encriptar texto**: Convierte texto plano a texto encriptado
- **Desencriptar texto**: Convierte texto encriptado a texto plano

### Ejemplo
```bash
$ pnpm run cli:crypto

? Que operacion deseas realizar? Encriptar texto
? Ingresa el texto a encriptar: mi-password-super-secreto

Resultado:
AsDf123*AsDf123*AsDf123*AsDf123

? Deseas realizar otra operacion? Yes
? Que operacion deseas realizar? Desencriptar texto
? Ingresa el texto a desencriptar: AsDf123*AsDf123*AsDf123*AsDf123

Resultado:
mi-password-super-secreto
```

### Casos de uso
1. **Encriptar credenciales para produccion**: ejecuta la CLI, encripta la contrasena real y copia el resultado al `.env`
2. **Verificar credenciales encriptadas**: desencripta el valor del `.env` y verifica que coincida

### Arquitectura de la CLI
```
src/modules/cli-crypto/
├── domain/              # Reglas de negocio
│   ├── ports/           # Interfaces (contratos)
│   └── schemas/         # Validaciones con Zod
├── application/         # Casos de uso
│   └── use-cases/
└── infrastructure/      # Detalles tecnicos
    ├── adapters/        # Implementaciones concretas
    └── cli.entrypoint.ts
```

> La CLI usa la variable `PASS_PHRASE` del `.env` para encriptar/desencriptar.

## Configuracion del editor

Las configuraciones de editor estan incluidas en `.vscode/settings.json`:
```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "eslint.validate": [
    "javascript",
    "typescript"
  ]
}
```

### Plugin necesario
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)

El proyecto usa **Prettier** integrado con ESLint como formateador. No es necesario instalar el plugin de Prettier.

## Tests

[Vitest](https://vitest.dev/guide/)

```bash
# Modo watch
pnpm run test

# Reporte detallado
pnpm run test --reporter=verbose

# Coverage
pnpm run coverage
```
