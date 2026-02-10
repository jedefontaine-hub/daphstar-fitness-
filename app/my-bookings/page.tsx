"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/session-context";
import { cancelBooking } from "@/lib/api";
import { ConfirmModal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { PageTransition } from "@/components/ui/PageTransition";
import { BottomNav } from "@/components/BottomNav";

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
  const toast = useToast();
  const { customer } = useSession();
  const [email, setEmail] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [status, setStatus] = useState<LookupStatus>({ state: "idle" });
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);

  // If logged in, auto-fetch bookings for the logged-in user
  useEffect(() => {
    if (customer && customer.email) {
      setEmail(customer.email);
      setStatus({ state: "loading" });
      fetch(`/api/bookings/lookup?email=${encodeURIComponent(customer.email)}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch");
          return res.json();
        })
        .then((data) => {
          setBookings(data.bookings);
          setStatus({ state: "ready" });
        })
        .catch(() => {
          toast.error("Unable to look up bookings. Try again.");
          setStatus({ state: "error", message: "Unable to look up bookings. Try again." });
        });
    }
  }, [customer]);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email address.");
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
      toast.error("Unable to look up bookings. Try again.");
      setStatus({ state: "error", message: "Unable to look up bookings. Try again." });
    }
  };

  const openCancelModal = (booking: Booking) => {
    setBookingToCancel(booking);
    setCancelModalOpen(true);
  };

  const handleCancel = async () => {
    if (!bookingToCancel) return;
    
    setCancelModalOpen(false);
    setCancellingId(bookingToCancel.id);
    try {
      await cancelBooking(bookingToCancel.cancelToken);
      // Update the booking in the list
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingToCancel.id
            ? { ...b, bookingStatus: "cancelled" as const, cancelledAt: new Date().toISOString() }
            : b
        )
      );
      toast.success("Booking cancelled successfully");
    } catch {
      toast.error("Failed to cancel booking. Please try again.");
    } finally {
      setCancellingId(null);
      setBookingToCancel(null);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 pb-20">
      {/* Soft decorative shapes */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-teal-500/20 blur-[100px]" />
        <div className="absolute -right-40 top-1/3 h-80 w-80 rounded-full bg-cyan-500/10 blur-[100px]" />
      </div>

      <header className="relative border-b border-white/10 bg-slate-900/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
          <div>
            <a href="/" className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-400 hover:text-teal-300 transition">
              Daphstar Fitness
            </a>
            <h1 className="mt-1 text-2xl font-bold text-white">My Bookings</h1>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/calendar"
              className="rounded-full border border-white/20 bg-white/10 px-6 py-3 text-base font-medium text-slate-200 transition hover:bg-white/20"
            >
              Calendar
            </a>
            <a
              href="/"
              className="rounded-full border border-white/20 bg-white/10 px-6 py-3 text-base font-medium text-slate-200 transition hover:bg-white/20"
            >
              Schedule
            </a>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-2xl px-6 py-10">
        {/* Lookup form */}
        {/* Only show lookup form if not logged in */}
        {!customer && (
          <div className="glass-card rounded-3xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-2">Look Up Your Bookings</h2>
            <p className="text-base text-slate-400 mb-4">
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
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/20 px-5 py-4 text-base text-red-300">
                {status.message}
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {status.state === "ready" && (
          <>
            {bookings.length === 0 ? (
              <div className="glass-card rounded-3xl p-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
                  <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white">No Bookings Found</h3>
                <p className="mt-2 text-base text-slate-400">
                  We couldn&apos;t find any bookings for this email address.
                </p>
                <a
                  href="/calendar"
                  className="mt-5 inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/20 px-6 py-3 text-base font-medium text-teal-300 hover:bg-teal-500/30 transition"
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
                    <h3 className="mb-4 flex items-center gap-2 text-base font-semibold uppercase tracking-wider text-emerald-400">
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
                            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-teal-500/20">
                              <svg className="h-7 w-7 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                            </div>
                            <div>
                              <h4 className="text-lg font-semibold text-white">{booking.classTitle}</h4>
                              <p className="text-base text-slate-400" suppressHydrationWarning>
                                {formatDateTime(booking.classStartTime)}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => openCancelModal(booking)}
                            disabled={cancellingId === booking.id}
                            className="rounded-full border-2 border-red-500/50 bg-red-500/20 px-6 py-3 text-base font-semibold text-red-300 transition hover:border-red-400 hover:bg-red-500/30 disabled:opacity-50"
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
                    <h3 className="mb-4 flex items-center gap-2 text-base font-semibold uppercase tracking-wider text-slate-400">
                      <span className="h-2.5 w-2.5 rounded-full bg-slate-500" />
                      Past ({pastBookings.length})
                    </h3>
                    <div className="space-y-3 opacity-70">
                      {pastBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="glass-card flex items-center gap-4 rounded-2xl p-5"
                        >
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                            <svg className="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-slate-300">{booking.classTitle}</h4>
                            <p className="text-base text-slate-300" suppressHydrationWarning>
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
                    <h3 className="mb-4 flex items-center gap-2 text-base font-semibold uppercase tracking-wider text-red-400">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                      Cancelled ({cancelledBookings.length})
                    </h3>
                    <div className="space-y-3 opacity-60">
                      {cancelledBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="glass-card flex items-center gap-4 rounded-2xl p-5"
                        >
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/20">
                            <svg className="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-slate-300">{booking.classTitle}</h4>
                            <p className="text-base text-slate-300" suppressHydrationWarning>
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

      <ConfirmModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleCancel}
        title="Cancel Booking?"
        message={`Are you sure you want to cancel your booking for ${bookingToCancel?.classTitle || "this class"}?`}
        confirmLabel="Yes, Cancel"
        cancelLabel="Keep Booking"
        variant="danger"
      />

      <BottomNav />
    </div>
  );
}
