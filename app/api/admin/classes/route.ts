import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  countActiveBookings,
  createClass,
  createRecurringClasses,
  listClasses,
  type ClassInput,
} from "@/lib/db-store";

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;

  const rawClasses = await listClasses(from, to);
  const classes = await Promise.all(
    rawClasses.map(async (item) => {
      const booked = await countActiveBookings(item.id);
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
    })
  );

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
  const location = body?.location;
  const recurring = body?.recurring === true;
  const repeatWeeks = typeof body?.repeatWeeks === "number" ? body.repeatWeeks : 1;

  if (!title || !startTime || !endTime || typeof capacity !== "number") {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const input: ClassInput = { title, startTime, endTime, capacity, location };

  if (recurring && repeatWeeks > 1) {
    const createdClasses = await createRecurringClasses({ ...input, repeatWeeks });
    return NextResponse.json(
      { 
        ids: createdClasses.map(c => c.id), 
        count: createdClasses.length,
        message: `Created ${createdClasses.length} recurring classes`
      },
      { status: 201 }
    );
  }

  const created = await createClass(input);

  return NextResponse.json(
    { id: created.id, status: created.status },
    { status: 201 }
  );
}
