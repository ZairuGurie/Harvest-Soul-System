import Link from "next/link";
import Button from "@/components/ui/Button";
import {
  eventDay,
  eventMonthShort,
  formatEventTime,
  type UpcomingEvent,
} from "@/lib/events/format";

export type { UpcomingEvent };

export default function UpcomingEventsPanel({
  items,
  showViewAll = true,
}: {
  items: UpcomingEvent[];
  showViewAll?: boolean;
}) {
  return (
    <section className="rounded-2xl bg-[#0b1220] px-5 py-5 text-white shadow-lg ring-1 ring-white/10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            Upcoming Events
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">Church gatherings and activities</p>
        </div>
        {items.length > 0 ? (
          <span className="shrink-0 rounded-md bg-sky-500/15 px-2 py-0.5 text-[11px] font-semibold text-sky-200">
            {items.length}
          </span>
        ) : null}
      </div>

      {items.length === 0 ? (
        <p className="mt-5 text-sm text-slate-400">No upcoming events right now.</p>
      ) : (
        <ul className="mt-5 space-y-2">
          {items.map((event) => {
            const day = eventDay(event.event_date);
            const month = eventMonthShort(event.event_date);
            const time = formatEventTime(event.start_time);
            const meta = [time, event.location].filter(Boolean).join(" · ");

            return (
              <li key={event.id}>
                <Link
                  href={`/events/${event.id}`}
                  className="group flex items-start gap-3.5 rounded-xl px-2 py-2.5 transition hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50"
                >
                  <div className="flex w-12 shrink-0 flex-col items-center rounded-lg bg-white/5 py-1.5 ring-1 ring-white/10">
                    <span className="text-lg font-bold leading-none text-white">
                      {day ?? "—"}
                    </span>
                    <span className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      {month || "—"}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="truncate font-semibold text-white transition group-hover:text-sky-200">
                      {event.title}
                    </p>
                    {meta ? (
                      <p className="mt-0.5 truncate text-sm text-slate-400">{meta}</p>
                    ) : (
                      <p className="mt-0.5 text-sm text-slate-500">View details</p>
                    )}
                  </div>
                  <span className="mt-2 shrink-0 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-sky-300" aria-hidden>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {showViewAll ? (
        <div className="mt-5 flex justify-end border-t border-white/10 pt-4">
          <Button
            variant="outline"
            href="/events"
            className="border-sky-400/50 text-sky-100 hover:bg-sky-500/10 dark:border-sky-400/40 dark:text-sky-100"
          >
            View Calendar
          </Button>
        </div>
      ) : null}
    </section>
  );
}
