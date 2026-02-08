"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type LoginStatus =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "error"; message: string };

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<LoginStatus>({ state: "idle" });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!password) {
      setStatus({ state: "error", message: "Please enter the admin password." });
      return;
    }

    setStatus({ state: "loading" });
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        setStatus({ state: "error", message: "Invalid password." });
        return;
      }

      router.push("/admin");
    } catch {
      setStatus({ state: "error", message: "Login failed. Try again." });
    }
  };

  return (
    <div className="min-h-screen bg-grid flex items-center justify-center px-6 py-10">
      {/* Gradient orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-purple-500/20 blur-[100px]" />
        <div className="absolute -right-40 top-1/3 h-80 w-80 rounded-full bg-fuchsia-500/15 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="glass-card rounded-3xl p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20">
              <svg className="h-7 w-7 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="gradient-text text-2xl font-bold">Admin Login</h1>
            <p className="mt-2 text-sm text-slate-400">
              Enter your password to access the dashboard
            </p>
          </div>

          <form className="grid gap-5" onSubmit={handleSubmit}>
            <label className="grid gap-2 text-sm font-medium text-slate-300">
              Password
              <input
                className="input-dark h-12 rounded-xl px-4 text-sm"
                placeholder="••••••••"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            {status.state === "error" ? (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                {status.message}
              </div>
            ) : null}

            <button
              className="btn-glow mt-2 h-12 rounded-full text-sm font-semibold text-white disabled:opacity-50"
              type="submit"
              disabled={status.state === "loading"}
            >
              {status.state === "loading" ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            Default password: <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono">admin123</code>
          </p>
        </div>

        <a href="/" className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to schedule
        </a>
      </div>
    </div>
  );
}
