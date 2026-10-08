-- Blueprint versions: one autosaved working snapshot per user plus saved, labelled versions. Additive only.

-- CreateTable
CREATE TABLE "BlueprintSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isWorking" BOOLEAN NOT NULL DEFAULT true,
    "label" TEXT,
    "savedAt" TIMESTAMP(3),
    "blueprint" JSONB NOT NULL,
    "extractedData" JSONB,
    "selectedPath" TEXT,
    "analysisRunId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlueprintSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BlueprintSnapshot_userId_createdAt_idx" ON "BlueprintSnapshot"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "BlueprintSnapshot_analysisRunId_idx" ON "BlueprintSnapshot"("analysisRunId");

-- AddForeignKey
ALTER TABLE "BlueprintSnapshot" ADD CONSTRAINT "BlueprintSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlueprintSnapshot" ADD CONSTRAINT "BlueprintSnapshot_analysisRunId_fkey" FOREIGN KEY ("analysisRunId") REFERENCES "AnalysisRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- A user has at most one working snapshot; saved versions have isWorking = false.
CREATE UNIQUE INDEX "BlueprintSnapshot_one_working_per_user" ON "BlueprintSnapshot"("userId") WHERE "isWorking";
ALTER TABLE "BlueprintSnapshot" ADD CONSTRAINT "BlueprintSnapshot_version_not_working" CHECK (NOT ("isWorking" AND "savedAt" IS NOT NULL));
