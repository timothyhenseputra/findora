-- Add manual claimant name for found items
ALTER TABLE "FoundItem"
ADD COLUMN "claimedByName" TEXT;
