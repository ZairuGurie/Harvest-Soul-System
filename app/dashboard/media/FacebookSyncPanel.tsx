"use client";

import { useActionState } from "react";
import Button from "@/components/ui/Button";
import { syncFacebookPageAction } from "./facebook-actions";
import type { ContentState } from "../content-actions";

const initial: ContentState = null;

export default function FacebookSyncPanel({
  configured,
  pageId,
  syncLimit,
}: {
  configured: boolean;
  pageId: string | null;
  syncLimit: number;
}) {
  const [state, formAction, pending] = useActionState(syncFacebookPageAction, initial);

  return (
    <section className="rounded-xl border bg-white p-6 dark:bg-slate-900 dark:border-slate-700">
      <h2 className="font-semibold text-slate-900 dark:text-slate-100">
        Auto-sync from Facebook Page (optional)
      </h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        Requires a Meta Developer Page access token. If registration is blocked, use{" "}
        <span className="font-medium">Paste Facebook link</span> above instead. Already-imported
        posts are skipped when sync works.
      </p>

      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <div className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-950">
          <dt className="text-xs uppercase tracking-wide text-slate-500">Status</dt>
          <dd className={configured ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}>
            {configured ? "Configured" : "Not configured"}
          </dd>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-950">
          <dt className="text-xs uppercase tracking-wide text-slate-500">Page ID</dt>
          <dd className="truncate font-mono text-xs text-slate-700 dark:text-slate-200">
            {pageId || "Set FACEBOOK_PAGE_ID"}
          </dd>
        </div>
      </dl>

      {!configured ? (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
          <p className="font-medium">Setup required</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs sm:text-sm">
            <li>
              Create a Meta app at{" "}
              <a
                href="https://developers.facebook.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                developers.facebook.com
              </a>
            </li>
            <li>Add the Facebook Login / Pages product and connect your Page as admin</li>
            <li>
              Generate a <strong>Page access token</strong> with{" "}
              <code className="rounded bg-black/5 px-1">pages_read_engagement</code> (and content
              read permissions as required by Meta)
            </li>
            <li>
              Add to <code className="rounded bg-black/5 px-1">.env.local</code> (and Vercel):
              <pre className="mt-2 overflow-x-auto rounded bg-black/5 p-2 text-[11px] leading-relaxed">
{`FACEBOOK_PAGE_ID=your_page_id
FACEBOOK_PAGE_ACCESS_TOKEN=your_page_token
FACEBOOK_SYNC_LIMIT=${syncLimit}`}
              </pre>
            </li>
            <li>
              Run SQL migration{" "}
              <code className="rounded bg-black/5 px-1">
                20260908130000_facebook_page_sync.sql
              </code>{" "}
              in Supabase
            </li>
          </ol>
        </div>
      ) : null}

      <form action={formAction} className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="submit" variant="primary" disabled={!configured || pending}>
          {pending ? "Syncing…" : "Sync Facebook media"}
        </Button>
        <p className="text-xs text-slate-500">
          Fetches up to {syncLimit} recent Page posts with photos/videos.
        </p>
      </form>

      {state?.error ? <p className="mt-3 text-sm text-red-600">{state.error}</p> : null}
      {state?.success ? (
        <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-300">{state.success}</p>
      ) : null}
    </section>
  );
}
