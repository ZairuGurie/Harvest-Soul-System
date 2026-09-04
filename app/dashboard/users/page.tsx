import { requireSuperAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";
import { roleLabel } from "@/lib/auth/roles";
import CreateAdminForm from "./CreateAdminForm";
import EditUserForm from "./EditUserForm";
import { profilesBirthdayReady } from "./actions";

type UserRow = {
  id: string;
  email?: string | null;
  display_name?: string | null;
  birthday?: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
  role?: { id?: string; name?: string } | null;
};

export default async function UsersPage() {
  await requireSuperAdmin();
  const admin = createAdminClient();
  const birthdayReady = await profilesBirthdayReady();

  let users: UserRow[] = [];

  if (birthdayReady) {
    const { data } = await admin
      .from("profiles")
      .select("id, email, display_name, birthday, is_active, created_at, role:roles(id, name)")
      .order("created_at", { ascending: false });
    users = (data ?? []) as UserRow[];
  } else {
    const { data } = await admin
      .from("profiles")
      .select("id, email, display_name, created_at, role:roles(id, name)")
      .order("created_at", { ascending: false });
    users = (data ?? []) as UserRow[];
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">User Management</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Only Super Admin can create and edit admin accounts.
        </p>
      </header>

      {!birthdayReady ? (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-4 text-sm text-amber-950 dark:text-amber-100">
          <p className="font-semibold">Birthday column is missing in the database</p>
          <p className="mt-1">
            Run this SQL in{" "}
            <span className="font-medium">Supabase Dashboard → SQL Editor</span>, then refresh this
            page:
          </p>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-black/80 p-3 text-xs text-emerald-200">
{`ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS birthday date,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES profiles(id);`}
          </pre>
          <p className="mt-2 text-xs opacity-90">
            File also saved at{" "}
            <code className="rounded bg-black/20 px-1">
              supabase/migrations/20260304140000_profiles_birthday_columns.sql
            </code>
          </p>
        </div>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="mb-4 text-lg font-semibold">Create staff account</h2>
        <CreateAdminForm />
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2 className="text-lg font-semibold">All users</h2>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {users.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">No users yet.</p>
          ) : (
            users.map((u) => {
              const roleName = u.role?.name ?? "MEMBER";
              return (
                <div key={u.id} className="grid gap-4 p-6 lg:grid-cols-[1fr_1.2fr]">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {u.display_name || "Unnamed"}
                    </p>
                    <p className="text-sm text-slate-500">{u.email}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {roleLabel(roleName)} · {u.is_active === false ? "Inactive" : "Active"}
                      {u.birthday ? ` · Birthday ${u.birthday}` : ""}
                    </p>
                  </div>
                  <EditUserForm
                    userId={u.id}
                    displayName={u.display_name || ""}
                    role={roleName}
                    birthday={u.birthday || ""}
                    isActive={u.is_active !== false}
                  />
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
