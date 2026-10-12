-- Where a posting was read from (public job-board feed or the employer's own page). Additive only.
ALTER TABLE "Posting" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'ATS';
