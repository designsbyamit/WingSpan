-- Career intelligence: additive only (new enums, tables, indexes, foreign keys). Nothing existing is altered.

-- CreateEnum
CREATE TYPE "EvidenceSourceType" AS ENUM ('RESUME', 'PORTFOLIO', 'PROJECT', 'EDUCATION', 'INTEREST', 'BEHAVIOUR', 'CONVERSATION');

-- CreateEnum
CREATE TYPE "EvidenceCategory" AS ENUM ('ROLE', 'RESPONSIBILITY', 'SKILL', 'CAPABILITY', 'ACHIEVEMENT', 'IMPACT', 'INTEREST', 'BEHAVIOUR', 'TRAJECTORY', 'CONSTRAINT');

-- CreateEnum
CREATE TYPE "EvidenceRelation" AS ENUM ('SUPPORTS', 'CONTRADICTS');

-- CreateEnum
CREATE TYPE "CapabilityType" AS ENUM ('CORE', 'TRANSFERABLE', 'DISTINCTIVE', 'DOMAIN', 'LEADERSHIP', 'STRATEGIC', 'CREATIVE', 'COLLABORATION');

-- CreateEnum
CREATE TYPE "DnaDimensionKind" AS ENUM ('STRONGEST', 'TRANSFERABLE', 'DISTINCTIVE');

-- CreateEnum
CREATE TYPE "MarketSourceType" AS ENUM ('GOVERNMENT', 'LABOUR_MARKET', 'EMPLOYER', 'RESEARCH', 'INDUSTRY', 'INVESTMENT', 'EXPERT', 'WEAK_SIGNAL');

-- CreateEnum
CREATE TYPE "MarketHorizon" AS ENUM ('CURRENT', 'ONE_TO_THREE_YEARS', 'THREE_TO_FIVE_YEARS', 'FIVE_TO_TEN_YEARS');

-- CreateEnum
CREATE TYPE "Directionality" AS ENUM ('POSITIVE', 'NEGATIVE', 'UNCERTAIN');

-- CreateEnum
CREATE TYPE "BetArchetype" AS ENUM ('SAFE', 'GROWTH', 'BOLD', 'RESERVE');

-- CreateEnum
CREATE TYPE "SourceKind" AS ENUM ('RESUME', 'PORTFOLIO', 'PROJECT', 'LINK', 'OTHER');

-- CreateEnum
CREATE TYPE "SourceStatus" AS ENUM ('PENDING', 'PARSED', 'FAILED');

-- CreateEnum
CREATE TYPE "RoadmapStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'DONE', 'SKIPPED');

-- CreateEnum
CREATE TYPE "FeedbackTarget" AS ENUM ('CANDIDATE', 'MILESTONE');

-- CreateEnum
CREATE TYPE "RunStatus" AS ENUM ('QUEUED', 'RUNNING', 'PARTIAL', 'COMPLETE', 'FAILED');

-- CreateEnum
CREATE TYPE "AgentName" AS ENUM ('AGGREGATOR', 'CAREER_ALPHA', 'MARKET_INTELLIGENCE', 'DIRECTION_GENERATOR');

-- CreateTable
CREATE TABLE "SourceDocument" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "SourceKind" NOT NULL,
    "filename" TEXT,
    "url" TEXT,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "contentHash" TEXT NOT NULL,
    "extractedText" TEXT,
    "status" "SourceStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SourceDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtractionRun" (
    "id" TEXT NOT NULL,
    "sourceDocumentId" TEXT NOT NULL,
    "model" TEXT,
    "promptVersion" TEXT,
    "raw" JSONB,
    "status" "SourceStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExtractionRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceDocumentId" TEXT,
    "company" TEXT,
    "title" TEXT NOT NULL,
    "startDate" TEXT,
    "endDate" TEXT,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceDocumentId" TEXT,
    "name" TEXT NOT NULL,
    "summary" TEXT,
    "role" TEXT,
    "outcomes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Education" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceDocumentId" TEXT,
    "institution" TEXT NOT NULL,
    "credential" TEXT,
    "field" TEXT,
    "startYear" INTEGER,
    "endYear" INTEGER,

    CONSTRAINT "Education_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillClaim" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceDocumentId" TEXT,
    "name" TEXT NOT NULL,
    "claimedLevel" TEXT,

    CONSTRAINT "SkillClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalysisRun" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "RunStatus" NOT NULL DEFAULT 'QUEUED',
    "isWorking" BOOLEAN NOT NULL DEFAULT true,
    "versionLabel" TEXT,
    "savedAt" TIMESTAMP(3),
    "pipelineVersion" TEXT NOT NULL,
    "formulaVersion" TEXT NOT NULL,
    "weights" JSONB NOT NULL,
    "models" JSONB,
    "tokensIn" INTEGER,
    "tokensOut" INTEGER,
    "costMicros" INTEGER,
    "durationMs" INTEGER,
    "confidence" DOUBLE PRECISION,
    "failedStage" "AgentName",
    "error" TEXT,
    "validationNotes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "AnalysisRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentOutput" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "agent" "AgentName" NOT NULL,
    "raw" JSONB NOT NULL,
    "valid" BOOLEAN NOT NULL,
    "validationError" TEXT,
    "model" TEXT,
    "promptVersion" TEXT,
    "tokensIn" INTEGER,
    "tokensOut" INTEGER,
    "durationMs" INTEGER,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentOutput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "sourceType" "EvidenceSourceType" NOT NULL,
    "sourceRef" TEXT,
    "category" "EvidenceCategory" NOT NULL,
    "statement" TEXT NOT NULL,
    "strength" DOUBLE PRECISION NOT NULL,
    "recency" DOUBLE PRECISION NOT NULL,
    "specificity" DOUBLE PRECISION NOT NULL,
    "reliability" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "startDate" TEXT,
    "endDate" TEXT,
    "entities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceLink" (
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    "relation" "EvidenceRelation" NOT NULL,

    CONSTRAINT "EvidenceLink_pkey" PRIMARY KEY ("fromId", "toId", "relation")
);

-- CreateTable
CREATE TABLE "Capability" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capabilityType" "CapabilityType" NOT NULL,
    "level" DOUBLE PRECISION NOT NULL,
    "recurrence" INTEGER NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "rationale" TEXT,

    CONSTRAINT "Capability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapabilityEvidence" (
    "capabilityId" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,

    CONSTRAINT "CapabilityEvidence_pkey" PRIMARY KEY ("capabilityId", "evidenceId")
);

-- CreateTable
CREATE TABLE "CareerDnaSnapshot" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "currentIdentity" TEXT NOT NULL,
    "emergingIdentity" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "underlyingCapabilities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "workingPatterns" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "problemSolvingPatterns" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "leadershipPatterns" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "domainExpertise" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "strategicMaturity" TEXT NOT NULL,
    "creativePatterns" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "collaborationPatterns" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "careerTrajectory" TEXT NOT NULL,
    "capabilityMaturity" TEXT NOT NULL,
    "deepInterestSignals" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "constraints" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "confidence" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "CareerDnaSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DnaDimension" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "kind" "DnaDimensionKind" NOT NULL,
    "name" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "rationale" TEXT,

    CONSTRAINT "DnaDimension_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DnaDimensionEvidence" (
    "dimensionId" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,

    CONSTRAINT "DnaDimensionEvidence_pkey" PRIMARY KEY ("dimensionId", "evidenceId")
);

-- CreateTable
CREATE TABLE "MarketDirection" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currentDemand" DOUBLE PRECISION NOT NULL,
    "momentum" DOUBLE PRECISION NOT NULL,
    "futurePotential" DOUBLE PRECISION NOT NULL,
    "resilience" DOUBLE PRECISION NOT NULL,
    "adjacency" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "currentCapabilities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "growingCapabilities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "decliningCapabilities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "futureThesis" TEXT,
    "invalidationRisks" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "geography" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "horizon" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "MarketDirection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketSignal" (
    "id" TEXT NOT NULL,
    "directionId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "signal" TEXT NOT NULL,
    "source" TEXT,
    "sourceType" "MarketSourceType" NOT NULL,
    "geography" TEXT,
    "observedAt" TIMESTAMP(3),
    "horizon" "MarketHorizon" NOT NULL,
    "directionality" "Directionality" NOT NULL,
    "magnitude" DOUBLE PRECISION NOT NULL,
    "reliability" DOUBLE PRECISION NOT NULL,
    "supportingEvidence" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "MarketSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapabilityRequirement" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "capability" TEXT NOT NULL,
    "importance" DOUBLE PRECISION NOT NULL,
    "levelRequired" DOUBLE PRECISION NOT NULL,
    "futureImportance" DOUBLE PRECISION NOT NULL,
    "marketDemand" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "CapabilityRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerCandidate" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "direction" TEXT NOT NULL,
    "archetype" "BetArchetype" NOT NULL,
    "experienceScore" DOUBLE PRECISION NOT NULL,
    "marketScore" DOUBLE PRECISION NOT NULL,
    "interestScore" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "careerScore" DOUBLE PRECISION NOT NULL,
    "capabilityDistance" DOUBLE PRECISION NOT NULL,
    "whyThisPerson" TEXT,
    "whyNow" TEXT,
    "rationale" TEXT,
    "breakdown" JSONB,

    CONSTRAINT "CareerCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateEvidence" (
    "candidateId" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,

    CONSTRAINT "CandidateEvidence_pkey" PRIMARY KEY ("candidateId", "evidenceId")
);

-- CreateTable
CREATE TABLE "ChosenBet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "candidateId" TEXT,
    "direction" TEXT NOT NULL,
    "archetype" "BetArchetype" NOT NULL,
    "careerScore" DOUBLE PRECISION NOT NULL,
    "rationale" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "pinnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChosenBet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Roadmap" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chosenBetId" TEXT,
    "title" TEXT NOT NULL,
    "status" "RoadmapStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Roadmap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoadmapMilestone" (
    "id" TEXT NOT NULL,
    "roadmapId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetCapability" TEXT,
    "gap" DOUBLE PRECISION,
    "status" "MilestoneStatus" NOT NULL DEFAULT 'PLANNED',
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "RoadmapMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MilestoneLink" (
    "id" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "conceptId" TEXT,
    "experienceId" TEXT,
    "challengeId" TEXT,

    CONSTRAINT "MilestoneLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCapabilityProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "capabilityName" TEXT NOT NULL,
    "competencyId" TEXT,
    "skillId" TEXT,
    "level" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserCapabilityProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "target" "FeedbackTarget" NOT NULL,
    "candidateKey" TEXT,
    "milestoneId" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageLedger" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "runId" TEXT,
    "kind" TEXT NOT NULL,
    "tokensIn" INTEGER NOT NULL DEFAULT 0,
    "tokensOut" INTEGER NOT NULL DEFAULT 0,
    "costMicros" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageLedger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SourceDocument_userId_contentHash_key" ON "SourceDocument"("userId", "contentHash");

-- CreateIndex
CREATE INDEX "SourceDocument_userId_createdAt_idx" ON "SourceDocument"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ExtractionRun_sourceDocumentId_idx" ON "ExtractionRun"("sourceDocumentId");

-- CreateIndex
CREATE INDEX "ExtractionRun_expiresAt_idx" ON "ExtractionRun"("expiresAt");

-- CreateIndex
CREATE INDEX "Role_userId_idx" ON "Role"("userId");

-- CreateIndex
CREATE INDEX "Role_sourceDocumentId_idx" ON "Role"("sourceDocumentId");

-- CreateIndex
CREATE INDEX "Project_userId_idx" ON "Project"("userId");

-- CreateIndex
CREATE INDEX "Project_sourceDocumentId_idx" ON "Project"("sourceDocumentId");

-- CreateIndex
CREATE INDEX "Education_userId_idx" ON "Education"("userId");

-- CreateIndex
CREATE INDEX "Education_sourceDocumentId_idx" ON "Education"("sourceDocumentId");

-- CreateIndex
CREATE UNIQUE INDEX "SkillClaim_userId_name_key" ON "SkillClaim"("userId", "name");

-- CreateIndex
CREATE INDEX "SkillClaim_sourceDocumentId_idx" ON "SkillClaim"("sourceDocumentId");

-- CreateIndex
CREATE INDEX "AnalysisRun_userId_createdAt_idx" ON "AnalysisRun"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AnalysisRun_userId_savedAt_idx" ON "AnalysisRun"("userId", "savedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AgentOutput_runId_agent_key" ON "AgentOutput"("runId", "agent");

-- CreateIndex
CREATE INDEX "AgentOutput_expiresAt_idx" ON "AgentOutput"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Evidence_runId_key_key" ON "Evidence"("runId", "key");

-- CreateIndex
CREATE INDEX "EvidenceLink_toId_idx" ON "EvidenceLink"("toId");

-- CreateIndex
CREATE UNIQUE INDEX "Capability_runId_key_key" ON "Capability"("runId", "key");

-- CreateIndex
CREATE INDEX "CapabilityEvidence_evidenceId_idx" ON "CapabilityEvidence"("evidenceId");

-- CreateIndex
CREATE UNIQUE INDEX "CareerDnaSnapshot_runId_key" ON "CareerDnaSnapshot"("runId");

-- CreateIndex
CREATE INDEX "DnaDimension_snapshotId_kind_idx" ON "DnaDimension"("snapshotId", "kind");

-- CreateIndex
CREATE INDEX "DnaDimensionEvidence_evidenceId_idx" ON "DnaDimensionEvidence"("evidenceId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketDirection_runId_name_key" ON "MarketDirection"("runId", "name");

-- CreateIndex
CREATE INDEX "MarketSignal_directionId_idx" ON "MarketSignal"("directionId");

-- CreateIndex
CREATE INDEX "MarketSignal_observedAt_idx" ON "MarketSignal"("observedAt");

-- CreateIndex
CREATE INDEX "CapabilityRequirement_runId_idx" ON "CapabilityRequirement"("runId");

-- CreateIndex
CREATE UNIQUE INDEX "CareerCandidate_runId_direction_key" ON "CareerCandidate"("runId", "direction");

-- CreateIndex
CREATE INDEX "CareerCandidate_runId_rank_idx" ON "CareerCandidate"("runId", "rank");

-- CreateIndex
CREATE INDEX "CandidateEvidence_evidenceId_idx" ON "CandidateEvidence"("evidenceId");

-- CreateIndex
CREATE INDEX "ChosenBet_userId_pinnedAt_idx" ON "ChosenBet"("userId", "pinnedAt");

-- CreateIndex
CREATE INDEX "ChosenBet_candidateId_idx" ON "ChosenBet"("candidateId");

-- CreateIndex
CREATE INDEX "Roadmap_userId_status_idx" ON "Roadmap"("userId", "status");

-- CreateIndex
CREATE INDEX "Roadmap_chosenBetId_idx" ON "Roadmap"("chosenBetId");

-- CreateIndex
CREATE UNIQUE INDEX "RoadmapMilestone_roadmapId_order_key" ON "RoadmapMilestone"("roadmapId", "order");

-- CreateIndex
CREATE INDEX "MilestoneLink_milestoneId_idx" ON "MilestoneLink"("milestoneId");

-- CreateIndex
CREATE INDEX "MilestoneLink_conceptId_idx" ON "MilestoneLink"("conceptId");

-- CreateIndex
CREATE INDEX "MilestoneLink_experienceId_idx" ON "MilestoneLink"("experienceId");

-- CreateIndex
CREATE INDEX "MilestoneLink_challengeId_idx" ON "MilestoneLink"("challengeId");

-- CreateIndex
CREATE UNIQUE INDEX "UserCapabilityProgress_userId_capabilityName_key" ON "UserCapabilityProgress"("userId", "capabilityName");

-- CreateIndex
CREATE INDEX "UserCapabilityProgress_competencyId_idx" ON "UserCapabilityProgress"("competencyId");

-- CreateIndex
CREATE INDEX "UserCapabilityProgress_skillId_idx" ON "UserCapabilityProgress"("skillId");

-- CreateIndex
CREATE INDEX "AuditEvent_userId_createdAt_idx" ON "AuditEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_action_createdAt_idx" ON "AuditEvent"("action", "createdAt");

-- CreateIndex
CREATE INDEX "Feedback_userId_createdAt_idx" ON "Feedback"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Feedback_milestoneId_idx" ON "Feedback"("milestoneId");

-- CreateIndex
CREATE INDEX "UsageLedger_userId_createdAt_idx" ON "UsageLedger"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "UsageLedger_runId_idx" ON "UsageLedger"("runId");

-- AddForeignKey
ALTER TABLE "SourceDocument" ADD CONSTRAINT "SourceDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtractionRun" ADD CONSTRAINT "ExtractionRun_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "SourceDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "SourceDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "SourceDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Education" ADD CONSTRAINT "Education_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Education" ADD CONSTRAINT "Education_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "SourceDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillClaim" ADD CONSTRAINT "SkillClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillClaim" ADD CONSTRAINT "SkillClaim_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "SourceDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisRun" ADD CONSTRAINT "AnalysisRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentOutput" ADD CONSTRAINT "AgentOutput_runId_fkey" FOREIGN KEY ("runId") REFERENCES "AnalysisRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_runId_fkey" FOREIGN KEY ("runId") REFERENCES "AnalysisRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceLink" ADD CONSTRAINT "EvidenceLink_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "Evidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceLink" ADD CONSTRAINT "EvidenceLink_toId_fkey" FOREIGN KEY ("toId") REFERENCES "Evidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Capability" ADD CONSTRAINT "Capability_runId_fkey" FOREIGN KEY ("runId") REFERENCES "AnalysisRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapabilityEvidence" ADD CONSTRAINT "CapabilityEvidence_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "Capability"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapabilityEvidence" ADD CONSTRAINT "CapabilityEvidence_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "Evidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerDnaSnapshot" ADD CONSTRAINT "CareerDnaSnapshot_runId_fkey" FOREIGN KEY ("runId") REFERENCES "AnalysisRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DnaDimension" ADD CONSTRAINT "DnaDimension_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "CareerDnaSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DnaDimensionEvidence" ADD CONSTRAINT "DnaDimensionEvidence_dimensionId_fkey" FOREIGN KEY ("dimensionId") REFERENCES "DnaDimension"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DnaDimensionEvidence" ADD CONSTRAINT "DnaDimensionEvidence_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "Evidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketDirection" ADD CONSTRAINT "MarketDirection_runId_fkey" FOREIGN KEY ("runId") REFERENCES "AnalysisRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketSignal" ADD CONSTRAINT "MarketSignal_directionId_fkey" FOREIGN KEY ("directionId") REFERENCES "MarketDirection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapabilityRequirement" ADD CONSTRAINT "CapabilityRequirement_runId_fkey" FOREIGN KEY ("runId") REFERENCES "AnalysisRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerCandidate" ADD CONSTRAINT "CareerCandidate_runId_fkey" FOREIGN KEY ("runId") REFERENCES "AnalysisRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateEvidence" ADD CONSTRAINT "CandidateEvidence_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "CareerCandidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateEvidence" ADD CONSTRAINT "CandidateEvidence_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "Evidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChosenBet" ADD CONSTRAINT "ChosenBet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChosenBet" ADD CONSTRAINT "ChosenBet_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "CareerCandidate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Roadmap" ADD CONSTRAINT "Roadmap_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Roadmap" ADD CONSTRAINT "Roadmap_chosenBetId_fkey" FOREIGN KEY ("chosenBetId") REFERENCES "ChosenBet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadmapMilestone" ADD CONSTRAINT "RoadmapMilestone_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "Roadmap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilestoneLink" ADD CONSTRAINT "MilestoneLink_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "RoadmapMilestone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilestoneLink" ADD CONSTRAINT "MilestoneLink_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilestoneLink" ADD CONSTRAINT "MilestoneLink_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilestoneLink" ADD CONSTRAINT "MilestoneLink_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCapabilityProgress" ADD CONSTRAINT "UserCapabilityProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "RoadmapMilestone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageLedger" ADD CONSTRAINT "UsageLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageLedger" ADD CONSTRAINT "UsageLedger_runId_fkey" FOREIGN KEY ("runId") REFERENCES "AnalysisRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Rules Prisma cannot express in schema.prisma ------------------------------------------

-- A user has at most one working (overwritable) run. Saved versions have isWorking = false.
CREATE UNIQUE INDEX "AnalysisRun_one_working_per_user" ON "AnalysisRun"("userId") WHERE "isWorking";
-- A saved version is never the working run.
ALTER TABLE "AnalysisRun" ADD CONSTRAINT "AnalysisRun_version_not_working" CHECK (NOT ("isWorking" AND "savedAt" IS NOT NULL));

-- A user has at most one active chosen bet.
CREATE UNIQUE INDEX "ChosenBet_one_active_per_user" ON "ChosenBet"("userId") WHERE "active";

-- A milestone link points at exactly one piece of learning content.
ALTER TABLE "MilestoneLink" ADD CONSTRAINT "MilestoneLink_exactly_one_target" CHECK (num_nonnulls("conceptId", "experienceId", "challengeId") = 1);

-- Feedback is a thumbs up or down.
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_rating_check" CHECK ("rating" IN (-1, 1));
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_target_check" CHECK (
  ("target" = 'CANDIDATE' AND "candidateKey" IS NOT NULL) OR ("target" = 'MILESTONE' AND "milestoneId" IS NOT NULL)
);
