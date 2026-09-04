import { requireSuperAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";

export default async function AuditPage() {
  await requireSuperAdmin();
  const admin = createAdminClient();

  const { data: logs, error } = await admin
    .from("audit_logs")
    .select(
      "id, action, entity_type, entity_id, summary, created_at, actor:profiles!audit_logs_actor_id_fkey(display_name, email)"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Super Admin only — system activity trail.
        </p>
      </header>

      {error ? (
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Audit table not ready yet. Run the auth migration SQL in Supabase, then refresh.
          ({error.message})
        </p>
      ) : null}

      <section className="rounded-xl border bg-white overflow-hidden dark:bg-slate-900 dark:border-slate-700">
        <ul className="divide-y dark:divide-slate-800">
          {(logs ?? []).map((log) => {
            const actor = log.actor as { display_name?: string; email?: string } | null;
            return (
              <li key={log.id} className="px-6 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">
                    <span className="uppercase text-xs tracking-wide text-harvest-green-dark dark:text-emerald-300 mr-2">
                      {log.action}
                    </span>
                    {log.summary || `${log.entity_type} ${log.entity_id || ""}`}
                  </p>
                  <time className="text-xs text-slate-500">
                    {log.created_at ? new Date(log.created_at).toLocaleString() : ""}
                  </time>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {actor?.display_name || actor?.email || "System"} · {log.entity_type}
                </p>
              </li>
            );
          })}
          {!error && (logs ?? []).length === 0 ? (
            <li className="px-6 py-8 text-sm text-slate-500">No audit events yet.</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
