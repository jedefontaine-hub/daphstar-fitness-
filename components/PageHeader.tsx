"use client";

import Link from "next/link";
import { useSession } from "@/lib/session-context";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

// Icons as components for reusability
export function CalendarIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

export function BookmarkIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  );
}

export function DashboardIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}

export function UserIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

export function LogoutIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}

export function LoginIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
    </svg>
  );
}

export function ChevronLeftIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

export function ChevronRightIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

interface PageHeaderProps {
  title?: string;
  subtitle?: string;
  showNav?: boolean;
  showBackLink?: boolean;
  backHref?: string;
  backLabel?: string;
  variant?: "light" | "dark";
  maxWidth?: "sm" | "md" | "lg" | "xl" | "3xl" | "5xl" | "6xl";
  rightContent?: React.ReactNode;
}

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "3xl": "max-w-3xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
};

export function PageHeader({
  title = APP_NAME,
  subtitle = APP_TAGLINE,
  showNav = true,
  showBackLink = false,
  backHref = "/",
  backLabel = "Back",
  variant = "light",
  maxWidth = "3xl",
  rightContent,
}: PageHeaderProps) {
  const { customer, logout } = useSession();

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  const isLight = variant === "light";
  const headerBg = isLight ? "bg-white border-b border-gray-200" : "bg-white/80 backdrop-blur-xl border-b border-slate-200";
  const titleColor = isLight ? "text-gray-900" : "text-slate-800";
  const subtitleColor = isLight ? "text-gray-500" : "text-slate-500";
  const navLinkClass = isLight
    ? "flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
    : "flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100";

  return (
    <header className={`${headerBg} sticky top-0 z-10`}>
      <div className={`mx-auto flex items-center justify-between px-4 py-4 ${maxWidthClasses[maxWidth]}`}>
        {showBackLink ? (
          <Link href={backHref} className="text-gray-600 hover:text-[#2196F3] flex items-center gap-2">
            <ChevronLeftIcon />
            {backLabel}
          </Link>
        ) : (
          <div>
            <h1 className={`text-xl font-bold ${titleColor}`}>{title}</h1>
            {subtitle && <p className={`text-sm ${subtitleColor}`}>{subtitle}</p>}
          </div>
        )}

        {showBackLink && (
          <h1 className={`text-xl font-bold ${titleColor}`}>{title}</h1>
        )}

        {rightContent ? (
          rightContent
        ) : showNav ? (
          <nav className="flex items-center gap-2">
            <Link href="/calendar" className={navLinkClass}>
              <CalendarIcon />
              Calendar
            </Link>
            <Link href="/my-bookings" className={`${navLinkClass} whitespace-nowrap`}>
              <BookmarkIcon />
              Bookings
            </Link>
            {customer ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100"
                >
                  <DashboardIcon />
                  Dashboard
                </Link>
                <Link href="/profile" className={`${navLinkClass} whitespace-nowrap`}>
                  <UserIcon />
                  Profile
                </Link>
                <button onClick={handleLogout} className={navLinkClass}>
                  <LogoutIcon />
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 rounded-lg bg-blue-500 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-600"
              >
                <LoginIcon />
                Login
              </Link>
            )}
          </nav>
        ) : (
          <div className="w-16"></div>
        )}
      </div>
    </header>
  );
}

export default PageHeader;
