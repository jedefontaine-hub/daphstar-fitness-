import AdminTopBar from "@/components/admin/AdminTopBar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="sticky top-0 z-50 border-b border-slate-800/50 bg-slate-950/80 px-4 py-2 backdrop-blur">
        <div className="mx-auto max-w-6xl">
          <AdminTopBar compact />
        </div>
      </div>
      {children}
    </>
  );
}
