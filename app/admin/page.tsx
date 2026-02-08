"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  adminCancelClass,
  adminCreateClass,
  adminUpdateClass,
  fetchAdminClasses,
  fetchAttendees,
  type AdminClassSummary,
  type Attendee,
} from "@/lib/api";

type PageStatus =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "error"; message: string };

type ModalState =
  | { type: "none" }
  | { type: "create" }
  | { type: "edit"; classItem: AdminClassSummary }
  | { type: "attendees"; classItem: AdminClassSummary; attendees: Attendee[] }
  | { type: "cancelConfirm"; classItem: AdminClassSummary };

function formatDateRange(startTime: string, endTime: string): string {
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

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [classes, setClasses] = useState<AdminClassSummary[]>([]);
  const [status, setStatus] = useState<PageStatus>({ state: "loading" });
  const [modal, setModal] = useState<ModalState>({ type: "none" });

  useEffect(() => {
    fetch("/api/admin/session")
      .then((res) => res.json())
      .then((data) => {
        if (!data.authenticated) {
          router.push("/admin/login");
        } else {
          setIsAuthenticated(true);
        }
      })
      .catch(() => {
        router.push("/admin/login");
      });
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  };

  const loadClasses = async () => {
    setStatus({ state: "loading" });
    try {
      const data = await fetchAdminClasses();
      setClasses(data);
      setStatus({ state: "idle" });
    } catch {
      setStatus({ state: "error", message: "Unable to load classes." });
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const handleOpenCreate = () => setModal({ type: "create" });

  const handleOpenEdit = (classItem: AdminClassSummary) =>
    setModal({ type: "edit", classItem });

  const handleOpenAttendees = async (classItem: AdminClassSummary) => {
    try {
      const attendees = await fetchAttendees(classItem.id);
      setModal({ type: "attendees", classItem, attendees });
    } catch {
      alert("Failed to load attendees.");
    }
  };

  const handleOpenCancelConfirm = (classItem: AdminClassSummary) =>
    setModal({ type: "cancelConfirm", classItem });

  const handleCloseModal = () => setModal({ type: "none" });

  const handleCreateSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const title = formData.get("title") as string;
    const startTime = formData.get("startTime") as string;
    const endTime = formData.get("endTime") as string;
    const capacity = Number(formData.get("capacity"));

    if (!title || !startTime || !endTime || !capacity) {
      alert("All fields are required.");
      return;
    }

    try {
      await adminCreateClass({
        title,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        capacity,
      });
      handleCloseModal();
      loadClasses();
    } catch {
      alert("Failed to create class.");
    }
  };

  const handleEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (modal.type !== "edit") return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const title = formData.get("title") as string;
    const startTime = formData.get("startTime") as string;
    const endTime = formData.get("endTime") as string;
    const capacity = Number(formData.get("capacity"));

    try {
      await adminUpdateClass(modal.classItem.id, {
        title,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        capacity,
      });
      handleCloseModal();
      loadClasses();
    } catch {
      alert("Failed to update class.");
    }
  };

  const handleCancelClass = async () => {
    if (modal.type !== "cancelConfirm") return;
    try {
      await adminCancelClass(modal.classItem.id);
      handleCloseModal();
      loadClasses();
    } catch {
      alert("Failed to cancel class.");
    }
  };

  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-grid">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grid px-6 py-10">
      {/* Gradient orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-purple-500/20 blur-[100px]" />
        <div className="absolute -right-40 top-1/3 h-80 w-80 rounded-full bg-fuchsia-500/15 blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 h-60 w-60 rounded-full bg-violet-500/10 blur-[80px]" />
      </div>

      <div className="relative mx-auto max-w-5xl space-y-6">
        <header className="glass-card flex items-start justify-between rounded-3xl p-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-purple-400">
              Daphstar Fitness
            </p>
            <h1 className="mt-1 text-2xl font-bold text-white">Admin Dashboard</h1>
            <p className="mt-2 text-sm text-slate-400">
              Manage classes, capacity, and attendees.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-300 backdrop-blur-sm transition hover:border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-300"
          >
            Sign out
          </button>
        </header>

        <section className="glass-card rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Classes</h2>
            <button
              className="btn-glow rounded-full px-5 py-2.5 text-sm font-semibold text-white"
              type="button"
              onClick={handleOpenCreate}
            >
              + Create Class
            </button>
          </div>

          {status.state === "loading" ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
            </div>
          ) : null}
          {status.state === "error" ? (
            <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
              {status.message}
            </div>
          ) : null}

          <div className="mt-6 grid gap-4">
            {classes.map((item) => {
              const isCancelled = item.status === "cancelled";
              const fillPercent = Math.round((item.booked / item.capacity) * 100);
              return (
                <div
                  key={item.id}
                  className={`group flex flex-col gap-4 rounded-2xl border p-5 transition sm:flex-row sm:items-center sm:justify-between ${
                    isCancelled
                      ? "border-white/5 bg-white/[0.01] opacity-50"
                      : "border-white/5 bg-white/[0.02] hover:border-purple-500/30 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                      isCancelled 
                        ? "bg-slate-500/20" 
                        : "bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20"
                    }`}>
                      <svg className={`h-6 w-6 ${isCancelled ? 'text-slate-500' : 'text-purple-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-purple-300 transition">
                        {item.title}
                        {isCancelled ? (
                          <span className="ml-2 rounded bg-rose-500/20 px-2 py-0.5 text-xs font-normal text-rose-400">
                            Cancelled
                          </span>
                        ) : null}
                      </h3>
                      <p className="text-sm text-slate-400" suppressHydrationWarning>
                        {formatDateRange(item.startTime, item.endTime)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium text-white">
                        {item.booked}/{item.capacity}
                      </p>
                      <div className="mt-1 h-1.5 w-20 overflow-hidden rounded-full bg-white/10">
                        <div 
                          className={`h-full rounded-full ${
                            fillPercent >= 100 
                              ? "bg-rose-500" 
                              : fillPercent >= 80 
                                ? "bg-amber-500" 
                                : "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.min(fillPercent, 100)}%` }}
                        />
                      </div>
                    </div>
                    <button
                      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:border-purple-500/50 hover:text-white"
                      type="button"
                      onClick={() => handleOpenAttendees(item)}
                    >
                      Attendees
                    </button>
                    {!isCancelled ? (
                      <>
                        <button
                          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:border-purple-500/50 hover:text-white"
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                        >
                          Edit
                        </button>
                        <button
                          className="rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-300 transition hover:border-rose-500 hover:bg-rose-500/20"
                          type="button"
                          onClick={() => handleOpenCancelConfirm(item)}
                        >
                          Cancel
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Modal overlay */}
      {modal.type !== "none" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-md rounded-3xl p-6 shadow-2xl">
            {modal.type === "create" ? (
              <>
                <h2 className="text-lg font-semibold text-white">Create Class</h2>
                <form className="mt-4 grid gap-4" onSubmit={handleCreateSubmit}>
                  <label className="grid gap-2 text-sm font-medium text-slate-300">
                    Title
                    <input
                      name="title"
                      className="input-dark h-12 rounded-xl px-4 text-sm"
                      required
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-slate-300">
                    Start time
                    <input
                      name="startTime"
                      type="datetime-local"
                      className="input-dark h-12 rounded-xl px-4 text-sm"
                      required
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-slate-300">
                    End time
                    <input
                      name="endTime"
                      type="datetime-local"
                      className="input-dark h-12 rounded-xl px-4 text-sm"
                      required
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-slate-300">
                    Capacity
                    <input
                      name="capacity"
                      type="number"
                      min={1}
                      className="input-dark h-12 rounded-xl px-4 text-sm"
                      required
                    />
                  </label>
                  <div className="mt-4 flex justify-end gap-3">
                    <button
                      type="button"
                      className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
                      onClick={handleCloseModal}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-glow rounded-full px-5 py-2.5 text-sm font-semibold text-white"
                    >
                      Create
                    </button>
                  </div>
                </form>
              </>
            ) : null}

            {modal.type === "edit" ? (
              <>
                <h2 className="text-lg font-semibold text-white">Edit Class</h2>
                <form className="mt-4 grid gap-4" onSubmit={handleEditSubmit}>
                  <label className="grid gap-2 text-sm font-medium text-slate-300">
                    Title
                    <input
                      name="title"
                      defaultValue={modal.classItem.title}
                      className="input-dark h-12 rounded-xl px-4 text-sm"
                      required
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-slate-300">
                    Start time
                    <input
                      name="startTime"
                      type="datetime-local"
                      defaultValue={toDatetimeLocal(modal.classItem.startTime)}
                      className="input-dark h-12 rounded-xl px-4 text-sm"
                      required
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-slate-300">
                    End time
                    <input
                      name="endTime"
                      type="datetime-local"
                      defaultValue={toDatetimeLocal(modal.classItem.endTime)}
                      className="input-dark h-12 rounded-xl px-4 text-sm"
                      required
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-slate-300">
                    Capacity
                    <input
                      name="capacity"
                      type="number"
                      min={1}
                      defaultValue={modal.classItem.capacity}
                      className="input-dark h-12 rounded-xl px-4 text-sm"
                      required
                    />
                  </label>
                  <div className="mt-4 flex justify-end gap-3">
                    <button
                      type="button"
                      className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
                      onClick={handleCloseModal}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-glow rounded-full px-5 py-2.5 text-sm font-semibold text-white"
                    >
                      Save
                    </button>
                  </div>
                </form>
              </>
            ) : null}

            {modal.type === "attendees" ? (
              <>
                <h2 className="text-lg font-semibold text-white">
                  Attendees – {modal.classItem.title}
                </h2>
                {modal.attendees.length === 0 ? (
                  <div className="mt-6 rounded-xl border border-white/5 bg-white/[0.02] p-6 text-center">
                    <p className="text-sm text-slate-500">No attendees yet.</p>
                  </div>
                ) : (
                  <ul className="mt-4 divide-y divide-white/5">
                    {modal.attendees.map((a) => (
                      <li key={a.id} className="py-3">
                        <p className="font-medium text-white">{a.customerName}</p>
                        <p className="text-sm text-slate-400">{a.customerEmail}</p>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
                    onClick={handleCloseModal}
                  >
                    Close
                  </button>
                </div>
              </>
            ) : null}

            {modal.type === "cancelConfirm" ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20">
                    <svg className="h-5 w-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-rose-400">
                    Cancel Class?
                  </h2>
                </div>
                <p className="mt-4 text-sm text-slate-400">
                  This will cancel <strong className="text-white">{modal.classItem.title}</strong> and
                  notify all attendees. This action cannot be undone.
                </p>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
                    onClick={handleCloseModal}
                  >
                    Keep class
                  </button>
                  <button
                    type="button"
                    className="rounded-full bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/30 transition hover:bg-rose-600"
                    onClick={handleCancelClass}
                  >
                    Cancel class
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
