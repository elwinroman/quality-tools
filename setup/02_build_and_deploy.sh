#!/bin/bash
# Rebuild y deploy de backend y frontend (preserva valkey)
# Uso:
#   bash setup/02_build_and_deploy.sh           → usa APP_VERSION de .env.compose
#   bash setup/02_build_and_deploy.sh 2.1.0     → override con versión específica
set -euo pipefail

cd "$(dirname "$0")/.."

if [ -n "${1:-}" ]; then
  export APP_VERSION=$1
  echo ">>> Version override: $APP_VERSION"
fi

ENV_FILES="--env-file .env.compose --env-file .env.valkey"

# Valkey es infraestructura preexistente: este script no lo crea, no lo arranca y no lo para.
# Si dependiera de este script, un fallo al conectar su red lo dejaría a medio crear y sin DNS.
if ! docker compose $ENV_FILES ps --status running --services | grep -qx valkey; then
  echo ">>> ERROR: valkey no esta corriendo. Este script asume un servicio ya existente." >&2
  echo ">>> Levantalo aparte antes de desplegar: docker compose $ENV_FILES up -d valkey" >&2
  exit 1
fi

echo ">>> Deteniendo backend y frontend..."
docker compose $ENV_FILES stop backend frontend
docker compose $ENV_FILES rm -f backend frontend

echo ">>> Rebuild y deploy (solo backend y frontend)..."
# --no-deps es obligatorio: sin el, `up` arrancaria valkey igual por el depends_on del compose.
docker compose $ENV_FILES up -d --build --no-deps backend frontend
docker image prune -f

if ! docker compose $ENV_FILES ps --status running --services | grep -qx backend \
  || ! docker compose $ENV_FILES ps --status running --services | grep -qx frontend; then
  echo ">>> ERROR: el deploy no dejo backend y frontend corriendo." >&2
  docker compose $ENV_FILES ps
  exit 1
fi

echo ">>> Deploy OK. Version: ${APP_VERSION:-$(grep APP_VERSION .env.compose | cut -d= -f2)}"
docker compose $ENV_FILES ps
