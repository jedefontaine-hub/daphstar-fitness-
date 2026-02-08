"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cancelBooking } from "@/lib/api";

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
  "Sunrise Village": { bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/30" },
  "Oakwood Gardens": { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30" },
  "Meadow Creek": { bg: "bg-sky-500/20", text: "text-sky-400", border: "border-sky-500/30" },
  "Lakeside Manor": { bg: "bg-violet-500/20", text: "text-violet-400", border: "border-violet-500/30" },
  "Hillcrest Retirement": { bg: "bg-rose-500/20", text: "text-rose-400", border: "border-rose-500/30" },
};

function getVillageColor(village?: string) {
  if (!village) return { bg: "bg-slate-500/20", text: "text-slate-400", border: "border-slate-500/30" };
  return villageColors[village] || { bg: "bg-slate-500/20", text: "text-slate-400", border: "border-slate-500/30" };
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
  const [status, setStatus] = useState<LoadStatus>({ state: "loading" });
  const [cancellingId, setCancellingId] = useState<string | null>(null);

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

  const handleCancel = async (booking: DashboardBooking) => {
    if (!confirm(`Cancel your booking for ${booking.classTitle}?`)) return;

    setCancellingId(booking.id);
    try {
      await cancelBooking(booking.cancelToken);
      // Refresh dashboard
      const res = await fetch("/api/dashboard");
      if (res.ok) {
        const data = await res.json();
        setStatus({ state: "ready", data });
      }
    } catch {
      alert("Failed to cancel booking. Please try again.");
    } finally {
      setCancellingId(null);
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
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/20">
            <svg className="h-7 w-7 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">Sign In Required</h2>
          <p className="mt-2 text-slate-400">Please log in to view your dashboard.</p>
          <a
            href="/login"
            className="btn-glow mt-6 inline-block rounded-full px-8 py-3 text-sm font-semibold text-white"
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
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  if (status.state === "error") {
    return (
      <div className="min-h-screen bg-grid flex items-center justify-center px-6">
        <div className="glass-card rounded-3xl p-8 max-w-md text-center">
          <p className="text-rose-400">{status.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-purple-400 hover:text-purple-300"
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
      {/* Gradient orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-purple-500/20 blur-[100px]" />
        <div className="absolute -right-40 top-1/3 h-80 w-80 rounded-full bg-fuchsia-500/15 blur-[100px]" />
      </div>

      <header className="relative border-b border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
          <div>
            <a href="/" className="text-xs font-medium uppercase tracking-[0.3em] text-purple-400 hover:text-purple-300 transition">
              Daphstar Fitness
            </a>
            <h1 className="mt-1 text-2xl font-bold text-white">My Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-300 backdrop-blur-sm transition hover:border-purple-500/50 hover:bg-white/10 hover:text-white"
            >
              Browse Classes
            </a>
            <button
              onClick={handleLogout}
              className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-300 backdrop-blur-sm transition hover:border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-300"
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
            <h2 className="gradient-text text-3xl font-bold">
              Welcome back, {customer.name.split(" ")[0]}!
            </h2>
            {customer.retirementVillage && (
              <span className={`mt-2 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium ${getVillageColor(customer.retirementVillage).bg} ${getVillageColor(customer.retirementVillage).text} ${getVillageColor(customer.retirementVillage).border}`}>
                <span className={`h-2 w-2 rounded-full ${getVillageColor(customer.retirementVillage).text.replace('text-', 'bg-')}`} />
                {customer.retirementVillage}
              </span>
            )}
          </div>
        </div>

        {/* Stats grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20">
                <svg className="h-6 w-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{stats.totalAttended}</p>
                <p className="text-sm text-slate-400">Classes Attended</p>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
                <svg className="h-6 w-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{stats.totalUpcoming}</p>
                <p className="text-sm text-slate-400">Upcoming</p>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                <svg className="h-6 w-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                </svg>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{stats.streak}</p>
                <p className="text-sm text-slate-400">Week Streak 🔥</p>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/20">
                <svg className="h-6 w-6 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">
                  {stats.rank ? `#${stats.rank}` : "—"}
                </p>
                <p className="text-sm text-slate-400">Leaderboard</p>
              </div>
            </div>
          </div>
        </div>

        {/* Favorite class */}
        {stats.favoriteClass && (
          <div className="mb-8 glass-card rounded-2xl p-5">
            <p className="text-sm text-slate-400">
              Your favorite class: <span className="font-semibold text-purple-400">{stats.favoriteClass}</span>
            </p>
          </div>
        )}

        {/* Upcoming bookings */}
        <section className="mb-8">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Upcoming Classes ({upcomingBookings.length})
          </h3>
          {upcomingBookings.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center">
              <p className="text-slate-400">No upcoming bookings</p>
              <a
                href="/"
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-purple-400 hover:text-purple-300 transition"
              >
                Browse classes to book
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
                  className="glass-card flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${getVillageColor(booking.classLocation).bg}`}>
                      <svg className={`h-6 w-6 ${getVillageColor(booking.classLocation).text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{booking.classTitle}</h4>
                      {booking.classLocation && (
                        <p className={`text-xs font-medium ${getVillageColor(booking.classLocation).text}`}>
                          {booking.classLocation}
                        </p>
                      )}
                      <p className="text-sm text-slate-400" suppressHydrationWarning>
                        {formatDateTime(booking.classStartTime)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCancel(booking)}
                    disabled={cancellingId === booking.id}
                    className="rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-300 transition hover:border-rose-500 hover:bg-rose-500/20 disabled:opacity-50"
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
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <span className="h-2 w-2 rounded-full bg-slate-500" />
            Recent Attendance
          </h3>
          {pastBookings.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center">
              <p className="text-slate-400">No past classes yet</p>
            </div>
          ) : (
            <div className="glass-card rounded-2xl divide-y divide-white/5">
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
                        <p className={`text-xs ${getVillageColor(booking.classLocation).text}`}>
                          {booking.classLocation}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-slate-500" suppressHydrationWarning>
                    {formatDate(booking.classStartTime)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
