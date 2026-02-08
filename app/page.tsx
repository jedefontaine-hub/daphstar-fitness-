"use client";

import { useEffect, useState } from "react";
import { fetchClasses, type ClassSummary } from "@/lib/api";
import { useSession } from "@/lib/session-context";
import { SkeletonSchedule } from "@/components/ui/Skeleton";
import { NoClassesFound, ErrorState } from "@/components/ui/EmptyState";
import { formatTime, formatDuration, formatDateHeader, getDateKey } from "@/lib/utils/date";
import { getVillageColor, getInitials, LOCATIONS } from "@/lib/constants";
import { BottomNav } from "@/components/BottomNav";
import Link from "next/link";

type ScheduleStatus =
  | { state: "loading" }
  | { state: "ready" }
  | { state: "error"; message: string };

type LeaderboardEntry = {
  customerName: string;
  retirementVillage: string;
  sessionsAttended: number;
};

function groupClassesByDate(classes: ClassSummary[]): Map<string, ClassSummary[]> {
  const grouped = new Map<string, ClassSummary[]>();
  for (const cls of classes) {
    const key = getDateKey(cls.startTime);
    const existing = grouped.get(key) || [];
    existing.push(cls);
    grouped.set(key, existing);
  }
  return grouped;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export default function Home() {
  const { customer } = useSession();
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [status, setStatus] = useState<ScheduleStatus>({ state: "loading" });
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<string>("all");

  const loadData = () => {
    const now = new Date();
    const to = new Date();
    to.setDate(now.getDate() + 7);

    const fromParam = now.toISOString().split("T")[0] ?? "";
    const toParam = to.toISOString().split("T")[0] ?? "";

    setStatus({ state: "loading" });
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

    setLeaderboardLoading(true);
    fetch("/api/leaderboard")
      .then((res) => res.json())
      .then((data) => setLeaderboard(data.leaderboard || []))
      .catch(() => {})
      .finally(() => setLeaderboardLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredClasses = selectedLocation === "all" 
    ? classes 
    : classes.filter(c => c.location === selectedLocation);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-teal-900 pb-20">
      {/* Hero Section with Gradient Overlay */}
      <div className="relative">
        {/* Background gradient decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-teal-500/20 blur-3xl" />
          <div className="absolute top-20 -left-20 h-60 w-60 rounded-full bg-cyan-500/10 blur-3xl" />
        </div>

        {/* Header */}
        <header className="relative px-4 pt-4 pb-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-teal-400">Daphstar Fitness</p>
            </div>
            {customer ? (
              <Link href="/profile" className="flex items-center gap-2 rounded-full bg-teal-500/20 border border-teal-400/50 px-3 py-1.5 backdrop-blur-sm hover:bg-teal-500/30 transition">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-sm font-bold text-slate-900 shadow-lg shadow-teal-500/30">
                  {getInitials(customer.name)}
                </div>
                <span className="text-sm font-medium text-teal-300 hidden sm:inline">{customer.name.split(' ')[0]}</span>
              </Link>
            ) : (
              <Link href="/login" className="rounded-full bg-teal-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-teal-500/30 hover:bg-teal-400 transition">
                Sign In
              </Link>
            )}
          </div>
        </header>

        {/* Greeting & Hero */}
        <div className="relative px-4 py-6">
          <h1 className="text-2xl font-bold text-white" suppressHydrationWarning>
            {getGreeting()}{customer ? `, ${customer.name.split(' ')[0]}` : ''}
          </h1>
          <p className="mt-1 text-white/70">Find your next fitness class</p>

          {/* Hero cards */}
          <div className="mt-6 flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            <Link href="/calendar" className="relative flex-shrink-0 w-40 h-28 rounded-2xl overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500 to-cyan-600" />
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDIwIDAgTCAwIDAgMCAyMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
              <div className="relative h-full flex flex-col justify-end p-3">
                <svg className="h-6 w-6 text-white/80 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-white font-semibold text-sm">Full Calendar</p>
                <p className="text-white/70 text-xs">View all classes</p>
              </div>
            </Link>
            
            <Link href="/my-bookings" className="relative flex-shrink-0 w-40 h-28 rounded-2xl overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-purple-600" />
              <div className="relative h-full flex flex-col justify-end p-3">
                <svg className="h-6 w-6 text-white/80 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                <p className="text-white font-semibold text-sm">My Bookings</p>
                <p className="text-white/70 text-xs">Manage your classes</p>
              </div>
            </Link>

            {customer && (
              <Link href="/dashboard" className="relative flex-shrink-0 w-40 h-28 rounded-2xl overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600" />
                <div className="relative h-full flex flex-col justify-end p-3">
                  <svg className="h-6 w-6 text-white/80 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className="text-white font-semibold text-sm">My Stats</p>
                  <p className="text-white/70 text-xs">Track progress</p>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative px-4 -mt-2">
        {/* Location Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
          <button
            onClick={() => setSelectedLocation("all")}
            className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
              selectedLocation === "all"
                ? "bg-teal-500 text-white"
                : "bg-white/10 text-white/80 hover:bg-white/20"
            }`}
          >
            All Locations
          </button>
          {LOCATIONS.slice(0, 4).map((loc) => (
            <button
              key={loc}
              onClick={() => setSelectedLocation(loc)}
              className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                selectedLocation === loc
                  ? "bg-teal-500 text-white"
                  : "bg-white/10 text-white/80 hover:bg-white/20"
              }`}
            >
              {loc.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Upcoming Classes */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white">Upcoming Classes</h2>
            <Link href="/calendar" className="text-sm text-teal-400 hover:text-teal-300">
              See all
            </Link>
          </div>

          {status.state === "loading" && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
          )}

          {status.state === "error" && (
            <div className="rounded-2xl bg-white/10 p-6 text-center">
              <p className="text-white/70">Unable to load classes</p>
              <button onClick={loadData} className="mt-2 text-teal-400 text-sm">Try again</button>
            </div>
          )}

          {status.state === "ready" && filteredClasses.length === 0 && (
            <div className="rounded-2xl bg-white/10 p-6 text-center">
              <p className="text-white/70">No classes available</p>
            </div>
          )}

          {status.state === "ready" && filteredClasses.length > 0 && (
            <div className="space-y-3">
              {Array.from(groupClassesByDate(filteredClasses)).slice(0, 3).map(([dateKey, dayClasses]) => (
                <div key={dateKey}>
                  <p className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2" suppressHydrationWarning>
                    {formatDateHeader(dayClasses[0].startTime)}
                  </p>
                  <div className="space-y-2">
                    {dayClasses.slice(0, 2).map((item) => {
                      const isFull = item.spotsLeft === 0;
                      const query = new URLSearchParams({
                        classId: item.id,
                        title: item.title,
                        startTime: item.startTime,
                        endTime: item.endTime,
                        spotsLeft: String(item.spotsLeft),
                      }).toString();
                      const colors = getVillageColor(item.location);

                      return (
                        <Link
                          key={item.id}
                          href={isFull ? "#" : `/booking?${query}`}
                          className={`block rounded-2xl bg-white/10 backdrop-blur-sm p-4 transition hover:bg-white/15 ${isFull ? 'opacity-60' : ''}`}
                          onClick={(e) => isFull && e.preventDefault()}
                        >
                          <div className="flex items-center gap-4">
                            {/* Time badge */}
                            <div className="flex-shrink-0 text-center">
                              <p className="text-lg font-bold text-teal-400" suppressHydrationWarning>
                                {formatTime(item.startTime)}
                              </p>
                              <p className="text-xs text-white/50">{formatDuration(item.startTime, item.endTime)}</p>
                            </div>

                            {/* Color bar */}
                            <div className={`w-1 h-12 rounded-full ${colors.bg.replace('/60', '')}`} />

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-white truncate">{item.title}</p>
                              <p className="text-sm text-white/60">{item.location}</p>
                            </div>

                            {/* Spots */}
                            <div className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                              isFull 
                                ? 'bg-white/10 text-white/50' 
                                : 'bg-teal-500/20 text-teal-300'
                            }`}>
                              {isFull ? 'Full' : `${item.spotsLeft} left`}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Leaderboard */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white">Top Members</h2>
          </div>
          
          {leaderboardLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : leaderboard.length > 0 ? (
            <div className="space-y-2">
              {leaderboard.slice(0, 5).map((entry, index) => {
                const isFirst = index === 0;
                const villageColor = getVillageColor(entry.retirementVillage);
                const initials = getInitials(entry.customerName);

                return (
                  <div
                    key={entry.customerName}
                    className="flex items-center gap-3 rounded-xl bg-white/10 backdrop-blur-sm p-3"
                  >
                    {/* Rank */}
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                      isFirst 
                        ? 'bg-amber-500 text-white' 
                        : index < 3 
                          ? 'bg-white/20 text-white' 
                          : 'bg-white/10 text-white/60'
                    }`}>
                      {isFirst && (
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm2 2h10v2H7v-2z"/>
                        </svg>
                      )}
                      {!isFirst && (index + 1)}
                    </div>

                    {/* Avatar */}
                    <div className={`h-10 w-10 rounded-full ${villageColor.bg} flex items-center justify-center text-sm font-bold ${villageColor.text}`}>
                      {initials}
                    </div>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{entry.customerName}</p>
                      <p className="text-xs text-white/50">{entry.retirementVillage}</p>
                    </div>

                    {/* Sessions */}
                    <div className="text-right">
                      <p className={`text-lg font-bold ${isFirst ? 'text-amber-400' : 'text-teal-400'}`}>
                        {entry.sessionsAttended}
                      </p>
                      <p className="text-xs text-white/50">sessions</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl bg-white/10 p-4 text-center">
              <p className="text-white/50 text-sm">No leaderboard data yet</p>
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
