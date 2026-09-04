import { requireStaff } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";
import {
  createChurchBirthday,
  deleteChurchBirthday,
  updateChurchBirthday,
} from "../content-actions";
import ContentForm from "../ContentForm";
import Button from "@/components/ui/Button";

const field =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:bg-slate-950 dark:border-slate-700";

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

type BirthdayRow = {
  id: string;
  display_name: string;
  birthday: string;
  notes: string | null;
  is_active: boolean;
};

function formatBirthday(iso: string) {
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export default async function BirthdaysDashboardPage() {
  await requireStaff();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("church_birthdays")
    .select("id, display_name, birthday, notes, is_active")
    .order("birthday", { ascending: true })
    .limit(500);

  const tableMissing =
    !!error && /church_birthdays|schema cache|relation .* does not exist/i.test(error.message);

  const rows = ((data ?? []) as BirthdayRow[]).slice().sort((a, b) => {
    const da = new Date(a.birthday + "T00:00:00");
    const db = new Date(b.birthday + "T00:00:00");
    const ma = da.getMonth();
    const mb = db.getMonth();
    if (ma !== mb) return ma - mb;
    return da.getDate() - db.getDate();
  });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Church Birthdays</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Add birthdays for members and families — no account required. They appear on the
          landing page for the current month.
        </p>
      </header>

      {tableMissing ? (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-4 text-sm text-amber-950 dark:text-amber-100">
          <p className="font-semibold">Birthday table is missing in the database</p>
          <p className="mt-1">
            Run this SQL in <span className="font-medium">Supabase Dashboard → SQL Editor</span>,
            then refresh this page:
          </p>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-black/80 p-3 text-xs text-emerald-200">{`CREATE TABLE IF NOT EXISTS public.church_birthdays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  birthday date NOT NULL,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.church_birthdays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active church birthdays"
  ON public.church_birthdays FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Authenticated can manage church birthdays"
  ON public.church_birthdays FOR ALL TO authenticated
  USING (true) WITH CHECK (true);`}</pre>
          <p className="mt-2 text-xs opacity-90">
            Full file:{" "}
            <code className="rounded bg-black/20 px-1">
              supabase/migrations/20260304150000_church_birthdays.sql
            </code>
          </p>
        </div>
      ) : null}

      <section className="rounded-xl border bg-white p-6 dark:bg-slate-900 dark:border-slate-700">
        <h2 className="mb-4 font-semibold">Add birthday</h2>
        <ContentForm action={createChurchBirthday} submitLabel="Save birthday">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Full name</label>
            <input
              name="display_name"
              placeholder="e.g. Sherly Atillo"
              required
              className={field}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Birthday</label>
            <input name="birthday" type="date" required className={field} />
            <p className="mt-1 text-xs text-slate-500">
              Month and day are shown on the site. Year is kept for your records.
            </p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Notes (optional)
            </label>
            <input
              name="notes"
              placeholder="e.g. Family of Pastor John"
              className={field}
            />
          </div>
        </ContentForm>
      </section>

      <section className="overflow-hidden rounded-xl border bg-white dark:bg-slate-900 dark:border-slate-700">
        <div className="border-b px-6 py-3 dark:border-slate-800">
          <h2 className="font-semibold">All birthdays ({rows.length})</h2>
        </div>
        {rows.length === 0 && !tableMissing ? (
          <p className="px-6 py-8 text-sm text-slate-500">No birthdays added yet.</p>
        ) : (
          <ul className="divide-y dark:divide-slate-800">
            {rows.map((row) => {
              const day = new Date(row.birthday + "T00:00:00").getDate();
              return (
                <li key={row.id} className="px-6 py-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                        style={{
                          background:
                            "linear-gradient(135deg, #1b6db5 0%, #2b8a3e 100%)",
                        }}
                      >
                        {Number.isNaN(day) ? "—" : day}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {row.display_name}
                          {!row.is_active ? (
                            <span className="ml-2 text-xs font-normal text-amber-600">
                              (hidden)
                            </span>
                          ) : null}
                        </p>
                        <p className="text-xs text-slate-500">{formatBirthday(row.birthday)}</p>
                        {row.notes ? (
                          <p className="mt-0.5 text-xs text-slate-400">{row.notes}</p>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                      <ContentForm action={updateChurchBirthday} submitLabel="Update">
                        <input type="hidden" name="id" value={row.id} />
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                          <input
                            name="display_name"
                            defaultValue={row.display_name}
                            required
                            className={field}
                          />
                          <input
                            name="birthday"
                            type="date"
                            defaultValue={row.birthday}
                            required
                            className={field}
                          />
                          <input
                            name="notes"
                            defaultValue={row.notes ?? ""}
                            placeholder="Notes"
                            className={field}
                          />
                          <select
                            name="is_active"
                            defaultValue={row.is_active ? "true" : "false"}
                            className={field}
                          >
                            <option value="true">Visible</option>
                            <option value="false">Hidden</option>
                          </select>
                        </div>
                      </ContentForm>
                      <form action={deleteChurchBirthday}>
                        <input type="hidden" name="id" value={row.id} />
                        <Button type="submit" variant="ghost" className="text-red-600">
                          Delete
                        </Button>
                      </form>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
