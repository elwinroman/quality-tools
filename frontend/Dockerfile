FROM node:22.13.1-slim AS build

ARG VITE_API_URL=PRODUCTION_API_URL

WORKDIR /app

RUN npm install -g pnpm@11.13.0

RUN apt-get update && \
    apt-get install -y dos2unix

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml /app/

RUN pnpm install --frozen-lockfile

COPY . /app
RUN echo "VITE_API_URL=${VITE_API_URL}" >> .env
RUN pnpm run build

FROM nginx:alpine3.20-slim
COPY --from=build /app/dist /usr/share/nginx/html
COPY /nginx.conf /etc/nginx/conf.d/default.conf
COPY env.sh /docker-entrypoint.d/env.sh

RUN dos2unix /docker-entrypoint.d/env.sh

RUN chmod +x /docker-entrypoint.d/env.sh
