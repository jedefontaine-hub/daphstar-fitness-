-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "attendanceMarkedAt" DATETIME;
ALTER TABLE "Booking" ADD COLUMN "attendanceStatus" TEXT DEFAULT 'pending';
