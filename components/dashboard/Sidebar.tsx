import Link from "next/link";
import { logoutAction } from "@/app/login/actions";
import { roleLabel } from "@/lib/auth/roles";
import type { RoleName } from "@/lib/auth/types";

const staffLinks = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/posts", label: "Posts" },
  { href: "/dashboard/announcements", label: "Announcements" },
  { href: "/dashboard/events", label: "Events" },
  { href: "/dashboard/sermons", label: "Sermons" },
  { href: "/dashboard/media", label: "Media" },
  { href: "/dashboard/worship", label: "Worship" },
  { href: "/dashboard/birthdays", label: "Birthdays" },
];

const superLinks = [
  { href: "/dashboard/users", label: "User Management" },
  { href: "/dashboard/stats", label: "Statistics" },
  { href: "/dashboard/audit", label: "Audit Logs" },
];

export default function DashboardSidebar({
  name,
  email,
  role,
}: {
  name: string;
  email: string;
  role: RoleName;
}) {
  const isSuper = role === "SUPER_ADMIN";

  return (
    <aside className="w-64 shrink-0 border-r border-white/10 bg-[#0f1f17] text-slate-100 flex flex-col">
      <div className="px-5 py-6 border-b border-white/10">
        <p className="text-xs uppercase tracking-wider text-emerald-300/80">Harvest Souls</p>
        <h1 className="mt-1 text-lg font-semibold text-white">Control Center</h1>
        <span className="mt-3 inline-block rounded-md bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-200">
          {roleLabel(role)}
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <p className="px-2 pb-1 text-[11px] uppercase tracking-wide text-slate-400">Content</p>
        {staffLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="block rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-white/10 transition-colors"
          >
            {link.label}
          </Link>
        ))}

        {isSuper ? (
          <>
            <p className="px-2 pt-4 pb-1 text-[11px] uppercase tracking-wide text-slate-400">
              Super Admin
            </p>
            {superLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-white/10 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </>
        ) : null}
      </nav>

      <div className="border-t border-white/10 px-4 py-4 space-y-3">
        <div>
          <p className="text-sm font-medium text-white truncate">{name}</p>
          <p className="text-xs text-slate-400 truncate">{email}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/"
            className="flex-1 text-center rounded-lg border border-white/15 px-2 py-1.5 text-xs hover:bg-white/10"
          >
            Site
          </Link>
          <form action={logoutAction} className="flex-1">
            <button
              type="submit"
              className="w-full rounded-lg bg-red-500/20 text-red-200 px-2 py-1.5 text-xs hover:bg-red-500/30"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
