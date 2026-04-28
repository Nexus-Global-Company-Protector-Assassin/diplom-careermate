-- CreateTable
CREATE TABLE "FavoriteVacancy" (
    "profileId" TEXT NOT NULL,
    "vacancyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavoriteVacancy_pkey" PRIMARY KEY ("profileId","vacancyId")
);

-- CreateIndex
CREATE INDEX "FavoriteVacancy_profileId_idx" ON "FavoriteVacancy"("profileId");

-- AddForeignKey
ALTER TABLE "FavoriteVacancy" ADD CONSTRAINT "FavoriteVacancy_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteVacancy" ADD CONSTRAINT "FavoriteVacancy_vacancyId_fkey" FOREIGN KEY ("vacancyId") REFERENCES "Vacancy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
