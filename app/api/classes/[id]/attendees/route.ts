import { NextResponse } from "next/server";
import { listAttendees } from "@/lib/db-store";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Params) {
  const { id } = await context.params;
  const attendees = await listAttendees(id);
  
  // Return only names (privacy: no emails for public endpoint)
  const publicAttendees = attendees.map((a) => ({
    id: a.id,
    name: a.customerName,
  }));
  
  return NextResponse.json({ attendees: publicAttendees });
}
