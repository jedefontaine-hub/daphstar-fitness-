"use client";

import { useState } from "react";
import { cancelBooking } from "@/lib/api";

type Booking = {
  id: string;
  classId: string;
  classTitle: string;
  classStartTime: string;
  classEndTime: string;
  classStatus: "scheduled" | "cancelled";
  bookingStatus: "active" | "cancelled";
  cancelToken: string;
  createdAt: string;
  cancelledAt?: string;
};

type LookupStatus =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "ready" }
  | { state: "error"; message: string };

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return "";
  return d.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function isUpcoming(iso: string): boolean {
  return new Date(iso).getTime() > Date.now();
}

export default function MyBookingsPage() {
  const [email, setEmail] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [status, setStatus] = useState<LookupStatus>({ state: "idle" });
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setStatus({ state: "error", message: "Please enter your email address." });
      return;
    }

    setStatus({ state: "loading" });
    try {
      const res = await fetch(`/api/bookings/lookup?email=${encodeURIComponent(email)}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setBookings(data.bookings);
      setStatus({ state: "ready" });
    } catch {
      setStatus({ state: "error", message: "Unable to look up bookings. Try again." });
    }
  };

  const handleCancel = async (booking: Booking) => {
    if (!confirm(`Cancel your booking for ${booking.classTitle}?`)) return;
    
    setCancellingId(booking.id);
    try {
      await cancelBooking(booking.cancelToken);
      // Update the booking in the list
      setBookings((prev) =>
        prev.map((b) =>
          b.id === booking.id
            ? { ...b, bookingStatus: "cancelled" as const, cancelledAt: new Date().toISOString() }
            : b
        )
      );
    } catch {
      alert("Failed to cancel booking. Please try again.");
    } finally {
      setCancellingId(null);
    }
  };

  const upcomingBookings = bookings.filter(
    (b) => b.bookingStatus === "active" && b.classStatus === "scheduled" && isUpcoming(b.classStartTime)
  );
  const pastBookings = bookings.filter(
    (b) => b.bookingStatus === "active" && b.classStatus === "scheduled" && !isUpcoming(b.classStartTime)
  );
  const cancelledBookings = bookings.filter(
    (b) => b.bookingStatus === "cancelled" || b.classStatus === "cancelled"
  );

  return (
    <div className="min-h-screen bg-grid">
      {/* Soft decorative shapes */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-violet-200/40 blur-[100px]" />
        <div className="absolute -right-40 top-1/3 h-80 w-80 rounded-full bg-purple-200/30 blur-[100px]" />
      </div>

      <header className="relative border-b border-slate-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
          <div>
            <a href="/" className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600 hover:text-violet-700 transition">
              Daphstar Fitness
            </a>
            <h1 className="mt-1 text-2xl font-bold text-slate-800">My Bookings</h1>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/calendar"
              className="rounded-full border border-slate-300 bg-white px-6 py-3 text-base font-medium text-slate-700 transition hover:border-violet-400 hover:bg-violet-50 hover:text-violet-700"
            >
              Calendar
            </a>
            <a
              href="/"
              className="rounded-full border border-slate-300 bg-white px-6 py-3 text-base font-medium text-slate-700 transition hover:border-violet-400 hover:bg-violet-50 hover:text-violet-700"
            >
              Schedule
            </a>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-2xl px-6 py-10">
        {/* Lookup form */}
        <div className="glass-card rounded-3xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Look Up Your Bookings</h2>
          <p className="text-base text-slate-600 mb-4">
            Enter the email address you used when booking to view and manage your reservations.
          </p>
          <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="input-dark flex-1 h-14 rounded-xl px-4 text-base"
            />
            <button
              type="submit"
              disabled={status.state === "loading"}
              className="btn-glow h-14 rounded-full px-8 text-base font-semibold text-white whitespace-nowrap"
            >
              {status.state === "loading" ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Looking up...
                </span>
              ) : (
                "Find Bookings"
              )}
            </button>
          </form>
          {status.state === "error" && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-base text-red-700">
              {status.message}
            </div>
          )}
        </div>

        {/* Results */}
        {status.state === "ready" && (
          <>
            {bookings.length === 0 ? (
              <div className="glass-card rounded-3xl p-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                  <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-800">No Bookings Found</h3>
                <p className="mt-2 text-base text-slate-600">
                  We couldn&apos;t find any bookings for this email address.
                </p>
                <a
                  href="/calendar"
                  className="mt-5 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-6 py-3 text-base font-medium text-violet-700 hover:bg-violet-100 transition"
                >
                  Browse classes to book
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Upcoming bookings */}
                {upcomingBookings.length > 0 && (
                  <section>
                    <h3 className="mb-4 flex items-center gap-2 text-base font-semibold uppercase tracking-wider text-emerald-600">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      Upcoming ({upcomingBookings.length})
                    </h3>
                    <div className="space-y-3">
                      {upcomingBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="glass-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl p-5"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-violet-100">
                              <svg className="h-7 w-7 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                            </div>
                            <div>
                              <h4 className="text-lg font-semibold text-slate-800">{booking.classTitle}</h4>
                              <p className="text-base text-slate-600" suppressHydrationWarning>
                                {formatDateTime(booking.classStartTime)}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleCancel(booking)}
                            disabled={cancellingId === booking.id}
                            className="rounded-full border-2 border-red-200 bg-red-50 px-6 py-3 text-base font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-100 disabled:opacity-50"
                          >
                            {cancellingId === booking.id ? "Cancelling..." : "Cancel"}
                          </button>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Past bookings */}
                {pastBookings.length > 0 && (
                  <section>
                    <h3 className="mb-4 flex items-center gap-2 text-base font-semibold uppercase tracking-wider text-slate-500">
                      <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
                      Past ({pastBookings.length})
                    </h3>
                    <div className="space-y-3 opacity-70">
                      {pastBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="glass-card flex items-center gap-4 rounded-2xl p-5"
                        >
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                            <svg className="h-6 w-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-slate-700">{booking.classTitle}</h4>
                            <p className="text-base text-slate-500" suppressHydrationWarning>
                              {formatDateTime(booking.classStartTime)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Cancelled bookings */}
                {cancelledBookings.length > 0 && (
                  <section>
                    <h3 className="mb-4 flex items-center gap-2 text-base font-semibold uppercase tracking-wider text-red-500">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                      Cancelled ({cancelledBookings.length})
                    </h3>
                    <div className="space-y-3 opacity-60">
                      {cancelledBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="glass-card flex items-center gap-4 rounded-2xl p-5"
                        >
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100">
                            <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-slate-700">{booking.classTitle}</h4>
                            <p className="text-base text-slate-500" suppressHydrationWarning>
                              {formatDateTime(booking.classStartTime)}
                              {booking.classStatus === "cancelled" && " · Class cancelled"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
