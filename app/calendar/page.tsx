"use client";

import { useEffect, useState } from "react";
import { fetchClasses, type ClassSummary } from "@/lib/api";

type ViewMode = "week" | "month";

function getWeekDates(baseDate: Date): Date[] {
  const dates: Date[] = [];
  const startOfWeek = new Date(baseDate);
  const day = startOfWeek.getDay();
  startOfWeek.setDate(startOfWeek.getDate() - day); // Start from Sunday

  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function getMonthDates(baseDate: Date): Date[] {
  const dates: Date[] = [];
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();

  // Start from the first day of the month
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay(); // Days to show from previous month

  // Start from the Sunday before (or on) the first day
  const start = new Date(firstDay);
  start.setDate(start.getDate() - startOffset);

  // Generate 42 days (6 weeks) to cover any month layout
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function formatDateKey(date: Date): string {
  return date.toISOString().split("T")[0] ?? "";
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const villageColors: Record<string, { bg: string; text: string; border: string; hover: string }> = {
  "Sunrise Village": { bg: "bg-amber-500/20", text: "text-amber-300", border: "border-amber-500/30", hover: "hover:bg-amber-500/30" },
  "Oakwood Gardens": { bg: "bg-emerald-500/20", text: "text-emerald-300", border: "border-emerald-500/30", hover: "hover:bg-emerald-500/30" },
  "Meadow Creek": { bg: "bg-sky-500/20", text: "text-sky-300", border: "border-sky-500/30", hover: "hover:bg-sky-500/30" },
  "Lakeside Manor": { bg: "bg-violet-500/20", text: "text-violet-300", border: "border-violet-500/30", hover: "hover:bg-violet-500/30" },
  "Hillcrest Retirement": { bg: "bg-rose-500/20", text: "text-rose-300", border: "border-rose-500/30", hover: "hover:bg-rose-500/30" },
};

function getVillageColor(village?: string) {
  if (!village) return { bg: "bg-purple-500/20", text: "text-purple-300", border: "border-purple-500/30", hover: "hover:bg-purple-500/30" };
  return villageColors[village] || { bg: "bg-purple-500/20", text: "text-purple-300", border: "border-purple-500/30", hover: "hover:bg-purple-500/30" };
}

export default function CalendarPage() {
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [isLoading, setIsLoading] = useState(true);

  const today = new Date();
  const weekDates = getWeekDates(currentDate);
  const monthDates = getMonthDates(currentDate);

  useEffect(() => {
    setIsLoading(true);
    // Fetch classes for a wider range to cover navigation
    const from = new Date(currentDate);
    from.setDate(from.getDate() - 35);
    const to = new Date(currentDate);
    to.setDate(to.getDate() + 35);

    fetchClasses(formatDateKey(from), formatDateKey(to))
      .then((data) => {
        setClasses(data.filter((c) => c.status === "scheduled"));
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [currentDate]);

  const navigatePrev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "week") {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => setCurrentDate(new Date());

  const getClassesForDate = (date: Date): ClassSummary[] => {
    return classes.filter((c) => {
      const classDate = new Date(c.startTime);
      return isSameDay(classDate, date);
    });
  };

  const monthName = currentDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const weekRange =
    viewMode === "week"
      ? `${weekDates[0]?.toLocaleDateString("default", { month: "short", day: "numeric" })} - ${weekDates[6]?.toLocaleDateString("default", { month: "short", day: "numeric", year: "numeric" })}`
      : monthName;

  return (
    <div className="min-h-screen bg-grid">
      {/* Gradient orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-purple-500/20 blur-[100px]" />
        <div className="absolute -right-40 top-1/3 h-80 w-80 rounded-full bg-fuchsia-500/15 blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 h-60 w-60 rounded-full bg-violet-500/10 blur-[80px]" />
      </div>

      <header className="relative border-b border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <div>
            <a href="/" className="text-xs font-medium uppercase tracking-[0.3em] text-purple-400 hover:text-purple-300 transition">
              Daphstar Fitness
            </a>
            <h1 className="mt-1 text-2xl font-bold text-white">Class Calendar</h1>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/my-bookings"
              className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-300 backdrop-blur-sm transition hover:border-purple-500/50 hover:bg-white/10 hover:text-white"
            >
              My Bookings
            </a>
            <a
              href="/admin/login"
              className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-300 backdrop-blur-sm transition hover:border-purple-500/50 hover:bg-white/10 hover:text-white"
            >
              Admin
            </a>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-6 py-8">
        {/* Calendar controls */}
        <div className="glass-card mb-6 flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={navigatePrev}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToToday}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              Today
            </button>
            <button
              onClick={navigateNext}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <span className="ml-2 text-lg font-semibold text-white" suppressHydrationWarning>
              {weekRange}
            </span>
          </div>
          <div className="flex rounded-xl border border-white/10 bg-white/5 p-1">
            <button
              onClick={() => setViewMode("week")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                viewMode === "week"
                  ? "bg-purple-500/30 text-purple-300"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode("month")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                viewMode === "month"
                  ? "bg-purple-500/30 text-purple-300"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Month
            </button>
          </div>
        </div>

        {/* Calendar grid */}
        <div className="glass-card overflow-hidden rounded-3xl">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-white/5 bg-white/[0.02]">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="border-r border-white/5 px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400 last:border-r-0"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar body */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
            </div>
          ) : viewMode === "week" ? (
            <div className="grid grid-cols-7">
              {weekDates.map((date, idx) => {
                const dayClasses = getClassesForDate(date);
                const isToday = isSameDay(date, today);
                return (
                  <div
                    key={idx}
                    className={`min-h-[200px] border-r border-white/5 p-2 last:border-r-0 ${
                      isToday ? "bg-purple-500/5" : ""
                    }`}
                  >
                    <div
                      className={`mb-2 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                        isToday
                          ? "bg-purple-500 text-white"
                          : "text-slate-300"
                      }`}
                      suppressHydrationWarning
                    >
                      {date.getDate()}
                    </div>
                    <div className="space-y-1.5">
                      {dayClasses.map((c) => {
                        const isFull = c.spotsLeft === 0;
                        const query = new URLSearchParams({
                          classId: c.id,
                          title: c.title,
                          startTime: c.startTime,
                          endTime: c.endTime,
                          spotsLeft: String(c.spotsLeft),
                        }).toString();
                        return (
                          <a
                            key={c.id}
                            href={isFull ? "#" : `/booking?${query}`}
                            className={`group block rounded-lg p-2 text-xs transition ${
                              isFull
                                ? "cursor-not-allowed bg-slate-500/20 text-slate-500"
                                : `${getVillageColor(c.location).bg} ${getVillageColor(c.location).text} ${getVillageColor(c.location).hover}`
                            }`}
                            onClick={(e) => isFull && e.preventDefault()}
                          >
                            <p className="font-semibold truncate" suppressHydrationWarning>
                              {formatTime(c.startTime)}
                            </p>
                            <p className="truncate">{c.title}</p>
                            {c.location && (
                              <p className="truncate text-[10px] opacity-80">{c.location}</p>
                            )}
                            <p className={`mt-0.5 ${isFull ? "text-rose-400" : "text-emerald-400"}`}>
                              {isFull ? "Full" : `${c.spotsLeft} spots`}
                            </p>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {monthDates.map((date, idx) => {
                const dayClasses = getClassesForDate(date);
                const isToday = isSameDay(date, today);
                const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                return (
                  <div
                    key={idx}
                    className={`min-h-[100px] border-b border-r border-white/5 p-1.5 last:border-r-0 ${
                      isToday ? "bg-purple-500/5" : ""
                    } ${!isCurrentMonth ? "opacity-40" : ""}`}
                  >
                    <div
                      className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                        isToday
                          ? "bg-purple-500 text-white"
                          : "text-slate-400"
                      }`}
                      suppressHydrationWarning
                    >
                      {date.getDate()}
                    </div>
                    <div className="space-y-0.5">
                      {dayClasses.slice(0, 2).map((c) => {
                        const isFull = c.spotsLeft === 0;
                        const query = new URLSearchParams({
                          classId: c.id,
                          title: c.title,
                          startTime: c.startTime,
                          endTime: c.endTime,
                          spotsLeft: String(c.spotsLeft),
                        }).toString();
                        return (
                          <a
                            key={c.id}
                            href={isFull ? "#" : `/booking?${query}`}
                            className={`block truncate rounded px-1.5 py-0.5 text-[10px] transition ${
                              isFull
                                ? "cursor-not-allowed bg-slate-500/20 text-slate-500"
                                : `${getVillageColor(c.location).bg} ${getVillageColor(c.location).text} ${getVillageColor(c.location).hover}`
                            }`}
                            onClick={(e) => isFull && e.preventDefault()}
                            title={c.location || c.title}
                          >
                            {c.title}
                          </a>
                        );
                      })}
                      {dayClasses.length > 2 && (
                        <p className="text-[10px] text-slate-500 px-1">
                          +{dayClasses.length - 2} more
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-amber-500/30" />
            <span>Sunrise Village</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-emerald-500/30" />
            <span>Oakwood Gardens</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-sky-500/30" />
            <span>Meadow Creek</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-violet-500/30" />
            <span>Lakeside Manor</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-rose-500/30" />
            <span>Hillcrest</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-slate-500/30" />
            <span>Full</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-5 w-5 rounded-full bg-purple-500 text-center text-xs font-bold text-white leading-5">7</span>
            <span>Today</span>
          </div>
        </div>
      </main>
    </div>
  );
}
