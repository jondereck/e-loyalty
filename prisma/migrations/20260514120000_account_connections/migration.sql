-- CreateTable
CREATE TABLE "AccountConnection" (
    "id" TEXT NOT NULL,
    "ownerProfileId" TEXT NOT NULL,
    "connectedProfileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountConnection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccountConnection_ownerProfileId_connectedProfileId_key" ON "AccountConnection"("ownerProfileId", "connectedProfileId");

-- CreateIndex
CREATE INDEX "AccountConnection_connectedProfileId_idx" ON "AccountConnection"("connectedProfileId");

-- AddForeignKey
ALTER TABLE "AccountConnection" ADD CONSTRAINT "AccountConnection_ownerProfileId_fkey" FOREIGN KEY ("ownerProfileId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountConnection" ADD CONSTRAINT "AccountConnection_connectedProfileId_fkey" FOREIGN KEY ("connectedProfileId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
