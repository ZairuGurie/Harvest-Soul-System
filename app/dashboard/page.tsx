import Link from "next/link";
import { requireStaff } from "@/lib/auth/session";
import { isSuperAdmin } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/server";
import StatCard from "@/components/dashboard/StatCard";

export default async function DashboardPage() {
  const user = await requireStaff();
  const admin = createAdminClient();
  const superAdmin = isSuperAdmin(user.role);

  const [
    posts,
    announcements,
    events,
    sermons,
    media,
    profiles,
    audit,
  ] = await Promise.all([
    admin.from("posts").select("id", { count: "exact", head: true }),
    admin.from("announcements").select("id", { count: "exact", head: true }),
    admin.from("events").select("id", { count: "exact", head: true }),
    admin.from("sermons").select("id", { count: "exact", head: true }),
    admin.from("media").select("id", { count: "exact", head: true }),
    admin.from("profiles").select("id, role:roles(name)", { count: "exact" }),
    superAdmin
      ? admin.from("audit_logs").select("id", { count: "exact", head: true })
      : Promise.resolve({ count: 0, data: null, error: null }),
  ]);

  const profileRows = profiles.data ?? [];
  const adminCount = profileRows.filter((p) => {
    const name = (p as { role?: { name?: string } | null }).role?.name;
    return name === "ADMIN" || name === "SUPER_ADMIN";
  }).length;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Welcome back, {user.profile.display_name || "Staff"}
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Manage church content{superAdmin ? ", users, and system activity" : ""}.
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Posts" value={posts.count ?? 0} />
        <StatCard label="Announcements" value={announcements.count ?? 0} />
        <StatCard label="Events" value={events.count ?? 0} />
        <StatCard label="Sermons" value={sermons.count ?? 0} />
        <StatCard label="Media items" value={media.count ?? 0} />
        {superAdmin ? (
          <>
            <StatCard label="Admin accounts" value={adminCount} hint="Super Admin + Admin" />
            <StatCard label="Audit events" value={audit.count ?? 0} />
            <StatCard label="Profiles" value={profiles.count ?? 0} />
          </>
        ) : null}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-semibold mb-4">Quick actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/posts" className="rounded-lg bg-harvest-gradient px-4 py-2 text-sm text-white">
            Manage posts
          </Link>
          <Link
            href="/dashboard/announcements"
            className="rounded-lg border border-harvest-blue/30 px-4 py-2 text-sm text-harvest-blue-dark dark:text-sky-200"
          >
            Announcements
          </Link>
          <Link
            href="/dashboard/media"
            className="rounded-lg border border-harvest-blue/30 px-4 py-2 text-sm text-harvest-blue-dark dark:text-sky-200"
          >
            Upload media
          </Link>
          {superAdmin ? (
            <Link
              href="/dashboard/users"
              className="rounded-lg border border-emerald-500/40 px-4 py-2 text-sm text-emerald-700 dark:text-emerald-300"
            >
              Create admin user
            </Link>
          ) : null}
        </div>
      </section>
    </div>
  );
}
