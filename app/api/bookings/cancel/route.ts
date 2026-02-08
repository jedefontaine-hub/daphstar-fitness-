import { NextResponse } from "next/server";
import { sendCancellationConfirmation } from "@/lib/email";
import { cancelBooking, getClassById } from "@/lib/store";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const cancelToken = body?.cancelToken ?? body?.cancel_token;

  if (!cancelToken) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const result = cancelBooking(cancelToken);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  // Send cancellation email (non-blocking)
  const classItem = getClassById(result.booking.classId);
  if (classItem) {
    sendCancellationConfirmation({
      customerEmail: result.booking.customerEmail,
      customerName: result.booking.customerName,
      classTitle: classItem.title,
      classStartTime: classItem.startTime,
    }).catch((err) => console.error("Email send error:", err));
  }

  return NextResponse.json({
    status: result.booking.status,
    bookingId: result.booking.id,
    cancelledAt: result.booking.cancelledAt ?? null,
  });
}
