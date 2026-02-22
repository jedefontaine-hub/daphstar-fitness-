/**
 * Database store - Prisma-based data access layer
 * 
 * This module provides async database operations using Prisma with SQLite.
 * It mirrors the API of lib/store.ts but persists data to disk.
 */

import { prisma } from "./db";
import type { Class, Booking, Customer } from "@prisma/client";

// Re-export types for convenience
export type ClassItem = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  capacity: number;
  location?: string;
  status: "scheduled" | "cancelled";
  recurringGroupId?: string;
};

export type BookingItem = {
  id: string;
  classId: string;
  customerName: string;
  customerEmail: string;
  retirementVillage?: string;
  status: "active" | "cancelled";
  cancelToken: string;
  createdAt: string;
  cancelledAt?: string;
};

export type BookingInput = {
  classId: string;
  customerName: string;
  customerEmail: string;
  retirementVillage?: string;
  customerId?: string;
};

export type BookingResult =
  | { ok: true; booking: BookingItem; cancelToken: string }
  | { ok: false; error: "class_full" | "class_not_found" | "class_cancelled" | "already_booked" };

export type CancelResult =
  | { ok: true; booking: BookingItem }
  | { ok: false; error: "not_found" };

// Helper to convert Prisma Class to ClassItem
function toClassItem(c: Class): ClassItem {
  return {
    id: c.id,
    title: c.title,
    startTime: c.startTime.toISOString(),
    endTime: c.endTime.toISOString(),
    capacity: c.capacity,
    location: c.location ?? undefined,
    status: c.status as "scheduled" | "cancelled",
    recurringGroupId: c.recurringGroupId ?? undefined,
  };
}

// Helper to convert Prisma Booking to BookingItem
function toBookingItem(b: Booking): BookingItem {
  return {
    id: b.id,
    classId: b.classId,
    customerName: b.customerName,
    customerEmail: b.customerEmail,
    retirementVillage: b.retirementVillage ?? undefined,
    status: b.status as "active" | "cancelled",
    cancelToken: b.cancelToken,
    createdAt: b.createdAt.toISOString(),
    cancelledAt: b.cancelledAt?.toISOString(),
  };
}

// ---------- Class Operations ----------

export async function listClasses(from?: string, to?: string): Promise<ClassItem[]> {
  const where: { startTime?: { gte?: Date; lte?: Date } } = {};
  
  if (from || to) {
    where.startTime = {};
    if (from) where.startTime.gte = new Date(from);
    if (to) where.startTime.lte = new Date(to);
  }
  
  const classes = await prisma.class.findMany({
    where,
    orderBy: { startTime: "asc" },
  });
  
  return classes.map(toClassItem);
}

export async function getClassById(id: string): Promise<ClassItem | null> {
  const classItem = await prisma.class.findUnique({ where: { id } });
  return classItem ? toClassItem(classItem) : null;
}

export async function countActiveBookings(classId: string): Promise<number> {
  return prisma.booking.count({
    where: { classId, status: "active" },
  });
}

// ---------- Booking Operations ----------

export async function createBooking(input: BookingInput): Promise<BookingResult> {
  const classItem = await prisma.class.findUnique({ where: { id: input.classId } });
  
  if (!classItem) {
    return { ok: false, error: "class_not_found" };
  }
  
  if (classItem.status === "cancelled") {
    return { ok: false, error: "class_cancelled" };
  }
  
  const bookedCount = await countActiveBookings(classItem.id);
  if (bookedCount >= classItem.capacity) {
    return { ok: false, error: "class_full" };
  }
  
  // Check for duplicate booking
  const normalizedEmail = input.customerEmail.toLowerCase().trim();
  const existingBooking = await prisma.booking.findFirst({
    where: {
      classId: input.classId,
      customerEmail: normalizedEmail,
      status: "active",
    },
  });
  
  if (existingBooking) {
    return { ok: false, error: "already_booked" };
  }
  
  const booking = await prisma.booking.create({
    data: {
      classId: input.classId,
      customerId: input.customerId,
      customerName: input.customerName,
      customerEmail: normalizedEmail,
      retirementVillage: input.retirementVillage,
      status: "active",
    },
  });
  
  return { ok: true, booking: toBookingItem(booking), cancelToken: booking.cancelToken };
}

export async function cancelBooking(cancelToken: string): Promise<CancelResult> {
  const booking = await prisma.booking.findUnique({ where: { cancelToken } });
  
  if (!booking) {
    return { ok: false, error: "not_found" };
  }
  
  if (booking.status === "cancelled") {
    return { ok: true, booking: toBookingItem(booking) };
  }
  
  const updated = await prisma.booking.update({
    where: { cancelToken },
    data: {
      status: "cancelled",
      cancelledAt: new Date(),
    },
  });
  
  return { ok: true, booking: toBookingItem(updated) };
}

// ---------- Admin Class Operations ----------

export type ClassInput = {
  title: string;
  startTime: string;
  endTime: string;
  capacity: number;
  location?: string;
};

export async function createClass(input: ClassInput): Promise<ClassItem> {
  const newClass = await prisma.class.create({
    data: {
      title: input.title,
      startTime: new Date(input.startTime),
      endTime: new Date(input.endTime),
      capacity: input.capacity,
      location: input.location,
      status: "scheduled",
    },
  });
  return toClassItem(newClass);
}

export type RecurringClassInput = ClassInput & {
  repeatWeeks: number;
};

export async function createRecurringClasses(input: RecurringClassInput): Promise<ClassItem[]> {
  const startDate = new Date(input.startTime);
  const endDate = new Date(input.endTime);
  const durationMs = endDate.getTime() - startDate.getTime();
  const recurringGroupId = crypto.randomUUID();

  const createdClasses: ClassItem[] = [];

  for (let week = 0; week < input.repeatWeeks; week++) {
    const weekStartTime = new Date(startDate.getTime() + week * 7 * 24 * 60 * 60 * 1000);
    const weekEndTime = new Date(weekStartTime.getTime() + durationMs);

    const newClass = await prisma.class.create({
      data: {
        title: input.title,
        startTime: weekStartTime,
        endTime: weekEndTime,
        capacity: input.capacity,
        location: input.location,
        status: "scheduled",
        recurringGroupId,
      },
    });
    createdClasses.push(toClassItem(newClass));
  }

  return createdClasses;
}

export async function updateClass(
  id: string,
  updates: Partial<ClassInput>
): Promise<ClassItem | null> {
  const existing = await prisma.class.findUnique({ where: { id } });
  if (!existing) return null;
  
  const updated = await prisma.class.update({
    where: { id },
    data: {
      ...(updates.title !== undefined && { title: updates.title }),
      ...(updates.startTime !== undefined && { startTime: new Date(updates.startTime) }),
      ...(updates.endTime !== undefined && { endTime: new Date(updates.endTime) }),
      ...(updates.capacity !== undefined && { capacity: updates.capacity }),
      ...(updates.location !== undefined && { location: updates.location }),
    },
  });
  
  return toClassItem(updated);
}

export async function cancelClass(id: string): Promise<ClassItem | null> {
  const existing = await prisma.class.findUnique({ where: { id } });
  if (!existing) return null;
  
  // Cancel the class
  const updated = await prisma.class.update({
    where: { id },
    data: { status: "cancelled" },
  });
  
  // Cancel all active bookings for this class
  await prisma.booking.updateMany({
    where: { classId: id, status: "active" },
    data: { status: "cancelled", cancelledAt: new Date() },
  });
  
  return toClassItem(updated);
}

export async function updateRecurringClasses(
  recurringGroupId: string,
  referenceClassId: string,
  updates: Partial<ClassInput>
): Promise<number> {
  const referenceClass = await prisma.class.findUnique({ where: { id: referenceClassId } });
  if (!referenceClass) return 0;

  // Find all future scheduled classes in the group (from the reference class onwards)
  const siblings = await prisma.class.findMany({
    where: {
      recurringGroupId,
      status: "scheduled",
      startTime: { gte: referenceClass.startTime },
    },
  });

  let count = 0;
  for (const sibling of siblings) {
    const data: Record<string, unknown> = {};
    if (updates.title !== undefined) data.title = updates.title;
    if (updates.capacity !== undefined) data.capacity = updates.capacity;
    if (updates.location !== undefined) data.location = updates.location;

    // For time updates, preserve the date but update the time-of-day
    if (updates.startTime !== undefined) {
      const newTime = new Date(updates.startTime);
      const existing = new Date(sibling.startTime);
      existing.setUTCHours(newTime.getUTCHours(), newTime.getUTCMinutes(), newTime.getUTCSeconds());
      data.startTime = existing;
    }
    if (updates.endTime !== undefined) {
      const newTime = new Date(updates.endTime);
      const existing = new Date(sibling.endTime);
      existing.setUTCHours(newTime.getUTCHours(), newTime.getUTCMinutes(), newTime.getUTCSeconds());
      data.endTime = existing;
    }

    if (Object.keys(data).length > 0) {
      await prisma.class.update({ where: { id: sibling.id }, data });
      count++;
    }
  }

  return count;
}

export async function cancelRecurringClasses(
  recurringGroupId: string,
  referenceClassId: string
): Promise<number> {
  const referenceClass = await prisma.class.findUnique({ where: { id: referenceClassId } });
  if (!referenceClass) return 0;

  // Find all future scheduled classes in the group
  const siblings = await prisma.class.findMany({
    where: {
      recurringGroupId,
      status: "scheduled",
      startTime: { gte: referenceClass.startTime },
    },
    select: { id: true },
  });

  const ids = siblings.map((s) => s.id);
  if (ids.length === 0) return 0;

  // Cancel all the classes
  await prisma.class.updateMany({
    where: { id: { in: ids } },
    data: { status: "cancelled" },
  });

  // Cancel all active bookings for these classes
  await prisma.booking.updateMany({
    where: { classId: { in: ids }, status: "active" },
    data: { status: "cancelled", cancelledAt: new Date() },
  });

  return ids.length;
}

export async function listAttendees(
  classId: string
  ): Promise<{ id: string; customerName: string; customerEmail: string; createdAt: string; attendanceStatus: string }[]> {
    const bookings = await prisma.booking.findMany({
      where: { classId, status: "active" },
      select: { id: true, customerName: true, customerEmail: true, createdAt: true, attendanceStatus: true },
    });
  
    return bookings.map((b) => ({
      id: b.id,
      customerName: b.customerName,
      customerEmail: b.customerEmail,
      createdAt: b.createdAt.toISOString(),
      attendanceStatus: b.attendanceStatus,
    }));
}

// ---------- Customer Booking Lookup ----------

export type CustomerBooking = {
  id: string;
  classId: string;
  classTitle: string;
  classStartTime: string;
  classEndTime: string;
  classStatus: "scheduled" | "cancelled";
  bookingStatus: "active" | "cancelled";
  cancelToken: string;
  createdAt: string;
  cancelledAt?: string;
};

export async function listBookingsByEmail(email: string): Promise<CustomerBooking[]> {
  const normalizedEmail = email.toLowerCase().trim();
  
  const bookings = await prisma.booking.findMany({
    where: { customerEmail: normalizedEmail },
    include: { class: true },
    orderBy: { class: { startTime: "desc" } },
  });
  
  return bookings.map((b) => ({
    id: b.id,
    classId: b.classId,
    classTitle: b.class.title,
    classStartTime: b.class.startTime.toISOString(),
    classEndTime: b.class.endTime.toISOString(),
    classStatus: b.class.status as "scheduled" | "cancelled",
    bookingStatus: b.status as "active" | "cancelled",
    cancelToken: b.cancelToken,
    createdAt: b.createdAt.toISOString(),
    cancelledAt: b.cancelledAt?.toISOString(),
  }));
}

// ---------- Leaderboard ----------

export type LeaderboardEntry = {
  customerName: string;
  retirementVillage: string;
  sessionsAttended: number;
};

export async function getLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
  const now = new Date();

  // Get all active bookings for past classes (compare with local now)
  const bookings = await prisma.booking.findMany({
    where: {
      status: "active",
      class: {
        status: "scheduled",
        startTime: { lt: now },
      },
    },
    include: { class: true },
  });
  
  // Count attendance per customer
  const attendanceMap = new Map<string, { name: string; village: string; count: number }>();
  
  for (const booking of bookings) {
    const email = booking.customerEmail.toLowerCase();
    const existing = attendanceMap.get(email);
    
    if (existing) {
      existing.count++;
      if (booking.retirementVillage && !existing.village) {
        existing.village = booking.retirementVillage;
      }
    } else {
      attendanceMap.set(email, {
        name: booking.customerName,
        village: booking.retirementVillage || "Independent",
        count: 1,
      });
    }
  }
  
  return Array.from(attendanceMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map(({ name, village, count }) => ({
      customerName: name,
      retirementVillage: village,
      sessionsAttended: count,
    }));
}

// ---------- Customer Authentication ----------

export type CustomerPublic = {
  id: string;
  name: string;
  email: string;
  retirementVillage?: string;
  birthdate?: string;
  phone?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
};

function toCustomerPublic(c: Customer): CustomerPublic {
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    retirementVillage: c.retirementVillage ?? undefined,
    birthdate: c.birthdate?.toISOString().split("T")[0],
    phone: c.phone ?? undefined,
    address: c.address ?? undefined,
    emergencyContactName: c.emergencyContactName ?? undefined,
    emergencyContactPhone: c.emergencyContactPhone ?? undefined,
  };
}

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  retirementVillage?: string;
};

export type RegisterResult =
  | { ok: true; customer: CustomerPublic }
  | { ok: false; error: "email_exists" | "invalid_input" };

export async function registerCustomer(input: RegisterInput): Promise<RegisterResult> {
  if (!input.name || !input.email || !input.password) {
    return { ok: false, error: "invalid_input" };
  }
  
  const normalizedEmail = input.email.toLowerCase().trim();
  
  const existing = await prisma.customer.findUnique({
    where: { email: normalizedEmail },
  });
  
  if (existing) {
    return { ok: false, error: "email_exists" };
  }
  
  const customer = await prisma.customer.create({
    data: {
      name: input.name.trim(),
      email: normalizedEmail,
      password: input.password, // Note: In production, hash this!
      retirementVillage: input.retirementVillage,
    },
  });
  
  return { ok: true, customer: toCustomerPublic(customer) };
}

export type LoginResult =
  | { ok: true; customer: CustomerPublic }
  | { ok: false; error: "invalid_credentials" };

export async function loginCustomer(email: string, password: string): Promise<LoginResult> {
  const normalizedEmail = email.toLowerCase().trim();
  
  const customer = await prisma.customer.findFirst({
    where: {
      email: normalizedEmail,
      password,
    },
  });
  
  if (!customer) {
    return { ok: false, error: "invalid_credentials" };
  }
  
  return { ok: true, customer: toCustomerPublic(customer) };
}

export async function getCustomerById(id: string): Promise<CustomerPublic | null> {
  const customer = await prisma.customer.findUnique({ where: { id } });
  return customer ? toCustomerPublic(customer) : null;
}

export type ProfileUpdateInput = {
  name?: string;
  email?: string;
  retirementVillage?: string;
  birthdate?: string;
  phone?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
};

export type ProfileUpdateResult =
  | { ok: true; customer: CustomerPublic }
  | { ok: false; error: "not_found" | "email_exists" };

export async function updateCustomerProfile(
  id: string,
  input: ProfileUpdateInput
): Promise<ProfileUpdateResult> {
  const customer = await prisma.customer.findUnique({ where: { id } });
  
  if (!customer) {
    return { ok: false, error: "not_found" };
  }
  
  // Check if email is being changed and if it's already taken
  if (input.email && input.email.toLowerCase() !== customer.email.toLowerCase()) {
    const normalizedNewEmail = input.email.toLowerCase().trim();
    const emailExists = await prisma.customer.findFirst({
      where: {
        email: normalizedNewEmail,
        id: { not: id },
      },
    });
    if (emailExists) {
      return { ok: false, error: "email_exists" };
    }
  }
  
  const updated = await prisma.customer.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name.trim() }),
      ...(input.email !== undefined && { email: input.email.toLowerCase().trim() }),
      ...(input.retirementVillage !== undefined && { retirementVillage: input.retirementVillage }),
      ...(input.birthdate !== undefined && { birthdate: input.birthdate ? new Date(input.birthdate) : null }),
      ...(input.phone !== undefined && { phone: input.phone }),
      ...(input.address !== undefined && { address: input.address }),
      ...(input.emergencyContactName !== undefined && { emergencyContactName: input.emergencyContactName }),
      ...(input.emergencyContactPhone !== undefined && { emergencyContactPhone: input.emergencyContactPhone }),
    },
  });
  
  return { ok: true, customer: toCustomerPublic(updated) };
}

// ---------- Customer Dashboard ----------

export type DashboardBooking = {
  id: string;
  classId: string;
  classTitle: string;
  classLocation?: string;
  classStartTime: string;
  classEndTime: string;
  cancelToken: string;
  status: "upcoming" | "attended" | "cancelled";
};

export type DashboardStats = {
  totalAttended: number;
  totalUpcoming: number;
  streak: number;
  favoriteClass: string | null;
  rank: number | null;
};

export type SessionPassHistory = {
  id: string;
  sessionNumber: number;
  classTitle: string;
  attendedDate: string;
};

export type SessionPassData = {
  remaining: number;
  total: number;
  purchaseDate: string | null;
  history: SessionPassHistory[];
};

export type DashboardData = {
  upcomingBookings: DashboardBooking[];
  pastBookings: DashboardBooking[];
  stats: DashboardStats;
  sessionPass: SessionPassData;
  completedPasses: CompletedPass[];
};

export async function getCustomerDashboard(email: string): Promise<DashboardData> {
  const normalizedEmail = email.toLowerCase().trim();
  const now = new Date();

  // Get all bookings for this customer with class info
  const customerBookings = await prisma.booking.findMany({
    where: { customerEmail: normalizedEmail },
    include: { class: true },
  });

  const upcoming: DashboardBooking[] = [];
  const past: DashboardBooking[] = [];
  const classAttendance: Record<string, number> = {};
  let totalAttended = 0;

  for (const booking of customerBookings) {
    const classItem = booking.class;
    const classTime = classItem.startTime.getTime();
    const isUpcoming = classTime > now.getTime();
    const isCancelled = booking.status === "cancelled" || classItem.status === "cancelled";

    const dashboardBooking: DashboardBooking = {
      id: booking.id,
      classId: booking.classId,
      classTitle: classItem.title,
      classLocation: classItem.location ?? undefined,
      classStartTime: classItem.startTime.toISOString(),
      classEndTime: classItem.endTime.toISOString(),
      cancelToken: booking.cancelToken,
      status: isCancelled ? "cancelled" : isUpcoming ? "upcoming" : "attended",
    };

    if (isUpcoming && !isCancelled) {
      upcoming.push(dashboardBooking);
    } else if (!isCancelled) {
      past.push(dashboardBooking);
      totalAttended++;
      classAttendance[classItem.title] = (classAttendance[classItem.title] || 0) + 1;
    }
  }

  // Sort bookings
  upcoming.sort((a, b) => new Date(a.classStartTime).getTime() - new Date(b.classStartTime).getTime());
  past.sort((a, b) => new Date(b.classStartTime).getTime() - new Date(a.classStartTime).getTime());

  // Find favorite class
  let favoriteClass: string | null = null;
  let maxCount = 0;
  for (const [className, count] of Object.entries(classAttendance)) {
    if (count > maxCount) {
      maxCount = count;
      favoriteClass = className;
    }
  }

  // Calculate rank on leaderboard
  const leaderboard = await getLeaderboard(100);
  const customer = await prisma.customer.findFirst({
    where: { email: normalizedEmail },
  });
  const rankIndex = leaderboard.findIndex(
    (entry) => entry.customerName === customer?.name
  );
  const rank = rankIndex >= 0 ? rankIndex + 1 : null;

  // Calculate streak
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const sortedAttendance = past
    .filter((b) => b.status === "attended")
    .map((b) => new Date(b.classStartTime).getTime())
    .sort((a, b) => b - a);

  let streak = 0;
  if (sortedAttendance.length > 0) {
    const currentWeekStart = Math.floor(now.getTime() / weekMs) * weekMs;
    const lastAttendedWeek = Math.floor(sortedAttendance[0] / weekMs) * weekMs;
    
    if (currentWeekStart - lastAttendedWeek <= weekMs) {
      streak = 1;
      for (let i = 1; i < sortedAttendance.length; i++) {
        const thisWeek = Math.floor(sortedAttendance[i] / weekMs) * weekMs;
        const prevWeek = Math.floor(sortedAttendance[i - 1] / weekMs) * weekMs;
        if (prevWeek - thisWeek === weekMs) {
          streak++;
        } else if (prevWeek !== thisWeek) {
          break;
        }
      }
    }
  }

  // Get session pass history
  const sessionPassHistory = await prisma.sessionPassHistory.findMany({
    where: { customerId: customer?.id ?? "" },
    orderBy: { sessionNumber: "asc" },
  });

  // Get completed passes
  const completedPasses = customer?.id ? await getCompletedPasses(customer.id) : [];

  return {
    upcomingBookings: upcoming,
    pastBookings: past.slice(0, 10),
    stats: {
      totalAttended,
      totalUpcoming: upcoming.length,
      streak,
      favoriteClass,
      rank,
    },
    sessionPass: {
      remaining: customer?.sessionPassRemaining ?? 10,
      total: customer?.sessionPassTotal ?? 10,
      purchaseDate: customer?.sessionPassPurchaseDate?.toISOString() ?? null,
      history: sessionPassHistory.map((h) => ({
        id: h.id,
        sessionNumber: h.sessionNumber,
        classTitle: h.classTitle,
        attendedDate: h.attendedDate.toISOString(),
      })),
    },
    completedPasses,
  };
}

// ---------- Session Pass Management ----------

export type MarkAttendanceResult =
  | { ok: true; sessionPassRemaining: number }
  | { ok: false; error: "booking_not_found" | "customer_not_found" | "no_sessions_remaining" };

export async function markAttendance(
  bookingId: string,
  attendanceStatus: "attended" | "absent"
): Promise<MarkAttendanceResult> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { class: true, customer: true },
  });

  if (!booking) {
    return { ok: false, error: "booking_not_found" };
  }

  const customer = booking.customer;
  if (!customer) {
    return { ok: false, error: "customer_not_found" };
  }

  // Update attendance status
  await prisma.booking.update({
    where: { id: bookingId },
    data: { attendanceStatus },
  });

  // If marking as attended, decrement session pass and record history
  if (attendanceStatus === "attended") {
    if (customer.sessionPassRemaining <= 0) {
      return { ok: false, error: "no_sessions_remaining" };
    }

    // Calculate which session number this is
    const usedSessions = customer.sessionPassTotal - customer.sessionPassRemaining;
    const sessionNumber = usedSessions + 1;

    // Check if history already exists for this booking (prevent double-counting)
    const existingHistory = await prisma.sessionPassHistory.findUnique({
      where: { bookingId },
    });

    if (!existingHistory) {
      // Decrement session pass
      const updatedCustomer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          sessionPassRemaining: {
            decrement: 1,
          },
        },
      });

      // Record in history
      await prisma.sessionPassHistory.create({
        data: {
          customerId: customer.id,
          bookingId: bookingId,
          sessionNumber,
          classTitle: booking.class.title,
          attendedDate: booking.class.startTime,
        },
      });

      return { ok: true, sessionPassRemaining: updatedCustomer.sessionPassRemaining };
    }

    return { ok: true, sessionPassRemaining: customer.sessionPassRemaining };
  }

  // If marking as absent, remove from history if it exists and increment session pass
  if (attendanceStatus === "absent") {
    const existingHistory = await prisma.sessionPassHistory.findUnique({
      where: { bookingId },
    });

    if (existingHistory) {
      // Remove from history
      await prisma.sessionPassHistory.delete({
        where: { bookingId },
      });

      // Increment session pass back
      const updatedCustomer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          sessionPassRemaining: {
            increment: 1,
          },
        },
      });

      return { ok: true, sessionPassRemaining: updatedCustomer.sessionPassRemaining };
    }
  }

  return { ok: true, sessionPassRemaining: customer.sessionPassRemaining };
}

export async function purchaseSessionPass(
  customerId: string,
  sessionCount: number = 10
): Promise<{ ok: boolean }> {
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });

  if (!customer) {
    return { ok: false };
  }

  // Archive the old pass if it was completed (all sessions used)
  const oldPassHistory = await prisma.sessionPassHistory.findMany({
    where: { customerId },
    orderBy: { sessionNumber: "asc" },
  });

  if (oldPassHistory.length > 0 && customer.sessionPassPurchaseDate) {
    // Create completed pass record
    const completedPass = await prisma.completedSessionPass.create({
      data: {
        customerId,
        purchaseDate: customer.sessionPassPurchaseDate,
        completedDate: new Date(),
        sessionsCount: oldPassHistory.length,
      },
    });

    // Archive all session history
    for (const session of oldPassHistory) {
      await prisma.completedSession.create({
        data: {
          completedPassId: completedPass.id,
          sessionNumber: session.sessionNumber,
          classTitle: session.classTitle,
          attendedDate: session.attendedDate,
        },
      });
    }

    // Clear old session history
    await prisma.sessionPassHistory.deleteMany({
      where: { customerId },
    });
  }

  // Create new pass
  await prisma.customer.update({
    where: { id: customerId },
    data: {
      sessionPassRemaining: sessionCount,
      sessionPassTotal: sessionCount,
      sessionPassPurchaseDate: new Date(),
    },
  });

  return { ok: true };
}

export async function getCustomersWithExpiredPasses(): Promise<
  { id: string; name: string; email: string; retirementVillage: string | null }[]
> {
  const customers = await prisma.customer.findMany({
    where: {
      sessionPassRemaining: 0,
    },
    select: {
      id: true,
      name: true,
      email: true,
      retirementVillage: true,
    },
  });

  return customers;
}

// ---------- Completed Pass History ----------

export type CompletedPassSession = {
  id: string;
  sessionNumber: number;
  classTitle: string;
  attendedDate: string;
};

export type CompletedPass = {
  id: string;
  purchaseDate: string;
  completedDate: string;
  sessionsCount: number;
  sessions: CompletedPassSession[];
};

export async function getCompletedPasses(customerId: string): Promise<CompletedPass[]> {
  const completedPasses = await prisma.completedSessionPass.findMany({
    where: { customerId },
    include: {
      sessions: {
        orderBy: { sessionNumber: "asc" },
      },
    },
    orderBy: { completedDate: "desc" },
  });

  return completedPasses.map((pass) => ({
    id: pass.id,
    purchaseDate: pass.purchaseDate.toISOString(),
    completedDate: pass.completedDate.toISOString(),
    sessionsCount: pass.sessionsCount,
    sessions: pass.sessions.map((s) => ({
      id: s.id,
      sessionNumber: s.sessionNumber,
      classTitle: s.classTitle,
      attendedDate: s.attendedDate.toISOString(),
    })),
  }));
}

// ---------- Birthday Functions ----------

export type BirthdayCustomer = {
  id: string;
  name: string;
  email: string;
};

export async function getCustomersWithBirthdayToday(): Promise<BirthdayCustomer[]> {
  const today = new Date();
  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();

  // SQLite doesn't have great date functions, so we'll filter in JS
  const customers = await prisma.customer.findMany({
    where: { birthdate: { not: null } },
  });

  return customers
    .filter((customer) => {
      if (!customer.birthdate) return false;
      const birthMonth = customer.birthdate.getMonth() + 1;
      const birthDay = customer.birthdate.getDate();
      return birthMonth === todayMonth && birthDay === todayDay;
    })
    .map((customer) => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
    }));
}
