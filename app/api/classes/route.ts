import { NextResponse } from "next/server";
import { countActiveBookings, listClasses } from "@/lib/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;

  const classes = listClasses(from, to).map((item) => {
    const booked = countActiveBookings(item.id);
    return {
      id: item.id,
      title: item.title,
      startTime: item.startTime,
      endTime: item.endTime,
      capacity: item.capacity,
      spotsLeft: Math.max(item.capacity - booked, 0),
      location: item.location,
      status: item.status,
    };
  });

  return NextResponse.json({ classes });
}
