"use client";

import { signOut, useSession } from "next-auth/react";

type AdminTopBarProps = {
  compact?: boolean;
};

export default function AdminTopBar({ compact = false }: AdminTopBarProps) {
  const { data: session } = useSession();
  const userLabel = session?.user?.email || session?.user?.name || "admin";

  if (compact) {
    return (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 13, color: "#666" }}>Signed in as {userLabel}</div>
        <button
          onClick={() => {
            signOut({ callbackUrl: "/admin/login" });
          }}
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-500">Signed in as {userLabel}</span>
      <button
        type="button"
        onClick={() => {
          signOut({ callbackUrl: "/admin/login" });
        }}
        className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-300 backdrop-blur-sm transition hover:border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-300"
      >
        Sign out
      </button>
    </div>
  );
}
