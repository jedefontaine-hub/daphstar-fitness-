"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createBooking, fetchClasses, type ClassSummary } from "@/lib/api";
import { SuccessAnimation } from "@/components/ui/SuccessAnimation";
import { useToast } from "@/components/ui/Toast";
import { PageTransition } from "@/components/ui/PageTransition";
import { useSession } from "@/lib/session-context";

type BookingStatus =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "success"; cancelToken: string }
  | { state: "error"; message: string };

type Attendee = {
  id: string;
  name: string;
  attendanceStatus?: string; // 'pending', 'attended', 'absent'
};

// Color palette for attendee avatars - expanded for more variety
const avatarColors = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-teal-500",
  "bg-orange-500",
  "bg-cyan-500",
  "bg-rose-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-lime-500",
  "bg-fuchsia-500",
  "bg-sky-500",
  "bg-red-500",
  "bg-yellow-600",
  "bg-slate-500",
  "bg-blue-700",
  "bg-green-700",
  "bg-purple-700",
  "bg-pink-700",
  "bg-indigo-700",
  "bg-teal-700",
  "bg-orange-700",
  "bg-cyan-700",
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getAvatarColor(name: string): string {
  // Simple hash to get consistent color for same name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

function formatDate(value: Date): string {
  return value.toISOString().split("T")[0] ?? "";
}

function BookingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const { customer, isLoading: sessionLoading } = useSession();
  const preferredClassId = searchParams.get("classId");
  const fallbackTitle = searchParams.get("title");
  const fallbackStart = searchParams.get("startTime");
  const fallbackEnd = searchParams.get("endTime");
  const fallbackSpots = searchParams.get("spotsLeft");
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [classId, setClassId] = useState("");
  const [status, setStatus] = useState<BookingStatus>({ state: "idle" });
  const [hasLoaded, setHasLoaded] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const selectedClass = classes.find((item) => item.id === classId);
  const isFull = selectedClass ? selectedClass.spotsLeft === 0 : false;
  const fallbackSpotsValue = fallbackSpots ? Number(fallbackSpots) : null;
  const fallbackSummary =
    !hasLoaded &&
    !selectedClass &&
    fallbackTitle &&
    fallbackStart &&
    fallbackEnd
      ? {
          title: fallbackTitle,
          startTime: fallbackStart,
          endTime: fallbackEnd,
          spotsLeft: Number.isNaN(fallbackSpotsValue)
            ? null
            : fallbackSpotsValue,
        }
      : null;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!sessionLoading && !customer) {
      const returnUrl = window.location.pathname + window.location.search;
      router.replace(`/login?redirect=${encodeURIComponent(returnUrl)}`);
    }
  }, [sessionLoading, customer, router]);

  useEffect(() => {
    const now = new Date();
    const to = new Date();
    to.setDate(now.getDate() + 7);

    fetchClasses(formatDate(now), formatDate(to))
      .then((data) => {
        setClasses(data);
        const preferredMatch = preferredClassId
          ? data.find((item) => item.id === preferredClassId)
          : undefined;
        const preferredIsFull =
          preferredMatch && preferredMatch.spotsLeft === 0;
        const firstAvailable = data.find((item) => item.spotsLeft > 0);
        const nextClassId = preferredIsFull
          ? (firstAvailable?.id ?? preferredMatch?.id ?? data[0]?.id ?? "")
          : (preferredMatch?.id ?? firstAvailable?.id ?? data[0]?.id ?? "");
        setClassId(nextClassId);
        setHasLoaded(true);
      })
      .catch(() => {
        setStatus({
          state: "error",
          message: "Unable to load classes. Try again soon.",
        });
        setHasLoaded(true);
      });
  }, [preferredClassId]);

  // Fetch attendees when class changes
  useEffect(() => {
    if (!classId) {
      setAttendees([]);
      return;
    }
    fetch(`/api/classes/${classId}/attendees`)
      .then((res) => res.json())
      .then((data) => setAttendees(data.attendees || []))
      .catch(() => setAttendees([]));
  }, [classId]);

  // Toggle attendance status for an attendee
  const handleToggleAttendance = async (attendee: Attendee) => {
    const newStatus = attendee.attendanceStatus === "attended" ? "absent" : "attended";
    try {
      const res = await fetch(`/api/classes/${classId}/attendees`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendeeId: attendee.id, attendanceStatus: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update attendance");
      setAttendees((prev) =>
        prev.map((a) =>
          a.id === attendee.id ? { ...a, attendanceStatus: newStatus } : a
        )
      );
      toast.success(`Marked as ${newStatus}`);
    } catch {
      toast.error("Could not update attendance");
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!classId || !customer) {
      toast.error("Please log in before booking.");
      return;
    }

    setStatus({ state: "loading" });
    try {
      const result = await createBooking({
        classId,
        customerName: customer.name,
        customerEmail: customer.email,
        retirementVillage: customer.retirementVillage || undefined,
      });
      setShowSuccessAnimation(true);
      setStatus({ state: "success", cancelToken: result.cancelToken });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to create booking.";
      toast.error(message);
      setStatus({ state: "error", message });
    }
  };

  // Show loading while session is being checked or redirecting
  if (sessionLoading || !customer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 px-4 py-6">
        <div className="mx-auto max-w-md">
          <div className="rounded-xl glass-card p-6">
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-teal-500 border-t-transparent" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 px-4 py-6">
      {/* Success Animation */}
      <SuccessAnimation
        show={showSuccessAnimation}
        message="Booking Confirmed!"
        subMessage="Check your email for details"
        onComplete={() => setShowSuccessAnimation(false)}
      />
      
      <PageTransition>
        <div className="mx-auto max-w-md">
          <div className="mb-4 flex items-center justify-between">
            <a href="/" className="inline-flex items-center gap-1 text-sm font-medium text-slate-300 hover:text-teal-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </a>
            <div className="flex items-center gap-2">
              <a
                href="/calendar"
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/10"
              >
                Calendar
              </a>
              <a
                href="/my-bookings"
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/10"
              >
                My Bookings
            </a>
          </div>
        </div>

        <div className="rounded-xl glass-card p-6">
          <div className="mb-5">
            <h1 className="text-xl font-bold text-white">Book a Class</h1>
            {customer && (
              <p className="mt-2 text-sm text-slate-400">
                Booking as <span className="text-teal-400 font-medium">{customer.name}</span>
              </p>
            )}
          </div>

          {selectedClass ? (
            <div className="mb-5 rounded-lg border border-teal-500/30 bg-teal-500/10 p-4">
              <p className="font-semibold text-white">{selectedClass.title}</p>
              <p className="text-sm text-slate-300" suppressHydrationWarning>
                {new Date(selectedClass.startTime).toLocaleString()} -{" "}
                {new Date(selectedClass.endTime).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
              <p className={`mt-2 text-sm font-semibold ${selectedClass.spotsLeft > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {selectedClass.spotsLeft} spots left
              </p>
              
              {/* Attendee avatars */}
              {attendees.length > 0 && (
                <div className="mt-3 border-t border-teal-500/30 pt-3">
                  <p className="text-xs text-slate-400 mb-2">Already signed up:</p>
                  <div className="flex flex-col gap-2">
                    {attendees.map((attendee) => (
                      <div key={attendee.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                        <div
                          className={`group relative flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white cursor-default ${getAvatarColor(attendee.name)}`}
                          title={attendee.name}
                        >
                          {getInitials(attendee.name)}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-white text-sm">{attendee.name}</div>
                        </div>
                        <button
                          className={`rounded-full px-3 py-1 text-xs font-medium transition focus:outline-none ${
                            attendee.attendanceStatus === "attended"
                              ? "bg-emerald-500/80 text-white hover:bg-emerald-600"
                              : "bg-slate-600/40 text-slate-200 hover:bg-slate-500"
                          }`}
                          onClick={() => handleToggleAttendance(attendee)}
                        >
                          {attendee.attendanceStatus === "attended" ? "Attended" : "Mark Attended"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : fallbackSummary ? (
            <div className="mb-5 rounded-lg border border-teal-500/30 bg-teal-500/10 p-4">
              <p className="font-semibold text-white">{fallbackSummary.title}</p>
              <p className="text-sm text-slate-300" suppressHydrationWarning>
                {new Date(fallbackSummary.startTime).toLocaleString()} -{" "}
                {new Date(fallbackSummary.endTime).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
              {fallbackSummary.spotsLeft !== null ? (
                <p className="mt-2 text-sm font-semibold text-emerald-400">
                  {fallbackSummary.spotsLeft} spots left
                </p>
              ) : null}
            </div>
          ) : null}

          <form className="grid gap-4" onSubmit={handleSubmit}>
            {status.state === "error" && (
              <div className="rounded-lg bg-red-500/20 border border-red-500/30 px-4 py-3 text-sm text-red-300">
                {status.message}
                {status.message.includes("already booked") && (
                  <span>
                    {" "}View your bookings in{" "}
                    <a href="/my-bookings" className="font-medium underline hover:text-red-200">My Bookings</a>.
                  </span>
                )}
              </div>
            )}

            {status.state === "success" && (
              <div className="rounded-lg bg-emerald-500/20 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-300">
                <p className="font-semibold">🎉 Booking confirmed!</p>
                <p className="mt-1">
                  Check your email for confirmation. You can manage your bookings in{" "}
                  <a href="/my-bookings" className="font-medium underline hover:text-emerald-200">My Bookings</a>.
                </p>
              </div>
            )}

            {isFull && (
              <div className="rounded-lg bg-amber-500/20 border border-amber-500/30 px-4 py-3 text-sm text-amber-300">
                This class is full. Please choose another.
              </div>
            )}

            <button
              className="btn-glow mt-2 h-12 w-full rounded-full text-sm font-semibold text-white disabled:opacity-50"
              type="submit"
              disabled={
                status.state === "loading" || classes.length === 0 || isFull
              }
            >
              {status.state === "loading" ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Booking...
                </span>
              ) : (
                "Confirm Booking"
              )}
            </button>
          </form>
        </div>
        </div>
      </PageTransition>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 px-4 py-6">
          <div className="mx-auto max-w-md">
            <div className="rounded-xl glass-card p-6">
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-3 border-teal-500 border-t-transparent" />
              </div>
            </div>
          </div>
        </div>
      }
    >
      <BookingContent />
    </Suspense>
  );
}
