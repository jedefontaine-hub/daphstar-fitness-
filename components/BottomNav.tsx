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

  const navItems = [
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
    {
      href: "/admin",
      label: "Admin",
      icon: (active: boolean) => (
        <svg className="h-6 w-6" fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      ),
    },
    {
      href: customer ? "/profile" : "/login",
      label: "Profile",
      icon: (active: boolean) => (
        <svg className="h-6 w-6" fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-lg border-t border-white/10 px-6 py-2 z-50">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href === "/profile" && pathname === "/login");
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
        {/* Logout button, only show if logged in */}
        {customer && (
          <button
            onClick={handleLogout}
            className="flex flex-col items-center gap-1 py-2 transition text-white/60 hover:text-red-400 focus:outline-none"
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
