"use client";

import { useEffect, useState } from "react";
import { fetchClasses, type ClassSummary } from "@/lib/api";
import { formatTime, isSameDay, getWeekDates, getMonthDates, getDateKey } from "@/lib/utils/date";
import { LOCATIONS, getVillageColor } from "@/lib/constants";
import { LoadingSection } from "@/components/ui/Spinner";

type ViewMode = "week" | "month";

export default function CalendarPage() {
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<string>("all");

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

    fetchClasses(getDateKey(from), getDateKey(to))
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
      const dateMatches = isSameDay(classDate, date);
      const locationMatches = selectedLocation === "all" || c.location === selectedLocation;
      return dateMatches && locationMatches;
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
      {/* Soft decorative shapes */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-violet-200/40 blur-[100px]" />
        <div className="absolute -right-40 top-1/3 h-80 w-80 rounded-full bg-purple-200/30 blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 h-60 w-60 rounded-full bg-indigo-200/20 blur-[80px]" />
      </div>

      <header className="relative border-b border-slate-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <a href="/" className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600 hover:text-violet-700 transition">
              Daphstar Fitness
            </a>
            <h1 className="mt-1 text-2xl font-bold text-slate-800">Class Calendar</h1>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/my-bookings"
              className="rounded-full border border-slate-300 bg-white px-6 py-3 text-base font-medium text-slate-700 transition hover:border-violet-400 hover:bg-violet-50 hover:text-violet-700"
            >
              My Bookings
            </a>
            <a
              href="/admin/login"
              className="rounded-full border border-slate-300 bg-white px-6 py-3 text-base font-medium text-slate-700 transition hover:border-violet-400 hover:bg-violet-50 hover:text-violet-700"
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
              className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-100 hover:text-slate-800"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToToday}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-base font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-800"
            >
              Today
            </button>
            <button
              onClick={navigateNext}
              className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-100 hover:text-slate-800"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <span className="ml-2 text-xl font-semibold text-slate-800" suppressHydrationWarning>
              {weekRange}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {/* Location filter */}
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-medium text-slate-600 transition hover:border-violet-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200"
            >
              <option value="all">All Locations</option>
              {LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>

            <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-1">
              <button
                onClick={() => setViewMode("week")}
                className={`rounded-lg px-5 py-3 text-base font-medium transition ${
                  viewMode === "week"
                    ? "bg-white text-violet-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode("month")}
                className={`rounded-lg px-5 py-3 text-base font-medium transition ${
                  viewMode === "month"
                    ? "bg-white text-violet-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Month
              </button>
            </div>
          </div>
        </div>

        {/* Calendar grid */}
        <div className="glass-card overflow-hidden rounded-3xl">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="border-r border-slate-200 px-2 py-4 text-center text-sm font-semibold uppercase tracking-wider text-slate-600 last:border-r-0"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar body */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-10 w-10 animate-spin rounded-full border-3 border-violet-500 border-t-transparent" />
            </div>
          ) : viewMode === "week" ? (
            <div className="grid grid-cols-7">
              {weekDates.map((date, idx) => {
                const dayClasses = getClassesForDate(date);
                const isToday = isSameDay(date, today);
                return (
                  <div
                    key={idx}
                    className={`min-h-[200px] border-r border-slate-200 p-2 last:border-r-0 ${
                      isToday ? "bg-violet-50" : "bg-white"
                    }`}
                  >
                    <div
                      className={`mb-2 flex h-10 w-10 items-center justify-center rounded-full text-base font-semibold ${
                        isToday
                          ? "bg-violet-600 text-white"
                          : "text-slate-700"
                      }`}
                      suppressHydrationWarning
                    >
                      {date.getDate()}
                    </div>
                    <div className="space-y-2">
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
                            className={`group block rounded-lg p-2.5 text-sm transition ${
                              isFull
                                ? "cursor-not-allowed bg-slate-100 text-slate-400"
                                : `${getVillageColor(c.location).bg} ${getVillageColor(c.location).text} ${getVillageColor(c.location).hover}`
                            }`}
                            onClick={(e) => isFull && e.preventDefault()}
                          >
                            <p className="font-semibold truncate" suppressHydrationWarning>
                              {formatTime(c.startTime)}
                            </p>
                            <p className="truncate">{c.title}</p>
                            {c.location && (
                              <p className="truncate text-xs opacity-80">{c.location}</p>
                            )}
                            <p className={`mt-1 text-xs font-medium ${isFull ? "text-red-500" : "text-emerald-600"}`}>
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
                    className={`min-h-[100px] border-b border-r border-slate-200 p-2 last:border-r-0 ${
                      isToday ? "bg-violet-50" : "bg-white"
                    } ${!isCurrentMonth ? "opacity-40" : ""}`}
                  >
                    <div
                      className={`mb-1 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                        isToday
                          ? "bg-violet-600 text-white"
                          : "text-slate-600"
                      }`}
                      suppressHydrationWarning
                    >
                      {date.getDate()}
                    </div>
                    <div className="space-y-1">
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
                            className={`block truncate rounded px-2 py-1 text-xs transition ${
                              isFull
                                ? "cursor-not-allowed bg-slate-100 text-slate-400"
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
                        <p className="text-xs text-slate-500 px-1">
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
        <div className="mt-6 flex flex-wrap items-center justify-center gap-5 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <span className="h-4 w-4 rounded bg-amber-100 border border-amber-300" />
            <span>Sunrise Village</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-4 w-4 rounded bg-emerald-100 border border-emerald-300" />
            <span>Oakwood Gardens</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-4 w-4 rounded bg-sky-100 border border-sky-300" />
            <span>Meadow Creek</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-4 w-4 rounded bg-violet-100 border border-violet-300" />
            <span>Lakeside Manor</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-4 w-4 rounded bg-rose-100 border border-rose-300" />
            <span>Hillcrest</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-4 w-4 rounded bg-slate-100 border border-slate-300" />
            <span>Full</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-violet-600 text-center text-sm font-bold text-white leading-6">7</span>
            <span>Today</span>
          </div>
        </div>
      </main>
    </div>
  );
}
