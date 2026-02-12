"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session-context";

type AuthMode = "login" | "register";

type AuthStatus =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "error"; message: string };

export default function LoginPage() {
  const router = useRouter();
  const { customer, isLoading } = useSession();
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [retirementVillage, setRetirementVillage] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [status, setStatus] = useState<AuthStatus>({ state: "idle" });

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && customer) {
      router.push("/dashboard");
    }
  }, [customer, isLoading, router]);

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
    if (mode === "register" && !termsAccepted) {
      setStatus({ state: "error", message: "Please accept the terms and conditions to continue." });
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

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-3 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  // Don't render if logged in (will redirect)
  if (customer) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 px-6 py-10">
      {/* Soft decorative shapes */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-teal-500/20 blur-[100px]" />
        <div className="absolute -right-40 top-1/3 h-80 w-80 rounded-full bg-cyan-500/10 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-md">
        <div className="mb-8 text-center">
          <a href="/" className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-400 hover:text-teal-300 transition">
            Daphstar Fitness
          </a>
          <h1 className="mt-4 gradient-text text-3xl font-bold">
            {mode === "login" ? "Welcome Back" : "Join Us"}
          </h1>
          <p className="mt-3 text-lg text-slate-400">
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
              className={`flex-1 rounded-lg py-3 text-base font-medium transition ${
                mode === "login"
                  ? "bg-teal-500 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode("register")}
              className={`flex-1 rounded-lg py-3 text-base font-medium transition ${
                mode === "register"
                  ? "bg-teal-500 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === "register" && (
              <label className="grid gap-2 text-base font-medium text-slate-300">
                Full Name
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-dark h-14 rounded-xl px-4 text-base"
                  placeholder="Margaret Wilson"
                />
              </label>
            )}

            <label className="grid gap-2 text-base font-medium text-slate-300">
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-dark h-14 rounded-xl px-4 text-base"
                placeholder="margaret@example.com"
              />
            </label>

            <label className="grid gap-2 text-base font-medium text-slate-300">
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-dark h-14 rounded-xl px-4 text-base"
                placeholder={mode === "register" ? "At least 6 characters" : "••••••••"}
              />
            </label>

            {mode === "register" && (
              <label className="grid gap-2 text-base font-medium text-slate-300">
                Retirement Village
                <select
                  value={retirementVillage}
                  onChange={(e) => setRetirementVillage(e.target.value)}
                  className="input-dark h-14 rounded-xl px-4 text-base"
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

            {mode === "register" && (
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-white/20 bg-white/10 text-teal-500 focus:ring-teal-500 focus:ring-offset-0"
                />
                <span className="text-sm text-slate-300 leading-relaxed">
                  I agree to the{" "}
                  <a
                    href="/terms"
                    target="_blank"
                    className="text-teal-400 hover:text-teal-300 underline font-medium"
                  >
                    Terms & Conditions
                  </a>
                  {" "}and{" "}
                  <a
                    href="/privacy"
                    target="_blank"
                    className="text-teal-400 hover:text-teal-300 underline font-medium"
                  >
                    Privacy Policy
                  </a>
                </span>
              </label>
            )}

            {status.state === "error" && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/20 px-5 py-4 text-base text-red-300">
                {status.message}
              </div>
            )}

            <button
              type="submit"
              disabled={status.state === "loading"}
              className="btn-glow w-full h-14 rounded-full text-base font-semibold text-white"
            >
              {status.state === "loading" ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
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
            <p className="mt-6 text-center text-base text-slate-400">
              Demo: <code className="text-teal-400 bg-teal-500/20 px-2 py-1 rounded">margaret@example.com</code> / <code className="text-teal-400 bg-teal-500/20 px-2 py-1 rounded">password123</code>
            </p>
          )}
        </div>

        <p className="mt-6 text-center text-base text-slate-400">
          <a href="/" className="text-teal-400 hover:text-teal-300 transition font-medium">
            ← Back to schedule
          </a>
        </p>
      </div>
    </div>
  );
}
