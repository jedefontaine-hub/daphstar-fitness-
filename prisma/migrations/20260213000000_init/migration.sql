-- CreateTable
CREATE TABLE "Class" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "customerId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "retirementVillage" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "attendanceStatus" TEXT NOT NULL DEFAULT 'pending',
    "cancelToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "retirementVillage" TEXT,
    "birthdate" TIMESTAMP(3),
    "phone" TEXT,
    "address" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sessionPassRemaining" INTEGER NOT NULL DEFAULT 10,
    "sessionPassTotal" INTEGER NOT NULL DEFAULT 10,
    "sessionPassPurchaseDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionPassHistory" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "sessionNumber" INTEGER NOT NULL,
    "classTitle" TEXT NOT NULL,
    "attendedDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionPassHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompletedSessionPass" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "purchaseDate" TIMESTAMP(3) NOT NULL,
    "completedDate" TIMESTAMP(3) NOT NULL,
    "sessionsCount" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompletedSessionPass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompletedSession" (
    "id" TEXT NOT NULL,
    "completedPassId" TEXT NOT NULL,
    "sessionNumber" INTEGER NOT NULL,
    "classTitle" TEXT NOT NULL,
    "attendedDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompletedSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Booking_cancelToken_key" ON "Booking"("cancelToken");

-- CreateIndex
CREATE INDEX "Booking_classId_idx" ON "Booking"("classId");

-- CreateIndex
CREATE INDEX "Booking_customerId_idx" ON "Booking"("customerId");

-- CreateIndex
CREATE INDEX "Booking_customerEmail_idx" ON "Booking"("customerEmail");

-- CreateIndex
CREATE INDEX "Booking_cancelToken_idx" ON "Booking"("cancelToken");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "SessionPassHistory_bookingId_key" ON "SessionPassHistory"("bookingId");

-- CreateIndex
CREATE INDEX "SessionPassHistory_customerId_idx" ON "SessionPassHistory"("customerId");

-- CreateIndex
CREATE INDEX "CompletedSessionPass_customerId_idx" ON "CompletedSessionPass"("customerId");

-- CreateIndex
CREATE INDEX "CompletedSession_completedPassId_idx" ON "CompletedSession"("completedPassId");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompletedSession" ADD CONSTRAINT "CompletedSession_completedPassId_fkey" FOREIGN KEY ("completedPassId") REFERENCES "CompletedSessionPass"("id") ON DELETE CASCADE ON UPDATE CASCADE;
