#!/bin/sh
set -e
# Apply migrations if the project has them, otherwise create the tables from schema.prisma
if ls prisma/migrations/*/migration.sql >/dev/null 2>&1; then
  npx prisma migrate deploy
else
  echo "No migrations found, syncing schema with db push"
  npx prisma db push --skip-generate
fi
exec node src/server.js
