import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-900/80 py-8 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="text-sm text-slate-400">
            © {new Date().getFullYear()} Daphstar Fitness. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm">
            <Link
              href="/terms"
              className="text-slate-400 transition hover:text-teal-400"
            >
              Terms & Conditions
            </Link>
            <Link
              href="/privacy"
              className="text-slate-400 transition hover:text-teal-400"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
