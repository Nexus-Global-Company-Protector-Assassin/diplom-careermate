-- CreateTable
CREATE TABLE "CareerAssessment" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "dimensionScores" JSONB NOT NULL,
    "result" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CareerAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CareerAssessment_profileId_createdAt_idx" ON "CareerAssessment"("profileId", "createdAt");

-- AddForeignKey
ALTER TABLE "CareerAssessment" ADD CONSTRAINT "CareerAssessment_profileId_fkey"
    FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
