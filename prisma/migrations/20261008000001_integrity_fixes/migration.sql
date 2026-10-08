-- Integrity fixes. Existing rows are backfilled, not dropped. Runs as one transaction.
-- Rows that cannot be mapped (unknown type strings, content ids that no longer exist) fall back to
-- 'other' / NULL rather than failing the deploy.

-- Helper: parse text as JSON, falling back to an empty array on malformed input. Dropped at the end.
CREATE FUNCTION "_wingspan_safe_jsonb"(input TEXT) RETURNS JSONB AS $$
BEGIN
  RETURN input::jsonb;
EXCEPTION WHEN others THEN
  RETURN '[]'::jsonb;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 1. Enums for free-text type columns ---------------------------------------------------------
CREATE TYPE "ExperienceType" AS ENUM ('module', 'project', 'exercise', 'case-study', 'other');
CREATE TYPE "ChallengeType" AS ENUM ('brief', 'critique', 'redesign', 'other');
CREATE TYPE "AssetType" AS ENUM ('image', 'pdf', 'video', 'figma', 'other');
CREATE TYPE "MessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

ALTER TABLE "Experience" ALTER COLUMN "type" TYPE "ExperienceType"
  USING (CASE WHEN "type" IN ('module', 'project', 'exercise', 'case-study') THEN "type" ELSE 'other' END::"ExperienceType");
ALTER TABLE "Experience" ALTER COLUMN "type" SET DEFAULT 'module';

ALTER TABLE "Challenge" ALTER COLUMN "type" TYPE "ChallengeType"
  USING (CASE WHEN "type" IN ('brief', 'critique', 'redesign') THEN "type" ELSE 'other' END::"ChallengeType");
ALTER TABLE "Challenge" ALTER COLUMN "type" SET DEFAULT 'other';

ALTER TABLE "Asset" ALTER COLUMN "type" TYPE "AssetType"
  USING (CASE WHEN "type" IN ('image', 'pdf', 'video', 'figma') THEN "type" ELSE 'other' END::"AssetType");
ALTER TABLE "Asset" ALTER COLUMN "type" SET DEFAULT 'other';

-- 2. Comma-separated tags -> TEXT[] -------------------------------------------------------------
ALTER TABLE "Asset" ALTER COLUMN "tags" DROP DEFAULT;
ALTER TABLE "Asset" ALTER COLUMN "tags" TYPE TEXT[]
  USING (array_remove(regexp_split_to_array(btrim("tags"), '\s*,\s*'), ''));
ALTER TABLE "Asset" ALTER COLUMN "tags" SET DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Asset" ALTER COLUMN "tags" SET NOT NULL;

-- 3. JSON stored as text -> JSONB ---------------------------------------------------------------
ALTER TABLE "AIMentorContext" ALTER COLUMN "weaknesses" DROP DEFAULT;
ALTER TABLE "AIMentorContext" ALTER COLUMN "weaknesses" TYPE JSONB USING "_wingspan_safe_jsonb"("weaknesses");
ALTER TABLE "AIMentorContext" ALTER COLUMN "weaknesses" SET DEFAULT '[]';
ALTER TABLE "AIMentorContext" ALTER COLUMN "reflectionHistory" DROP DEFAULT;
ALTER TABLE "AIMentorContext" ALTER COLUMN "reflectionHistory" TYPE JSONB USING "_wingspan_safe_jsonb"("reflectionHistory");
ALTER TABLE "AIMentorContext" ALTER COLUMN "reflectionHistory" SET DEFAULT '[]';

-- 4. Soft delete on users ------------------------------------------------------------------------
ALTER TABLE "User" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- 5. Duplicate lastSeen / lastSeenAt on UserConceptMastery ----------------------------------------
UPDATE "UserConceptMastery" SET "lastSeenAt" = "lastSeen" WHERE "lastSeen" IS NOT NULL AND "lastSeen" > "lastSeenAt";
ALTER TABLE "UserConceptMastery" DROP COLUMN "lastSeen";

-- 6. LearningPathEntry: typed foreign keys instead of entityType/entityId -----------------------------
ALTER TABLE "LearningPathEntry" ADD COLUMN "conceptId" TEXT, ADD COLUMN "experienceId" TEXT, ADD COLUMN "challengeId" TEXT;
UPDATE "LearningPathEntry" e SET "experienceId" = e."entityId"
  WHERE e."entityType" = 'experience' AND EXISTS (SELECT 1 FROM "Experience" x WHERE x."id" = e."entityId");
UPDATE "LearningPathEntry" e SET "conceptId" = e."entityId"
  WHERE e."entityType" = 'concept' AND EXISTS (SELECT 1 FROM "Concept" x WHERE x."id" = e."entityId");
UPDATE "LearningPathEntry" e SET "challengeId" = e."entityId"
  WHERE e."entityType" = 'challenge' AND EXISTS (SELECT 1 FROM "Challenge" x WHERE x."id" = e."entityId");
ALTER TABLE "LearningPathEntry" DROP COLUMN "entityType", DROP COLUMN "entityId";

-- Make (learningPathId, order) unique. Only paths that already contain duplicate orders are renumbered,
-- preserving their relative sequence.
UPDATE "LearningPathEntry" e SET "order" = r.rn
  FROM (
    SELECT "id", row_number() OVER (PARTITION BY "learningPathId" ORDER BY "order", "id") AS rn
    FROM "LearningPathEntry"
    WHERE "learningPathId" IN (
      SELECT "learningPathId" FROM "LearningPathEntry" GROUP BY "learningPathId", "order" HAVING count(*) > 1
    )
  ) r
  WHERE e."id" = r."id";

-- NOT VALID: new and updated rows must point at exactly one target; any legacy row whose content no
-- longer exists is left in place rather than deleted.
ALTER TABLE "LearningPathEntry" ADD CONSTRAINT "LearningPathEntry_exactly_one_target"
  CHECK (num_nonnulls("conceptId", "experienceId", "challengeId") = 1) NOT VALID;

-- 7. LearningSession: typed foreign keys instead of entityType/entityId ----------------------------------
ALTER TABLE "LearningSession" ADD COLUMN "conceptId" TEXT, ADD COLUMN "challengeId" TEXT;
UPDATE "LearningSession" s SET "experienceId" = s."entityId"
  WHERE s."experienceId" IS NULL AND s."entityType" = 'experience'
    AND EXISTS (SELECT 1 FROM "Experience" x WHERE x."id" = s."entityId");
UPDATE "LearningSession" s SET "conceptId" = s."entityId"
  WHERE s."entityType" = 'concept' AND EXISTS (SELECT 1 FROM "Concept" x WHERE x."id" = s."entityId");
UPDATE "LearningSession" s SET "challengeId" = s."entityId"
  WHERE s."entityType" = 'challenge' AND EXISTS (SELECT 1 FROM "Challenge" x WHERE x."id" = s."entityId");

-- 8. Mentor chat -> its own table --------------------------------------------------------------------------
CREATE TABLE "MentorMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MentorMessage_pkey" PRIMARY KEY ("id")
);

INSERT INTO "MentorMessage" ("id", "sessionId", "role", "content", "createdAt")
SELECT gen_random_uuid()::text, s."id", upper(t.msg->>'role')::"MessageRole", t.msg->>'content',
       s."startedAt" + (t.ord * interval '1 millisecond')
FROM "LearningSession" s,
     LATERAL jsonb_array_elements(
       CASE WHEN jsonb_typeof("_wingspan_safe_jsonb"(s."aiMessages")) = 'array'
            THEN "_wingspan_safe_jsonb"(s."aiMessages") ELSE '[]'::jsonb END
     ) WITH ORDINALITY AS t(msg, ord)
WHERE jsonb_typeof(t.msg) = 'object'
  AND upper(t.msg->>'role') IN ('USER', 'ASSISTANT', 'SYSTEM')
  AND t.msg->>'content' IS NOT NULL;

ALTER TABLE "LearningSession" DROP COLUMN "aiMessages", DROP COLUMN "entityType", DROP COLUMN "entityId";

ALTER TABLE "LearningSession" ADD CONSTRAINT "LearningSession_exactly_one_target"
  CHECK (num_nonnulls("conceptId", "experienceId", "challengeId") = 1) NOT VALID;

-- 9. Foreign keys: typed content references and cascade-on-user-delete ---------------------------------------
ALTER TABLE "LearningPathEntry" ADD CONSTRAINT "LearningPathEntry_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LearningPathEntry" ADD CONSTRAINT "LearningPathEntry_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LearningPathEntry" ADD CONSTRAINT "LearningPathEntry_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LearningSession" ADD CONSTRAINT "LearningSession_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LearningSession" ADD CONSTRAINT "LearningSession_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MentorMessage" ADD CONSTRAINT "MentorMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LearningSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LearningPathEntry" DROP CONSTRAINT "LearningPathEntry_learningPathId_fkey";
ALTER TABLE "LearningPathEntry" ADD CONSTRAINT "LearningPathEntry_learningPathId_fkey" FOREIGN KEY ("learningPathId") REFERENCES "LearningPath"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MagicLinkToken" DROP CONSTRAINT "MagicLinkToken_userId_fkey";
ALTER TABLE "MagicLinkToken" ADD CONSTRAINT "MagicLinkToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserCompetency" DROP CONSTRAINT "UserCompetency_userId_fkey";
ALTER TABLE "UserCompetency" ADD CONSTRAINT "UserCompetency_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserSkill" DROP CONSTRAINT "UserSkill_userId_fkey";
ALTER TABLE "UserSkill" ADD CONSTRAINT "UserSkill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserConceptMastery" DROP CONSTRAINT "UserConceptMastery_userId_fkey";
ALTER TABLE "UserConceptMastery" ADD CONSTRAINT "UserConceptMastery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LearningSession" DROP CONSTRAINT "LearningSession_userId_fkey";
ALTER TABLE "LearningSession" ADD CONSTRAINT "LearningSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserLearningPath" DROP CONSTRAINT "UserLearningPath_userId_fkey";
ALTER TABLE "UserLearningPath" ADD CONSTRAINT "UserLearningPath_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIMentorContext" DROP CONSTRAINT "AIMentorContext_userId_fkey";
ALTER TABLE "AIMentorContext" ADD CONSTRAINT "AIMentorContext_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChallengeSubmission" DROP CONSTRAINT "ChallengeSubmission_userId_fkey";
ALTER TABLE "ChallengeSubmission" ADD CONSTRAINT "ChallengeSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 10. Indexes -----------------------------------------------------------------------------------------------
CREATE UNIQUE INDEX "LearningPathEntry_learningPathId_order_key" ON "LearningPathEntry"("learningPathId", "order");
CREATE INDEX "LearningPathEntry_conceptId_idx" ON "LearningPathEntry"("conceptId");
CREATE INDEX "LearningPathEntry_experienceId_idx" ON "LearningPathEntry"("experienceId");
CREATE INDEX "LearningPathEntry_challengeId_idx" ON "LearningPathEntry"("challengeId");
CREATE INDEX "LearningSession_userId_startedAt_idx" ON "LearningSession"("userId", "startedAt");
CREATE INDEX "LearningSession_experienceId_idx" ON "LearningSession"("experienceId");
CREATE INDEX "LearningSession_conceptId_idx" ON "LearningSession"("conceptId");
CREATE INDEX "LearningSession_challengeId_idx" ON "LearningSession"("challengeId");
CREATE INDEX "MentorMessage_sessionId_createdAt_idx" ON "MentorMessage"("sessionId", "createdAt");
CREATE INDEX "Competency_domainId_idx" ON "Competency"("domainId");
CREATE INDEX "Skill_domainId_idx" ON "Skill"("domainId");
CREATE INDEX "LearningPath_careerLevelId_idx" ON "LearningPath"("careerLevelId");
CREATE INDEX "User_careerLevelId_idx" ON "User"("careerLevelId");
CREATE INDEX "MagicLinkToken_userId_idx" ON "MagicLinkToken"("userId");
CREATE INDEX "MagicLinkToken_email_idx" ON "MagicLinkToken"("email");
CREATE INDEX "UserCompetency_competencyId_idx" ON "UserCompetency"("competencyId");
CREATE INDEX "UserSkill_skillId_idx" ON "UserSkill"("skillId");
CREATE INDEX "UserConceptMastery_conceptId_idx" ON "UserConceptMastery"("conceptId");
CREATE INDEX "UserLearningPath_learningPathId_idx" ON "UserLearningPath"("learningPathId");
CREATE INDEX "ChallengeSubmission_userId_submittedAt_idx" ON "ChallengeSubmission"("userId", "submittedAt");
CREATE INDEX "ChallengeSubmission_challengeId_idx" ON "ChallengeSubmission"("challengeId");
CREATE INDEX "ConceptPrerequisite_prerequisiteId_idx" ON "ConceptPrerequisite"("prerequisiteId");
CREATE INDEX "ConceptOnSkill_skillId_idx" ON "ConceptOnSkill"("skillId");
CREATE INDEX "ConceptOnHumanPattern_humanPatternId_idx" ON "ConceptOnHumanPattern"("humanPatternId");
CREATE INDEX "ConceptOnPrinciple_principleId_idx" ON "ConceptOnPrinciple"("principleId");
CREATE INDEX "ConceptOnExperience_experienceId_idx" ON "ConceptOnExperience"("experienceId");
CREATE INDEX "SkillOnCompetency_competencyId_idx" ON "SkillOnCompetency"("competencyId");
CREATE INDEX "SkillOnCareerLevel_careerLevelId_idx" ON "SkillOnCareerLevel"("careerLevelId");
CREATE INDEX "ExperienceOnCompetency_competencyId_idx" ON "ExperienceOnCompetency"("competencyId");
CREATE INDEX "ExperienceOnHumanPattern_humanPatternId_idx" ON "ExperienceOnHumanPattern"("humanPatternId");
CREATE INDEX "ExperienceOnPrinciple_principleId_idx" ON "ExperienceOnPrinciple"("principleId");
CREATE INDEX "ChallengeOnSkill_skillId_idx" ON "ChallengeOnSkill"("skillId");
CREATE INDEX "ChallengeOnCompetency_competencyId_idx" ON "ChallengeOnCompetency"("competencyId");

DROP FUNCTION "_wingspan_safe_jsonb"(TEXT);
