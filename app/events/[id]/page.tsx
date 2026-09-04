import Button from "@/components/ui/Button";
import { supabase } from "@/lib/supabaseClient";
import {
  eventDay,
  eventMonthShort,
  formatEventDateLong,
  formatEventTime,
  formatEventWeekday,
} from "@/lib/events/format";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data, error } = await supabase
    .from("events")
    .select("id,title,event_date,start_time,location,description")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-2xl border border-amber-500/30 bg-white/95 p-8 shadow-lg dark:bg-[#0b1220]/95">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Event not found</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            This event may have been removed or the link is incorrect.
          </p>
          <div className="mt-6 flex gap-3">
            <Button variant="primary" href="/events">
              View Calendar
            </Button>
            <Button variant="ghost" href="/">
              Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const day = eventDay(data.event_date);
  const month = eventMonthShort(data.event_date);
  const dateLong = formatEventDateLong(data.event_date);
  const weekday = formatEventWeekday(data.event_date);
  const time = formatEventTime(data.start_time);

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <article className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white/94 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-[#0b1220]/94">
        <header className="border-b border-slate-200/70 px-6 py-7 sm:px-9 dark:border-white/10">
          <div className="flex flex-wrap items-start gap-5">
            <div className="flex w-16 shrink-0 flex-col items-center rounded-2xl bg-harvest-gradient py-3 text-white shadow-md">
              <span className="text-2xl font-bold leading-none">{day ?? "—"}</span>
              <span className="mt-1 text-xs font-semibold uppercase tracking-wider opacity-90">
                {month || "—"}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-harvest-blue dark:text-sky-300">
                Event
              </p>
              <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                {data.title}
              </h1>
            </div>
          </div>
        </header>

        <div className="space-y-6 px-6 py-7 sm:px-9">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 dark:border-white/10 dark:bg-white/5">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Date</dt>
              <dd className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                {[weekday, dateLong].filter(Boolean).join(" · ") || "TBA"}
              </dd>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 dark:border-white/10 dark:bg-white/5">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Time</dt>
              <dd className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                {time || "Time TBA"}
              </dd>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 sm:col-span-2 dark:border-white/10 dark:bg-white/5">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Location
              </dt>
              <dd className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                {data.location || "Harvest Souls Mission Christian Church"}
              </dd>
            </div>
          </dl>

          {data.description ? (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                About
              </h2>
              <p className="mt-3 whitespace-pre-wrap text-base leading-relaxed text-slate-700 dark:text-slate-200">
                {data.description}
              </p>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3 border-t border-slate-200/70 pt-6 dark:border-white/10">
            <Button variant="primary" href="/events">
              View Calendar
            </Button>
            <Button variant="ghost" href="/">
              Home
            </Button>
          </div>
        </div>
      </article>
    </div>
  );
}
