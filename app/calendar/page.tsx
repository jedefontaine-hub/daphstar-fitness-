"use client";

import { useEffect, useState } from "react";
import { fetchClasses, type ClassSummary } from "@/lib/api";
import { formatTime, formatDuration, isSameDay, getWeekDates, getMonthDates, getDateKey } from "@/lib/utils/date";
import { BottomNav } from "@/components/BottomNav";

type ViewMode = "week" | "month";

const CALENDAR_COLORS = [
  { bg: "bg-teal-500/20", text: "text-teal-300", border: "border-teal-500/30", dot: "bg-teal-400", hover: "hover:bg-teal-500/30" },
  { bg: "bg-emerald-500/20", text: "text-emerald-300", border: "border-emerald-500/30", dot: "bg-emerald-400", hover: "hover:bg-emerald-500/30" },
  { bg: "bg-purple-500/20", text: "text-purple-300", border: "border-purple-500/30", dot: "bg-purple-400", hover: "hover:bg-purple-500/30" },
  { bg: "bg-sky-500/20", text: "text-sky-300", border: "border-sky-500/30", dot: "bg-sky-400", hover: "hover:bg-sky-500/30" },
  { bg: "bg-amber-500/20", text: "text-amber-300", border: "border-amber-500/30", dot: "bg-amber-400", hover: "hover:bg-amber-500/30" },
  { bg: "bg-rose-500/20", text: "text-rose-300", border: "border-rose-500/30", dot: "bg-rose-400", hover: "hover:bg-rose-500/30" },
];

const DEFAULT_CAL_COLOR = { bg: "bg-slate-500/20", text: "text-slate-300", border: "border-slate-500/30", dot: "bg-slate-400", hover: "hover:bg-slate-500/30" };

const villageColorMap = new Map<string, typeof DEFAULT_CAL_COLOR>();

function getCalendarVillageColor(village?: string) {
  if (!village) return DEFAULT_CAL_COLOR;
  if (villageColorMap.has(village)) return villageColorMap.get(village)!;
  const color = CALENDAR_COLORS[villageColorMap.size % CALENDAR_COLORS.length];
  villageColorMap.set(village, color);
  return color;
}

export default function CalendarPage() {
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [villages, setVillages] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch("/api/villages").then(r => r.json()).then(setVillages).catch(() => {});
  }, []);

  const today = new Date();
  const weekDates = getWeekDates(currentDate);
  const monthDates = getMonthDates(currentDate);

  useEffect(() => {
    setIsLoading(true);
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
    month: "short",
    year: "numeric",
  });

  const weekRange =
    viewMode === "week"
      ? `${weekDates[0]?.toLocaleDateString("default", { month: "short", day: "numeric" })} - ${weekDates[6]?.toLocaleDateString("default", { day: "numeric" })}`
      : monthName;

  // Get week's classes grouped by date for mobile list view
  const weekClassesByDate = weekDates.map(date => ({
    date,
    classes: getClassesForDate(date),
    isToday: isSameDay(date, today)
  })).filter(d => d.classes.length > 0 || d.isToday);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-white/10 bg-slate-900/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-3 sm:px-6 py-3 sm:py-4">
          <div className="min-w-0">
            <a href="/" className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-teal-400 hover:text-teal-300">
              Daphstar Fitness
            </a>
            <h1 className="text-lg sm:text-2xl font-bold text-white">Class Calendar</h1>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/my-bookings"
              className="rounded-full border border-white/20 bg-white/10 px-3 sm:px-5 py-2 text-sm font-medium text-slate-200 hover:bg-white/20"
            >
              <span className="hidden sm:inline">My </span>Bookings
            </a>
            <a
              href="/admin/login"
              className="rounded-full border border-white/20 bg-white/10 px-3 sm:px-5 py-2 text-sm font-medium text-slate-200 hover:bg-white/20"
            >
              Admin
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-3 sm:px-6 py-4 sm:py-6">
        {/* Controls */}
        <div className="mb-4 rounded-xl glass-card p-3 sm:p-4">
          {/* Navigation row */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={navigatePrev}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-slate-200 hover:bg-white/20"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={goToToday}
                className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-white/20"
              >
                Today
              </button>
              <button
                onClick={navigateNext}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-slate-200 hover:bg-white/20"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <span className="text-base sm:text-lg font-semibold text-white" suppressHydrationWarning>
              {weekRange}
            </span>
          </div>

          {/* Filters row */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="flex-1 sm:flex-none rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-slate-200 focus:border-teal-400 focus:outline-none"
            >
              <option value="all">All Locations</option>
              {villages.map((v) => (
                <option key={v.id} value={v.name}>
                  {v.name}
                </option>
              ))}
            </select>

            <div className="flex rounded-lg border border-white/20 bg-white/5 p-0.5">
              <button
                onClick={() => setViewMode("week")}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  viewMode === "week"
                    ? "bg-teal-500 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode("month")}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  viewMode === "month"
                    ? "bg-teal-500 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Month
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-teal-500 border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Mobile List View - shown on small screens for week view */}
            {viewMode === "week" && (
              <div className="sm:hidden space-y-3">
                {weekClassesByDate.length === 0 ? (
                  <div className="rounded-xl glass-card p-6 text-center">
                    <p className="text-slate-400">No classes this week</p>
                  </div>
                ) : (
                  weekClassesByDate.map(({ date, classes: dayClasses, isToday }) => (
                    <div key={date.toISOString()} className="rounded-xl glass-card overflow-hidden">
                      {/* Day header */}
                      <div className={`px-4 py-2 flex items-center gap-2 ${isToday ? 'bg-teal-500 text-white' : 'bg-white/10 text-slate-200'}`}>
                        <span className="font-semibold" suppressHydrationWarning>
                          {date.toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        {isToday && <span className="text-xs bg-white/20 px-2 py-0.5 rounded">Today</span>}
                      </div>
                      
                      {/* Classes */}
                      <div className="divide-y divide-white/10">
                        {dayClasses.length === 0 ? (
                          <p className="px-4 py-3 text-sm text-slate-300">No classes</p>
                        ) : (
                          dayClasses.map((c) => {
                            const isFull = c.spotsLeft === 0;
                            const isExpired = new Date(c.endTime) < new Date();
                            const isUnavailable = isFull || isExpired;
                            const query = new URLSearchParams({
                              classId: c.id,
                              title: c.title,
                              startTime: c.startTime,
                              endTime: c.endTime,
                              spotsLeft: String(c.spotsLeft),
                            }).toString();
                            const colors = getCalendarVillageColor(c.location);

                            return (
                              <a
                                key={c.id}
                                href={isUnavailable ? "#" : `/booking?${query}`}
                                className={`flex items-center gap-3 px-4 py-3 ${isUnavailable ? 'opacity-50' : 'hover:bg-white/10'}`}
                                onClick={(e) => isUnavailable && e.preventDefault()}
                              >
                                {/* Time */}
                                <div className="text-center w-14 flex-shrink-0">
                                  <p className="text-sm font-bold text-teal-400" suppressHydrationWarning>
                                    {formatTime(c.startTime)}
                                  </p>
                                  <p className="text-xs text-slate-300">{formatDuration(c.startTime, c.endTime)}</p>
                                </div>
                                
                                {/* Village color bar */}
                                <div className={`w-1 h-10 rounded-full flex-shrink-0 ${colors.dot}`} />
                                
                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-white">{c.title}</p>
                                  {c.location && <p className="text-xs text-slate-400">{c.location}</p>}
                                </div>
                                
                                {/* Spots */}
                                <div className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${
                                  isExpired ? 'bg-slate-600/50 text-slate-400' : isFull ? 'bg-slate-600/50 text-slate-400' : 'bg-emerald-500/30 text-emerald-400'
                                }`}>
                                  {isExpired ? 'Expired' : isFull ? 'Full' : `${c.spotsLeft} left`}
                                </div>
                              </a>
                            );
                          })
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Desktop Grid View - hidden on mobile for week view */}
            <div className={`${viewMode === "week" ? "hidden sm:block" : ""}`}>
              <div className="rounded-xl glass-card overflow-hidden">
                {/* Day headers */}
                <div className="grid grid-cols-7 border-b border-white/10 bg-white/5">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div
                      key={day}
                      className="border-r border-white/10 px-1 sm:px-2 py-2 sm:py-3 text-center text-xs sm:text-sm font-semibold text-slate-300 last:border-r-0"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Week view grid */}
                {viewMode === "week" && (
                  <div className="grid grid-cols-7">
                    {weekDates.map((date, idx) => {
                      const dayClasses = getClassesForDate(date);
                      const isToday = isSameDay(date, today);
                      return (
                        <div
                          key={idx}
                          className={`min-h-[180px] border-r border-white/10 p-2 last:border-r-0 ${
                            isToday ? "bg-teal-900/30" : "bg-transparent"
                          }`}
                        >
                          <div
                            className={`mb-2 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                              isToday ? "bg-teal-500 text-white" : "text-slate-300"
                            }`}
                            suppressHydrationWarning
                          >
                            {date.getDate()}
                          </div>
                          <div className="space-y-1.5">
                            {dayClasses.map((c) => {
                              const isFull = c.spotsLeft === 0;
                              const isExpired = new Date(c.endTime) < new Date();
                              const isUnavailable = isFull || isExpired;
                              const query = new URLSearchParams({
                                classId: c.id,
                                title: c.title,
                                startTime: c.startTime,
                                endTime: c.endTime,
                                spotsLeft: String(c.spotsLeft),
                              }).toString();
                              const colors = getCalendarVillageColor(c.location);
                              return (
                                <a
                                  key={c.id}
                                  href={isUnavailable ? "#" : `/booking?${query}`}
                                  className={`block rounded-lg p-2 text-xs transition ${
                                    isUnavailable
                                      ? "cursor-not-allowed bg-slate-700/50 text-slate-400 opacity-50"
                                      : `${colors.bg} ${colors.text} ${colors.hover}`
                                  }`}
                                  onClick={(e) => isUnavailable && e.preventDefault()}
                                >
                                  <p className="font-semibold" suppressHydrationWarning>
                                    {formatTime(c.startTime)}
                                  </p>
                                  <p className="truncate">{c.title}</p>
                                  <p className={`mt-0.5 font-medium ${isExpired ? "text-slate-500" : isFull ? "text-rose-400" : "text-emerald-400"}`}>
                                    {isExpired ? "Expired" : isFull ? "Full" : `${c.spotsLeft} spots`}
                                  </p>
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Month view grid */}
                {viewMode === "month" && (
                  <div className="grid grid-cols-7">
                    {monthDates.map((date, idx) => {
                      const dayClasses = getClassesForDate(date);
                      const isToday = isSameDay(date, today);
                      const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                      return (
                        <div
                          key={idx}
                          className={`min-h-[80px] sm:min-h-[100px] border-b border-r border-white/10 p-1 sm:p-2 last:border-r-0 ${
                            isToday ? "bg-teal-900/30" : "bg-transparent"
                          } ${!isCurrentMonth ? "opacity-40" : ""}`}
                        >
                          <div
                            className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                              isToday ? "bg-teal-500 text-white" : "text-slate-400"
                            }`}
                            suppressHydrationWarning
                          >
                            {date.getDate()}
                          </div>
                          <div className="space-y-0.5">
                            {/* On mobile, show dots. On desktop, show labels */}
                            <div className="sm:hidden flex gap-0.5 flex-wrap">
                              {dayClasses.slice(0, 4).map((c) => {
                                const colors = getCalendarVillageColor(c.location);
                                const isFull = c.spotsLeft === 0;
                                const isExpired = new Date(c.endTime) < new Date();
                                return (
                                  <div
                                    key={c.id}
                                    className={`h-2 w-2 rounded-full ${(isFull || isExpired) ? 'bg-slate-500' : colors.dot}`}
                                    title={`${formatTime(c.startTime)} - ${c.title}${isExpired ? ' (Expired)' : ''}`}
                                  />
                                );
                              })}
                              {dayClasses.length > 4 && (
                                <span className="text-[10px] text-slate-300">+{dayClasses.length - 4}</span>
                              )}
                            </div>
                            
                            {/* Desktop: show class labels */}
                            <div className="hidden sm:block space-y-0.5">
                              {dayClasses.slice(0, 2).map((c) => {
                                const isFull = c.spotsLeft === 0;
                                const isExpired = new Date(c.endTime) < new Date();
                                const isUnavailable = isFull || isExpired;
                                const query = new URLSearchParams({
                                  classId: c.id,
                                  title: c.title,
                                  startTime: c.startTime,
                                  endTime: c.endTime,
                                  spotsLeft: String(c.spotsLeft),
                                }).toString();
                                const colors = getCalendarVillageColor(c.location);
                                return (
                                  <a
                                    key={c.id}
                                    href={isUnavailable ? "#" : `/booking?${query}`}
                                    className={`block truncate rounded px-1.5 py-0.5 text-[11px] transition ${
                                      isUnavailable
                                        ? "cursor-not-allowed bg-slate-700/50 text-slate-400 opacity-50"
                                        : `${colors.bg} ${colors.text} ${colors.hover}`
                                    }`}
                                    onClick={(e) => isUnavailable && e.preventDefault()}
                                  >
                                    {c.title}
                                  </a>
                                );
                              })}
                              {dayClasses.length > 2 && (
                                <p className="text-[10px] text-slate-300 px-1">
                                  +{dayClasses.length - 2} more
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Legend - dynamic from villages */}
            {villages.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs sm:text-sm text-slate-400">
                {villages.map((v) => {
                  const colors = getCalendarVillageColor(v.name);
                  return (
                    <div key={v.id} className="flex items-center gap-1.5">
                      <span className={`h-3 w-3 rounded ${colors.dot}`} />
                      <span>{v.name}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
      <BottomNav />    </div>
  );
}
