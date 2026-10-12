-- Employers and their open design roles, crawled from public job-board feeds. Additive only.

CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sector" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'PRODUCT',
    "cities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "careersUrl" TEXT,
    "atsType" TEXT,
    "atsToken" TEXT,
    "seeded" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "fresherScore" DOUBLE PRECISION,
    "scoreSignals" JSONB,
    "lastCrawledAt" TIMESTAMP(3),
    "lastStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Posting" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "location" TEXT,
    "inIndia" BOOLEAN NOT NULL DEFAULT false,
    "remote" BOOLEAN NOT NULL DEFAULT false,
    "isDesign" BOOLEAN NOT NULL DEFAULT false,
    "seniority" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "minYears" INTEGER,
    "fresherOk" BOOLEAN NOT NULL DEFAULT false,
    "postedAt" TIMESTAMP(3),
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "excerpt" TEXT,
    CONSTRAINT "Posting_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Company_key_key" ON "Company"("key");
CREATE UNIQUE INDEX "Posting_companyId_externalId_key" ON "Posting"("companyId", "externalId");
CREATE INDEX "Posting_isDesign_inIndia_closedAt_idx" ON "Posting"("isDesign", "inIndia", "closedAt");
CREATE INDEX "Posting_fresherOk_idx" ON "Posting"("fresherOk");

ALTER TABLE "Posting" ADD CONSTRAINT "Posting_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
