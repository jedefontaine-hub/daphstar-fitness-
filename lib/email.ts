import { Resend } from "resend";

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

const fromEmail = process.env.EMAIL_FROM ?? "Daphstar Fitness <noreply@daphstarfitness.com>";
const appUrl = process.env.APP_URL ?? "http://localhost:3000";

function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export async function sendBookingConfirmation(params: {
  customerEmail: string;
  customerName: string;
  classTitle: string;
  classStartTime: string;
  classEndTime: string;
  cancelToken: string;
}): Promise<{ success: boolean; error?: string }> {
  const client = getResend();
  if (!client) {
    console.warn("RESEND_API_KEY not configured – skipping email");
    return { success: true };
  }

  const cancelUrl = `${appUrl}/cancel?token=${params.cancelToken}`;

  try {
    await client.emails.send({
      from: fromEmail,
      to: params.customerEmail,
      subject: `Booking Confirmed: ${params.classTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h1 style="color: #1e293b; font-size: 24px;">You're booked!</h1>
          <p style="color: #475569;">Hi ${params.customerName},</p>
          <p style="color: #475569;">Your spot has been reserved for:</p>
          <div style="background: #f1f5f9; border-radius: 12px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0; font-weight: 600; color: #1e293b;">${params.classTitle}</p>
            <p style="margin: 8px 0 0; color: #475569;">${formatDateTime(params.classStartTime)}</p>
          </div>
          <p style="color: #475569;">Need to cancel? <a href="${cancelUrl}" style="color: #3b82f6;">Click here</a></p>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 32px;">Daphstar Fitness</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send booking confirmation email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Email send failed",
    };
  }
}

export async function sendCancellationConfirmation(params: {
  customerEmail: string;
  customerName: string;
  classTitle: string;
  classStartTime: string;
}): Promise<{ success: boolean; error?: string }> {
  const client = getResend();
  if (!client) {
    console.warn("RESEND_API_KEY not configured – skipping email");
    return { success: true };
  }

  try {
    await client.emails.send({
      from: fromEmail,
      to: params.customerEmail,
      subject: `Booking Cancelled: ${params.classTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h1 style="color: #1e293b; font-size: 24px;">Booking Cancelled</h1>
          <p style="color: #475569;">Hi ${params.customerName},</p>
          <p style="color: #475569;">Your booking has been cancelled for:</p>
          <div style="background: #f1f5f9; border-radius: 12px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0; font-weight: 600; color: #1e293b;">${params.classTitle}</p>
            <p style="margin: 8px 0 0; color: #475569;">${formatDateTime(params.classStartTime)}</p>
          </div>
          <p style="color: #475569;">Want to book a different class? <a href="${appUrl}" style="color: #3b82f6;">View schedule</a></p>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 32px;">Daphstar Fitness</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send cancellation confirmation email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Email send failed",
    };
  }
}
