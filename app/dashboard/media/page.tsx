import { requireStaff } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";
import { createMedia, deleteMedia } from "../content-actions";
import ContentForm from "../ContentForm";
import Button from "@/components/ui/Button";

const field =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:bg-slate-950 dark:border-slate-700";

export default async function MediaDashboardPage() {
  await requireStaff();
  const admin = createAdminClient();
  const { data } = await admin
    .from("media")
    .select("id, title, type, url, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Media</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Add photo or video links for the church gallery.
        </p>
      </header>
      <section className="rounded-xl border bg-white p-6 dark:bg-slate-900 dark:border-slate-700">
        <ContentForm action={createMedia} submitLabel="Add media">
          <input name="title" placeholder="Title" required className={field} />
          <select name="type" defaultValue="PHOTO" className={field}>
            <option value="PHOTO">Photo</option>
            <option value="VIDEO">Video</option>
          </select>
          <input name="url" placeholder="Image or video URL" required className={field} />
          <input name="caption" placeholder="Caption" className={field} />
        </ContentForm>
      </section>
      <section className="rounded-xl border bg-white dark:bg-slate-900 dark:border-slate-700 overflow-hidden">
        <ul className="divide-y dark:divide-slate-800">
          {(data ?? []).map((m) => (
            <li key={m.id} className="px-6 py-4 flex justify-between gap-4">
              <div>
                <p className="font-medium">{m.title || "Untitled"}</p>
                <p className="text-xs text-slate-500">
                  {m.type} · {m.url}
                </p>
              </div>
              <form action={deleteMedia}>
                <input type="hidden" name="id" value={m.id} />
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
