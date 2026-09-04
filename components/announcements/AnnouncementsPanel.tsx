import Link from "next/link";
import Button from "@/components/ui/Button";

export type AnnouncementItem = {
  id: string;
  title: string;
  content?: string | null;
  publish_date?: string | null;
  priority?: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return null;
  const d = new Date(value.includes("T") ? value : `${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isRecent(value?: string | null) {
  if (!value) return false;
  const d = new Date(value.includes("T") ? value : `${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  const diff = Date.now() - d.getTime();
  return diff >= 0 && diff < 1000 * 60 * 60 * 24 * 7;
}

function priorityTone(priority?: string | null) {
  const p = (priority || "NORMAL").toUpperCase();
  if (p === "HIGH" || p === "URGENT") {
    return {
      bar: "bg-amber-500",
      chip: "bg-amber-500/15 text-amber-800 dark:text-amber-200",
      label: p === "URGENT" ? "Urgent" : "Important",
    };
  }
  return {
    bar: "bg-harvest-green",
    chip: "bg-harvest-green/10 text-harvest-green-dark dark:text-emerald-200",
    label: "Update",
  };
}

export default function AnnouncementsPanel({
  items,
  showViewAll = true,
}: {
  items: AnnouncementItem[];
  showViewAll?: boolean;
}) {
  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Announcements</h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Church notices and important updates
          </p>
        </div>
        {items.length > 0 ? (
          <span className="shrink-0 rounded-md bg-harvest-blue/10 px-2 py-0.5 text-[11px] font-semibold text-harvest-blue-dark dark:bg-sky-500/15 dark:text-sky-200">
            {items.length} new
          </span>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-harvest-gold/30 bg-harvest-cream/40 px-4 py-6 text-center dark:border-slate-600 dark:bg-slate-900/40">
          <p className="text-sm text-slate-600 dark:text-slate-300">No announcements right now.</p>
          <p className="mt-1 text-xs text-slate-500">Check back soon for church updates.</p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {items.map((a, index) => {
            const tone = priorityTone(a.priority);
            const recent = isRecent(a.publish_date) || index === 0;
            const excerpt = (a.content || "").trim();
            const dateLabel = formatDate(a.publish_date);

            return (
              <li key={a.id}>
                <Link
                  href={`/announcements/${a.id}`}
                  className="group relative flex gap-3 overflow-hidden rounded-xl border border-harvest-gold/15 bg-white/70 p-3 transition-all hover:-translate-y-0.5 hover:border-harvest-green/40 hover:shadow-sm dark:border-slate-700 dark:bg-slate-950/50 dark:hover:border-emerald-500/40"
                >
                  <span className={`absolute inset-y-0 left-0 w-1 ${tone.bar}`} aria-hidden />
                  <div className="min-w-0 flex-1 pl-1.5">
                    <div className="mb-1 flex flex-wrap items-center gap-1.5">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tone.chip}`}>
                        {tone.label}
                      </span>
                      {recent ? (
                        <span className="rounded bg-harvest-gradient px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                          New
                        </span>
                      ) : null}
                    </div>
                    <p className="font-medium text-slate-900 transition-colors group-hover:text-harvest-blue-dark dark:text-white dark:group-hover:text-emerald-200">
                      {a.title}
                    </p>
                    {excerpt ? (
                      <p className="mt-1 text-xs leading-relaxed text-slate-600 line-clamp-2 dark:text-slate-300">
                        {excerpt}
                      </p>
                    ) : null}
                    {dateLabel ? (
                      <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">{dateLabel}</p>
                    ) : null}
                  </div>
                  <span
                    className="mt-1 shrink-0 self-center text-harvest-green-dark opacity-0 transition-opacity group-hover:opacity-100 dark:text-emerald-300"
                    aria-hidden
                  >
                    →
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {showViewAll ? (
        <div className="mt-4 flex justify-end">
          <Button variant="ghost" href="/announcements" className="text-sm">
            View All
          </Button>
        </div>
      ) : null}
    </div>
  );
}
