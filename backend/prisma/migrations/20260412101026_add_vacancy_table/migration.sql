-- CreateTable
CREATE TABLE "Vacancy" (
    "id" TEXT NOT NULL,
    "hhId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "employer" TEXT NOT NULL,
    "location" TEXT,
    "salaryFrom" INTEGER,
    "salaryTo" INTEGER,
    "salaryCurrency" TEXT,
    "salaryLabel" TEXT,
    "skills" JSONB,
    "descriptionPreview" TEXT,
    "experience" TEXT,
    "schedule" TEXT,
    "searchQuery" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vacancy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Vacancy_hhId_key" ON "Vacancy"("hhId");
