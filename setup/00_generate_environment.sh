#!/bin/bash
# Copia los .example para generar los archivos de entorno
cp -n .env.local.example .env.local
cp -n .env.backend.example .env.backend
cp -n .env.compose.example .env.compose
cp -n .env.valkey.example .env.valkey
echo "Archivos .env.local, .env.backend, .env.compose y .env.valkey generados. Edita las credenciales antes de continuar."
