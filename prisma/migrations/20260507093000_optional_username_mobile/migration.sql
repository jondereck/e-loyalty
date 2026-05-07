-- Allow simplified signup without username and mobile.
ALTER TABLE "UserProfile" ALTER COLUMN "username" DROP NOT NULL;
ALTER TABLE "UserProfile" ALTER COLUMN "mobile" DROP NOT NULL;
