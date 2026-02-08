import { NextResponse } from "next/server";
import { sendBookingConfirmation } from "@/lib/email";
import { createBooking, getClassById } from "@/lib/store";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const classId = body?.classId ?? body?.class_id;
  const customerName = body?.customerName ?? body?.customer_name;
  const customerEmail = body?.customerEmail ?? body?.customer_email;
  const retirementVillage = body?.retirementVillage ?? body?.retirement_village;

  if (!classId || !customerName || !customerEmail) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const result = createBooking({ classId, customerName, customerEmail, retirementVillage });
  if (!result.ok) {
    const status = result.error === "class_full" ? 409 : 404;
    return NextResponse.json({ error: result.error }, { status });
  }

  const booking = result.booking;

  // Send confirmation email (non-blocking)
  const classItem = getClassById(classId);
  if (classItem) {
    sendBookingConfirmation({
      customerEmail: booking.customerEmail,
      customerName: booking.customerName,
      classTitle: classItem.title,
      classStartTime: classItem.startTime,
      classEndTime: classItem.endTime,
      cancelToken: result.cancelToken,
    }).catch((err) => console.error("Email send error:", err));
  }

  return NextResponse.json(
    {
      booking: {
        id: booking.id,
        classId: booking.classId,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        status: booking.status,
        createdAt: booking.createdAt,
      },
      cancelToken: result.cancelToken,
    },
    { status: 201 }
  );
}
