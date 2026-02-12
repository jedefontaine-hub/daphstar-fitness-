"use client";

type SessionPassHistory = {
  id: string;
  sessionNumber: number;
  classTitle: string;
  attendedDate: string;
};

type SessionPassTrackerProps = {
  remaining: number;
  total: number;
  purchaseDate?: string;
  history: SessionPassHistory[];
};

export function SessionPassTracker({
  remaining,
  total,
  purchaseDate,
  history,
}: SessionPassTrackerProps) {
  const used = total - remaining;
  const isExpired = remaining === 0;
  const isLowBalance = remaining > 0 && remaining <= 2;

  // Create an array of sessions with their status
  const sessions = Array.from({ length: total }, (_, i) => {
    const sessionNumber = i + 1;
    const sessionHistory = history.find((h) => h.sessionNumber === sessionNumber);
    return {
      number: sessionNumber,
      attended: !!sessionHistory,
      classTitle: sessionHistory?.classTitle,
      date: sessionHistory?.attendedDate,
    };
  });

  const formatDate = (isoDate?: string) => {
    if (!isoDate) return "";
    const d = new Date(isoDate);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div
      className={`glass-card rounded-2xl p-6 border-2 ${
        isExpired
          ? "border-red-500/50 bg-red-500/5"
          : isLowBalance
          ? "border-amber-500/50 bg-amber-500/5"
          : "border-teal-500/30"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-white">
            {isExpired ? "🚫 Session Pass Expired" : "📋 Session Pass"}
          </h3>
          {purchaseDate && (
            <p className="text-sm text-slate-400 mt-1">
              Purchased: {formatDate(purchaseDate)}
            </p>
          )}
        </div>
        <div className="text-right">
          <p
            className={`text-3xl font-bold ${
              isExpired
                ? "text-red-400"
                : isLowBalance
                ? "text-amber-400"
                : "text-teal-400"
            }`}
          >
            {remaining}/{total}
          </p>
          <p className="text-sm text-slate-400">Sessions Left</p>
        </div>
      </div>

      {/* Alert Messages */}
      {isExpired && (
        <div className="mb-4 rounded-xl bg-red-500/20 border border-red-500/30 px-4 py-3">
          <p className="text-red-300 font-medium">
            ⚠️ Your session pass has expired. Please purchase a new pass to continue
            booking classes.
          </p>
        </div>
      )}

      {isLowBalance && !isExpired && (
        <div className="mb-4 rounded-xl bg-amber-500/20 border border-amber-500/30 px-4 py-3">
          <p className="text-amber-300 font-medium">
            ⚠️ You have {remaining} session{remaining > 1 ? "s" : ""} remaining. Consider
            purchasing your next pass soon!
          </p>
        </div>
      )}

      {/* Visual Session Tracker - Compact Single Row */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {sessions.map((session) => (
          <div key={session.number} className="relative group flex-shrink-0">
            <div
              className={`w-14 h-14 rounded-lg flex items-center justify-center border-2 transition ${
                session.attended
                  ? "bg-teal-500/20 border-teal-500 text-teal-400"
                  : "bg-white/5 border-white/10 text-slate-500"
              }`}
            >
              {session.attended ? (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <span className="text-base font-bold">{session.number}</span>
              )}
            </div>

            {/* Tooltip on hover */}
            {session.attended && session.classTitle && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                <div className="bg-slate-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-xl border border-white/10">
                  <p className="font-medium">{session.classTitle}</p>
                  <p className="text-slate-400 mt-1">{formatDate(session.date)}</p>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                    <div className="border-4 border-transparent border-t-slate-900" />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isExpired
                ? "bg-red-500"
                : isLowBalance
                ? "bg-amber-500"
                : "bg-teal-500"
            }`}
            style={{ width: `${(used / total) * 100}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-2 text-center">
          {used} of {total} sessions used
        </p>
      </div>
    </div>
  );
}
