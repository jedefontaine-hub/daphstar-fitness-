// Skeleton loading components for smooth perceived loading

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded bg-gray-200 ${className}`}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({ lines = 1, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === lines - 1 && lines > 1 ? "w-3/4" : "w-full"}`}
        />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };
  return <Skeleton className={`rounded-full ${sizeClasses[size]}`} />;
}

export function SkeletonButton({ className = "" }: SkeletonProps) {
  return <Skeleton className={`h-10 w-24 rounded-lg ${className}`} />;
}

// Class card skeleton for home page
export function SkeletonClassCard() {
  return (
    <div className="flex items-center gap-4 rounded-lg bg-white p-4 shadow-sm">
      {/* Time column */}
      <div className="w-16 flex-shrink-0 text-center">
        <Skeleton className="mx-auto h-6 w-12 mb-1" />
        <Skeleton className="mx-auto h-3 w-10" />
      </div>
      
      {/* Class info */}
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      
      {/* Action button */}
      <Skeleton className="h-10 w-24 rounded-full" />
    </div>
  );
}

// Date header skeleton
export function SkeletonDateHeader() {
  return <Skeleton className="h-6 w-40 mb-2 mt-4" />;
}

// Schedule skeleton (multiple class cards grouped by date)
export function SkeletonSchedule({ days = 3, classesPerDay = 2 }: { days?: number; classesPerDay?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: days }).map((_, dayIndex) => (
        <div key={dayIndex}>
          <SkeletonDateHeader />
          <div className="space-y-1">
            {Array.from({ length: classesPerDay }).map((_, classIndex) => (
              <SkeletonClassCard key={classIndex} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Dashboard stats skeleton
export function SkeletonStats() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl bg-white p-4 shadow-sm">
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-8 w-12" />
        </div>
      ))}
    </div>
  );
}

// Booking card skeleton
export function SkeletonBookingCard() {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <SkeletonButton />
      </div>
    </div>
  );
}

// Leaderboard skeleton
export function SkeletonLeaderboard({ entries = 5 }: { entries?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: entries }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="text-right">
            <Skeleton className="h-6 w-8 ml-auto" />
            <Skeleton className="h-3 w-12 mt-1" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Calendar day skeleton
export function SkeletonCalendarDay() {
  return (
    <div className="min-h-[100px] rounded-lg border border-gray-100 bg-white p-2">
      <Skeleton className="h-4 w-6 mb-2" />
      <div className="space-y-1">
        <Skeleton className="h-6 w-full rounded" />
        <Skeleton className="h-6 w-full rounded" />
      </div>
    </div>
  );
}

// Profile form skeleton
export function SkeletonProfileForm() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i}>
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      ))}
      <Skeleton className="h-12 w-full rounded-lg mt-4" />
    </div>
  );
}

export default Skeleton;
