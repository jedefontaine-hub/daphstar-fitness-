"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AuthMode = "login" | "register";

type AuthStatus =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "error"; message: string };

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [retirementVillage, setRetirementVillage] = useState("");
  const [status, setStatus] = useState<AuthStatus>({ state: "idle" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === "register" && !name.trim()) {
      setStatus({ state: "error", message: "Please enter your name." });
      return;
    }
    if (!email.trim()) {
      setStatus({ state: "error", message: "Please enter your email." });
      return;
    }
    if (!password) {
      setStatus({ state: "error", message: "Please enter your password." });
      return;
    }
    if (mode === "register" && password.length < 6) {
      setStatus({ state: "error", message: "Password must be at least 6 characters." });
      return;
    }

    setStatus({ state: "loading" });

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body = mode === "login"
        ? { email, password }
        : { name, email, password, retirementVillage: retirementVillage || undefined };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.error === "email_exists") {
          setStatus({ state: "error", message: "An account with this email already exists." });
        } else if (data.error === "invalid_credentials") {
          setStatus({ state: "error", message: "Invalid email or password." });
        } else {
          setStatus({ state: "error", message: "Something went wrong. Please try again." });
        }
        return;
      }

      // Success - redirect to home or booking page
      router.push("/");
      router.refresh();
    } catch {
      setStatus({ state: "error", message: "Unable to connect. Please try again." });
    }
  };

  return (
    <div className="min-h-screen bg-grid px-6 py-10">
      {/* Gradient orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-purple-500/20 blur-[100px]" />
        <div className="absolute -right-40 top-1/3 h-80 w-80 rounded-full bg-fuchsia-500/15 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-md">
        <div className="mb-8 text-center">
          <a href="/" className="text-xs font-medium uppercase tracking-[0.3em] text-purple-400 hover:text-purple-300 transition">
            Daphstar Fitness
          </a>
          <h1 className="mt-4 gradient-text text-3xl font-bold">
            {mode === "login" ? "Welcome Back" : "Join Us"}
          </h1>
          <p className="mt-2 text-slate-400">
            {mode === "login"
              ? "Sign in to book classes and manage your bookings."
              : "Create an account to start booking fitness classes."}
          </p>
        </div>

        <div className="glass-card rounded-3xl p-8">
          {/* Tab toggle */}
          <div className="mb-6 flex rounded-xl border border-white/10 bg-white/5 p-1">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition ${
                mode === "login"
                  ? "bg-purple-500/30 text-purple-300"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode("register")}
              className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition ${
                mode === "register"
                  ? "bg-purple-500/30 text-purple-300"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === "register" && (
              <label className="grid gap-2 text-sm font-medium text-slate-300">
                Full Name
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-dark h-12 rounded-xl px-4 text-sm"
                  placeholder="Margaret Wilson"
                />
              </label>
            )}

            <label className="grid gap-2 text-sm font-medium text-slate-300">
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-dark h-12 rounded-xl px-4 text-sm"
                placeholder="margaret@example.com"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-300">
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-dark h-12 rounded-xl px-4 text-sm"
                placeholder={mode === "register" ? "At least 6 characters" : "••••••••"}
              />
            </label>

            {mode === "register" && (
              <label className="grid gap-2 text-sm font-medium text-slate-300">
                Retirement Village
                <select
                  value={retirementVillage}
                  onChange={(e) => setRetirementVillage(e.target.value)}
                  className="input-dark h-12 rounded-xl px-4 text-sm"
                >
                  <option value="">Select your village (optional)</option>
                  <option value="Sunrise Village">Sunrise Village</option>
                  <option value="Oakwood Gardens">Oakwood Gardens</option>
                  <option value="Meadow Creek">Meadow Creek</option>
                  <option value="Lakeside Manor">Lakeside Manor</option>
                  <option value="Hillcrest Retirement">Hillcrest Retirement</option>
                  <option value="Independent">Independent / Other</option>
                </select>
              </label>
            )}

            {status.state === "error" && (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                {status.message}
              </div>
            )}

            <button
              type="submit"
              disabled={status.state === "loading"}
              className="btn-glow w-full h-12 rounded-full text-sm font-semibold text-white"
            >
              {status.state === "loading" ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  {mode === "login" ? "Signing in..." : "Creating account..."}
                </span>
              ) : mode === "login" ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {mode === "login" && (
            <p className="mt-6 text-center text-sm text-slate-400">
              Demo accounts: <code className="text-purple-400">margaret@example.com</code> / <code className="text-purple-400">password123</code>
            </p>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          <a href="/" className="text-purple-400 hover:text-purple-300 transition">
            ← Back to schedule
          </a>
        </p>
      </div>
    </div>
  );
}
