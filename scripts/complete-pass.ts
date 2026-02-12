/**
 * Script to complete Margaret's current pass and archive it
 * Run with: npx tsx scripts/complete-pass.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🎯 Completing Margaret's current session pass...");

  // Find Margaret
  const margaret = await prisma.customer.findFirst({
    where: { email: "margaret@example.com" },
  });

  if (!margaret) {
    console.error("❌ Margaret not found!");
    return;
  }

  console.log(`✅ Found Margaret (${margaret.sessionPassRemaining} sessions remaining)`);

  // Find 3 more classes to complete the pass (she has 7, needs 3 more)
  const additionalClasses = await prisma.class.findMany({
    where: {
      status: "scheduled",
      startTime: { lt: new Date() } // Past classes
    },
    take: 3,
    orderBy: { startTime: "desc" },
  });

  if (additionalClasses.length < 3) {
    console.log("⚠️ Not enough classes. Creating some dummy past classes...");

    // Create 3 dummy past classes
    for (let i = 0; i < 3; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (i + 1)); // Yesterday, day before, etc.

      await prisma.class.create({
        data: {
          title: ["Cardio Blast", "Yoga Flow", "Strength Training"][i],
          startTime: new Date(date.setHours(10, 0, 0, 0)),
          endTime: new Date(date.setHours(11, 0, 0, 0)),
          capacity: 15,
          location: "Sunrise Village",
          status: "scheduled",
        },
      });
    }
  }

  // Get fresh class list
  const classes = await prisma.class.findMany({
    where: {
      status: "scheduled",
      startTime: { lt: new Date() }
    },
    take: 3,
    orderBy: { startTime: "desc" },
  });

  // Mark 3 more sessions as attended (to reach 10 total)
  let sessionNumber = 8; // Starting from session 8 (since Margaret has 7)

  for (const classItem of classes) {
    // Create booking
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

    // Create session pass history
    await prisma.sessionPassHistory.create({
      data: {
        customerId: margaret.id,
        bookingId: booking.id,
        sessionNumber,
        classTitle: classItem.title,
        attendedDate: classItem.startTime,
      },
    });

    console.log(`✅ Session ${sessionNumber}: ${classItem.title}`);
    sessionNumber++;
  }

  // Update to 0 remaining
  await prisma.customer.update({
    where: { id: margaret.id },
    data: { sessionPassRemaining: 0 },
  });

  console.log("✅ Pass completed! (0/10 remaining)");
  console.log("\n🔄 Now purchasing a new pass to archive the old one...");

  // Import and use the purchaseSessionPass function
  const { purchaseSessionPass } = await import("../lib/db-store");
  await purchaseSessionPass(margaret.id, 10);

  console.log("✅ New pass purchased and old pass archived!");
  console.log("🎉 Check the dashboard to see the completed pass history!");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
