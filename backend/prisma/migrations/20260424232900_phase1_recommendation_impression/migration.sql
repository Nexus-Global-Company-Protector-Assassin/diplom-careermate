-- CreateTable RecommendationImpression
CREATE TABLE "RecommendationImpression" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "vacancyId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "modelVersion" TEXT NOT NULL DEFAULT 'rule-based-v1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecommendationImpression_pkey" PRIMARY KEY ("id")
);

-- CreateIndex RecommendationImpression_profileId_createdAt_idx
CREATE INDEX "RecommendationImpression_profileId_createdAt_idx" ON "RecommendationImpression"("profileId", "createdAt");
