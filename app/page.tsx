"use client";

import { useEffect, useState } from "react";
import { fetchClasses, type ClassSummary } from "@/lib/api";

type ScheduleStatus =
  | { state: "loading" }
  | { state: "ready" }
  | { state: "error"; message: string };

type LeaderboardEntry = {
  customerName: string;
  retirementVillage: string;
  sessionsAttended: number;
};

type CustomerSession = {
  id: string;
  name: string;
  email: string;
  retirementVillage?: string;
} | null;

function formatDateRange(startTime: string, endTime: string): string {
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf())) {
    return "Time TBD";
  }

  const day = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(start);
  const startTimeText = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(start);
  const endTimeText = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(end);
  return `${day} · ${startTimeText} - ${endTimeText}`;
}

function formatDuration(startTime: string, endTime: string): string {
  const start = new Date(startTime).valueOf();
  const end = new Date(endTime).valueOf();
  if (Number.isNaN(start) || Number.isNaN(end)) {
    return "";
  }
  const minutes = Math.max(Math.round((end - start) / 60000), 0);
  return `${minutes} min`;
}

const villageColors: Record<string, { bg: string; text: string; border: string }> = {
  "Sunrise Village": { bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/30" },
  "Oakwood Gardens": { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30" },
  "Meadow Creek": { bg: "bg-sky-500/20", text: "text-sky-400", border: "border-sky-500/30" },
  "Lakeside Manor": { bg: "bg-violet-500/20", text: "text-violet-400", border: "border-violet-500/30" },
  "Hillcrest Retirement": { bg: "bg-rose-500/20", text: "text-rose-400", border: "border-rose-500/30" },
};

function getVillageColor(village: string) {
  return villageColors[village] || { bg: "bg-slate-500/20", text: "text-slate-400", border: "border-slate-500/30" };
}

export default function Home() {
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [status, setStatus] = useState<ScheduleStatus>({ state: "loading" });
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [customer, setCustomer] = useState<CustomerSession>(null);

  useEffect(() => {
    const now = new Date();
    const to = new Date();
    to.setDate(now.getDate() + 7);

    const fromParam = now.toISOString().split("T")[0] ?? "";
    const toParam = to.toISOString().split("T")[0] ?? "";

    fetchClasses(fromParam, toParam)
      .then((data) => {
        setClasses(data.filter((item) => item.status === "scheduled"));
        setStatus({ state: "ready" });
      })
      .catch(() => {
        setStatus({
          state: "error",
          message: "Unable to load the schedule right now.",
        });
      });

    // Fetch leaderboard
    fetch("/api/leaderboard")
      .then((res) => res.json())
      .then((data) => setLeaderboard(data.leaderboard || []))
      .catch(() => {});

    // Fetch customer session
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setCustomer(data.customer);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setCustomer(null);
  };

  return (
    <div className="min-h-screen bg-grid">
      {/* Gradient orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-purple-500/20 blur-[100px]" />
        <div className="absolute -right-40 top-1/3 h-80 w-80 rounded-full bg-fuchsia-500/15 blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 h-60 w-60 rounded-full bg-violet-500/10 blur-[80px]" />
      </div>

      <header className="relative border-b border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-purple-400">
              Daphstar Fitness
            </p>
            <h1 className="mt-1 text-2xl font-bold text-white">Class Schedule</h1>
          </div>
          <nav className="flex items-center gap-3">
            <a
              href="/calendar"
              className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-300 backdrop-blur-sm transition hover:border-purple-500/50 hover:bg-white/10 hover:text-white"
            >
              Calendar
            </a>
            <a
              href="/my-bookings"
              className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-300 backdrop-blur-sm transition hover:border-purple-500/50 hover:bg-white/10 hover:text-white"
            >
              My Bookings
            </a>
            {customer ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-300">
                  Hi, <span className="font-medium text-purple-400">{customer.name.split(" ")[0]}</span>
                </span>
                <a
                  href="/dashboard"
                  className="rounded-full border border-purple-500/30 bg-purple-500/10 px-5 py-2.5 text-sm font-medium text-purple-300 backdrop-blur-sm transition hover:border-purple-500 hover:bg-purple-500/20 hover:text-white"
                >
                  Dashboard
                </a>
                <button
                  onClick={handleLogout}
                  className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-300 backdrop-blur-sm transition hover:border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-300"
                >
                  Logout
                </button>
              </div>
            ) : (
              <a
                href="/login"
                className="btn-glow rounded-full px-5 py-2.5 text-sm font-semibold text-white"
              >
                Login
              </a>
            )}
          </nav>
        </div>
      </header>

      <main className="relative mx-auto max-w-5xl px-6 py-10">
        {/* Hero section */}
        <div className="mb-10 text-center">
          <h2 className="gradient-text text-3xl font-bold sm:text-4xl">
            Book Your Next Class
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-400">
            Reserve your spot in seconds. Cancellations allowed up to 6 hours before class.
          </p>
        </div>

        {/* Classes grid */}
        <section className="glass-card mb-8 rounded-3xl p-6 sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Upcoming Classes</h3>
            <span className="rounded-full bg-purple-500/20 px-3 py-1 text-xs font-medium text-purple-300">
              Next 7 days
            </span>
          </div>

          <div className="grid gap-4">
            {status.state === "loading" ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
              </div>
            ) : null}

            {status.state === "error" ? (
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                {status.message}
              </div>
            ) : null}

            {status.state === "ready" && classes.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                No classes scheduled for the next 7 days.
              </div>
            ) : null}

            {status.state === "ready"
              ? classes.map((item) => {
                  const isFull = item.spotsLeft === 0;
                  const query = new URLSearchParams({
                    classId: item.id,
                    title: item.title,
                    startTime: item.startTime,
                    endTime: item.endTime,
                    spotsLeft: String(item.spotsLeft),
                  }).toString();
                  const spotsPercent = Math.round(
                    ((item.spotsLeft) / (item.spotsLeft + 1)) * 100
                  );
                  return (
                    <div
                      key={item.id}
                      className="group flex flex-col gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-5 transition hover:border-purple-500/30 hover:bg-white/[0.04] sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20">
                            <svg className="h-5 w-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-semibold text-white group-hover:text-purple-300 transition">
                              {item.title}
                            </h4>
                            {item.location && (
                              <span className={`mt-1 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${getVillageColor(item.location).bg} ${getVillageColor(item.location).text} ${getVillageColor(item.location).border}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${getVillageColor(item.location).text.replace('text-', 'bg-')}`} />
                                {item.location}
                              </span>
                            )}
                            <p className="text-sm text-slate-400" suppressHydrationWarning>
                              {formatDateRange(item.startTime, item.endTime)}
                              {formatDuration(item.startTime, item.endTime)
                                ? ` · ${formatDuration(item.startTime, item.endTime)}`
                                : ""}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className={`text-sm font-medium ${isFull ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {isFull ? 'Full' : `${item.spotsLeft} spots left`}
                          </p>
                          {!isFull && (
                            <div className="mt-1 h-1.5 w-20 overflow-hidden rounded-full bg-white/10">
                              <div 
                                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                                style={{ width: `${Math.min(spotsPercent, 100)}%` }}
                              />
                            </div>
                          )}
                        </div>
                        <a
                          href={isFull ? "#" : `/booking?${query}`}
                          className={`btn-glow rounded-full px-6 py-2.5 text-sm font-semibold text-white transition ${
                            isFull ? "!bg-slate-700 !shadow-none cursor-not-allowed opacity-50" : ""
                          }`}
                          aria-disabled={isFull}
                          onClick={(event) => {
                            if (isFull) event.preventDefault();
                          }}
                        >
                          {isFull ? "Full" : "Book"}
                        </a>
                      </div>
                    </div>
                  );
                })
              : null}
          </div>
        </section>

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <section className="glass-card mb-8 rounded-3xl p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                <svg className="h-5 w-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Attendance Leaderboard</h3>
                <p className="text-sm text-slate-400">Top members by sessions attended</p>
              </div>
            </div>

            <div className="space-y-3">
              {leaderboard.map((entry, index) => {
                const medalColors = [
                  "from-amber-400 to-yellow-500", // Gold
                  "from-slate-300 to-slate-400",  // Silver
                  "from-amber-600 to-orange-700", // Bronze
                ];
                const isTop3 = index < 3;
                
                return (
                  <div
                    key={entry.customerName}
                    className={`flex items-center gap-4 rounded-2xl p-4 transition ${
                      isTop3 
                        ? "bg-gradient-to-r from-white/10 to-transparent border border-white/10" 
                        : "bg-white/5"
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${
                        isTop3
                          ? `bg-gradient-to-br ${medalColors[index]} text-black`
                          : "bg-slate-700 text-slate-300"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">{entry.customerName}</p>
                      <span className={`mt-1 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${getVillageColor(entry.retirementVillage).bg} ${getVillageColor(entry.retirementVillage).text} ${getVillageColor(entry.retirementVillage).border}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${getVillageColor(entry.retirementVillage).text.replace('text-', 'bg-')}`} />
                        {entry.retirementVillage}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-purple-400">{entry.sessionsAttended}</p>
                      <p className="text-xs text-slate-500">sessions</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Info cards */}
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="glass-card rounded-2xl p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20">
              <svg className="h-5 w-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-white">Booking Policies</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-purple-500" />
                Cancel up to 6 hours before class start
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-purple-500" />
                No-shows may be subject to a fee
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-purple-500" />
                Capacity capped for safety & quality
              </li>
            </ul>
          </div>
          <div className="glass-card rounded-2xl p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20">
              <svg className="h-5 w-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-white">Need Help?</h3>
            <p className="mt-3 text-sm text-slate-400">
              Email confirmations include a direct cancellation link. For any changes or questions, contact the studio directly.
            </p>
            <a href="/cancel" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-purple-400 hover:text-purple-300 transition">
              Cancel a booking
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
