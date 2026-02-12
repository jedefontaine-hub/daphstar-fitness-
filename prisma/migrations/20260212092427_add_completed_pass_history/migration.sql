-- CreateTable
CREATE TABLE "CompletedSessionPass" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "purchaseDate" DATETIME NOT NULL,
    "completedDate" DATETIME NOT NULL,
    "sessionsCount" INTEGER NOT NULL DEFAULT 10,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "CompletedSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "completedPassId" TEXT NOT NULL,
    "sessionNumber" INTEGER NOT NULL,
    "classTitle" TEXT NOT NULL,
    "attendedDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CompletedSession_completedPassId_fkey" FOREIGN KEY ("completedPassId") REFERENCES "CompletedSessionPass" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "CompletedSessionPass_customerId_idx" ON "CompletedSessionPass"("customerId");

-- CreateIndex
CREATE INDEX "CompletedSession_completedPassId_idx" ON "CompletedSession"("completedPassId");
