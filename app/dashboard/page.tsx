"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cancelBooking } from "@/lib/api";
import { ConfirmModal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { BottomNav } from "@/components/BottomNav";
import { CompletedPassHistory } from "@/components/CompletedPassHistory";

type DashboardBooking = {
  id: string;
  classId: string;
  classTitle: string;
  classLocation?: string;
  classStartTime: string;
  classEndTime: string;
  cancelToken: string;
  status: "upcoming" | "attended" | "cancelled";
};

type DashboardStats = {
  totalAttended: number;
  totalUpcoming: number;
  streak: number;
  favoriteClass: string | null;
  rank: number | null;
};

type SessionPassHistory = {
  id: string;
  sessionNumber: number;
  classTitle: string;
  attendedDate: string;
};

type SessionPassData = {
  remaining: number;
  total: number;
  purchaseDate: string | null;
  history: SessionPassHistory[];
};

type CompletedPassSession = {
  id: string;
  sessionNumber: number;
  classTitle: string;
  attendedDate: string;
};

type CompletedPass = {
  id: string;
  purchaseDate: string;
  completedDate: string;
  sessionsCount: number;
  sessions: CompletedPassSession[];
};

type CustomerInfo = {
  id: string;
  name: string;
  email: string;
  retirementVillage?: string;
};

type DashboardData = {
  customer: CustomerInfo;
  upcomingBookings: DashboardBooking[];
  pastBookings: DashboardBooking[];
  stats: DashboardStats;
  sessionPass: SessionPassData;
  completedPasses: CompletedPass[];
};

type LoadStatus =
  | { state: "loading" }
  | { state: "ready"; data: DashboardData }
  | { state: "error"; message: string }
  | { state: "unauthorized" };

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return "";
  return d.toLocaleString("en-AU", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Australia/Brisbane",
  });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return "";
  return d.toLocaleDateString("en-AU", {
    month: "short",
    day: "numeric",
    timeZone: "Australia/Brisbane",
  });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return "";
  return d.toLocaleString("en-AU", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Australia/Brisbane",
  });
}

function getNextClassMessage(bookings: DashboardBooking[]): string | null {
  if (bookings.length === 0) return null;
  const next = bookings[0];
  const now = new Date();
  const classDate = new Date(next.classStartTime);
  const brisbaneNow = new Date(now.toLocaleString("en-US", { timeZone: "Australia/Brisbane" }));
  const brisbaneClass = new Date(classDate.toLocaleString("en-US", { timeZone: "Australia/Brisbane" }));

  const isToday = brisbaneNow.toDateString() === brisbaneClass.toDateString();
  const tomorrow = new Date(brisbaneNow);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = tomorrow.toDateString() === brisbaneClass.toDateString();

  const time = formatTime(next.classStartTime);
  const location = next.classLocation ? ` at ${next.classLocation}` : "";

  if (isToday) return `Next class today at ${time}${location}`;
  if (isTomorrow) return `Next class tomorrow at ${time}${location}`;
  return `Next class ${formatDateTime(next.classStartTime)}${location}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const toast = useToast();
  const [status, setStatus] = useState<LoadStatus>({ state: "loading" });
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<DashboardBooking | null>(null);

  const openCancelModal = (booking: DashboardBooking) => {
    setBookingToCancel(booking);
    setCancelModalOpen(true);
  };

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => {
        if (res.status === 401) {
          setStatus({ state: "unauthorized" });
          return null;
        }
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((data) => {
        if (data) {
          setStatus({ state: "ready", data });
        }
      })
      .catch(() => {
        setStatus({ state: "error", message: "Unable to load dashboard." });
      });
  }, []);

  const handleCancel = async () => {
    if (!bookingToCancel) return;

    setCancelModalOpen(false);
    setCancellingId(bookingToCancel.id);
    try {
      await cancelBooking(bookingToCancel.cancelToken);
      toast.success("Booking cancelled successfully");
      const res = await fetch("/api/dashboard");
      if (res.ok) {
        const data = await res.json();
        setStatus({ state: "ready", data });
      }
    } catch {
      toast.error("Failed to cancel booking. Please try again.");
    } finally {
      setCancellingId(null);
      setBookingToCancel(null);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  if (status.state === "unauthorized") {
    return (
      <div className="min-h-screen bg-grid flex items-center justify-center px-6">
        <div className="glass-card rounded-3xl p-8 max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100">
            <svg className="h-8 w-8 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Sign In Required</h2>
          <p className="mt-3 text-lg text-slate-400">Please log in to view your dashboard.</p>
          <a
            href="/login"
            className="btn-glow mt-6 inline-block rounded-full px-8 py-3.5 text-base font-semibold text-white"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  if (status.state === "loading") {
    return (
      <div className="min-h-screen bg-grid flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-3 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  if (status.state === "error") {
    return (
      <div className="min-h-screen bg-grid flex items-center justify-center px-6">
        <div className="glass-card rounded-3xl p-8 max-w-md text-center">
          <p className="text-red-600 text-lg">{status.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-violet-600 hover:text-violet-700 font-medium"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const { customer, upcomingBookings, pastBookings, stats, sessionPass, completedPasses } = status.data;
  const nextClassMsg = getNextClassMessage(upcomingBookings);
  const used = sessionPass.total - sessionPass.remaining;
  const isPassExpired = sessionPass.remaining === 0;
  const isPassLow = sessionPass.remaining > 0 && sessionPass.remaining <= 2;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 pb-20">
      {/* Soft decorative shapes */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-teal-500/20 blur-[100px]" />
        <div className="absolute -right-40 top-1/3 h-80 w-80 rounded-full bg-cyan-500/10 blur-[100px]" />
      </div>

      <header className="relative border-b border-white/10 bg-slate-900/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
          <div>
            <a href="/" className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-400 hover:text-teal-300 transition sm:text-sm">
              Daphstar Fitness
            </a>
            <h1 className="mt-1 text-xl font-bold text-white sm:text-2xl">My Dashboard</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="/"
              className="flex-1 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/20 sm:flex-none sm:px-6 sm:py-3 sm:text-base text-center"
            >
              Browse Classes
            </a>
            <button
              onClick={handleLogout}
              className="flex-1 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-red-400/50 hover:bg-red-500/20 hover:text-red-300 sm:flex-none sm:px-6 sm:py-3 sm:text-base"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-5xl px-6 py-8">
        {/* Welcome section with next class reminder */}
        <div className="mb-6">
          <h2 className="gradient-text text-3xl font-bold">
            Welcome back, {customer.name.split(" ")[0]}!
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {customer.retirementVillage && (
              <span className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-sm font-medium text-teal-400">
                <span className="h-2 w-2 rounded-full bg-teal-400" />
                {customer.retirementVillage}
              </span>
            )}
          </div>
          {nextClassMsg && (
            <p className="mt-3 text-base text-slate-300" suppressHydrationWarning>
              {nextClassMsg}
            </p>
          )}
        </div>

        {/* Stats grid - colored numbers, no icon backgrounds */}
        <div className="mb-6 grid grid-cols-4 gap-2 sm:gap-3">
          <div className="glass-card rounded-2xl p-3 sm:p-4 text-center">
            <p className="text-2xl sm:text-3xl font-bold text-teal-400">{stats.totalAttended}</p>
            <p className="mt-1 text-xs sm:text-sm text-slate-400">Attended</p>
          </div>
          <div className="glass-card rounded-2xl p-3 sm:p-4 text-center">
            <p className="text-2xl sm:text-3xl font-bold text-emerald-400">{stats.totalUpcoming}</p>
            <p className="mt-1 text-xs sm:text-sm text-slate-400">Upcoming</p>
          </div>
          <div className="glass-card rounded-2xl p-3 sm:p-4 text-center">
            <p className="text-2xl sm:text-3xl font-bold text-amber-400">{stats.streak}</p>
            <p className="mt-1 text-xs sm:text-sm text-slate-400">Streak</p>
          </div>
          <div className="glass-card rounded-2xl p-3 sm:p-4 text-center">
            <p className="text-2xl sm:text-3xl font-bold text-rose-400">
              {stats.rank ? `#${stats.rank}` : "—"}
            </p>
            <p className="mt-1 text-xs sm:text-sm text-slate-400">Rank</p>
          </div>
        </div>

        {/* Session Pass - compact */}
        {sessionPass.total > 0 && (
          <div className={`mb-6 glass-card rounded-2xl p-4 sm:p-5 border ${
            isPassExpired
              ? "border-red-500/50"
              : isPassLow
              ? "border-amber-500/50"
              : "border-teal-500/20"
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-semibold text-white">
                  {isPassExpired ? "Pass Expired" : "Session Pass"}
                </h3>
                {sessionPass.purchaseDate && (
                  <p className="text-xs text-slate-400">
                    Purchased {formatDate(sessionPass.purchaseDate)}
                  </p>
                )}
              </div>
              <p className={`text-2xl font-bold ${
                isPassExpired ? "text-red-400" : isPassLow ? "text-amber-400" : "text-teal-400"
              }`}>
                {sessionPass.remaining}/{sessionPass.total}
              </p>
            </div>
            <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isPassExpired ? "bg-red-500" : isPassLow ? "bg-amber-500" : "bg-teal-500"
                }`}
                style={{ width: `${(used / sessionPass.total) * 100}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1.5 text-center">
              {used} of {sessionPass.total} sessions used
            </p>
            {isPassExpired && (
              <p className="mt-2 text-sm text-red-300 text-center">
                Please purchase a new pass to continue booking classes.
              </p>
            )}
            {isPassLow && !isPassExpired && (
              <p className="mt-2 text-sm text-amber-300 text-center">
                Only {sessionPass.remaining} session{sessionPass.remaining > 1 ? "s" : ""} left — consider renewing soon!
              </p>
            )}
          </div>
        )}

        {/* Favorite class */}
        {stats.favoriteClass && (
          <div className="mb-6 glass-card rounded-2xl p-4">
            <p className="text-sm text-slate-400">
              Favourite class: <span className="font-semibold text-teal-400">{stats.favoriteClass}</span>
            </p>
          </div>
        )}

        {/* Upcoming bookings */}
        <section className="mb-6">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Upcoming Classes ({upcomingBookings.length})
          </h3>
          {upcomingBookings.length === 0 ? (
            <div className="glass-card rounded-2xl p-6 text-center">
              <p className="text-slate-400">No upcoming classes booked yet.</p>
              <a
                href="/"
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-teal-500/20 px-5 py-2.5 text-sm font-medium text-teal-300 hover:bg-teal-500/30 transition"
              >
                Book your first class
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {upcomingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="glass-card group rounded-2xl p-4 transition hover:border-white/10"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-teal-500/20">
                        <svg className="h-5 w-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">{booking.classTitle}</h4>
                        {booking.classLocation && (
                          <p className="text-sm text-teal-400">{booking.classLocation}</p>
                        )}
                        <p className="text-sm text-slate-400" suppressHydrationWarning>
                          {formatDateTime(booking.classStartTime)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => openCancelModal(booking)}
                      disabled={cancellingId === booking.id}
                      className="mt-1 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-red-500/20 hover:text-red-300 disabled:opacity-50"
                    >
                      {cancellingId === booking.id ? "..." : "Cancel"}
                    </button>
                  </div>
                </div>
              ))}
              {upcomingBookings.length <= 1 && (
                <a
                  href="/"
                  className="glass-card flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/10 p-4 text-sm font-medium text-slate-400 transition hover:border-teal-500/30 hover:text-teal-400"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Book another class
                </a>
              )}
            </div>
          )}
        </section>

        {/* Past bookings */}
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
            <span className="h-2 w-2 rounded-full bg-slate-500" />
            Recent Attendance
          </h3>
          {pastBookings.length === 0 ? (
            <div className="glass-card rounded-2xl p-6 text-center">
              <p className="text-slate-400">Complete your first class to start tracking!</p>
            </div>
          ) : (
            <div className="glass-card rounded-2xl divide-y divide-white/10">
              {pastBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-white">{booking.classTitle}</p>
                      {booking.classLocation && (
                        <p className="text-xs text-teal-400">{booking.classLocation}</p>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-slate-400" suppressHydrationWarning>
                    {formatDate(booking.classStartTime)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Completed Pass History */}
        {completedPasses && completedPasses.length > 0 && (
          <section className="mt-6">
            <CompletedPassHistory passes={completedPasses} />
          </section>
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
