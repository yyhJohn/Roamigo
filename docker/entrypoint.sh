#!/bin/sh
set -eu

echo "[roamigo] Applying Prisma migrations..."
./node_modules/.bin/prisma migrate deploy

if [ "${SEED_DEMO_DATA:-false}" = "true" ]; then
  echo "[roamigo] Seeding idempotent demo baseline..."
  ./node_modules/.bin/tsx prisma/seed.ts
fi

echo "[roamigo] Starting production API + Realtime server..."
exec node dist-server/server/index.js
