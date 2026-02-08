interface EmptyStateProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  variant?: "calendar" | "bookings" | "search" | "error" | "generic";
}

const illustrations = {
  calendar: (
    <svg className="h-32 w-32" viewBox="0 0 128 128" fill="none">
      {/* Calendar body */}
      <rect x="20" y="30" width="88" height="78" rx="8" fill="#E3F2FD" stroke="#90CAF9" strokeWidth="2" />
      {/* Calendar header */}
      <rect x="20" y="30" width="88" height="20" rx="8" fill="#2196F3" />
      <rect x="20" y="42" width="88" height="8" fill="#2196F3" />
      {/* Calendar rings */}
      <rect x="38" y="24" width="4" height="12" rx="2" fill="#1976D2" />
      <rect x="86" y="24" width="4" height="12" rx="2" fill="#1976D2" />
      {/* Calendar grid dots */}
      <circle cx="40" cy="65" r="4" fill="#BBDEFB" />
      <circle cx="64" cy="65" r="4" fill="#BBDEFB" />
      <circle cx="88" cy="65" r="4" fill="#BBDEFB" />
      <circle cx="40" cy="85" r="4" fill="#BBDEFB" />
      <circle cx="64" cy="85" r="4" fill="#2196F3" />
      <circle cx="88" cy="85" r="4" fill="#BBDEFB" />
      {/* Sparkle */}
      <path d="M100 20L102 26L108 28L102 30L100 36L98 30L92 28L98 26L100 20Z" fill="#FFC107" />
    </svg>
  ),
  bookings: (
    <svg className="h-32 w-32" viewBox="0 0 128 128" fill="none">
      {/* Clipboard */}
      <rect x="30" y="20" width="68" height="90" rx="6" fill="#E8F5E9" stroke="#A5D6A7" strokeWidth="2" />
      {/* Clipboard clip */}
      <rect x="48" y="14" width="32" height="12" rx="4" fill="#4CAF50" />
      <rect x="54" y="10" width="20" height="8" rx="3" fill="#81C784" />
      {/* Lines */}
      <rect x="42" y="40" width="44" height="4" rx="2" fill="#C8E6C9" />
      <rect x="42" y="52" width="36" height="4" rx="2" fill="#C8E6C9" />
      <rect x="42" y="64" width="40" height="4" rx="2" fill="#C8E6C9" />
      {/* Checkmark circle */}
      <circle cx="64" cy="88" r="12" fill="#4CAF50" />
      <path d="M58 88L62 92L70 84" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  search: (
    <svg className="h-32 w-32" viewBox="0 0 128 128" fill="none">
      {/* Magnifying glass circle */}
      <circle cx="52" cy="52" r="30" fill="#FFF3E0" stroke="#FFB74D" strokeWidth="3" />
      <circle cx="52" cy="52" r="20" fill="#FFECB3" />
      {/* Handle */}
      <rect x="72" y="78" width="32" height="10" rx="5" transform="rotate(-45 72 78)" fill="#FF9800" />
      {/* Question mark */}
      <path d="M48 44C48 40 51 38 55 38C59 38 62 40 62 44C62 48 58 48 58 52" stroke="#FF9800" strokeWidth="3" strokeLinecap="round" />
      <circle cx="58" cy="60" r="2" fill="#FF9800" />
    </svg>
  ),
  error: (
    <svg className="h-32 w-32" viewBox="0 0 128 128" fill="none">
      {/* Cloud */}
      <ellipse cx="64" cy="60" rx="40" ry="30" fill="#FFEBEE" />
      <circle cx="40" cy="55" r="20" fill="#FFEBEE" />
      <circle cx="88" cy="55" r="20" fill="#FFEBEE" />
      {/* Rain drops */}
      <path d="M45 90L40 100" stroke="#EF9A9A" strokeWidth="3" strokeLinecap="round" />
      <path d="M64 95L59 105" stroke="#EF9A9A" strokeWidth="3" strokeLinecap="round" />
      <path d="M83 90L78 100" stroke="#EF9A9A" strokeWidth="3" strokeLinecap="round" />
      {/* Sad face */}
      <circle cx="52" cy="55" r="3" fill="#E57373" />
      <circle cx="76" cy="55" r="3" fill="#E57373" />
      <path d="M54 70C58 66 70 66 74 70" stroke="#E57373" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
  generic: (
    <svg className="h-32 w-32" viewBox="0 0 128 128" fill="none">
      {/* Box */}
      <rect x="30" y="40" width="68" height="60" rx="6" fill="#F3E5F5" stroke="#CE93D8" strokeWidth="2" />
      {/* Box flaps */}
      <path d="M30 46L64 30L98 46" stroke="#CE93D8" strokeWidth="2" fill="#E1BEE7" />
      {/* Sparkles */}
      <circle cx="50" cy="70" r="6" fill="#E1BEE7" />
      <circle cx="78" cy="70" r="6" fill="#E1BEE7" />
      <circle cx="64" cy="85" r="6" fill="#E1BEE7" />
      {/* Stars */}
      <path d="M20 30L22 36L28 38L22 40L20 46L18 40L12 38L18 36L20 30Z" fill="#FFC107" />
      <path d="M108 50L110 54L114 56L110 58L108 62L106 58L102 56L106 54L108 50Z" fill="#FFC107" />
    </svg>
  ),
};

export function EmptyState({ title, description, action, variant = "generic" }: EmptyStateProps) {
  const illustration = illustrations[variant];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {/* Illustration */}
      <div className="mb-6 animate-[float_3s_ease-in-out_infinite]">
        {illustration}
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>

      {/* Description */}
      {description && (
        <p className="text-gray-500 max-w-sm mb-6">{description}</p>
      )}

      {/* Action button */}
      {action && (
        action.href ? (
          <a
            href={action.href}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-600 transition-colors"
          >
            {action.label}
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        ) : (
          <button
            onClick={action.onClick}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-600 transition-colors"
          >
            {action.label}
          </button>
        )
      )}

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  );
}

// Specific empty states for common scenarios
export function NoClassesFound() {
  return (
    <EmptyState
      variant="calendar"
      title="No Classes Scheduled"
      description="There are no classes scheduled for this period. Check back soon!"
      action={{ label: "View Full Calendar", href: "/calendar" }}
    />
  );
}

export function NoBookingsFound() {
  return (
    <EmptyState
      variant="bookings"
      title="No Bookings Yet"
      description="You haven't booked any classes yet. Browse available classes to get started!"
      action={{ label: "Browse Classes", href: "/" }}
    />
  );
}

export function NoSearchResults() {
  return (
    <EmptyState
      variant="search"
      title="No Results Found"
      description="We couldn't find what you're looking for. Try adjusting your search or filters."
    />
  );
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      variant="error"
      title="Oops! Something Went Wrong"
      description="We're having trouble loading this content. Please try again."
      action={onRetry ? { label: "Try Again", onClick: onRetry } : undefined}
    />
  );
}

export default EmptyState;
