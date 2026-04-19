#!/bin/sh
set -e

echo "▶ Running admin DB migrations..."
./node_modules/.bin/prisma migrate deploy

if [ "${RUN_SEED:-true}" = "true" ]; then
  echo "▶ Seeding admin DB (idempotent)..."
  ./node_modules/.bin/ts-node prisma/seed.ts || echo "⚠ seed step failed, continuing"
fi

echo "▶ Starting admin API..."
exec node dist/main
