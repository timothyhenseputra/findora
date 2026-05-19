-- Add admin reset token fields
ALTER TABLE "Admin" ADD COLUMN IF NOT EXISTS "resetToken" TEXT;
ALTER TABLE "Admin" ADD COLUMN IF NOT EXISTS "resetTokenExpires" TIMESTAMP(3);

-- Ensure matchBreakdown exists on Matching
ALTER TABLE "Matching" ADD COLUMN IF NOT EXISTS "matchBreakdown" TEXT;
