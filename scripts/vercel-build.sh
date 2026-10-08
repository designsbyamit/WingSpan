#!/usr/bin/env bash
# Vercel build entrypoint.
#
# Database migrations only run for real production builds (VERCEL_ENV=production).
# Preview/staging builds skip `prisma migrate deploy` unless STAGING_ALLOW_MIGRATE=1
# is set AND the build has its own Preview-scoped DATABASE_URL (never the live DB).
set -euo pipefail

npx prisma generate

if [ "${VERCEL_ENV:-}" = "production" ]; then
  echo "[build] production build: running prisma migrate deploy"
  npx prisma migrate deploy
elif [ "${STAGING_ALLOW_MIGRATE:-}" = "1" ]; then
  echo "[build] staging build: STAGING_ALLOW_MIGRATE=1, running prisma migrate deploy against the Preview DATABASE_URL"
  npx prisma migrate deploy
else
  echo "[build] VERCEL_ENV=${VERCEL_ENV:-unset}: skipping prisma migrate deploy"
fi

npx next build
