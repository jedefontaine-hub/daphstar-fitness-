export type ClassSummary = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  capacity: number;
  spotsLeft: number;
  location?: string;
  status: "scheduled" | "cancelled";
};

export type BookingRequest = {
  classId: string;
  customerName: string;
  customerEmail: string;
  retirementVillage?: string;
};

export type BookingResponse = {
  id: string;
  classId: string;
  customerName: string;
  customerEmail: string;
  status: "active" | "cancelled";
  createdAt: string;
};

export async function fetchClasses(
  from: string,
  to: string
): Promise<ClassSummary[]> {
  const response = await fetch(`/api/classes?from=${from}&to=${to}`);
  if (!response.ok) {
    throw new Error("Failed to load classes.");
  }
  const data = (await response.json()) as { classes: ClassSummary[] };
  return data.classes;
}

export async function createBooking(
  payload: BookingRequest
): Promise<{ booking: BookingResponse; cancelToken: string }> {
  const response = await fetch("/api/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    const errorMessages: Record<string, string> = {
      already_booked: "You have already booked this class.",
      class_full: "This class is now full.",
      class_not_found: "Class not found.",
      class_cancelled: "This class has been cancelled.",
    };
    const message = data?.error ? (errorMessages[data.error] ?? "Failed to create booking.") : "Failed to create booking.";
    throw new Error(message);
  }
  return (await response.json()) as {
    booking: BookingResponse;
    cancelToken: string;
  };
}

export async function cancelBooking(cancelToken: string): Promise<{
  status: "cancelled";
  bookingId: string;
  cancelledAt: string | null;
}> {
  const response = await fetch("/api/bookings/cancel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cancelToken }),
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    const message = data?.error
      ? `Cancellation failed: ${data.error}`
      : "Failed to cancel booking.";
    throw new Error(message);
  }
  return (await response.json()) as {
    status: "cancelled";
    bookingId: string;
    cancelledAt: string | null;
  };
}

// ---------- Admin API Helpers ----------

export type AdminClassSummary = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  capacity: number;
  booked: number;
  spotsLeft: number;
  status: "scheduled" | "cancelled";
};

export type ClassCreateRequest = {
  title: string;
  startTime: string;
  endTime: string;
  capacity: number;
  location?: string;
  recurring?: boolean;
  repeatWeeks?: number;
};

export type Attendee = {
  id: string;
  customerName: string;
  customerEmail: string;
  createdAt: string;
  attendanceStatus?: string;
};

export async function fetchAdminClasses(
  from?: string,
  to?: string
): Promise<AdminClassSummary[]> {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const url = `/api/admin/classes${params.toString() ? `?${params}` : ""}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to load classes.");
  }
  const data = (await response.json()) as { classes: AdminClassSummary[] };
  return data.classes;
}

export async function adminCreateClass(
  payload: ClassCreateRequest
): Promise<{ id: string; status: string }> {
  const response = await fetch("/api/admin/classes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error("Failed to create class.");
  }
  return (await response.json()) as { id: string; status: string };
}

export async function adminUpdateClass(
  id: string,
  updates: Partial<ClassCreateRequest>
): Promise<{ id: string; status: string }> {
  const response = await fetch(`/api/admin/classes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    throw new Error("Failed to update class.");
  }
  return (await response.json()) as { id: string; status: string };
}

export async function adminCancelClass(
  id: string
): Promise<{ id: string; status: string }> {
  const response = await fetch(`/api/admin/classes/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to cancel class.");
  }
  return (await response.json()) as { id: string; status: string };
}

export async function fetchAttendees(classId: string): Promise<Attendee[]> {
  const response = await fetch(`/api/admin/classes/${classId}/attendees`);
  if (!response.ok) {
    throw new Error("Failed to load attendees.");
  }
  const data = (await response.json()) as { attendees: Attendee[] };
  return data.attendees;
}
