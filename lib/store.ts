type ClassItem = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  capacity: number;
  location?: string;
  status: "scheduled" | "cancelled";
};

type BookingItem = {
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

type CustomerItem = {
  id: string;
  name: string;
  email: string;
  password: string;
  retirementVillage?: string;
  createdAt: string;
};

type Store = {
  classes: ClassItem[];
  bookings: BookingItem[];
  customers: CustomerItem[];
};

type BookingInput = {
  classId: string;
  customerName: string;
  customerEmail: string;
  retirementVillage?: string;
};

type BookingResult =
  | { ok: true; booking: BookingItem; cancelToken: string }
  | { ok: false; error: "class_full" | "class_not_found" | "class_cancelled" };

type CancelResult =
  | { ok: true; booking: BookingItem }
  | { ok: false; error: "not_found" };

const storeKey = "__daphstarStore";

const seedClasses: ClassItem[] = [
  // Past classes (for leaderboard)
  {
    id: "cls-past-1",
    title: "Chair Yoga",
    startTime: "2026-01-15T10:00:00-05:00",
    endTime: "2026-01-15T11:00:00-05:00",
    capacity: 15,
    location: "Sunrise Village",
    status: "scheduled",
  },
  {
    id: "cls-past-2",
    title: "Gentle Strength",
    startTime: "2026-01-20T10:00:00-05:00",
    endTime: "2026-01-20T11:00:00-05:00",
    capacity: 15,
    location: "Oakwood Gardens",
    status: "scheduled",
  },
  {
    id: "cls-past-3",
    title: "Balance & Stability",
    startTime: "2026-01-27T10:00:00-05:00",
    endTime: "2026-01-27T11:00:00-05:00",
    capacity: 15,
    location: "Meadow Creek",
    status: "scheduled",
  },
  {
    id: "cls-past-4",
    title: "Mobility Flow",
    startTime: "2026-02-03T10:00:00-05:00",
    endTime: "2026-02-03T11:00:00-05:00",
    capacity: 15,
    location: "Sunrise Village",
    status: "scheduled",
  },
  // Upcoming classes
  {
    id: "cls-1",
    title: "Strength Fundamentals",
    startTime: "2026-02-10T18:00:00-05:00",
    endTime: "2026-02-10T19:00:00-05:00",
    capacity: 12,
    location: "Sunrise Village",
    status: "scheduled",
  },
  {
    id: "cls-2",
    title: "Mobility Flow",
    startTime: "2026-02-12T09:00:00-05:00",
    endTime: "2026-02-12T09:45:00-05:00",
    capacity: 10,
    location: "Oakwood Gardens",
    status: "scheduled",
  },
  {
    id: "cls-3",
    title: "Power Circuit",
    startTime: "2026-02-14T17:30:00-05:00",
    endTime: "2026-02-14T18:20:00-05:00",
    capacity: 12,
    location: "Meadow Creek",
    status: "scheduled",
  },
];

const seedBookings: BookingItem[] = [
  // Margaret - 4 sessions (Sunrise Village)
  { id: "bk-1", classId: "cls-past-1", customerName: "Margaret Wilson", customerEmail: "margaret@example.com", retirementVillage: "Sunrise Village", status: "active", cancelToken: "ct-1", createdAt: "2026-01-14T09:00:00Z" },
  { id: "bk-2", classId: "cls-past-2", customerName: "Margaret Wilson", customerEmail: "margaret@example.com", retirementVillage: "Sunrise Village", status: "active", cancelToken: "ct-2", createdAt: "2026-01-19T09:00:00Z" },
  { id: "bk-3", classId: "cls-past-3", customerName: "Margaret Wilson", customerEmail: "margaret@example.com", retirementVillage: "Sunrise Village", status: "active", cancelToken: "ct-3", createdAt: "2026-01-26T09:00:00Z" },
  { id: "bk-4", classId: "cls-past-4", customerName: "Margaret Wilson", customerEmail: "margaret@example.com", retirementVillage: "Sunrise Village", status: "active", cancelToken: "ct-4", createdAt: "2026-02-02T09:00:00Z" },
  // Harold - 3 sessions (Oakwood Gardens)
  { id: "bk-5", classId: "cls-past-1", customerName: "Harold Chen", customerEmail: "harold@example.com", retirementVillage: "Oakwood Gardens", status: "active", cancelToken: "ct-5", createdAt: "2026-01-14T09:30:00Z" },
  { id: "bk-6", classId: "cls-past-2", customerName: "Harold Chen", customerEmail: "harold@example.com", retirementVillage: "Oakwood Gardens", status: "active", cancelToken: "ct-6", createdAt: "2026-01-19T09:30:00Z" },
  { id: "bk-7", classId: "cls-past-4", customerName: "Harold Chen", customerEmail: "harold@example.com", retirementVillage: "Oakwood Gardens", status: "active", cancelToken: "ct-7", createdAt: "2026-02-02T09:30:00Z" },
  // Dorothy - 3 sessions (Sunrise Village)
  { id: "bk-8", classId: "cls-past-2", customerName: "Dorothy Martinez", customerEmail: "dorothy@example.com", retirementVillage: "Sunrise Village", status: "active", cancelToken: "ct-8", createdAt: "2026-01-19T10:00:00Z" },
  { id: "bk-9", classId: "cls-past-3", customerName: "Dorothy Martinez", customerEmail: "dorothy@example.com", retirementVillage: "Sunrise Village", status: "active", cancelToken: "ct-9", createdAt: "2026-01-26T10:00:00Z" },
  { id: "bk-10", classId: "cls-past-4", customerName: "Dorothy Martinez", customerEmail: "dorothy@example.com", retirementVillage: "Sunrise Village", status: "active", cancelToken: "ct-10", createdAt: "2026-02-02T10:00:00Z" },
  // Robert - 2 sessions (Meadow Creek)
  { id: "bk-11", classId: "cls-past-1", customerName: "Robert Thompson", customerEmail: "robert@example.com", retirementVillage: "Meadow Creek", status: "active", cancelToken: "ct-11", createdAt: "2026-01-14T10:30:00Z" },
  { id: "bk-12", classId: "cls-past-3", customerName: "Robert Thompson", customerEmail: "robert@example.com", retirementVillage: "Meadow Creek", status: "active", cancelToken: "ct-12", createdAt: "2026-01-26T10:30:00Z" },
  // Betty - 2 sessions (Oakwood Gardens)
  { id: "bk-13", classId: "cls-past-2", customerName: "Betty Johnson", customerEmail: "betty@example.com", retirementVillage: "Oakwood Gardens", status: "active", cancelToken: "ct-13", createdAt: "2026-01-19T11:00:00Z" },
  { id: "bk-14", classId: "cls-past-4", customerName: "Betty Johnson", customerEmail: "betty@example.com", retirementVillage: "Oakwood Gardens", status: "active", cancelToken: "ct-14", createdAt: "2026-02-02T11:00:00Z" },
];

const seedCustomers: CustomerItem[] = [
  { id: "cust-1", name: "Margaret Wilson", email: "margaret@example.com", password: "password123", retirementVillage: "Sunrise Village", createdAt: "2026-01-01T00:00:00Z" },
  { id: "cust-2", name: "Harold Chen", email: "harold@example.com", password: "password123", retirementVillage: "Oakwood Gardens", createdAt: "2026-01-01T00:00:00Z" },
  { id: "cust-3", name: "Dorothy Martinez", email: "dorothy@example.com", password: "password123", retirementVillage: "Sunrise Village", createdAt: "2026-01-01T00:00:00Z" },
  { id: "cust-4", name: "Robert Thompson", email: "robert@example.com", password: "password123", retirementVillage: "Meadow Creek", createdAt: "2026-01-01T00:00:00Z" },
  { id: "cust-5", name: "Betty Johnson", email: "betty@example.com", password: "password123", retirementVillage: "Oakwood Gardens", createdAt: "2026-01-01T00:00:00Z" },
];

function getStore(): Store {
  const g = globalThis as unknown as { [key: string]: Store | undefined };
  if (!g[storeKey]) {
    g[storeKey] = { classes: seedClasses, bookings: seedBookings, customers: seedCustomers };
  }
  return g[storeKey] as Store;
}

function parseDate(value?: string | null): number | null {
  if (!value) {
    return null;
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export function listClasses(from?: string, to?: string): ClassItem[] {
  const { classes } = getStore();
  const fromTime = parseDate(from) ?? null;
  const toTime = parseDate(to) ?? null;

  return classes.filter((item) => {
    const startTime = Date.parse(item.startTime);
    if (Number.isNaN(startTime)) {
      return false;
    }
    if (fromTime !== null && startTime < fromTime) {
      return false;
    }
    if (toTime !== null && startTime > toTime) {
      return false;
    }
    return true;
  });
}

export function countActiveBookings(classId: string): number {
  const { bookings } = getStore();
  return bookings.filter(
    (booking) => booking.classId === classId && booking.status === "active"
  ).length;
}

export function createBooking(input: BookingInput): BookingResult {
  const store = getStore();
  const classItem = store.classes.find((item) => item.id === input.classId);
  if (!classItem) {
    return { ok: false, error: "class_not_found" };
  }
  if (classItem.status === "cancelled") {
    return { ok: false, error: "class_cancelled" };
  }
  const booked = countActiveBookings(classItem.id);
  if (booked >= classItem.capacity) {
    return { ok: false, error: "class_full" };
  }

  const booking: BookingItem = {
    id: crypto.randomUUID(),
    classId: input.classId,
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    retirementVillage: input.retirementVillage,
    status: "active",
    cancelToken: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };

  store.bookings.push(booking);
  return { ok: true, booking, cancelToken: booking.cancelToken };
}

export function cancelBooking(cancelToken: string): CancelResult {
  const store = getStore();
  const booking = store.bookings.find(
    (item) => item.cancelToken === cancelToken
  );
  if (!booking) {
    return { ok: false, error: "not_found" };
  }
  if (booking.status === "cancelled") {
    return { ok: true, booking };
  }
  booking.status = "cancelled";
  booking.cancelledAt = new Date().toISOString();
  return { ok: true, booking };
}

// ---------- Admin Operations ----------

export type ClassInput = {
  title: string;
  startTime: string;
  endTime: string;
  capacity: number;
  location?: string;
};

export function createClass(input: ClassInput): ClassItem {
  const store = getStore();
  const newClass: ClassItem = {
    id: crypto.randomUUID(),
    title: input.title,
    startTime: input.startTime,
    endTime: input.endTime,
    capacity: input.capacity,
    status: "scheduled",
  };
  store.classes.push(newClass);
  return newClass;
}

export function updateClass(
  id: string,
  updates: Partial<ClassInput>
): ClassItem | null {
  const store = getStore();
  const classItem = store.classes.find((item) => item.id === id);
  if (!classItem) {
    return null;
  }
  if (updates.title !== undefined) classItem.title = updates.title;
  if (updates.startTime !== undefined) classItem.startTime = updates.startTime;
  if (updates.endTime !== undefined) classItem.endTime = updates.endTime;
  if (updates.capacity !== undefined) classItem.capacity = updates.capacity;
  return classItem;
}

export function cancelClass(id: string): ClassItem | null {
  const store = getStore();
  const classItem = store.classes.find((item) => item.id === id);
  if (!classItem) {
    return null;
  }
  classItem.status = "cancelled";
  // Cancel all active bookings for this class
  store.bookings
    .filter((b) => b.classId === id && b.status === "active")
    .forEach((b) => {
      b.status = "cancelled";
      b.cancelledAt = new Date().toISOString();
    });
  return classItem;
}

export function getClassById(id: string): ClassItem | null {
  const store = getStore();
  return store.classes.find((item) => item.id === id) ?? null;
}

export function listAttendees(
  classId: string
): { id: string; customerName: string; customerEmail: string; createdAt: string }[] {
  const store = getStore();
  return store.bookings
    .filter((b) => b.classId === classId && b.status === "active")
    .map((b) => ({
      id: b.id,
      customerName: b.customerName,
      customerEmail: b.customerEmail,
      createdAt: b.createdAt,
    }));
}

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

export function listBookingsByEmail(email: string): CustomerBooking[] {
  const store = getStore();
  const normalizedEmail = email.toLowerCase().trim();
  
  return store.bookings
    .filter((b) => b.customerEmail.toLowerCase() === normalizedEmail)
    .map((b) => {
      const classItem = store.classes.find((c) => c.id === b.classId);
      return {
        id: b.id,
        classId: b.classId,
        classTitle: classItem?.title ?? "Unknown Class",
        classStartTime: classItem?.startTime ?? "",
        classEndTime: classItem?.endTime ?? "",
        classStatus: classItem?.status ?? "cancelled",
        bookingStatus: b.status,
        cancelToken: b.cancelToken,
        createdAt: b.createdAt,
        cancelledAt: b.cancelledAt,
      };
    })
    .sort((a, b) => new Date(b.classStartTime).getTime() - new Date(a.classStartTime).getTime());
}

// ---------- Leaderboard ----------

export type LeaderboardEntry = {
  customerName: string;
  retirementVillage: string;
  sessionsAttended: number;
};

export function getLeaderboard(limit = 10): LeaderboardEntry[] {
  const store = getStore();
  const now = Date.now();
  
  // Count attended sessions per customer (active bookings for past classes)
  const attendanceMap = new Map<string, { name: string; village: string; count: number }>();
  
  for (const booking of store.bookings) {
    if (booking.status !== "active") continue;
    
    const classItem = store.classes.find((c) => c.id === booking.classId);
    if (!classItem || classItem.status === "cancelled") continue;
    
    // Only count past classes (already attended)
    const classTime = new Date(classItem.startTime).getTime();
    if (classTime > now) continue;
    
    const email = booking.customerEmail.toLowerCase();
    const existing = attendanceMap.get(email);
    
    if (existing) {
      existing.count++;
      // Update village if this booking has one and existing doesn't
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
  
  // Sort by count descending and return top entries
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
};

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  retirementVillage?: string;
};

export type RegisterResult =
  | { ok: true; customer: CustomerPublic }
  | { ok: false; error: "email_exists" | "invalid_input" };

export type LoginResult =
  | { ok: true; customer: CustomerPublic }
  | { ok: false; error: "invalid_credentials" };

export function registerCustomer(input: RegisterInput): RegisterResult {
  const store = getStore();
  
  if (!input.name || !input.email || !input.password) {
    return { ok: false, error: "invalid_input" };
  }
  
  const normalizedEmail = input.email.toLowerCase().trim();
  const existing = store.customers.find((c) => c.email.toLowerCase() === normalizedEmail);
  
  if (existing) {
    return { ok: false, error: "email_exists" };
  }
  
  const customer: CustomerItem = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    email: normalizedEmail,
    password: input.password,
    retirementVillage: input.retirementVillage,
    createdAt: new Date().toISOString(),
  };
  
  store.customers.push(customer);
  
  return {
    ok: true,
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      retirementVillage: customer.retirementVillage,
    },
  };
}

export function loginCustomer(email: string, password: string): LoginResult {
  const store = getStore();
  const normalizedEmail = email.toLowerCase().trim();
  
  const customer = store.customers.find(
    (c) => c.email.toLowerCase() === normalizedEmail && c.password === password
  );
  
  if (!customer) {
    return { ok: false, error: "invalid_credentials" };
  }
  
  return {
    ok: true,
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      retirementVillage: customer.retirementVillage,
    },
  };
}

export function getCustomerById(id: string): CustomerPublic | null {
  const store = getStore();
  const customer = store.customers.find((c) => c.id === id);
  
  if (!customer) {
    return null;
  }
  
  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    retirementVillage: customer.retirementVillage,
  };
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

export type DashboardData = {
  upcomingBookings: DashboardBooking[];
  pastBookings: DashboardBooking[];
  stats: DashboardStats;
};

export function getCustomerDashboard(email: string): DashboardData {
  const store = getStore();
  const normalizedEmail = email.toLowerCase().trim();
  const now = Date.now();

  // Get all bookings for this customer
  const customerBookings = store.bookings.filter(
    (b) => b.customerEmail.toLowerCase() === normalizedEmail
  );

  const upcoming: DashboardBooking[] = [];
  const past: DashboardBooking[] = [];
  const classAttendance: Record<string, number> = {};
  let totalAttended = 0;

  for (const booking of customerBookings) {
    const classItem = store.classes.find((c) => c.id === booking.classId);
    if (!classItem) continue;

    const classTime = new Date(classItem.startTime).getTime();
    const isUpcoming = classTime > now;
    const isCancelled = booking.status === "cancelled" || classItem.status === "cancelled";

    const dashboardBooking: DashboardBooking = {
      id: booking.id,
      classId: booking.classId,
      classTitle: classItem.title,
      classLocation: classItem.location,
      classStartTime: classItem.startTime,
      classEndTime: classItem.endTime,
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
  const leaderboard = getLeaderboard(100);
  const rankIndex = leaderboard.findIndex(
    (entry) => entry.customerName.toLowerCase() === normalizedEmail || 
               store.customers.find((c) => c.email.toLowerCase() === normalizedEmail)?.name === entry.customerName
  );
  const rank = rankIndex >= 0 ? rankIndex + 1 : null;

  // Calculate streak (consecutive weeks with attendance)
  let streak = 0;
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const sortedAttendance = past
    .filter((b) => b.status === "attended")
    .map((b) => new Date(b.classStartTime).getTime())
    .sort((a, b) => b - a);

  if (sortedAttendance.length > 0) {
    let currentWeekStart = Math.floor(now / weekMs) * weekMs;
    let lastAttendedWeek = Math.floor(sortedAttendance[0] / weekMs) * weekMs;
    
    // Only count streak if attended in current or last week
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

  return {
    upcomingBookings: upcoming,
    pastBookings: past.slice(0, 10), // Last 10 attended
    stats: {
      totalAttended,
      totalUpcoming: upcoming.length,
      streak,
      favoriteClass,
      rank,
    },
  };
}
