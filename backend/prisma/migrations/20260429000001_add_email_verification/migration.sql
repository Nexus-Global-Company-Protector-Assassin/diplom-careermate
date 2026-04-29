-- AlterTable: add emailVerified to User
ALTER TABLE "User" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false;

-- Existing users (registered before email verification) are considered verified
UPDATE "User" SET "emailVerified" = true WHERE "createdAt" < NOW();

-- CreateTable: EmailVerificationCode
CREATE TABLE "EmailVerificationCode" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailVerificationCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailVerificationCode_email_used_expiresAt_idx" ON "EmailVerificationCode"("email", "used", "expiresAt");
