"use client";


import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/lib/session-context";

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { customer, logout } = useSession();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  // Move Profile to the far left and Admin to the far right
  const profileItem = {
    href: customer ? "/profile" : "/login",
    label: "Profile",
    icon: (active: boolean) => (
      <svg className="h-6 w-6" fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  };
  const adminItem = {
    href: "/admin",
    label: "Admin",
    icon: (active: boolean) => (
      // Admin icon: user with gear and window
      <svg className="h-6 w-6" viewBox="0 0 512 512" fill="none" stroke={active ? "#14b8a6" : "currentColor"} strokeWidth="2">
        {/* Window */}
        <rect x="200" y="40" width="272" height="160" rx="16" fill="none" stroke="currentColor" strokeWidth="24" />
        {/* Gear */}
        <g>
          <circle cx="392" cy="264" r="40" fill="none" stroke="currentColor" strokeWidth="24" />
          <path d="M392 224v-24m0 104v-24m40-40h24m-104 0h24m17-17l17-17m-17 97l17 17m-97-17l-17 17m17-97l-17-17" stroke="currentColor" strokeWidth="16" />
        </g>
        {/* User */}
        <circle cx="104" cy="192" r="56" fill="none" stroke="currentColor" strokeWidth="24" />
        <rect x="48" y="264" width="112" height="80" rx="40" fill="none" stroke="currentColor" strokeWidth="24" />
      </svg>
    ),
  };
  const statsItem = {
    href: "/dashboard", // or the correct stats page route
    label: "Stats",
    icon: (active: boolean) => (
      // Stats icon: bar chart (matching provided black icon)
      <svg className="h-6 w-6" viewBox="0 0 512 512" fill="none" stroke={active ? "#f59e42" : "currentColor"} strokeWidth="2">
        <rect x="64" y="320" width="48" height="96" rx="8" fill="none" stroke="currentColor" strokeWidth="32" />
        <rect x="176" y="224" width="48" height="192" rx="8" fill="none" stroke="currentColor" strokeWidth="32" />
        <rect x="288" y="288" width="48" height="128" rx="8" fill="none" stroke="currentColor" strokeWidth="32" />
        <rect x="400" y="160" width="48" height="256" rx="8" fill="none" stroke="currentColor" strokeWidth="32" />
      </svg>
    ),
  };
  // Remove statsItem from navItems
  const navItems = [
    profileItem,
    {
      href: "/",
      label: "Home",
      icon: (active: boolean) => (
        <svg className="h-6 w-6" fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d={active ? "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" : "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"} />
        </svg>
      ),
    },
    {
      href: "/calendar",
      label: "Calendar",
      icon: (active: boolean) => (
        <svg className="h-6 w-6" fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      href: "/my-bookings",
      label: "Bookings",
      icon: (active: boolean) => (
        <svg className="h-6 w-6" fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      ),
    },
    statsItem,
    adminItem,
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-lg border-t border-white/10 px-6 py-2 z-50">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Profile (far left) */}
        <div className="flex-1 flex justify-start">
          <Link
            key={navItems[0].href}
            href={navItems[0].href}
            className={`flex flex-col items-center gap-1 py-2 transition ${
              (pathname === navItems[0].href || (navItems[0].href === "/profile" && pathname === "/login")) ? "text-teal-400" : "text-white/60 hover:text-white"
            }`}
          >
            {navItems[0].icon(pathname === navItems[0].href || (navItems[0].href === "/profile" && pathname === "/login"))}
            <span className={`text-xs ${(pathname === navItems[0].href || (navItems[0].href === "/profile" && pathname === "/login")) ? "font-medium" : ""}`}>{navItems[0].label}</span>
          </Link>
        </div>
        {/* Center navs */}
        <div className="flex-1 flex justify-center gap-6">
          {navItems.slice(1, -1).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 py-2 transition ${
                  isActive ? "text-teal-400" : "text-white/60 hover:text-white"
                }`}
              >
                {item.icon(isActive)}
                <span className={`text-xs ${isActive ? "font-medium" : ""}`}>{item.label}</span>
              </Link>
            );
          })}
        </div>
        {/* Admin (far right) */}
        <div className="flex-1 flex justify-end">
          <Link
            key={navItems[navItems.length-1].href}
            href={navItems[navItems.length-1].href}
            className={`flex flex-col items-center gap-1 py-2 transition ${
              pathname === navItems[navItems.length-1].href ? "text-teal-400" : "text-white/60 hover:text-white"
            }`}
          >
            {navItems[navItems.length-1].icon(pathname === navItems[navItems.length-1].href)}
            <span className={`text-xs ${pathname === navItems[navItems.length-1].href ? "font-medium" : ""}`}>{navItems[navItems.length-1].label}</span>
          </Link>
        </div>
        {/* Logout button, only show if logged in */}
        {customer && (
          <button
            onClick={handleLogout}
            className="flex flex-col items-center gap-1 py-2 transition text-white/60 hover:text-red-400 focus:outline-none ml-4"
            style={{ background: "none", border: "none" }}
            aria-label="Sign Out"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" />
            </svg>
            <span className="text-xs">Sign Out</span>
          </button>
        )}
      </div>
    </nav>
  );
}

export default BottomNav;
