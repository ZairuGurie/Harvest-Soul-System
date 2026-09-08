import { requireSuperAdmin } from "@/lib/auth/session";
import { aiPublicStatus } from "@/lib/ai";

export default async function AiConfigPage() {
  await requireSuperAdmin();
  const status = aiPublicStatus();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">AI Guidance</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Super Admin overview. API keys are never shown here — configure them in Vercel /
          server environment variables only.
        </p>
      </header>

      <section className="rounded-xl border bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="font-semibold text-slate-900 dark:text-slate-100">Status</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-lg border border-slate-200/80 px-3 py-2 dark:border-slate-700">
            <dt className="text-slate-500">Mode</dt>
            <dd className="font-medium text-slate-900 dark:text-white">
              {status.hasLlm
                ? `LLM (${status.provider})`
                : status.scriptureFallback
                  ? "Scripture fallback (free)"
                  : "Disabled"}
            </dd>
          </div>
          <div className="rounded-lg border border-slate-200/80 px-3 py-2 dark:border-slate-700">
            <dt className="text-slate-500">Enabled</dt>
            <dd className="font-medium text-slate-900 dark:text-white">
              {status.enabled ? "Yes" : "No"}
            </dd>
          </div>
          <div className="rounded-lg border border-slate-200/80 px-3 py-2 dark:border-slate-700">
            <dt className="text-slate-500">Model</dt>
            <dd className="font-medium text-slate-900 dark:text-white">{status.model}</dd>
          </div>
          <div className="rounded-lg border border-slate-200/80 px-3 py-2 dark:border-slate-700">
            <dt className="text-slate-500">Default Bible version</dt>
            <dd className="font-medium uppercase text-slate-900 dark:text-white">
              {status.defaultTranslation}
            </dd>
          </div>
          <div className="rounded-lg border border-slate-200/80 px-3 py-2 dark:border-slate-700">
            <dt className="text-slate-500">Daily limit (signed-in)</dt>
            <dd className="font-medium text-slate-900 dark:text-white">
              {status.dailyLimitAuthenticated}
            </dd>
          </div>
          <div className="rounded-lg border border-slate-200/80 px-3 py-2 dark:border-slate-700">
            <dt className="text-slate-500">Daily limit (anonymous)</dt>
            <dd className="font-medium text-slate-900 dark:text-white">
              {status.dailyLimitAnonymous}
            </dd>
          </div>
        </dl>

        <div className="mt-6 space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <p className="font-medium text-slate-800 dark:text-slate-100">Environment variables</p>
          <ul className="list-disc space-y-1 pl-5 font-mono text-xs">
            <li>AI_SCRIPTURE_FALLBACK (free mode without paid API)</li>
            <li>AI_API_KEY / AI_MODEL / AI_BASE_URL (OpenAI or Groq)</li>
            <li>AI_ENABLED / AI_BIBLE_VERSION</li>
            <li>AI_MAX_TOKENS / AI_TEMPERATURE</li>
            <li>AI_DAILY_LIMIT_AUTH / AI_DAILY_LIMIT_ANON</li>
          </ul>
          <p className="pt-2 text-xs">
            Free LLM option: Groq at console.groq.com — set AI_BASE_URL to
            https://api.groq.com/openai/v1 and model llama-3.3-70b-versatile.
          </p>
          <p className="pt-2">
            Public page:{" "}
            <a href="/guidance" className="text-harvest-blue underline dark:text-sky-300">
              /guidance
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
