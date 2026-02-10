"use client";

import { useSession } from "@/lib/session-context";
import Link from "next/link";
import { getInitials } from "@/lib/constants";

export default function GlobalProfileButton() {
  const { customer } = useSession();
  if (!customer) return null;
  return (
    <div style={{ position: "fixed", top: 24, right: 24, zIndex: 100 }}>
      <Link href="/profile" className="flex items-center gap-2 rounded-full bg-teal-500/20 border border-teal-400/50 px-3 py-1.5 backdrop-blur-sm hover:bg-teal-500/30 transition shadow-lg">
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-sm font-bold text-slate-900">
          {getInitials(customer.name)}
        </div>
        <span className="text-sm font-medium text-teal-300 hidden sm:inline">{customer.name.split(' ')[0]}</span>
      </Link>
    </div>
  );
}
