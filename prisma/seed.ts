import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await prisma.booking.deleteMany();
  await prisma.class.deleteMany();
  await prisma.customer.deleteMany();

  // Seed customers
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        id: "cust-1",
        name: "Margaret Wilson",
        email: "margaret@example.com",
        password: "password123",
        retirementVillage: "Sunrise Village",
      },
    }),
    prisma.customer.create({
      data: {
        id: "cust-2",
        name: "Harold Chen",
        email: "harold@example.com",
        password: "password123",
        retirementVillage: "Oakwood Gardens",
      },
    }),
    prisma.customer.create({
      data: {
        id: "cust-3",
        name: "Dorothy Martinez",
        email: "dorothy@example.com",
        password: "password123",
        retirementVillage: "Sunrise Village",
      },
    }),
    prisma.customer.create({
      data: {
        id: "cust-4",
        name: "Robert Thompson",
        email: "robert@example.com",
        password: "password123",
        retirementVillage: "Meadow Creek",
      },
    }),
    prisma.customer.create({
      data: {
        id: "cust-5",
        name: "Betty Johnson",
        email: "betty@example.com",
        password: "password123",
        retirementVillage: "Oakwood Gardens",
      },
    }),
  ]);
  console.log(`✅ Created ${customers.length} customers`);

  // Seed classes
  const classes = await Promise.all([
    // Past classes (for leaderboard)
    prisma.class.create({
      data: {
        id: "cls-past-1",
        title: "Chair Yoga",
        startTime: new Date("2026-01-15T10:00:00-05:00"),
        endTime: new Date("2026-01-15T11:00:00-05:00"),
        capacity: 15,
        location: "Sunrise Village",
        status: "scheduled",
      },
    }),
    prisma.class.create({
      data: {
        id: "cls-past-2",
        title: "Gentle Strength",
        startTime: new Date("2026-01-20T10:00:00-05:00"),
        endTime: new Date("2026-01-20T11:00:00-05:00"),
        capacity: 15,
        location: "Oakwood Gardens",
        status: "scheduled",
      },
    }),
    prisma.class.create({
      data: {
        id: "cls-past-3",
        title: "Balance & Stability",
        startTime: new Date("2026-01-27T10:00:00-05:00"),
        endTime: new Date("2026-01-27T11:00:00-05:00"),
        capacity: 15,
        location: "Meadow Creek",
        status: "scheduled",
      },
    }),
    prisma.class.create({
      data: {
        id: "cls-past-4",
        title: "Mobility Flow",
        startTime: new Date("2026-02-03T10:00:00-05:00"),
        endTime: new Date("2026-02-03T11:00:00-05:00"),
        capacity: 15,
        location: "Sunrise Village",
        status: "scheduled",
      },
    }),
    // Upcoming classes
    prisma.class.create({
      data: {
        id: "cls-1",
        title: "Strength Fundamentals",
        startTime: new Date("2026-02-10T18:00:00-05:00"),
        endTime: new Date("2026-02-10T19:00:00-05:00"),
        capacity: 12,
        location: "Sunrise Village",
        status: "scheduled",
      },
    }),
    prisma.class.create({
      data: {
        id: "cls-2",
        title: "Mobility Flow",
        startTime: new Date("2026-02-12T09:00:00-05:00"),
        endTime: new Date("2026-02-12T09:45:00-05:00"),
        capacity: 10,
        location: "Oakwood Gardens",
        status: "scheduled",
      },
    }),
    prisma.class.create({
      data: {
        id: "cls-3",
        title: "Power Circuit",
        startTime: new Date("2026-02-14T17:30:00-05:00"),
        endTime: new Date("2026-02-14T18:20:00-05:00"),
        capacity: 12,
        location: "Meadow Creek",
        status: "scheduled",
      },
    }),
  ]);
  console.log(`✅ Created ${classes.length} classes`);

  // Seed bookings
  const bookings = await Promise.all([
    // Upcoming class bookings (cls-1: Strength Fundamentals)
    prisma.booking.create({
      data: {
        id: "bk-f1",
        classId: "cls-1",
        customerId: "cust-2",
        customerName: "Harold Chen",
        customerEmail: "harold@example.com",
        retirementVillage: "Oakwood Gardens",
        status: "active",
        cancelToken: "ct-f1",
        createdAt: new Date("2026-02-07T09:00:00Z"),
      },
    }),
    prisma.booking.create({
      data: {
        id: "bk-f2",
        classId: "cls-1",
        customerId: "cust-3",
        customerName: "Dorothy Martinez",
        customerEmail: "dorothy@example.com",
        retirementVillage: "Sunrise Village",
        status: "active",
        cancelToken: "ct-f2",
        createdAt: new Date("2026-02-07T10:00:00Z"),
      },
    }),
    prisma.booking.create({
      data: {
        id: "bk-f3",
        classId: "cls-1",
        customerId: "cust-4",
        customerName: "Robert Thompson",
        customerEmail: "robert@example.com",
        retirementVillage: "Meadow Creek",
        status: "active",
        cancelToken: "ct-f3",
        createdAt: new Date("2026-02-07T11:00:00Z"),
      },
    }),
    prisma.booking.create({
      data: {
        id: "bk-f4",
        classId: "cls-1",
        customerId: "cust-5",
        customerName: "Betty Johnson",
        customerEmail: "betty@example.com",
        retirementVillage: "Oakwood Gardens",
        status: "active",
        cancelToken: "ct-f4",
        createdAt: new Date("2026-02-07T12:00:00Z"),
      },
    }),
    prisma.booking.create({
      data: {
        id: "bk-f5",
        classId: "cls-1",
        customerName: "William Davis",
        customerEmail: "william@example.com",
        retirementVillage: "Lakeside Manor",
        status: "active",
        cancelToken: "ct-f5",
        createdAt: new Date("2026-02-07T13:00:00Z"),
      },
    }),
    // Margaret - 4 sessions (Sunrise Village)
    prisma.booking.create({
      data: {
        id: "bk-1",
        classId: "cls-past-1",
        customerId: "cust-1",
        customerName: "Margaret Wilson",
        customerEmail: "margaret@example.com",
        retirementVillage: "Sunrise Village",
        status: "active",
        cancelToken: "ct-1",
        createdAt: new Date("2026-01-14T09:00:00Z"),
      },
    }),
    prisma.booking.create({
      data: {
        id: "bk-2",
        classId: "cls-past-2",
        customerId: "cust-1",
        customerName: "Margaret Wilson",
        customerEmail: "margaret@example.com",
        retirementVillage: "Sunrise Village",
        status: "active",
        cancelToken: "ct-2",
        createdAt: new Date("2026-01-19T09:00:00Z"),
      },
    }),
    prisma.booking.create({
      data: {
        id: "bk-3",
        classId: "cls-past-3",
        customerId: "cust-1",
        customerName: "Margaret Wilson",
        customerEmail: "margaret@example.com",
        retirementVillage: "Sunrise Village",
        status: "active",
        cancelToken: "ct-3",
        createdAt: new Date("2026-01-26T09:00:00Z"),
      },
    }),
    prisma.booking.create({
      data: {
        id: "bk-4",
        classId: "cls-past-4",
        customerId: "cust-1",
        customerName: "Margaret Wilson",
        customerEmail: "margaret@example.com",
        retirementVillage: "Sunrise Village",
        status: "active",
        cancelToken: "ct-4",
        createdAt: new Date("2026-02-02T09:00:00Z"),
      },
    }),
    // Harold - 3 sessions (Oakwood Gardens)
    prisma.booking.create({
      data: {
        id: "bk-5",
        classId: "cls-past-1",
        customerId: "cust-2",
        customerName: "Harold Chen",
        customerEmail: "harold@example.com",
        retirementVillage: "Oakwood Gardens",
        status: "active",
        cancelToken: "ct-5",
        createdAt: new Date("2026-01-14T09:30:00Z"),
      },
    }),
    prisma.booking.create({
      data: {
        id: "bk-6",
        classId: "cls-past-2",
        customerId: "cust-2",
        customerName: "Harold Chen",
        customerEmail: "harold@example.com",
        retirementVillage: "Oakwood Gardens",
        status: "active",
        cancelToken: "ct-6",
        createdAt: new Date("2026-01-19T09:30:00Z"),
      },
    }),
    prisma.booking.create({
      data: {
        id: "bk-7",
        classId: "cls-past-4",
        customerId: "cust-2",
        customerName: "Harold Chen",
        customerEmail: "harold@example.com",
        retirementVillage: "Oakwood Gardens",
        status: "active",
        cancelToken: "ct-7",
        createdAt: new Date("2026-02-02T09:30:00Z"),
      },
    }),
    // Dorothy - 3 sessions (Sunrise Village)
    prisma.booking.create({
      data: {
        id: "bk-8",
        classId: "cls-past-2",
        customerId: "cust-3",
        customerName: "Dorothy Martinez",
        customerEmail: "dorothy@example.com",
        retirementVillage: "Sunrise Village",
        status: "active",
        cancelToken: "ct-8",
        createdAt: new Date("2026-01-19T10:00:00Z"),
      },
    }),
    prisma.booking.create({
      data: {
        id: "bk-9",
        classId: "cls-past-3",
        customerId: "cust-3",
        customerName: "Dorothy Martinez",
        customerEmail: "dorothy@example.com",
        retirementVillage: "Sunrise Village",
        status: "active",
        cancelToken: "ct-9",
        createdAt: new Date("2026-01-26T10:00:00Z"),
      },
    }),
    prisma.booking.create({
      data: {
        id: "bk-10",
        classId: "cls-past-4",
        customerId: "cust-3",
        customerName: "Dorothy Martinez",
        customerEmail: "dorothy@example.com",
        retirementVillage: "Sunrise Village",
        status: "active",
        cancelToken: "ct-10",
        createdAt: new Date("2026-02-02T10:00:00Z"),
      },
    }),
    // Robert - 2 sessions (Meadow Creek)
    prisma.booking.create({
      data: {
        id: "bk-11",
        classId: "cls-past-1",
        customerId: "cust-4",
        customerName: "Robert Thompson",
        customerEmail: "robert@example.com",
        retirementVillage: "Meadow Creek",
        status: "active",
        cancelToken: "ct-11",
        createdAt: new Date("2026-01-14T10:30:00Z"),
      },
    }),
    prisma.booking.create({
      data: {
        id: "bk-12",
        classId: "cls-past-3",
        customerId: "cust-4",
        customerName: "Robert Thompson",
        customerEmail: "robert@example.com",
        retirementVillage: "Meadow Creek",
        status: "active",
        cancelToken: "ct-12",
        createdAt: new Date("2026-01-26T10:30:00Z"),
      },
    }),
    // Betty - 2 sessions (Oakwood Gardens)
    prisma.booking.create({
      data: {
        id: "bk-13",
        classId: "cls-past-2",
        customerId: "cust-5",
        customerName: "Betty Johnson",
        customerEmail: "betty@example.com",
        retirementVillage: "Oakwood Gardens",
        status: "active",
        cancelToken: "ct-13",
        createdAt: new Date("2026-01-19T11:00:00Z"),
      },
    }),
    prisma.booking.create({
      data: {
        id: "bk-14",
        classId: "cls-past-4",
        customerId: "cust-5",
        customerName: "Betty Johnson",
        customerEmail: "betty@example.com",
        retirementVillage: "Oakwood Gardens",
        status: "active",
        cancelToken: "ct-14",
        createdAt: new Date("2026-02-02T11:00:00Z"),
      },
    }),
  ]);
  console.log(`✅ Created ${bookings.length} bookings`);

  console.log("🎉 Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
