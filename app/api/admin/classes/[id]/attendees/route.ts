import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { listAttendees } from "@/lib/db-store";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Params) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const attendees = await listAttendees(id);
  // Ensure attendanceStatus is present for each attendee
  const adminAttendees = attendees.map((a) => ({
    id: a.id,
    customerName: a.customerName,
    customerEmail: a.customerEmail,
    createdAt: a.createdAt,
    attendanceStatus: a.attendanceStatus,
  }));
  return NextResponse.json({ attendees: adminAttendees });
}
