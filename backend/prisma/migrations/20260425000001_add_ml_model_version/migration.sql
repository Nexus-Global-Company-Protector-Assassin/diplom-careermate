-- CreateTable: tracks trained ML model versions and their evaluation metrics
CREATE TABLE "MLModelVersion" (
    "id"           TEXT NOT NULL,
    "version"      TEXT NOT NULL,
    "algorithm"    TEXT NOT NULL,
    "trainedAt"    TIMESTAMP(3) NOT NULL,
    "precision10"  DOUBLE PRECISION,
    "ndcg10"       DOUBLE PRECISION,
    "auc"          DOUBLE PRECISION,
    "isActive"     BOOLEAN NOT NULL DEFAULT false,
    "artefactPath" TEXT,
    "trainSamples" INTEGER,
    "notes"        TEXT,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MLModelVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MLModelVersion_version_key" ON "MLModelVersion"("version");
