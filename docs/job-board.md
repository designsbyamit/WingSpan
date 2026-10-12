# Job board (JobListing / JobBatch)

Hand-fed from screenshots Amit shares almost daily. Mostly junior / fresher design roles, every level stored.
Separate from `Posting` (machine-crawled, auto-closed). The Student Plan reads open rows from the last 45 days
and shows fresher / junior ones first, labelled "shared by your mentor".

## Workflow
1. Write to **production** first (Neon project `blue-forest-82192683`, branch `main` = `br-divine-night-az9k9tji`).
2. Replicate the same rows to **staging** (`preview/staging` = `br-jolly-dew-azc1xz0z`).
3. One `JobBatch` per drop of screenshots; `imageCount` = number of images.

## Rules
- Only what is printed on the screenshot. Unknown fields stay NULL; never infer salary, years or apply links.
- `dedupeKey` = lower-case `company|title|city`, punctuation stripped, spaces collapsed to single spaces.
  Re-sharing a job refreshes `lastSeenAt` (and fills blanks) instead of adding a row.
- `level`: INTERN | FRESHER | JUNIOR | MID | SENIOR | LEAD | UNKNOWN. `status`: OPEN | CLOSED.
- `rawText` keeps the transcribed card for audit. `isDesign` false for non-design roles that are kept anyway.

## Upsert template
```sql
INSERT INTO "JobListing" ("id","dedupeKey","title","company","city","location","workMode","employment","level","minYears","maxYears","roleFamily","skills","salaryText","applyUrl","sourceName","postedText","rawText","batchId","updatedAt")
VALUES (gen_random_uuid()::text, '<key>', '<title>', '<company>', '<city>', '<location>', NULL, 'FULL_TIME', 'JUNIOR', 0, 2, 'UX', ARRAY['Figma'], NULL, NULL, 'LinkedIn', '2 days ago', '<card text>', '<batchId>', now())
ON CONFLICT ("dedupeKey") DO UPDATE SET "lastSeenAt" = now(), "status" = 'OPEN', "updatedAt" = now(),
  "applyUrl" = COALESCE(EXCLUDED."applyUrl","JobListing"."applyUrl"), "salaryText" = COALESCE(EXCLUDED."salaryText","JobListing"."salaryText");
```
