-- CreateTable
CREATE TABLE "SessionPassHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "sessionNumber" INTEGER NOT NULL,
    "classTitle" TEXT NOT NULL,
    "attendedDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "retirementVillage" TEXT,
    "birthdate" DATETIME,
    "phone" TEXT,
    "address" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "sessionPassRemaining" INTEGER NOT NULL DEFAULT 10,
    "sessionPassTotal" INTEGER NOT NULL DEFAULT 10,
    "sessionPassPurchaseDate" DATETIME DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Customer" ("address", "birthdate", "createdAt", "email", "emergencyContactName", "emergencyContactPhone", "id", "name", "password", "phone", "retirementVillage", "updatedAt") SELECT "address", "birthdate", "createdAt", "email", "emergencyContactName", "emergencyContactPhone", "id", "name", "password", "phone", "retirementVillage", "updatedAt" FROM "Customer";
DROP TABLE "Customer";
ALTER TABLE "new_Customer" RENAME TO "Customer";
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "SessionPassHistory_bookingId_key" ON "SessionPassHistory"("bookingId");

-- CreateIndex
CREATE INDEX "SessionPassHistory_customerId_idx" ON "SessionPassHistory"("customerId");
