/**
 * Seed script to create dummy session pass data for testing
 * Run with: npx tsx scripts/seed-session-data.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding session pass data...");

  // Find Margaret's customer record
  const margaret = await prisma.customer.findFirst({
    where: { email: "margaret@example.com" },
  });

  if (!margaret) {
    console.error("❌ Margaret not found! Please ensure the main seed has run.");
    return;
  }

  console.log("✅ Found Margaret:", margaret.name);

  // Find some classes to create bookings for
  const classes = await prisma.class.findMany({
    where: { status: "scheduled" },
    take: 7,
    orderBy: { startTime: "asc" },
  });

  if (classes.length === 0) {
    console.error("❌ No classes found! Please ensure classes exist.");
    return;
  }

  console.log(`✅ Found ${classes.length} classes`);

  // Create bookings and mark 7 as attended
  let sessionNumber = 1;

  for (const classItem of classes) {
    // Create a booking
    const booking = await prisma.booking.create({
      data: {
        classId: classItem.id,
        customerId: margaret.id,
        customerName: margaret.name,
        customerEmail: margaret.email,
        retirementVillage: margaret.retirementVillage,
        status: "active",
        attendanceStatus: "attended",
      },
    });

    console.log(`📝 Created booking for: ${classItem.title}`);

    // Create session pass history
    await prisma.sessionPassHistory.create({
      data: {
        customerId: margaret.id,
        bookingId: booking.id,
        sessionNumber: sessionNumber,
        classTitle: classItem.title,
        attendedDate: classItem.startTime,
      },
    });

    console.log(`✅ Marked session ${sessionNumber} as attended: ${classItem.title}`);
    sessionNumber++;
  }

  // Update Margaret's session pass to show 7 sessions used (3 remaining)
  await prisma.customer.update({
    where: { id: margaret.id },
    data: {
      sessionPassRemaining: 3,
      sessionPassTotal: 10,
    },
  });

  console.log("✅ Updated session pass: 3/10 remaining");
  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
