# WingSpan staging environment

Goal: make and verify changes without touching the live deployment.

## Rules
- Work happens on the `staging` branch (or feature branches cut from it). Never push to the production branch directly.
- Staging builds are Vercel **Preview** deployments. They must use **Preview-scoped** environment variables, never the Production ones.
- `scripts/vercel-build.sh` runs `prisma migrate deploy` only when `VERCEL_ENV=production`. A staging build skips migrations unless `STAGING_ALLOW_MIGRATE=1` is set, and that must only be done with a staging-only `DATABASE_URL`.
- Promote to live only by an explicit, reviewed merge into the production branch.

## Vercel setup (one-time, dashboard)
1. Project `wing-span` > Settings > Environment Variables: define each variable below with the **Preview** target only, scoped to branch `staging`, pointing at staging resources.
2. `DATABASE_URL`: a separate database (for example a Neon branch of the live DB), not the production connection string.
3. `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `JWT_SECRET`, `NEXT_PUBLIC_APP_URL`: staging values (the staging URL must be added as an authorized redirect URI).
4. Optional: `STAGING_ALLOW_MIGRATE=1` (Preview, branch `staging`) once the staging `DATABASE_URL` is confirmed separate.
5. AI keys (`GEMINI_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`) and models (`GEMINI_MODEL`, `GROQ_MODEL`) can be shared, or use separate staging keys to isolate usage.

## Stable URL
The branch alias `wing-span-git-staging-<team>.vercel.app` is created automatically for the `staging` branch.

## Workflow
patch on `staging` > commit > push > wait for the Preview deployment to be READY > check build logs if it fails > verify the flow > only then consider promoting.

## Database migrations on staging

Preview builds skip `prisma migrate deploy` by default. To let the `staging` branch migrate its own database, set these Preview-scoped variables for branch `staging` in Vercel:

- `STAGING_ALLOW_MIGRATE=1`
- `STAGING_DB_HOST_ALLOW=<endpoint id of the preview/staging Neon branch>` (for example `ep-restless-poetry-azm9akje`; not a secret)

The build prints the database endpoint it was given and refuses to migrate unless it matches `STAGING_DB_HOST_ALLOW`, so a preview can never migrate the live database. Production builds (`VERCEL_ENV=production`) always run `prisma migrate deploy`.

Production also needs `CRON_SECRET` set for the daily purge of raw agent output (`/api/cron/purge-agent-output`).
