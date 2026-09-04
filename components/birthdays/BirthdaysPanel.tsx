import type { BirthdayPerson } from "@/lib/birthdays";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function formatMonthDay(birthday: string) {
  const d = new Date(birthday + "T00:00:00");
  if (Number.isNaN(d.getTime())) return birthday;
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export default function BirthdaysPanel({
  items,
  monthLabel,
}: {
  items: BirthdayPerson[];
  monthLabel: string;
}) {
  return (
    <section className="rounded-2xl bg-[#0b1220] px-5 py-5 text-white shadow-lg ring-1 ring-white/10">
      <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
        Birthdays in {monthLabel}
      </h2>

      {items.length === 0 ? (
        <p className="mt-5 text-sm text-slate-400">
          No birthdays listed for this month yet.
        </p>
      ) : (
        <ul className="mt-5 space-y-4">
          {items.map((b) => (
            <li key={b.id} className="flex items-center gap-3.5">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white shadow-md"
                style={{
                  background:
                    "linear-gradient(135deg, #1b6db5 0%, #2b8a3e 100%)",
                }}
                aria-hidden
              >
                {b.day}
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-white">
                  {b.display_name}
                </p>
                <p className="text-sm text-slate-400">{formatMonthDay(b.birthday)}</p>
                {b.notes ? (
                  <p className="mt-0.5 truncate text-xs text-slate-500">{b.notes}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
