-- Add explicit status timeline fields to found items
ALTER TABLE "FoundItem"
ADD COLUMN IF NOT EXISTS "claimedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "returnedAt" TIMESTAMP(3);