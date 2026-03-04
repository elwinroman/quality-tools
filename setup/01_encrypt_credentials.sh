#!/bin/bash
# Ejecuta el CLI de encriptación para generar credenciales encriptadas
cd "$(dirname "$0")/../api"
pnpm run cli:crypto
