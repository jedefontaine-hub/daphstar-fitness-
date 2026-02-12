import { NextResponse } from "next/server";
import { listAttendees, markAttendance } from "@/lib/db-store";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Params) {
  const { id } = await context.params;
  const attendees = await listAttendees(id);
  // For admin, return all attendee info including attendanceStatus
  return NextResponse.json({ attendees });
}

// PATCH /api/classes/[id]/attendees - Mark attendance
export async function PATCH(request: Request, context: Params) {
  const { attendeeId, attendanceStatus } = await request.json();

  if (!attendeeId || !attendanceStatus) {
    return NextResponse.json(
      { error: "Missing attendeeId or attendanceStatus" },
      { status: 400 }
    );
  }

  const result = await markAttendance(attendeeId, attendanceStatus);

  if (!result.ok) {
    if (result.error === "no_sessions_remaining") {
      return NextResponse.json(
        { error: "Customer has no sessions remaining on their pass" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    sessionPassRemaining: result.sessionPassRemaining,
  });
}
