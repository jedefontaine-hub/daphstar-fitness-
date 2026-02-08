"use client";

import { useEffect, useState } from "react";
import { fetchClasses, type ClassSummary } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { LoadingSection } from "@/components/ui/Spinner";
import { ErrorAlert } from "@/components/ui/Alert";
import { formatTime, formatDuration, formatDateHeader, getDateKey } from "@/lib/utils/date";
import { getVillageColor } from "@/lib/constants";

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
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <PageHeader subtitle="Class Schedule" />

      <main className="mx-auto max-w-3xl px-4 py-6">
        {/* Classes list grouped by date */}
        <div className="space-y-2">
          {status.state === "loading" && <LoadingSection />}

          {status.state === "error" && <ErrorAlert message={status.message} />}

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
