"use client";

import { useEffect, useState } from "react";
import { fetchClasses, type ClassSummary } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { SkeletonSchedule, SkeletonLeaderboard } from "@/components/ui/Skeleton";
import { NoClassesFound, ErrorState } from "@/components/ui/EmptyState";
import { PageTransition, FadeIn } from "@/components/ui/PageTransition";
import { formatTime, formatDuration, formatDateHeader, getDateKey } from "@/lib/utils/date";
import { getVillageColor, getInitials } from "@/lib/constants";

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

export default function Home() {
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [status, setStatus] = useState<ScheduleStatus>({ state: "loading" });
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);

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

    // Fetch leaderboard
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

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <PageHeader subtitle="Class Schedule" />

      <PageTransition>
        <main className="mx-auto max-w-3xl px-4 py-6">
          {/* Classes list grouped by date */}
          <div className="space-y-2">
            {status.state === "loading" && <SkeletonSchedule days={3} classesPerDay={2} />}

            {status.state === "error" && <ErrorState onRetry={loadData} />}

            {status.state === "ready" && classes.length === 0 && <NoClassesFound />}

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
        <FadeIn delay={200}>
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

            {leaderboardLoading ? (
              <SkeletonLeaderboard entries={5} />
            ) : leaderboard.length > 0 ? (
              <div className="space-y-2">
                {leaderboard.map((entry, index) => {
                  const isFirst = index === 0;
                  const isTop3 = index < 3;
                  const maxSessions = leaderboard[0]?.sessionsAttended || 1;
                  const progressPercent = (entry.sessionsAttended / maxSessions) * 100;
                  const villageColor = getVillageColor(entry.retirementVillage);
                  const initials = getInitials(entry.customerName);
                  
                  return (
                  <div
                    key={entry.customerName}
                    className="group relative flex items-center gap-3 rounded-xl bg-gray-50 p-3 transition-all duration-200 hover:bg-white hover:shadow-md hover:scale-[1.01]"
                  >
                    {/* Progress bar background */}
                    <div 
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ width: `${progressPercent}%` }}
                    />
                    
                    {/* Rank badge */}
                    <div className="relative flex items-center justify-center">
                      {isFirst ? (
                        <div className="relative">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-500 text-white font-bold shadow-md">
                            1
                          </div>
                          {/* Crown */}
                          <svg 
                            className="absolute -top-3 left-1/2 -translate-x-1/2 h-5 w-5 text-amber-500 drop-shadow-sm" 
                            fill="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm2 2h10v2H7v-2z"/>
                          </svg>
                        </div>
                      ) : isTop3 ? (
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full font-bold text-white shadow-sm ${
                          index === 1 ? "bg-gradient-to-br from-gray-300 to-gray-400" : "bg-gradient-to-br from-amber-600 to-amber-700"
                        }`}>
                          {index + 1}
                        </div>
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-gray-600 font-semibold">
                          {index + 1}
                        </div>
                      )}
                    </div>
                    
                    {/* Avatar with village color */}
                    <div className={`relative flex h-10 w-10 items-center justify-center rounded-full ${villageColor.bg} ${villageColor.text} font-bold text-sm ring-2 ring-white shadow-sm`}>
                      {initials}
                    </div>

                    {/* Name and village */}
                    <div className="relative min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">{entry.customerName}</p>
                      <p className={`text-xs ${villageColor.text} font-medium`}>{entry.retirementVillage}</p>
                      {/* Mini progress bar */}
                      <div className="mt-1.5 h-1 w-full rounded-full bg-gray-200 overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-500 transition-all duration-500"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Sessions count */}
                    <div className="relative text-right">
                      <p className={`text-xl font-bold ${isFirst ? "text-amber-500" : "text-blue-500"}`}>
                        {entry.sessionsAttended}
                      </p>
                      <p className="text-xs text-gray-400">sessions</p>
                    </div>
                  </div>
                );
              })}
            </div>
            ) : (
              <p className="text-center text-sm text-gray-500 py-4">No leaderboard data yet</p>
            )}
          </section>
        </FadeIn>

        {/* Quick links */}
        <FadeIn delay={300}>
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
        </FadeIn>
        </main>
      </PageTransition>
    </div>
  );
}
