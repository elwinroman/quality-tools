#!/bin/bash
# Rebuild y deploy de backend y frontend (preserva valkey)
# Uso:
#   bash setup/02_build_and_deploy.sh           → usa APP_VERSION de .env.docker
#   bash setup/02_build_and_deploy.sh 2.1.0     → override con versión específica
cd "$(dirname "$0")/.."

if [ -n "$1" ]; then
  export APP_VERSION=$1
  echo ">>> Version override: $APP_VERSION"
fi

echo ">>> Deteniendo backend y frontend..."
docker compose stop backend frontend
docker compose rm -f backend frontend

echo ">>> Rebuild y deploy..."
docker compose --env-file .env.docker --env-file .env.valkey up -d --build
docker image prune -f

echo ">>> Deploy completado. Versión: ${APP_VERSION:-$(grep APP_VERSION .env.docker | cut -d= -f2)}"
docker compose ps
