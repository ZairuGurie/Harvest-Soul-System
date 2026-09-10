"use client";

import Link from "next/link";
import { useState } from "react";
import Logo from "@/components/brand/Logo";
import { roleLabel } from "@/lib/auth/roles";
import type { RoleName } from "@/lib/auth/types";

const navLinkClass =
  "hs-motion px-2.5 py-1.5 rounded-lg text-harvest-green-dark dark:text-emerald-200 hover:bg-harvest-green/10 hover:text-harvest-blue-dark dark:hover:bg-harvest-green/20 dark:hover:text-emerald-100";

type HeaderUser = {
  name: string;
  role: RoleName;
  isStaff: boolean;
} | null;

export default function Header({ user = null }: { user?: HeaderUser }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-harvest-gold/30 bg-harvest-cream/90 backdrop-blur transition-shadow duration-300 dark:bg-slate-900/90">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo size={44} />
            <nav className="hidden items-center gap-0.5 text-sm md:flex">
              <Link href="/posts" className={navLinkClass}>
                Posts
              </Link>
              <Link href="/media" className={navLinkClass}>
                Media
              </Link>
              <Link href="/sermons" className={navLinkClass}>
                Sermons
              </Link>
              <Link href="/songs" className={navLinkClass}>
                Songs
              </Link>
              <Link href="/bible" className={navLinkClass}>
                Bible
              </Link>
              <Link href="/guidance" className={navLinkClass}>
                Guidance
              </Link>
              <Link href="/game" className={navLinkClass}>
                Game
              </Link>
              <Link href="/events" className={navLinkClass}>
                Events
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/search"
              className="hs-motion hidden rounded-lg border border-harvest-blue/20 px-3 py-1.5 text-sm text-harvest-blue-dark hover:border-harvest-blue/40 hover:bg-harvest-blue/10 sm:inline-flex dark:text-sky-200 dark:hover:border-sky-500/40"
            >
              Search
            </Link>
            {user?.isStaff ? (
              <Link
                href="/dashboard"
                className="hs-motion rounded-lg bg-harvest-gradient px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:-translate-y-0.5 hover:opacity-95 hover:shadow-md active:translate-y-0"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                className="hs-motion rounded-lg bg-harvest-gradient px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:-translate-y-0.5 hover:opacity-95 hover:shadow-md active:translate-y-0"
              >
                Login
              </Link>
            )}

            <button
              className="hs-motion rounded-lg p-2 hover:bg-harvest-green/10 md:hidden dark:hover:bg-slate-800"
              aria-label="Toggle menu"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-harvest-blue dark:text-sky-200"
              >
                {open ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M3 12h18M3 6h18M3 18h18" />
                )}
              </svg>
            </button>
          </div>
        </div>
        {open ? (
          <div className="animate-hs-fade-up border-t border-harvest-gold/20 py-2 md:hidden">
            <nav className="flex flex-col gap-1">
              <Link href="/posts" className={`block px-3 py-2.5 ${navLinkClass}`}>
                Posts
              </Link>
              <Link href="/media" className={`block px-3 py-2.5 ${navLinkClass}`}>
                Media
              </Link>
              <Link href="/sermons" className={`block px-3 py-2.5 ${navLinkClass}`}>
                Sermons
              </Link>
              <Link href="/songs" className={`block px-3 py-2.5 ${navLinkClass}`}>
                Songs
              </Link>
              <Link href="/bible" className={`block px-3 py-2.5 ${navLinkClass}`}>
                Bible
              </Link>
              <Link href="/guidance" className={`block px-3 py-2.5 ${navLinkClass}`}>
                Guidance
              </Link>
              <Link href="/game" className={`block px-3 py-2.5 ${navLinkClass}`}>
                Game
              </Link>
              <Link href="/events" className={`block px-3 py-2.5 ${navLinkClass}`}>
                Events
              </Link>
              {user?.isStaff ? (
                <Link
                  href="/dashboard"
                  className="hs-motion mt-1 block rounded-lg bg-harvest-gradient px-3 py-2.5 text-center text-white hover:opacity-95"
                >
                  Dashboard ({roleLabel(user.role)})
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="hs-motion mt-1 block rounded-lg bg-harvest-gradient px-3 py-2.5 text-center text-white hover:opacity-95"
                >
                  Login
                </Link>
              )}
            </nav>
          </div>
        ) : null}
      </div>
    </header>
  );
}
