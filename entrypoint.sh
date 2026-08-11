#!/bin/sh
set -e

echo "Sincronizando base de datos Prisma..."
# Usamos db push para aplicar cambios sin historial de migraciones en modo rápido. 
# accept-data-loss evita prompts interactivos que bloquean Docker
npx prisma db push --accept-data-loss

echo "Iniciando servidor de InmobiliarIA..."
exec "$@"
