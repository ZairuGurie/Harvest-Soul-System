import { fetchPassages, type ScripturePassage } from "./passages";
import { extractBibleReferences, parseBibleReference } from "./references";
import { expandQueryForMatching, matchTopics } from "./scriptureTopics";

export type ScriptureRetrievalResult = {
  passages: ScripturePassage[];
  translationKey: string;
  matchedTopics: string[];
  explicitReferences: string[];
};

const DEFAULT_FALLBACK_REFS = [
  "Psalm 119:105",
  "2 Timothy 3:16-17",
  "Joshua 1:8",
  "Psalm 19:7-8",
  "James 1:5",
];

/**
 * Retrieve verified Scripture passages for a user question.
 * Prefers explicit references in the question, then topic keywords.
 * Never invents verse text — only returns DB-backed passages.
 */
export async function searchRelevantScripture(
  query: string,
  translationKey = "kjv",
  options?: { limit?: number; extraReferences?: string[] }
): Promise<ScriptureRetrievalResult> {
  const limit = options?.limit ?? 5;
  const expandedQuery = expandQueryForMatching(query);
  const explicit = extractBibleReferences(query);
  const topics = matchTopics(expandedQuery);

  const candidateRefs: string[] = [];
  const seen = new Set<string>();

  const push = (ref: string) => {
    const key = ref.trim().toLowerCase();
    if (!key || seen.has(key)) return;
    // Only push if it parses as a real book/chapter shape
    if (!parseBibleReference(ref) && !extractBibleReferences(ref).length) return;
    seen.add(key);
    candidateRefs.push(ref);
  };

  for (const ref of explicit) {
    push(
      ref.verseStart != null
        ? `${ref.book.name} ${ref.chapter}:${ref.verseStart}${
            ref.verseEnd && ref.verseEnd !== ref.verseStart ? `-${ref.verseEnd}` : ""
          }`
        : `${ref.book.name} ${ref.chapter}`
    );
  }

  for (const extra of options?.extraReferences ?? []) push(extra);

  for (const topic of topics) {
    for (const ref of topic.references) push(ref);
  }

  // Study/devotional without topic: still provide foundational Scripture
  if (candidateRefs.length === 0) {
    for (const ref of DEFAULT_FALLBACK_REFS) push(ref);
  }

  const passages = await fetchPassages(translationKey, candidateRefs, limit);

  return {
    passages,
    translationKey,
    matchedTopics: topics.map((t) => t.id),
    explicitReferences: explicit.map((r) => r.raw),
  };
}
