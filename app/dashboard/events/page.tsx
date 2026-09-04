import { requireStaff } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";
import { createEvent, deleteEvent } from "../content-actions";
import ContentForm from "../ContentForm";
import Button from "@/components/ui/Button";

const field =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:bg-slate-950 dark:border-slate-700";

export default async function EventsDashboardPage() {
  await requireStaff();
  const admin = createAdminClient();
  const { data } = await admin
    .from("events")
    .select("id, title, event_date, location")
    .order("event_date", { ascending: true })
    .limit(50);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Events</h1>
      </header>
      <section className="rounded-xl border bg-white p-6 dark:bg-slate-900 dark:border-slate-700">
        <ContentForm action={createEvent} submitLabel="Create event">
          <input name="title" placeholder="Title" required className={field} />
          <textarea name="description" placeholder="Description" rows={3} className={field} />
          <input name="event_date" type="date" required className={field} />
          <input name="start_time" type="time" className={field} />
          <input name="location" placeholder="Location" className={field} />
        </ContentForm>
      </section>
      <section className="rounded-xl border bg-white dark:bg-slate-900 dark:border-slate-700 overflow-hidden">
        <ul className="divide-y dark:divide-slate-800">
          {(data ?? []).map((e) => (
            <li key={e.id} className="px-6 py-4 flex justify-between gap-4">
              <div>
                <p className="font-medium">{e.title}</p>
                <p className="text-xs text-slate-500">
                  {e.event_date}
                  {e.location ? ` · ${e.location}` : ""}
                </p>
              </div>
              <form action={deleteEvent}>
                <input type="hidden" name="id" value={e.id} />
                <Button type="submit" variant="ghost" className="text-red-600">
                  Delete
                </Button>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
