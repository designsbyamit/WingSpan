-- Job-market database: sources, crawled documents, extracted observations and ingestion runs. Additive only.

CREATE TYPE "MarketCategory" AS ENUM ('INDUSTRY_PERFORMANCE', 'JOB_MARKET');

CREATE TABLE "MarketDataSource" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "publisher" TEXT NOT NULL,
    "category" "MarketCategory" NOT NULL,
    "kind" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "region" TEXT NOT NULL DEFAULT 'Global',
    "licence" TEXT,
    "reliability" DOUBLE PRECISION NOT NULL DEFAULT 0.6,
    "cadenceDays" INTEGER NOT NULL DEFAULT 10,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB,
    "notes" TEXT,
    "lastFetchedAt" TIMESTAMP(3),
    "lastStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MarketDataSource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarketDataDocument" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "publishedAt" TIMESTAMP(3),
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contentHash" TEXT NOT NULL,
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "error" TEXT,
    CONSTRAINT "MarketDataDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarketObservation" (
    "id" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "documentId" TEXT,
    "category" "MarketCategory" NOT NULL,
    "metric" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "value" DOUBLE PRECISION,
    "unit" TEXT,
    "period" TEXT,
    "statement" TEXT NOT NULL,
    "reliability" DOUBLE PRECISION NOT NULL,
    "observedAt" TIMESTAMP(3),
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "supersededAt" TIMESTAMP(3),
    CONSTRAINT "MarketObservation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarketIngestionRun" (
    "id" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "sourcesTried" INTEGER NOT NULL DEFAULT 0,
    "documentsNew" INTEGER NOT NULL DEFAULT 0,
    "observationsNew" INTEGER NOT NULL DEFAULT 0,
    "details" JSONB,
    CONSTRAINT "MarketIngestionRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MarketDataSource_key_key" ON "MarketDataSource"("key");
CREATE UNIQUE INDEX "MarketDataDocument_sourceId_url_key" ON "MarketDataDocument"("sourceId", "url");
CREATE INDEX "MarketDataDocument_fetchedAt_idx" ON "MarketDataDocument"("fetchedAt");
CREATE UNIQUE INDEX "MarketObservation_fingerprint_key" ON "MarketObservation"("fingerprint");
CREATE INDEX "MarketObservation_category_metric_idx" ON "MarketObservation"("category", "metric");
CREATE INDEX "MarketObservation_subject_idx" ON "MarketObservation"("subject");
CREATE INDEX "MarketObservation_region_idx" ON "MarketObservation"("region");
CREATE INDEX "MarketObservation_observedAt_idx" ON "MarketObservation"("observedAt");

ALTER TABLE "MarketDataDocument" ADD CONSTRAINT "MarketDataDocument_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "MarketDataSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketObservation" ADD CONSTRAINT "MarketObservation_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "MarketDataSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketObservation" ADD CONSTRAINT "MarketObservation_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "MarketDataDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;
