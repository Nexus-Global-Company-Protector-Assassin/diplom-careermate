-- CreateTable VacancyInteraction for behavioral signals tracking
CREATE TABLE IF NOT EXISTS "VacancyInteraction" (
    "id"        TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "vacancyId" TEXT NOT NULL,
    "type"      TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VacancyInteraction_pkey" PRIMARY KEY ("id")
);

-- Unique constraint: one interaction type per profile+vacancy
CREATE UNIQUE INDEX IF NOT EXISTS "VacancyInteraction_profileId_vacancyId_type_key"
    ON "VacancyInteraction"("profileId", "vacancyId", "type");

-- Index for fast profile-based queries
CREATE INDEX IF NOT EXISTS "VacancyInteraction_profileId_type_idx"
    ON "VacancyInteraction"("profileId", "type");

-- Foreign keys
ALTER TABLE "VacancyInteraction"
    ADD CONSTRAINT "VacancyInteraction_profileId_fkey"
    FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VacancyInteraction"
    ADD CONSTRAINT "VacancyInteraction_vacancyId_fkey"
    FOREIGN KEY ("vacancyId") REFERENCES "Vacancy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
