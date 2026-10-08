#!/usr/bin/env bash
# Vercel build entrypoint.
#
# Database migrations only run for real production builds (VERCEL_ENV=production).
# Preview/staging builds skip `prisma migrate deploy` unless STAGING_ALLOW_MIGRATE=1 is set AND the
# DATABASE_URL endpoint equals STAGING_DB_HOST_ALLOW (the staging Neon branch), so the live DB can never be migrated from a preview.
set -euo pipefail

npx prisma generate

if [ "${VERCEL_ENV:-}" = "production" ]; then
  echo "[build] production build: running prisma migrate deploy"
  npx prisma migrate deploy
elif [ "${STAGING_ALLOW_MIGRATE:-}" = "1" ]; then
  # Refuse to migrate unless the injected DATABASE_URL points at the expected staging database host.
  # STAGING_DB_HOST_ALLOW is the staging Neon branch's endpoint id (not a secret). Only the host is
  # ever printed; the connection string and password never reach the build log.
  db_host="$(node -e 'try{console.log(new URL(process.env.DATABASE_URL||"").hostname)}catch{console.log("")}')"
  db_endpoint="${db_host%%.*}"
  db_endpoint="${db_endpoint%-pooler}"
  echo "[build] staging build: database endpoint is '${db_endpoint:-unknown}'"
  if [ -z "${STAGING_DB_HOST_ALLOW:-}" ] || [ "$db_endpoint" != "$STAGING_DB_HOST_ALLOW" ]; then
    echo "[build] REFUSING to migrate: endpoint '${db_endpoint:-unknown}' does not match STAGING_DB_HOST_ALLOW. Skipping migrations."
  else
    echo "[build] endpoint matches the staging database: running prisma migrate deploy"
    npx prisma migrate deploy
  fi
else
  echo "[build] VERCEL_ENV=${VERCEL_ENV:-unset}: skipping prisma migrate deploy"
fi

npx next build
