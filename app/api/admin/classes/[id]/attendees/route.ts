import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { listAttendees } from "@/lib/store";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Params) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const attendees = listAttendees(id);
  return NextResponse.json({ attendees });
}
