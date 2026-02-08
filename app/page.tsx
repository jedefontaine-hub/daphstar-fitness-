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

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.valueOf())) return "TBD";
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatDuration(startTime: string, endTime: string): string {
  const start = new Date(startTime).valueOf();
  const end = new Date(endTime).valueOf();
  if (Number.isNaN(start) || Number.isNaN(end)) return "";
  const minutes = Math.max(Math.round((end - start) / 60000), 0);
  return `${minutes} min`;
}

function formatDateHeader(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const dateOnly = date.toDateString();
  const todayOnly = today.toDateString();
  const tomorrowOnly = tomorrow.toDateString();
  
  if (dateOnly === todayOnly) {
    return `Today ${new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short" }).format(date)}`;
  }
  if (dateOnly === tomorrowOnly) {
    return `Tomorrow ${new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short" }).format(date)}`;
  }
  return new Intl.DateTimeFormat("en-US", { weekday: "long", day: "numeric", month: "short" }).format(date);
}

function groupClassesByDate(classes: ClassSummary[]): Map<string, ClassSummary[]> {
  const grouped = new Map<string, ClassSummary[]>();
  for (const cls of classes) {
    const dateKey = new Date(cls.startTime).toDateString();
    const existing = grouped.get(dateKey) || [];
    existing.push(cls);
    grouped.set(dateKey, existing);
  }
  return grouped;
}

const villageColors: Record<string, { bg: string; text: string }> = {
  "Sunrise Village": { bg: "bg-amber-50", text: "text-amber-700" },
  "Oakwood Gardens": { bg: "bg-emerald-50", text: "text-emerald-700" },
  "Meadow Creek": { bg: "bg-sky-50", text: "text-sky-700" },
  "Lakeside Manor": { bg: "bg-violet-50", text: "text-violet-700" },
  "Hillcrest Retirement": { bg: "bg-rose-50", text: "text-rose-700" },
};

function getVillageColor(village: string) {
  return villageColors[village] || { bg: "bg-gray-50", text: "text-gray-600" };
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
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Daphstar Fitness</h1>
            <p className="text-sm text-gray-500">Class Schedule</p>
          </div>
          <nav className="flex items-center gap-2">
            <a
              href="/calendar"
              className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Calendar
            </a>
            <a
              href="/my-bookings"
              className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 whitespace-nowrap"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              Bookings
            </a>
            {customer ? (
              <div className="flex items-center gap-2">
                <a
                  href="/dashboard"
                  className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Dashboard
                </a>
                <a
                  href="/profile"
                  className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 whitespace-nowrap"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profile
                </a>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            ) : (
              <a
                href="/login"
                className="flex items-center gap-1.5 rounded-lg bg-blue-500 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-600"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Login
              </a>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        {/* Classes list grouped by date */}
        <div className="space-y-2">
          {status.state === "loading" && (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-500 border-t-transparent" />
            </div>
          )}

          {status.state === "error" && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {status.message}
            </div>
          )}

          {status.state === "ready" && classes.length === 0 && (
            <div className="py-12 text-center text-gray-500">
              No classes scheduled for the next 7 days.
            </div>
          )}

          {status.state === "ready" && classes.length > 0 && (
            <>
              {Array.from(groupClassesByDate(classes)).map(([dateKey, dayClasses]) => (
                <div key={dateKey}>
                  {/* Date header */}
                  <div className="date-header" suppressHydrationWarning>
                    {formatDateHeader(dayClasses[0].startTime)}
                  </div>
                  
                  {/* Classes for this date */}
                  <div className="space-y-1">
                    {dayClasses.length === 0 ? (
                      <p className="py-4 text-sm text-gray-500">There are no matching classes that day.</p>
                    ) : (
                      dayClasses.map((item) => {
                        const isFull = item.spotsLeft === 0;
                        const query = new URLSearchParams({
                          classId: item.id,
                          title: item.title,
                          startTime: item.startTime,
                          endTime: item.endTime,
                          spotsLeft: String(item.spotsLeft),
                        }).toString();
                        
                        return (
                          <div
                            key={item.id}
                            className="flex items-center gap-4 rounded-lg bg-white p-4 shadow-sm"
                          >
                            {/* Time column */}
                            <div className="w-16 flex-shrink-0 text-center">
                              <p className="text-lg font-bold text-blue-500" suppressHydrationWarning>
                                {formatTime(item.startTime)}
                              </p>
                              <p className="text-xs text-gray-400">
                                {formatDuration(item.startTime, item.endTime)}
                              </p>
                            </div>
                            
                            {/* Class info */}
                            <div className="min-w-0 flex-1">
                              <h4 className="truncate text-base font-semibold text-gray-900">
                                {item.title}
                              </h4>
                              <p className="flex items-center gap-1 text-sm text-gray-500">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Instructor TBA
                              </p>
                              {item.location && (
                                <p className="flex items-center gap-1 text-sm text-gray-500">
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  {item.location}
                                </p>
                              )}
                            </div>
                            
                            {/* Action button */}
                            <a
                              href={isFull ? "#" : `/booking?${query}`}
                              className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                                isFull 
                                  ? "bg-gray-200 text-gray-400 cursor-not-allowed" 
                                  : "bg-white border border-gray-200 text-blue-600 hover:bg-blue-50 shadow-sm"
                              }`}
                              aria-disabled={isFull}
                              onClick={(e) => isFull && e.preventDefault()}
                              title={isFull ? "Class is full" : "Book this class"}
                            >
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {isFull ? "Full" : "Book Now"}
                            </a>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <section className="mt-6 rounded-lg bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <svg className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Attendance Leaderboard</h3>
                <p className="text-sm text-gray-500">Top members by sessions</p>
              </div>
            </div>

            <div className="space-y-2">
              {leaderboard.map((entry, index) => {
                const medalColors = [
                  "bg-amber-400", // Gold
                  "bg-gray-300",  // Silver
                  "bg-amber-600", // Bronze
                ];
                const isTop3 = index < 3;
                
                return (
                  <div
                    key={entry.customerName}
                    className="flex items-center gap-3 rounded-lg bg-gray-50 p-3"
                  >
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                        isTop3
                          ? `${medalColors[index]} text-white`
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">{entry.customerName}</p>
                      <p className="text-xs text-gray-500">{entry.retirementVillage}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-500">{entry.sessionsAttended}</p>
                      <p className="text-xs text-gray-400">sessions</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Quick links */}
        <section className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900">Booking Policies</h3>
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                Cancel up to 6 hours before class
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                No-shows may be subject to a fee
              </li>
            </ul>
          </div>
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900">Need Help?</h3>
            <p className="mt-2 text-sm text-gray-600">
              Check your email for cancellation links.
            </p>
            <a href="/cancel" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-500 hover:text-blue-600">
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
