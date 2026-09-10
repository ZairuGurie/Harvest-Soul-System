import { fetchPassage, type ScripturePassage } from "@/lib/bible";
import { getAiConfig } from "@/lib/ai/config";

/**
 * Resolve a scenario Scripture reference from the Harvest Souls Bible DB.
 * Never invents verse text — returns null if the reference cannot be loaded.
 */
export async function resolveGameScripture(
  reference: string,
  translation?: string
): Promise<ScripturePassage | null> {
  const version = translation || getAiConfig().defaultTranslation || "kjv";
  const passage = await fetchPassage(version, reference);
  if (passage) return passage;

  // Fallback try common English slugs if configured version missing
  if (version !== "kjv") {
    return fetchPassage("kjv", reference);
  }
  return null;
}
