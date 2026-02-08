"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cancelBooking } from "@/lib/api";
import { ConfirmModal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

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
};

type LoadStatus =
  | { state: "loading" }
  | { state: "ready"; data: DashboardData }
  | { state: "error"; message: string }
  | { state: "unauthorized" };

const villageColors: Record<string, { bg: string; text: string; border: string }> = {
  "Sunrise Village": { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-300" },
  "Oakwood Gardens": { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-300" },
  "Meadow Creek": { bg: "bg-sky-100", text: "text-sky-700", border: "border-sky-300" },
  "Lakeside Manor": { bg: "bg-violet-100", text: "text-violet-700", border: "border-violet-300" },
  "Hillcrest Retirement": { bg: "bg-rose-100", text: "text-rose-700", border: "border-rose-300" },
};

function getVillageColor(village?: string) {
  if (!village) return { bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-300" };
  return villageColors[village] || { bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-300" };
}

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

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return "";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
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
      // Refresh dashboard
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
          <p className="mt-3 text-lg text-slate-600">Please log in to view your dashboard.</p>
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

  const { customer, upcomingBookings, pastBookings, stats } = status.data;

  return (
    <div className="min-h-screen bg-grid">
      {/* Soft decorative shapes */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-violet-200/40 blur-[100px]" />
        <div className="absolute -right-40 top-1/3 h-80 w-80 rounded-full bg-purple-200/30 blur-[100px]" />
      </div>

      <header className="relative border-b border-slate-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div>
            <a href="/" className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600 hover:text-violet-700 transition">
              Daphstar Fitness
            </a>
            <h1 className="mt-1 text-2xl font-bold text-slate-800">My Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="rounded-full border border-slate-300 bg-white px-6 py-3 text-base font-medium text-slate-700 transition hover:border-violet-400 hover:bg-violet-50 hover:text-violet-700"
            >
              Browse Classes
            </a>
            <button
              onClick={handleLogout}
              className="rounded-full border border-slate-300 bg-white px-6 py-3 text-base font-medium text-slate-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-5xl px-6 py-10">
        {/* Welcome section */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="gradient-text text-3xl font-bold text-slate-800">
              Welcome back, {customer.name.split(" ")[0]}!
            </h2>
            {customer.retirementVillage && (
              <span className={`mt-3 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-base font-medium ${getVillageColor(customer.retirementVillage).bg} ${getVillageColor(customer.retirementVillage).text} ${getVillageColor(customer.retirementVillage).border}`}>
                <span className={`h-2.5 w-2.5 rounded-full ${getVillageColor(customer.retirementVillage).text.replace('text-', 'bg-')}`} />
                {customer.retirementVillage}
              </span>
            )}
          </div>
        </div>

        {/* Stats grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-violet-100">
                <svg className="h-7 w-7 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-800">{stats.totalAttended}</p>
                <p className="text-base text-slate-600">Classes Attended</p>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-100">
                <svg className="h-7 w-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-800">{stats.totalUpcoming}</p>
                <p className="text-base text-slate-600">Upcoming</p>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber-100">
                <svg className="h-7 w-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                </svg>
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-800">{stats.streak}</p>
                <p className="text-base text-slate-600">Week Streak 🔥</p>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-rose-100">
                <svg className="h-7 w-7 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-800">
                  {stats.rank ? `#${stats.rank}` : "—"}
                </p>
                <p className="text-base text-slate-600">Leaderboard</p>
              </div>
            </div>
          </div>
        </div>

        {/* Favorite class */}
        {stats.favoriteClass && (
          <div className="mb-8 glass-card rounded-2xl p-5">
            <p className="text-base text-slate-600">
              Your favorite class: <span className="font-semibold text-violet-600">{stats.favoriteClass}</span>
            </p>
          </div>
        )}

        {/* Upcoming bookings */}
        <section className="mb-8">
          <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-slate-800">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Upcoming Classes ({upcomingBookings.length})
          </h3>
          {upcomingBookings.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center">
              <p className="text-lg text-slate-600">No upcoming bookings</p>
              <a
                href="/"
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-6 py-3 text-base font-medium text-violet-700 hover:bg-violet-100 transition"
              >
                Browse classes to book
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {upcomingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="glass-card flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${getVillageColor(booking.classLocation).bg}`}>
                      <svg className={`h-7 w-7 ${getVillageColor(booking.classLocation).text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-slate-800">{booking.classTitle}</h4>
                      {booking.classLocation && (
                        <p className={`text-sm font-medium ${getVillageColor(booking.classLocation).text}`}>
                          {booking.classLocation}
                        </p>
                      )}
                      <p className="text-base text-slate-600" suppressHydrationWarning>
                        {formatDateTime(booking.classStartTime)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => openCancelModal(booking)}
                    disabled={cancellingId === booking.id}
                    className="rounded-full border-2 border-red-200 bg-red-50 px-6 py-3 text-base font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-100 disabled:opacity-50"
                  >
                    {cancellingId === booking.id ? "..." : "Cancel"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Past bookings */}
        <section>
          <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-slate-800">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
            Recent Attendance
          </h3>
          {pastBookings.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center">
              <p className="text-lg text-slate-600">No past classes yet</p>
            </div>
          ) : (
            <div className="glass-card rounded-2xl divide-y divide-slate-200">
              {pastBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-5"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-lg font-medium text-slate-800">{booking.classTitle}</p>
                      {booking.classLocation && (
                        <p className={`text-sm ${getVillageColor(booking.classLocation).text}`}>
                          {booking.classLocation}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-base text-slate-500" suppressHydrationWarning>
                    {formatDate(booking.classStartTime)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
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
    </div>
  );
}
