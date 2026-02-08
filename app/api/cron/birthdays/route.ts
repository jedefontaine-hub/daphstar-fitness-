import { NextResponse } from "next/server";
import { getCustomersWithBirthdayToday } from "@/lib/store";
import { sendBirthdayEmail } from "@/lib/email";

// This endpoint can be called by a cron job (e.g., Vercel Cron, GitHub Actions, or external service)
// Set CRON_SECRET in your environment to secure this endpoint

export async function POST(request: Request) {
  // Verify cron secret for security
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const birthdayCustomers = getCustomersWithBirthdayToday();
  
  if (birthdayCustomers.length === 0) {
    return NextResponse.json({
      message: "No birthdays today",
      sent: 0,
    });
  }

  const results = await Promise.allSettled(
    birthdayCustomers.map((customer) =>
      sendBirthdayEmail({
        customerEmail: customer.email,
        customerName: customer.name,
      })
    )
  );

  const successful = results.filter(
    (r) => r.status === "fulfilled" && r.value.success
  ).length;
  const failed = results.filter(
    (r) => r.status === "rejected" || (r.status === "fulfilled" && !r.value.success)
  ).length;

  console.log(`Birthday emails sent: ${successful} successful, ${failed} failed`);

  return NextResponse.json({
    message: `Birthday emails processed`,
    total: birthdayCustomers.length,
    successful,
    failed,
    recipients: birthdayCustomers.map((c) => c.name),
  });
}

// Also support GET for easier testing (with same auth)
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const birthdayCustomers = getCustomersWithBirthdayToday();
  
  return NextResponse.json({
    message: "Birthday check",
    date: new Date().toISOString().split("T")[0],
    birthdayCount: birthdayCustomers.length,
    customers: birthdayCustomers.map((c) => ({ name: c.name })),
  });
}
