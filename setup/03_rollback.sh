#!/bin/bash
# Rollback a una versión anterior (sin rebuild, usa imagen existente)
# Uso: bash setup/04_rollback.sh 1.0.0
cd "$(dirname "$0")/.."

if [ -z "$1" ]; then
  echo "Uso: bash setup/04_rollback.sh <version>"
  echo "Imágenes disponibles:"
  docker images --format "{{.Repository}}:{{.Tag}}" | grep "^qt-"
  exit 1
fi

ENV_FILES="--env-file .env.docker --env-file .env.valkey"

export APP_VERSION=$1
echo ">>> Rollback a versión: $APP_VERSION"
docker compose $ENV_FILES up -d
docker compose $ENV_FILES ps
