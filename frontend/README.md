# Frontend

## Requisitos previos
- [Node.js](https://nodejs.org/) >= 20.0.18
- [pnpm](https://pnpm.io/) >= 9.0.0

## Instalacion

```bash
cd frontend
pnpm install
```

## Variables de entorno

Las variables de entorno se gestionan desde el **archivo `.env` en la raiz del monorepo**. Consulta [README.md](../README.md#variables-de-entorno) para la documentacion completa.

La unica variable que el frontend consume es `VITE_API_URL`. Vite ignora todas las demas variables del `.env` que no tengan prefijo `VITE_`.

## Como empezar

### Desarrollo
```bash
pnpm run dev
```

### Pre-produccion
```bash
pnpm run build
pnpm run preview
```

### Exponer puerto en la red
```bash
pnpm run dev -- --host
# o
pnpm run preview -- --host
```

### Produccion con Docker
Ver [README.md](../README.md#produccion-con-docker) de la raiz del repositorio.

## Configuracion del editor

Las configuraciones de editor estan incluidas en `.vscode/settings.json`:
```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

### Plugins necesarios
1. [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint): Identificacion y reporte de patrones en TypeScript.
2. [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss): Autocompletado, sugerencias y preview de clases de Tailwind CSS.
3. [Headwind](https://marketplace.visualstudio.com/items?itemName=heybourn.headwind): Ordenamiento automatico de clases Tailwind al guardar.

El proyecto usa **Prettier** integrado con ESLint como formateador. No es necesario instalar el plugin de Prettier.
