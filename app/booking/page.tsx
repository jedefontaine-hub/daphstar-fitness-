"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createBooking, fetchClasses, type ClassSummary } from "@/lib/api";

type BookingStatus =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "success"; cancelToken: string }
  | { state: "error"; message: string };

type Attendee = {
  id: string;
  name: string;
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
  const preferredClassId = searchParams.get("classId");
  const fallbackTitle = searchParams.get("title");
  const fallbackStart = searchParams.get("startTime");
  const fallbackEnd = searchParams.get("endTime");
  const fallbackSpots = searchParams.get("spotsLeft");
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [classId, setClassId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [retirementVillage, setRetirementVillage] = useState("");
  const [status, setStatus] = useState<BookingStatus>({ state: "idle" });
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
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

  useEffect(() => {
    // Fetch customer session to pre-fill form
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.customer) {
          setCustomerName(data.customer.name);
          setCustomerEmail(data.customer.email);
          setRetirementVillage(data.customer.retirementVillage || "");
          setIsLoggedIn(true);
        }
      })
      .catch(() => {});

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!classId || !customerName || !customerEmail) {
      setStatus({
        state: "error",
        message: "Please complete all fields before booking.",
      });
      return;
    }

    setStatus({ state: "loading" });
    try {
      const result = await createBooking({
        classId,
        customerName,
        customerEmail,
        retirementVillage: retirementVillage || undefined,
      });
      setStatus({ state: "success", cancelToken: result.cancelToken });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to create booking.";
      setStatus({ state: "error", message });
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] px-4 py-6">
      <div className="mx-auto max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <a href="/" className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-blue-500">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </a>
          <div className="flex items-center gap-2">
            <a
              href="/calendar"
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Calendar
            </a>
            <a
              href="/my-bookings"
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              My Bookings
            </a>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h1 className="text-xl font-bold text-gray-900">Book a Class</h1>
            <p className="mt-2 text-sm text-gray-500">
              Enter your details to reserve a spot.
            </p>
          </div>

          {selectedClass ? (
            <div className="mb-5 rounded-lg border border-blue-100 bg-blue-50 p-4">
              <p className="font-semibold text-gray-900">{selectedClass.title}</p>
              <p className="text-sm text-gray-600" suppressHydrationWarning>
                {new Date(selectedClass.startTime).toLocaleString()} -{" "}
                {new Date(selectedClass.endTime).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
              <p className={`mt-2 text-sm font-semibold ${selectedClass.spotsLeft > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {selectedClass.spotsLeft} spots left
              </p>
              
              {/* Attendee avatars */}
              {attendees.length > 0 && (
                <div className="mt-3 border-t border-blue-100 pt-3">
                  <p className="text-xs text-gray-500 mb-2">Already signed up:</p>
                  <div className="flex flex-wrap gap-1">
                    {attendees.map((attendee) => (
                      <div
                        key={attendee.id}
                        className={`group relative flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white cursor-default ${getAvatarColor(attendee.name)}`}
                        title={attendee.name}
                      >
                        {getInitials(attendee.name)}
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                          <div className="whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white shadow-lg">
                            {attendee.name}
                          </div>
                          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : fallbackSummary ? (
            <div className="mb-5 rounded-lg border border-blue-100 bg-blue-50 p-4">
              <p className="font-semibold text-gray-900">{fallbackSummary.title}</p>
              <p className="text-sm text-gray-600" suppressHydrationWarning>
                {new Date(fallbackSummary.startTime).toLocaleString()} -{" "}
                {new Date(fallbackSummary.endTime).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
              {fallbackSummary.spotsLeft !== null ? (
                <p className="mt-2 text-sm font-semibold text-green-600">
                  {fallbackSummary.spotsLeft} spots left
                </p>
              ) : null}
            </div>
          ) : null}

          {isLoggedIn ? (
            <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
              <p className="font-semibold">✓ Logged in as {customerName}</p>
              <p className="text-green-600 mt-1">Your details have been pre-filled.</p>
            </div>
          ) : (
            <div className="mb-4 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
              <a href="/login" className="font-semibold hover:text-blue-900">
                Sign in to book faster →
              </a>
            </div>
          )}

          <form className="grid gap-4" onSubmit={handleSubmit}>
            <label className="grid gap-1.5 text-sm font-medium text-gray-700">
              Retirement Village
              <select
                className="h-12 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={retirementVillage}
                onChange={(event) => setRetirementVillage(event.target.value)}
              >
                <option value="">Select your village</option>
                <option value="Sunrise Village">Sunrise Village</option>
                <option value="Oakwood Gardens">Oakwood Gardens</option>
                <option value="Meadow Creek">Meadow Creek</option>
                <option value="Lakeside Manor">Lakeside Manor</option>
                <option value="Hillcrest Retirement">Hillcrest Retirement</option>
                <option value="Independent">Independent / Other</option>
              </select>
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-gray-700">
              Class
              <select
                className="h-12 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={classId}
                onChange={(event) => setClassId(event.target.value)}
              >
                {classes.length === 0 ? (
                  <option value="">No classes available</option>
                ) : (
                  classes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title} ({item.spotsLeft} spots left)
                    </option>
                  ))
                )}
              </select>
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-gray-700">
              Full name
              <input
                className="h-12 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Margaret Wilson"
                type="text"
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-gray-700">
              Email
              <input
                className="h-12 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="margaret@example.com"
                type="email"
                value={customerEmail}
                onChange={(event) => setCustomerEmail(event.target.value)}
              />
            </label>

            {status.state === "error" && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {status.message}
                {status.message.includes("already booked") && (
                  <span>
                    {" "}View your bookings in{" "}
                    <a href="/my-bookings" className="font-medium underline hover:text-red-800">My Bookings</a>.
                  </span>
                )}
              </div>
            )}

            {status.state === "success" && (
              <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
                <p className="font-semibold">🎉 Booking confirmed!</p>
                <p className="mt-1">
                  Check your email for confirmation. You can manage your bookings in{" "}
                  <a href="/my-bookings" className="font-medium underline hover:text-green-800">My Bookings</a>.
                </p>
              </div>
            )}

            {isFull && (
              <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
                This class is full. Please choose another.
              </div>
            )}

            <button
              className="mt-2 h-12 w-full rounded-lg bg-blue-500 text-sm font-semibold text-white hover:bg-blue-600 disabled:bg-gray-300"
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
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f5f5f5] px-4 py-6">
          <div className="mx-auto max-w-md">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-500 border-t-transparent" />
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
