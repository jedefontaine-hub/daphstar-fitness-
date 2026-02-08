import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  countActiveBookings,
  createClass,
  listClasses,
  type ClassInput,
} from "@/lib/store";

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

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
      booked,
      spotsLeft: Math.max(item.capacity - booked, 0),
      status: item.status,
    };
  });

  return NextResponse.json({ classes });
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const title = body?.title;
  const startTime = body?.startTime ?? body?.start_time;
  const endTime = body?.endTime ?? body?.end_time;
  const capacity = body?.capacity;

  if (!title || !startTime || !endTime || typeof capacity !== "number") {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const input: ClassInput = { title, startTime, endTime, capacity };
  const created = createClass(input);

  return NextResponse.json(
    { id: created.id, status: created.status },
    { status: 201 }
  );
}
