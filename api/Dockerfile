FROM node:24.13.0-slim AS base

WORKDIR /app

FROM base AS build

# Instalar PNPM
RUN npm install -g pnpm

RUN apt-get update && \
    apt-get install -y dumb-init

COPY package*.json /app

# Instalar dependencias usando PNPM
RUN pnpm install

# Copiar archivos de configuración
COPY tsconfig*.json /app
COPY .swcrc /app
COPY src /app/src

# Ejecutar el comando de construcción
RUN pnpm run build:prod

# Eliminar las dependencias de desarrollo si es necesario
RUN pnpm prune --prod

FROM base AS release

COPY --from=build /usr/bin/dumb-init /usr/bin/dumb-init
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/dist /app/dist
COPY --from=build /app/package.json /app/package.json

EXPOSE 3000

CMD ["dumb-init", "node", "dist/index.js", "--", "--host"]
