import { requireStaff } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";
import { createAnnouncement, deleteAnnouncement } from "../content-actions";
import ContentForm from "../ContentForm";
import Button from "@/components/ui/Button";

const field =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:bg-slate-950 dark:border-slate-700";

export default async function AnnouncementsDashboardPage() {
  await requireStaff();
  const admin = createAdminClient();
  const { data } = await admin
    .from("announcements")
    .select("id, title, publish_date, status")
    .order("publish_date", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Announcements</h1>
      </header>
      <section className="rounded-xl border bg-white p-6 dark:bg-slate-900 dark:border-slate-700">
        <h2 className="font-semibold mb-4">New announcement</h2>
        <ContentForm action={createAnnouncement} submitLabel="Publish">
          <input name="title" placeholder="Title" required className={field} />
          <textarea name="content" placeholder="Message" required rows={4} className={field} />
          <input name="publish_date" type="date" className={field} />
        </ContentForm>
      </section>
      <section className="rounded-xl border bg-white dark:bg-slate-900 dark:border-slate-700 overflow-hidden">
        <ul className="divide-y dark:divide-slate-800">
          {(data ?? []).map((a) => (
            <li key={a.id} className="px-6 py-4 flex justify-between gap-4">
              <div>
                <p className="font-medium">{a.title}</p>
                <p className="text-xs text-slate-500">{a.publish_date}</p>
              </div>
              <form action={deleteAnnouncement}>
                <input type="hidden" name="id" value={a.id} />
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
