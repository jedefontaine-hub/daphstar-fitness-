"use client";

import { useState } from "react";

type CompletedPassSession = {
  id: string;
  sessionNumber: number;
  classTitle: string;
  attendedDate: string;
};

type CompletedPass = {
  id: string;
  purchaseDate: string;
  completedDate: string;
  sessionsCount: number;
  sessions: CompletedPassSession[];
};

type CompletedPassHistoryProps = {
  passes: CompletedPass[];
};

export function CompletedPassHistory({ passes }: CompletedPassHistoryProps) {
  const [expandedPass, setExpandedPass] = useState<string | null>(null);

  if (passes.length === 0) {
    return null;
  }

  const formatDate = (isoDate: string) => {
    const d = new Date(isoDate);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatShortDate = (isoDate: string) => {
    const d = new Date(isoDate);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
          <svg className="h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Completed Passes</h3>
          <p className="text-sm text-slate-400">{passes.length} pass{passes.length > 1 ? "es" : ""} completed</p>
        </div>
      </div>

      <div className="space-y-3">
        {passes.map((pass) => {
          const isExpanded = expandedPass === pass.id;

          return (
            <div
              key={pass.id}
              className="rounded-xl border border-white/10 bg-white/5 overflow-hidden transition"
            >
              {/* Summary Header */}
              <button
                onClick={() => setExpandedPass(isExpanded ? null : pass.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/20">
                    <span className="text-lg font-bold text-emerald-400">{pass.sessionsCount}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-white">
                      {pass.sessionsCount} Sessions Completed
                    </p>
                    <p className="text-sm text-slate-400">
                      {formatDate(pass.purchaseDate)} → {formatDate(pass.completedDate)}
                    </p>
                  </div>
                </div>
                <svg
                  className={`h-5 w-5 text-slate-400 transition-transform ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-white/10 p-4 bg-white/[0.02]">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                    Sessions Attended
                  </p>
                  <div className="grid gap-2">
                    {pass.sessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-7 w-7 items-center justify-center rounded bg-emerald-500/20 text-xs font-bold text-emerald-400">
                            {session.sessionNumber}
                          </div>
                          <p className="text-sm font-medium text-white">{session.classTitle}</p>
                        </div>
                        <p className="text-xs text-slate-400">{formatShortDate(session.attendedDate)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
