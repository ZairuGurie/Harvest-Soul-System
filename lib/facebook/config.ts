/**
 * Facebook Page sync configuration (server-only).
 *
 * Required in .env.local / Vercel:
 *   FACEBOOK_PAGE_ID=1234567890
 *   FACEBOOK_PAGE_ACCESS_TOKEN=EAAB...
 *
 * Optional:
 *   FACEBOOK_GRAPH_VERSION=v21.0
 *   FACEBOOK_SYNC_LIMIT=50
 */

export type FacebookConfig = {
  pageId: string;
  accessToken: string;
  graphVersion: string;
  syncLimit: number;
};

export function getFacebookConfig(): FacebookConfig | null {
  const pageId = String(process.env.FACEBOOK_PAGE_ID || "").trim();
  const accessToken = String(process.env.FACEBOOK_PAGE_ACCESS_TOKEN || "").trim();
  if (!pageId || !accessToken) return null;

  const graphVersion = String(process.env.FACEBOOK_GRAPH_VERSION || "v21.0").trim() || "v21.0";
  const rawLimit = Number(process.env.FACEBOOK_SYNC_LIMIT || 50);
  const syncLimit = Number.isFinite(rawLimit)
    ? Math.min(100, Math.max(1, Math.floor(rawLimit)))
    : 50;

  return { pageId, accessToken, graphVersion, syncLimit };
}

export function facebookConfigStatus() {
  const cfg = getFacebookConfig();
  return {
    configured: !!cfg,
    pageId: cfg?.pageId ?? null,
    graphVersion: cfg?.graphVersion ?? "v21.0",
    syncLimit: cfg?.syncLimit ?? 50,
  };
}
