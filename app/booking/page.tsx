"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createBooking, fetchClasses, type ClassSummary } from "@/lib/api";

type BookingStatus =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "success"; cancelToken: string }
  | { state: "error"; message: string };

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
    <div className="min-h-screen bg-grid px-6 py-10">
      {/* Gradient orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-purple-500/20 blur-[100px]" />
        <div className="absolute -right-40 top-1/3 h-80 w-80 rounded-full bg-fuchsia-500/15 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-lg">
        <div className="mb-6 flex items-center justify-between">
          <a href="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Schedule
          </a>
          <div className="flex items-center gap-2">
            <a
              href="/calendar"
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-400 transition hover:border-purple-500/50 hover:text-white"
            >
              Calendar
            </a>
            <a
              href="/my-bookings"
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-400 transition hover:border-purple-500/50 hover:text-white"
            >
              My Bookings
            </a>
          </div>
        </div>

        <div className="glass-card rounded-3xl p-8">
          <div className="mb-6">
            <h1 className="gradient-text text-2xl font-bold">Book a Class</h1>
            <p className="mt-2 text-sm text-slate-400">
              Enter your details to reserve a spot. You&apos;ll receive a confirmation email with a cancellation link.
            </p>
          </div>

          {selectedClass ? (
            <div className="mb-6 rounded-2xl border border-purple-500/20 bg-purple-500/10 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20">
                  <svg className="h-5 w-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-white">{selectedClass.title}</p>
                  <p className="text-sm text-slate-400" suppressHydrationWarning>
                    {new Date(selectedClass.startTime).toLocaleString()} -{" "}
                    {new Date(selectedClass.endTime).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
              <p className={`mt-3 text-sm font-medium ${selectedClass.spotsLeft > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {selectedClass.spotsLeft} spots left
              </p>
            </div>
          ) : fallbackSummary ? (
            <div className="mb-6 rounded-2xl border border-purple-500/20 bg-purple-500/10 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20">
                  <svg className="h-5 w-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-white">{fallbackSummary.title}</p>
                  <p className="text-sm text-slate-400" suppressHydrationWarning>
                    {new Date(fallbackSummary.startTime).toLocaleString()} -{" "}
                    {new Date(fallbackSummary.endTime).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
              {fallbackSummary.spotsLeft !== null ? (
                <p className="mt-3 text-sm font-medium text-emerald-400">
                  {fallbackSummary.spotsLeft} spots left
                </p>
              ) : null}
            </div>
          ) : null}

          {isLoggedIn ? (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300 mb-2">
              <p className="font-medium">✓ Logged in as {customerName}</p>
              <p className="text-emerald-400/80 text-xs mt-1">Your details have been pre-filled below.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-purple-500/20 bg-purple-500/10 px-4 py-3 text-sm text-purple-300 mb-2">
              <a href="/login" className="font-medium hover:text-purple-200 transition">
                Sign in to book faster →
              </a>
            </div>
          )}

          <form className="grid gap-5" onSubmit={handleSubmit}>
            <label className="grid gap-2 text-sm font-medium text-slate-300">
              Retirement Village
              <select
                className="input-dark h-12 rounded-xl px-4 text-sm"
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
            <label className="grid gap-2 text-sm font-medium text-slate-300">
              Class
              <select
                className="input-dark h-12 rounded-xl px-4 text-sm"
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
            <label className="grid gap-2 text-sm font-medium text-slate-300">
              Full name
              <input
                className="input-dark h-12 rounded-xl px-4 text-sm"
                placeholder="Jordan Miles"
                type="text"
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-300">
              Email
              <input
                className="input-dark h-12 rounded-xl px-4 text-sm"
                placeholder="jordan@example.com"
                type="email"
                value={customerEmail}
                onChange={(event) => setCustomerEmail(event.target.value)}
              />
            </label>

            {status.state === "error" ? (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                {status.message}
              </div>
            ) : null}

            {status.state === "success" ? (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                <p className="font-medium">🎉 Booking confirmed!</p>
                <p className="mt-1 text-emerald-400/80">
                  Save your cancellation token: <code className="rounded bg-black/30 px-2 py-0.5 font-mono text-xs">{status.cancelToken}</code>
                </p>
              </div>
            ) : null}

            {isFull ? (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
                This class is currently full. Please choose another class.
              </div>
            ) : null}

            <button
              className="btn-glow mt-2 h-12 rounded-full text-sm font-semibold text-white"
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
        <div className="min-h-screen bg-grid px-6 py-10">
          <div className="relative mx-auto max-w-lg">
            <div className="glass-card rounded-3xl p-8">
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
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
