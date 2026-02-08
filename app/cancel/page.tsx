"use client";

import { useState } from "react";
import { cancelBooking } from "@/lib/api";

type CancelStatus =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "success"; cancelledAt: string | null }
  | { state: "error"; message: string };

export default function CancelPage() {
  const [cancelToken, setCancelToken] = useState("");
  const [status, setStatus] = useState<CancelStatus>({ state: "idle" });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!cancelToken) {
      setStatus({ state: "error", message: "Enter your cancellation token." });
      return;
    }
    setStatus({ state: "loading" });
    try {
      const result = await cancelBooking(cancelToken);
      setStatus({ state: "success", cancelledAt: result.cancelledAt });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to cancel booking.";
      setStatus({ state: "error", message });
    }
  };

  return (
    <div className="min-h-screen bg-grid px-6 py-10">
      {/* Soft decorative shapes */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-violet-200/40 blur-[100px]" />
        <div className="absolute -right-40 top-1/3 h-80 w-80 rounded-full bg-purple-200/30 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-lg">
        <div className="mb-6 flex items-center justify-between">
          <a href="/" className="inline-flex items-center gap-2 text-base font-medium text-slate-600 hover:text-violet-700 transition">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Schedule
          </a>
          <div className="flex items-center gap-2">
            <a
              href="/calendar"
              className="rounded-full border border-slate-300 bg-white px-5 py-3 text-base font-medium text-slate-600 transition hover:border-violet-400 hover:text-violet-700"
            >
              Calendar
            </a>
            <a
              href="/my-bookings"
              className="rounded-full border border-slate-300 bg-white px-5 py-3 text-base font-medium text-slate-600 transition hover:border-violet-400 hover:text-violet-700"
            >
              My Bookings
            </a>
          </div>
        </div>

        <div className="glass-card rounded-3xl p-8">
          <div className="mb-6">
            <h1 className="gradient-text text-2xl font-bold text-slate-800">Cancel Booking</h1>
            <p className="mt-3 text-base text-slate-600">
              Paste the cancellation token from your confirmation email.
            </p>
          </div>

          <form className="grid gap-5" onSubmit={handleSubmit}>
            <label className="grid gap-2 text-base font-medium text-slate-700">
              Cancellation token
              <input
                className="input-dark h-14 rounded-xl px-4 font-mono text-base"
                placeholder="ct_abc123"
                type="text"
                value={cancelToken}
                onChange={(event) => setCancelToken(event.target.value)}
              />
            </label>

            {status.state === "error" ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-base text-red-700">
                {status.message}
              </div>
            ) : null}

            {status.state === "success" ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-base text-emerald-700">
                <p className="font-semibold">✓ Booking cancelled successfully</p>
                <p className="mt-2 text-emerald-600">Your spot has been released.</p>
              </div>
            ) : null}

            <button
              className="mt-2 h-14 rounded-full border-2 border-red-300 bg-red-50 text-base font-semibold text-red-600 transition hover:bg-red-100 hover:border-red-400 disabled:opacity-50"
              type="submit"
              disabled={status.state === "loading"}
            >
              {status.state === "loading" ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-red-300 border-t-red-600" />
                  Cancelling...
                </span>
              ) : (
                "Cancel Booking"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
