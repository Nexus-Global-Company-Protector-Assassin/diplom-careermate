-- AddColumn workFormatPreference, companyTypePreference, managementStylePreference to Profile
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "workFormatPreference" TEXT;
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "companyTypePreference" TEXT;
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "managementStylePreference" TEXT;
