import { requireSuperAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";
import StatCard from "@/components/dashboard/StatCard";

type LogRow = {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  created_at: string;
};

export default async function StatsPage() {
  await requireSuperAdmin();
  const admin = createAdminClient();

  const [{ data: logs }, { data: profiles }] = await Promise.all([
    admin
      .from("audit_logs")
      .select("id, actor_id, action, entity_type, created_at")
      .order("created_at", { ascending: false })
      .limit(2000),
    admin.from("profiles").select("id, display_name, email, role:roles(name)"),
  ]);

  const nameById = new Map(
    (profiles ?? []).map((p) => [p.id, p.display_name || p.email || "Unknown"])
  );

  const staffIds = new Set(
    (profiles ?? [])
      .filter((p) => {
        const name = (p as { role?: { name?: string } | null }).role?.name;
        return name === "SUPER_ADMIN" || name === "ADMIN" || name === "EDITOR";
      })
      .map((p) => p.id)
  );

  const byActor = new Map<
    string,
    { creates: number; updates: number; deletes: number; logins: number; total: number }
  >();

  for (const id of staffIds) {
    byActor.set(id, { creates: 0, updates: 0, deletes: 0, logins: 0, total: 0 });
  }

  for (const log of (logs ?? []) as LogRow[]) {
    if (!log.actor_id || !byActor.has(log.actor_id)) continue;
    const row = byActor.get(log.actor_id)!;
    row.total += 1;
    if (log.action === "create") row.creates += 1;
    else if (log.action === "update") row.updates += 1;
    else if (log.action === "delete") row.deletes += 1;
    else if (log.action === "login") row.logins += 1;
  }

  const totals = [...byActor.values()].reduce(
    (acc, row) => {
      acc.creates += row.creates;
      acc.updates += row.updates;
      acc.deletes += row.deletes;
      return acc;
    },
    { creates: 0, updates: 0, deletes: 0 }
  );

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Statistics</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Super Admin only — activity measured from audit logs.
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Creates" value={totals.creates} />
        <StatCard label="Edits" value={totals.updates} />
        <StatCard label="Deletes" value={totals.deletes} />
      </section>

      <section className="rounded-xl border bg-white overflow-hidden dark:bg-slate-900 dark:border-slate-700">
        <div className="px-6 py-4 border-b dark:border-slate-800 font-semibold">
          Per-admin activity
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-950 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-3">Admin</th>
                <th className="px-4 py-3">Posts / creates</th>
                <th className="px-4 py-3">Edits</th>
                <th className="px-4 py-3">Deletes</th>
                <th className="px-4 py-3">Logins</th>
                <th className="px-4 py-3">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800">
              {[...byActor.entries()].map(([id, row]) => (
                <tr key={id}>
                  <td className="px-6 py-3 font-medium">{nameById.get(id)}</td>
                  <td className="px-4 py-3">{row.creates}</td>
                  <td className="px-4 py-3">{row.updates}</td>
                  <td className="px-4 py-3">{row.deletes}</td>
                  <td className="px-4 py-3">{row.logins}</td>
                  <td className="px-4 py-3">{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
