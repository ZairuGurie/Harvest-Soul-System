"use client";

import Link from "next/link";
import { useState } from "react";
import Logo from "@/components/brand/Logo";
import { roleLabel } from "@/lib/auth/roles";
import type { RoleName } from "@/lib/auth/types";

const navLinkClass =
  "px-2 py-1 rounded text-harvest-green-dark dark:text-emerald-200 hover:bg-harvest-green/10 dark:hover:bg-harvest-green/20 transition-colors";

type HeaderUser = {
  name: string;
  role: RoleName;
  isStaff: boolean;
} | null;

export default function Header({ user = null }: { user?: HeaderUser }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="w-full bg-harvest-cream/90 dark:bg-slate-900/90 backdrop-blur sticky top-0 z-40 border-b border-harvest-gold/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Logo size={44} />
            <nav className="hidden md:flex items-center gap-1 text-sm">
              <Link href="/posts" className={navLinkClass}>Posts</Link>
              <Link href="/media" className={navLinkClass}>Media</Link>
              <Link href="/sermons" className={navLinkClass}>Sermons</Link>
              <Link href="/songs" className={navLinkClass}>Songs</Link>
              <Link href="/bible" className={navLinkClass}>Bible</Link>
              <Link href="/events" className={navLinkClass}>Events</Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/search"
              className="hidden sm:inline-flex px-3 py-1 rounded text-sm border border-harvest-blue/20 text-harvest-blue-dark dark:text-sky-200 hover:bg-harvest-blue/10"
            >
              Search
            </Link>
            {user?.isStaff ? (
              <Link
                href="/dashboard"
                className="px-3 py-1.5 rounded text-sm font-medium text-white bg-harvest-gradient hover:opacity-90 shadow-sm"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                className="px-3 py-1.5 rounded text-sm font-medium text-white bg-harvest-gradient hover:opacity-90 shadow-sm"
              >
                Login
              </Link>
            )}

            <button
              className="md:hidden p-2 rounded hover:bg-harvest-green/10 dark:hover:bg-slate-800"
              aria-label="Toggle menu"
              onClick={() => setOpen((v) => !v)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-harvest-blue dark:text-sky-200">
                {open ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M3 12h18M3 6h18M3 18h18" />
                )}
              </svg>
            </button>
          </div>
        </div>
        {open && (
          <div className="md:hidden py-2 border-t border-harvest-gold/20">
            <nav className="flex flex-col gap-1">
              <Link href="/posts" className={`block px-3 py-2 ${navLinkClass}`}>Posts</Link>
              <Link href="/media" className={`block px-3 py-2 ${navLinkClass}`}>Media</Link>
              <Link href="/sermons" className={`block px-3 py-2 ${navLinkClass}`}>Sermons</Link>
              <Link href="/songs" className={`block px-3 py-2 ${navLinkClass}`}>Songs</Link>
              <Link href="/bible" className={`block px-3 py-2 ${navLinkClass}`}>Bible</Link>
              <Link href="/events" className={`block px-3 py-2 ${navLinkClass}`}>Events</Link>
              {user?.isStaff ? (
                <Link href="/dashboard" className="block px-3 py-2 rounded text-center text-white bg-harvest-gradient mt-1">
                  Dashboard ({roleLabel(user.role)})
                </Link>
              ) : (
                <Link href="/login" className="block px-3 py-2 rounded text-center text-white bg-harvest-gradient mt-1">
                  Login
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
