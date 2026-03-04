FROM node:22.11.0-slim AS build

# Define un argumento que se pasará durante la construcción
ARG VITE_API_URL=PRODUCTION_API_URL

WORKDIR /app
COPY package.json /app

# Instalar Bun y dos2unix
RUN apt-get update && \
    apt-get install -y curl unzip dos2unix && \
    curl -fsSL https://bun.sh/install | bash && \
    ln -s /root/.bun/bin/bun /usr/local/bin/bun

# Usar Bun para instalar dependencias
RUN bun install

COPY . /app
RUN echo "VITE_API_URL=${VITE_API_URL}" >> .env
RUN bun run build

FROM nginx:alpine3.20-slim
COPY --from=build /app/dist /usr/share/nginx/html
COPY /nginx.conf /etc/nginx/conf.d/default.conf
COPY env.sh /docker-entrypoint.d/env.sh

# Convertir CRLF a LF usando dos2unix
RUN dos2unix /docker-entrypoint.d/env.sh

RUN chmod +x /docker-entrypoint.d/env.sh
