#!/bin/sh

echo "Sincronizando base de datos Prisma..."
npx --yes prisma@7.9.1 db push --skip-generate --accept-data-loss || echo "⚠️ Advertencia: Prisma db push falló. Revisa la conexión a la base de datos."

echo "Iniciando servidor de InmobiliarIA..."
exec "$@"
