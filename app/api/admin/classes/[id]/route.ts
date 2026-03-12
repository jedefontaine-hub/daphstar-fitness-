import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendClassCancellationByAdminEmail } from "@/lib/email";
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

type CancelledClassWithBookings = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  location?: string;
  bookings: {
    customerName: string;
    customerEmail: string;
    retirementVillage?: string;
  }[];
};

function formatDateLabel(iso: string) {
  return new Date(iso).toLocaleString("en-AU", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

async function notifyCancellation(impacted: CancelledClassWithBookings[], applyToSeries: boolean) {
  if (impacted.length === 0) return;

  const emailTasks = impacted.flatMap((classItem) =>
    classItem.bookings.map((booking) =>
      sendClassCancellationByAdminEmail({
        customerEmail: booking.customerEmail,
        customerName: booking.customerName,
        classTitle: classItem.title,
        classStartTime: classItem.startTime,
      })
    )
  );
  await Promise.allSettled(emailTasks);

  const villages = new Set<string>();
  for (const classItem of impacted) {
    for (const booking of classItem.bookings) {
      if (booking.retirementVillage?.trim()) {
        villages.add(booking.retirementVillage.trim());
      }
    }
  }

  if (villages.size === 0) return;

  const primary = impacted[0];
  const announcementTitle = applyToSeries
    ? `Class Series Cancelled: ${primary.title}`
    : `Class Cancelled: ${primary.title}`;
  const announcementMessage = applyToSeries
    ? `${primary.title} classes from ${formatDateLabel(primary.startTime)} onward have been cancelled. Please check the calendar for alternatives.`
    : `${primary.title} scheduled for ${formatDateLabel(primary.startTime)} has been cancelled. Please check the calendar for alternatives.`;

  await Promise.allSettled(
    Array.from(villages).map((village) =>
      prisma.announcement.create({
        data: {
          title: announcementTitle,
          message: announcementMessage,
          village,
          isPinned: true,
          isActive: true,
        },
      })
    )
  );
}

export async function GET(request: Request, context: Params) {
  const admin = getAdminFromRequest(request);
  if (!admin) {
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
  const admin = getAdminFromRequest(request);
  if (!admin) {
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
  const admin = getAdminFromRequest(request);
  if (!admin) {
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

    const impactedRaw = await prisma.class.findMany({
      where: {
        recurringGroupId: classItem.recurringGroupId,
        status: "scheduled",
        startTime: { gte: new Date(classItem.startTime) },
      },
      orderBy: { startTime: "asc" },
      include: {
        bookings: {
          where: { status: "active" },
          select: {
            customerName: true,
            customerEmail: true,
            retirementVillage: true,
          },
        },
      },
    });

    const count = await cancelRecurringClasses(classItem.recurringGroupId, id);
    const impacted: CancelledClassWithBookings[] = impactedRaw.map((item) => ({
      id: item.id,
      title: item.title,
      startTime: item.startTime.toISOString(),
      endTime: item.endTime.toISOString(),
      location: item.location ?? undefined,
      bookings: item.bookings.map((b) => ({
        customerName: b.customerName,
        customerEmail: b.customerEmail,
        retirementVillage: b.retirementVillage ?? undefined,
      })),
    }));

    await notifyCancellation(impacted, true);
    return NextResponse.json({
      cancelled: count,
      emailsAttempted: impacted.reduce((sum, c) => sum + c.bookings.length, 0),
      announcementsPublishedToVillages: Array.from(
        new Set(impacted.flatMap((c) => c.bookings.map((b) => b.retirementVillage).filter(Boolean)))
      ).length,
    });
  }

  const impactedClass = await prisma.class.findUnique({
    where: { id },
    include: {
      bookings: {
        where: { status: "active" },
        select: {
          customerName: true,
          customerEmail: true,
          retirementVillage: true,
        },
      },
    },
  });

  const cancelled = await cancelClass(id);
  if (!cancelled) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (impactedClass) {
    const impacted: CancelledClassWithBookings[] = [
      {
        id: impactedClass.id,
        title: impactedClass.title,
        startTime: impactedClass.startTime.toISOString(),
        endTime: impactedClass.endTime.toISOString(),
        location: impactedClass.location ?? undefined,
        bookings: impactedClass.bookings.map((b) => ({
          customerName: b.customerName,
          customerEmail: b.customerEmail,
          retirementVillage: b.retirementVillage ?? undefined,
        })),
      },
    ];
    await notifyCancellation(impacted, false);
  }

  return NextResponse.json({
    id: cancelled.id,
    status: cancelled.status,
    emailsAttempted: impactedClass?.bookings.length ?? 0,
    announcementsPublishedToVillages: new Set(
      (impactedClass?.bookings ?? []).map((b) => b.retirementVillage).filter(Boolean)
    ).size,
  });
}
