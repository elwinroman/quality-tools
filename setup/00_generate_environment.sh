#!/bin/bash
# Copia los .sample para generar los archivos de entorno
cp -n .env.sample .env
cp -n .env.docker.sample .env.docker
cp -n .env.valkey.sample .env.valkey
# cp -n .env.development.sample .env.development
echo "Archivos .env, .env.valkey y .env.docker generados. Edita las credenciales antes de continuar."