# Changelog

## Unreleased (staging) - 2026-10-08

Blueprint areas 7, 15 and 19: deterministic scoring and schema contracts. Career Alpha flow and algorithm are unchanged.

### Career Direction
- Career Score is now computed in TypeScript (`lib/career-scoring.ts`), not by the model: `(0.40E + 0.40M + 0.20I) * (0.75 + 0.25C)`, with the documented E, M and I sub-weights.
- The model now returns candidate directions with 0-100 component sub-scores only. The app computes final scores and selects Safe, Growth and Bold by capability distance, so results are reproducible and auditable.
- Every candidate carries a `scoreBreakdown` (inputs, base score, confidence multiplier).
- Picks must be genuinely different directions: duplicate names are merged and near-duplicate names are not used for two bets.
- With fewer than three distinct directions the pipeline reports insufficient candidates instead of manufacturing a third bet.
- Removed two unused scoring helpers from `lib/v02-agents.ts`.

### Schema contracts
- Replaced every `z.any()` in `lib/agent-contracts.ts` with explicit schemas for capabilities, Career DNA dimensions, market directions, market evidence, capability requirements and career candidates.
- Missing numbers are rejected rather than turned into 0. Unknown enum labels fall back to the lowest-claim value (`core`, `weak_signal`, `current`, `uncertain`). A bare capability name keeps its name with score 0 and confidence 0.
- `zod` is now a direct dependency (it was only installed as a peer of other packages).

### Tooling and deployment
- `npm test` runs 26 unit tests for scoring and contracts.
- Staging: `scripts/vercel-build.sh` runs `prisma migrate deploy` only for production builds. See `docs/STAGING.md`.
- `package-lock.json` now includes `@sparticuz/chromium` and `playwright-core`, which were already in `package.json`.

## v0.1.0 - 2026-10-07

First working WingSpan release.

### Highlights
- Resume/document career extraction is working end-to-end.
- Career findings are surfaced before continuing to the Blueprint.
- Added a visible findings snapshot for extracted roles, projects, and skills.
- Hardened AI extraction against malformed or partial JSON responses.
- Added defensive normalization for career timeline and related extracted data.
- Added clear error states instead of allowing broken pipeline data to silently continue.
- Fixed the downstream Career Alpha pipeline handling.
- Production deployment is stable on the current release build.

### Release status
**v0.1.0 - First functional release**
