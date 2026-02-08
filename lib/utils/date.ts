/**
 * Date and time formatting utilities
 * Consolidated from various pages to avoid duplication
 */

/**
 * Format a time from ISO string (e.g., "9:00 AM")
 */
export function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return "";
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/**
 * Format a date and time (e.g., "Saturday, Feb 15 at 9:00 AM")
 */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return "";
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Format a date only (e.g., "Feb 15, 2026")
 */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return "";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format a date header (e.g., "Today, Feb 15" or "Saturday 15 Feb")
 * Handles Today/Tomorrow relative dates
 */
export function formatDateHeader(dateInput: string | Date): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
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

/**
 * Format date range for admin (e.g., "Sat, Feb 15, 9:00 AM - 10:00 AM")
 */
export function formatDateRange(startTime: string, endTime: string): string {
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf())) {
    return "Time TBD";
  }
  const day = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(start);
  const endTimeText = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(end);
  return `${day} - ${endTimeText}`;
}

/**
 * Format class duration (e.g., "1 hour" or "45 mins")
 */
export function formatDuration(startTime: string, endTime: string): string {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const mins = Math.round((end.getTime() - start.getTime()) / 60000);
  if (mins >= 60) {
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (remainingMins === 0) {
      return `${hours} hour${hours > 1 ? "s" : ""}`;
    }
    return `${hours}h ${remainingMins}m`;
  }
  return `${mins} mins`;
}

/**
 * Convert ISO string to datetime-local input format (e.g., "2026-02-15T09:00")
 */
export function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Check if a date/time is in the future
 */
export function isUpcoming(iso: string): boolean {
  return new Date(iso) > new Date();
}

/**
 * Get a date key for grouping (YYYY-MM-DD format)
 */
export function getDateKey(dateInput: string | Date): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  return date.toISOString().split("T")[0] ?? "";
}

/**
 * Get week dates starting from Sunday
 */
export function getWeekDates(baseDate: Date): Date[] {
  const dates: Date[] = [];
  const startOfWeek = new Date(baseDate);
  const day = startOfWeek.getDay();
  startOfWeek.setDate(startOfWeek.getDate() - day);

  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    dates.push(d);
  }
  return dates;
}

/**
 * Get all dates for a month view (42 dates for 6 weeks grid)
 */
export function getMonthDates(baseDate: Date): Date[] {
  const dates: Date[] = [];
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();

  const start = new Date(firstDay);
  start.setDate(start.getDate() - startOffset);

  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d);
  }
  return dates;
}

/**
 * Format week range (e.g., "Feb 8 - Feb 14, 2026")
 */
export function formatWeekRange(weekDates: Date[]): string {
  if (weekDates.length < 7) return "";
  const first = weekDates[0];
  const last = weekDates[6];
  if (!first || !last) return "";
  return `${first.toLocaleDateString("default", { month: "short", day: "numeric" })} - ${last.toLocaleDateString("default", { month: "short", day: "numeric", year: "numeric" })}`;
}

/**
 * Format month name with year (e.g., "February 2026")
 */
export function formatMonthYear(date: Date): string {
  return date.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
}
