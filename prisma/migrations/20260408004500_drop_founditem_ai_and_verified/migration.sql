-- Drop obsolete fields from FoundItem
ALTER TABLE "FoundItem"
DROP COLUMN IF EXISTS "aiGeneratedDescription",
DROP COLUMN IF EXISTS "verified";
