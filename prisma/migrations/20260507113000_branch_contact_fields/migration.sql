-- Add optional branch contact fields for admin branch management.
ALTER TABLE "Branch" ADD COLUMN "address" TEXT;
ALTER TABLE "Branch" ADD COLUMN "phone" TEXT;
ALTER TABLE "Branch" ADD COLUMN "email" TEXT;
