import { prisma } from "@/lib/db";

// PATCH /api/classes/[id]/attendees
export async function PATCH(request: Request, context: Params) {
  const { id: classId } = await context.params;
  const { attendeeId, attendanceStatus } = await request.json();
  if (!attendeeId || !attendanceStatus) {
    return NextResponse.json({ error: "Missing attendeeId or attendanceStatus" }, { status: 400 });
  }
  try {
    const updated = await prisma.booking.update({
      where: { id: attendeeId },
      data: { attendanceStatus },
    });
    return NextResponse.json({ ok: true, booking: updated });
  } catch (e) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
import { NextResponse } from "next/server";
import { listAttendees } from "@/lib/db-store";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Params) {
  const { id } = await context.params;
  const attendees = await listAttendees(id);
  // For admin, return all attendee info including attendanceStatus
  return NextResponse.json({ attendees });
}
