"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  match?: (pathname: string) => boolean;
  icon: React.ReactNode;
};

function IconHome({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M10 21v-6h4v6" />
    </svg>
  );
}

function IconPosts({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M8 6h13" />
      <path d="M8 12h13" />
      <path d="M8 18h13" />
      <path d="M3 6h.01" />
      <path d="M3 12h.01" />
      <path d="M3 18h.01" />
    </svg>
  );
}

function IconSongs({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

function IconBible({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M12 6v8" />
      <path d="M9 9h6" />
    </svg>
  );
}

function IconMore({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

const items: NavItem[] = [
  {
    href: "/",
    label: "Home",
    match: (p) => p === "/",
    icon: <IconHome />,
  },
  {
    href: "/posts",
    label: "Posts",
    match: (p) => p.startsWith("/posts"),
    icon: <IconPosts />,
  },
  {
    href: "/songs",
    label: "Songs",
    match: (p) => p.startsWith("/songs"),
    icon: <IconSongs />,
  },
  {
    href: "/bible",
    label: "Bible",
    match: (p) => p.startsWith("/bible"),
    icon: <IconBible />,
  },
  {
    href: "/more",
    label: "More",
    match: (p) =>
      p.startsWith("/more") ||
      p.startsWith("/media") ||
      p.startsWith("/sermons") ||
      p.startsWith("/events") ||
      p.startsWith("/announcements") ||
      p.startsWith("/guidance"),
    icon: <IconMore />,
  },
];

export default function MobileNav() {
  const pathname = usePathname() || "/";

  return (
    <nav
      className="fixed bottom-4 left-1/2 z-50 w-[92%] max-w-md -translate-x-1/2 rounded-2xl border border-harvest-gold/30 bg-[#0b1220]/95 text-slate-200 shadow-xl backdrop-blur-md"
      aria-label="Primary"
    >
      <ul className="flex items-stretch justify-between px-1.5 py-1.5">
        {items.map((item) => {
          const active = item.match ? item.match(pathname) : pathname === item.href;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] font-medium transition-colors ${
                  active
                    ? "bg-white/10 text-emerald-300"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                }`}
              >
                <span className={active ? "text-emerald-300" : "text-current"}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
