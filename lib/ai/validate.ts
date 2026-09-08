import { fetchPassages, type ScripturePassage } from "@/lib/bible";
import { extractBibleReferences } from "@/lib/bible/references";

const DIVINE_CLAIM_PATTERNS: RegExp[] = [
  /\bi\s+am\s+(god|jesus|the\s+holy\s+spirit|yahweh|jehovah)\b/i,
  /\bgod\s+(told|revealed|spoke\s+to)\s+me\b/i,
  /\bi\s+(speak|am\s+speaking)\s+(for|on\s+behalf\s+of)\s+god\b/i,
  /\bthis\s+is\s+god'?s\s+direct\s+message\s+to\s+you\b/i,
  /\bas\s+god,?\s+i\b/i,
  /\bhere\s+is\s+(a\s+)?prophecy\s+from\s+god\b/i,
  /\bgod\s+personally\s+(told|revealed|wants)\b/i,
  /\bgod\s+wants\s+you\s+to\s+(quit|leave|marry|divorce)\b/i,
];

const CRISIS_PATTERNS: RegExp[] = [
  /\b(kill\s+myself|suicide|suicidal|end\s+my\s+life|self[-\s]?harm|want\s+to\s+die|hurting\s+myself)\b/i,
  /\b(being\s+abused|domestic\s+violence|going\s+to\s+hurt\s+(him|her|them|someone))\b/i,
];

export function detectCrisis(message: string): boolean {
  return CRISIS_PATTERNS.some((re) => re.test(message));
}

export function containsDivineClaims(text: string): boolean {
  return DIVINE_CLAIM_PATTERNS.some((re) => re.test(text));
}

export function stripDivineClaims(text: string): string {
  if (!containsDivineClaims(text)) return text;
  return `${text.trim()}

---
Note: I cannot claim to speak for God or provide personal revelation. The guidance above should be read as Scripture-grounded reflection, not divine speech.`;
}

/**
 * Validate that cited references exist; drop fabricated ones from the scriptures list.
 * Also soft-correct response if it invents refs not in verified set.
 */
export async function validateScriptureReferences(params: {
  answer: string;
  verified: ScripturePassage[];
  translationKey: string;
}): Promise<{
  answer: string;
  scriptures: ScripturePassage[];
  removedReferences: string[];
  ok: boolean;
}> {
  const cited = extractBibleReferences(params.answer);
  const verifiedKeys = new Set(
    params.verified.map(
      (p) =>
        `${p.bookSlug}:${p.chapter}:${p.verseStart ?? ""}-${p.verseEnd ?? ""}`
    )
  );

  const removed: string[] = [];
  const toFetch: string[] = [];

  for (const ref of cited) {
    const label =
      ref.verseStart != null
        ? `${ref.book.name} ${ref.chapter}:${ref.verseStart}${
            ref.verseEnd && ref.verseEnd !== ref.verseStart ? `-${ref.verseEnd}` : ""
          }`
        : `${ref.book.name} ${ref.chapter}`;
    const key = `${ref.book.slug}:${ref.chapter}:${ref.verseStart ?? ""}-${ref.verseEnd ?? ""}`;
    if (verifiedKeys.has(key)) continue;
    toFetch.push(label);
  }

  const extra = await fetchPassages(params.translationKey, toFetch, 8);
  const extraOk = new Set(
    extra.map(
      (p) => `${p.bookSlug}:${p.chapter}:${p.verseStart ?? ""}-${p.verseEnd ?? ""}`
    )
  );

  for (const ref of cited) {
    const key = `${ref.book.slug}:${ref.chapter}:${ref.verseStart ?? ""}-${ref.verseEnd ?? ""}`;
    const label =
      ref.verseStart != null
        ? `${ref.book.name} ${ref.chapter}:${ref.verseStart}${
            ref.verseEnd && ref.verseEnd !== ref.verseStart ? `-${ref.verseEnd}` : ""
          }`
        : `${ref.book.name} ${ref.chapter}`;
    if (!verifiedKeys.has(key) && !extraOk.has(key)) {
      removed.push(label);
    }
  }

  const scriptures = [
    ...params.verified,
    ...extra.filter((p) => {
      const key = `${p.bookSlug}:${p.chapter}:${p.verseStart ?? ""}-${p.verseEnd ?? ""}`;
      return !verifiedKeys.has(key);
    }),
  ];

  let answer = params.answer;
  if (removed.length > 0) {
    answer = `${answer.trim()}

---
Some references could not be verified in the Harvest Souls Bible database and should not be treated as confirmed quotations: ${removed.join(", ")}.`;
  }

  if (containsDivineClaims(answer)) {
    answer = stripDivineClaims(answer);
  }

  return {
    answer,
    scriptures,
    removedReferences: removed,
    ok: removed.length === 0 && !containsDivineClaims(params.answer),
  };
}

export function crisisResponse(): string {
  return `If you are in immediate danger or thinking about harming yourself, please seek help right away.

- Contact local emergency services
- Reach out to someone you trust nearby
- In the U.S., you can call or text 988 (Suicide & Crisis Lifeline)
- Elsewhere, use your local crisis hotline or emergency number

You are not alone. Caring human help matters most in a crisis.

I can also share Scripture that speaks of God's nearness to the brokenhearted (for example Psalm 34:18), but that is support — not a substitute for urgent help. If you want, tell me how you are feeling and we can look at relevant Scripture together after you are safe.`;
}
