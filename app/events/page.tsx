import Link from "next/link";
import Button from "@/components/ui/Button";
import { supabase } from "@/lib/supabaseClient";
import {
  eventDay,
  eventMonthShort,
  formatEventDateLong,
  formatEventTime,
  formatEventWeekday,
  isUpcomingOrToday,
  type UpcomingEvent,
} from "@/lib/events/format";

export default async function EventsPage() {
  const { data } = await supabase
    .from("events")
    .select("id,title,event_date,start_time,location,description")
    .order("event_date", { ascending: true })
    .limit(100);

  const all = (data ?? []) as UpcomingEvent[];
  const upcoming = all.filter((e) => isUpcomingOrToday(e.event_date));
  const past = all.filter((e) => !isUpcomingOrToday(e.event_date)).reverse();

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <section className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white/92 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-[#0b1220]/92">
        <header className="border-b border-slate-200/70 px-6 py-7 sm:px-9 dark:border-white/10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-harvest-blue dark:text-sky-300">
                Church Calendar
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Events
              </h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Gatherings, services, and activities at Harvest Souls.
              </p>
            </div>
            <Button variant="ghost" href="/">
              Home
            </Button>
          </div>
        </header>

        <div className="space-y-10 px-6 py-8 sm:px-9">
          <EventGroup title="Upcoming" items={upcoming} empty="No upcoming events scheduled." />
          {past.length > 0 ? (
            <EventGroup title="Past" items={past} empty="" muted />
          ) : null}
        </div>
      </section>
    </div>
  );
}

function EventGroup({
  title,
  items,
  empty,
  muted = false,
}: {
  title: string;
  items: UpcomingEvent[];
  empty: string;
  muted?: boolean;
}) {
  return (
    <section>
      <h2
        className={`mb-4 text-sm font-semibold uppercase tracking-[0.18em] ${
          muted
            ? "text-slate-400"
            : "text-harvest-blue dark:text-sky-300"
        }`}
      >
        {title}
        {items.length > 0 ? (
          <span className="ml-2 font-medium normal-case tracking-normal text-slate-400">
            ({items.length})
          </span>
        ) : null}
      </h2>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300/70 px-4 py-8 text-center text-sm text-slate-500 dark:border-white/15 dark:text-slate-400">
          {empty}
        </p>
      ) : (
        <ul className="space-y-2.5">
          {items.map((event) => {
            const day = eventDay(event.event_date);
            const month = eventMonthShort(event.event_date);
            const time = formatEventTime(event.start_time);
            const weekday = formatEventWeekday(event.event_date);
            const dateLong = formatEventDateLong(event.event_date);
            const meta = [weekday, time, event.location].filter(Boolean).join(" · ");

            return (
              <li key={event.id}>
                <Link
                  href={`/events/${event.id}`}
                  className={`group flex items-start gap-4 rounded-2xl border px-4 py-4 transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-harvest-blue/40 ${
                    muted
                      ? "border-slate-200/60 bg-slate-50/80 opacity-80 dark:border-white/5 dark:bg-white/[0.03]"
                      : "border-slate-200/80 bg-white/90 hover:border-harvest-blue/35 dark:border-white/10 dark:bg-slate-950/60 dark:hover:border-sky-400/30"
                  }`}
                >
                  <div className="flex w-14 shrink-0 flex-col items-center rounded-xl bg-harvest-gradient py-2.5 text-white shadow-sm">
                    <span className="text-xl font-bold leading-none">{day ?? "—"}</span>
                    <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider opacity-90">
                      {month || "—"}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900 group-hover:text-harvest-blue-dark dark:text-white dark:group-hover:text-sky-200">
                      {event.title}
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {meta || dateLong || "View details"}
                    </p>
                    {event.description ? (
                      <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                        {event.description}
                      </p>
                    ) : null}
                  </div>
                  <span className="mt-3 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-harvest-blue dark:group-hover:text-sky-300" aria-hidden>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
