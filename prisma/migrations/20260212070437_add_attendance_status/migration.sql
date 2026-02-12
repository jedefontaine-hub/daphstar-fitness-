/*
  Warnings:

  - You are about to drop the column `attendanceMarkedAt` on the `Booking` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "classId" TEXT NOT NULL,
    "customerId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "retirementVillage" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "attendanceStatus" TEXT NOT NULL DEFAULT 'pending',
    "cancelToken" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" DATETIME,
    CONSTRAINT "Booking_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Booking" ("attendanceStatus", "cancelToken", "cancelledAt", "classId", "createdAt", "customerEmail", "customerId", "customerName", "id", "retirementVillage", "status") SELECT coalesce("attendanceStatus", 'pending') AS "attendanceStatus", "cancelToken", "cancelledAt", "classId", "createdAt", "customerEmail", "customerId", "customerName", "id", "retirementVillage", "status" FROM "Booking";
DROP TABLE "Booking";
ALTER TABLE "new_Booking" RENAME TO "Booking";
CREATE UNIQUE INDEX "Booking_cancelToken_key" ON "Booking"("cancelToken");
CREATE INDEX "Booking_classId_idx" ON "Booking"("classId");
CREATE INDEX "Booking_customerId_idx" ON "Booking"("customerId");
CREATE INDEX "Booking_customerEmail_idx" ON "Booking"("customerEmail");
CREATE INDEX "Booking_cancelToken_idx" ON "Booking"("cancelToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
