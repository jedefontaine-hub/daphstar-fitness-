import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  cancelClass,
  cancelRecurringClasses,
  countActiveBookings,
  getClassById,
  listAttendees,
  updateClass,
  updateRecurringClasses,
} from "@/lib/db-store";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Params) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const classItem = await getClassById(id);
  if (!classItem) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const booked = await countActiveBookings(id);
  return NextResponse.json({
    id: classItem.id,
    title: classItem.title,
    startTime: classItem.startTime,
    endTime: classItem.endTime,
    capacity: classItem.capacity,
    booked,
    spotsLeft: Math.max(classItem.capacity - booked, 0),
    status: classItem.status,
  });
}

export async function PUT(request: Request, context: Params) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) updates.title = body.title;
  if (body.startTime !== undefined || body.start_time !== undefined)
    updates.startTime = body.startTime ?? body.start_time;
  if (body.endTime !== undefined || body.end_time !== undefined)
    updates.endTime = body.endTime ?? body.end_time;
  if (body.capacity !== undefined) updates.capacity = body.capacity;
  if (body.location !== undefined) updates.location = body.location;

  // Apply to entire recurring series if requested
  if (body.applyToSeries === true) {
    const classItem = await getClassById(id);
    if (!classItem?.recurringGroupId) {
      return NextResponse.json({ error: "not_recurring" }, { status: 400 });
    }
    const count = await updateRecurringClasses(classItem.recurringGroupId, id, updates);
    return NextResponse.json({ updated: count });
  }

  const updated = await updateClass(id, updates);
  if (!updated) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ id: updated.id, status: updated.status });
}

export async function DELETE(request: Request, context: Params) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const url = new URL(request.url);
  const applyToSeries = url.searchParams.get("applyToSeries") === "true";

  if (applyToSeries) {
    const classItem = await getClassById(id);
    if (!classItem?.recurringGroupId) {
      return NextResponse.json({ error: "not_recurring" }, { status: 400 });
    }
    const count = await cancelRecurringClasses(classItem.recurringGroupId, id);
    return NextResponse.json({ cancelled: count });
  }

  const cancelled = await cancelClass(id);
  if (!cancelled) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ id: cancelled.id, status: cancelled.status });
}
