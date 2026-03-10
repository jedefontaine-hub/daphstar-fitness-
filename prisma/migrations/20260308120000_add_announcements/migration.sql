-- Create announcements table for village-specific pinned notices
CREATE TABLE "Announcement" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "village" TEXT NOT NULL,
  "isPinned" BOOLEAN NOT NULL DEFAULT true,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Announcement_village_isPinned_isActive_idx" ON "Announcement"("village", "isPinned", "isActive");
CREATE INDEX "Announcement_createdAt_idx" ON "Announcement"("createdAt");
