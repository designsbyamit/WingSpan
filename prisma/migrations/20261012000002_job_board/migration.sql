-- CreateTable
CREATE TABLE "JobBatch" (
    "id" TEXT NOT NULL,
    "label" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "imageCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    CONSTRAINT "JobBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobListing" (
    "id" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "companyKey" TEXT,
    "city" TEXT,
    "location" TEXT,
    "workMode" TEXT,
    "employment" TEXT,
    "level" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "minYears" INTEGER,
    "maxYears" INTEGER,
    "isDesign" BOOLEAN NOT NULL DEFAULT true,
    "roleFamily" TEXT,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "salaryText" TEXT,
    "applyUrl" TEXT,
    "sourceName" TEXT,
    "postedAt" TIMESTAMP(3),
    "postedText" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "rawText" TEXT,
    "batchId" TEXT,
    "firstAddedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "JobListing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobListing_dedupeKey_key" ON "JobListing"("dedupeKey");
CREATE INDEX "JobListing_status_level_idx" ON "JobListing"("status", "level");
CREATE INDEX "JobListing_isDesign_city_idx" ON "JobListing"("isDesign", "city");
CREATE INDEX "JobListing_lastSeenAt_idx" ON "JobListing"("lastSeenAt");

-- AddForeignKey
ALTER TABLE "JobListing" ADD CONSTRAINT "JobListing_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "JobBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
