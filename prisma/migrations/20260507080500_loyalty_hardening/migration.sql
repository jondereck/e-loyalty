-- Add server-side business day and idempotency fields for loyalty scans.
ALTER TABLE "Visit" ADD COLUMN "businessDate" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Visit" ADD COLUMN "earnKey" TEXT;

ALTER TABLE "ScanAttempt" ADD COLUMN "businessDate" TEXT;
ALTER TABLE "ScanAttempt" ADD COLUMN "repeatedCustomerScan" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ScanAttempt" ADD COLUMN "repeatedCashierFailure" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ScanAttempt" ADD COLUMN "invalidQrBurst" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ScanAttempt" ADD COLUMN "multipleBranchSameDay" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "Visit_earnKey_key" ON "Visit"("earnKey");
CREATE UNIQUE INDEX "RewardRedemption_loyaltyCardId_milestoneId_key" ON "RewardRedemption"("loyaltyCardId", "milestoneId");
