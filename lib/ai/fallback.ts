import type { ScripturePassage } from "@/lib/bible";
import type { AiMode } from "./types";

function listRefs(passages: ScripturePassage[]): string {
  return passages.map((p) => p.reference).join("; ");
}

function quoteBlock(passages: ScripturePassage[]): string {
  return passages
    .map(
      (p) =>
        `${p.reference} (${p.translation.abbreviation})\n${p.text}`
    )
    .join("\n\n");
}

/**
 * Zero-cost Scripture guidance when no LLM provider is available.
 * Uses only verified Bible passages from the Harvest Souls database.
 */
export function buildScriptureFallbackAnswer(params: {
  message: string;
  mode: AiMode;
  passages: ScripturePassage[];
}): string {
  const { message, mode, passages } = params;

  if (!passages.length) {
    return `I could not retrieve matching Scripture for that question right now.

Please try again, or open the Bible reader and search a related passage.

This is a Scripture-lookup response (no AI model). It does not claim to speak for God.`;
  }

  const refs = listRefs(passages);
  const quotes = quoteBlock(passages);
  const version = passages[0]?.translation.abbreviation || "Bible";

  if (mode === "devotional") {
    const primary = passages[0];
    return `Scripture
${primary.reference} (${primary.translation.abbreviation})

${primary.text}

Context
Read this passage in its full chapter for a clearer picture. This response uses only verified text from the Harvest Souls Bible library (${version}).

Observation
Slowly notice what the passage says about God, about people, and about how we are invited to respond. Write down any word or phrase that stands out.

Meaning
A Biblical principle suggested by this text (and related passages: ${refs}) is to bring your situation before God in light of His Word. This tool does not invent a private revelation for you.

Application
1. Read the passage slowly twice.
2. Write one sentence: “This Scripture teaches me that…”
3. Choose one concrete act of obedience or trust for today.
4. Share what you learned with a trusted believer if you can.

Reflection
• What part of this passage speaks most clearly to your question?
• Where might you also need wisdom from pastors, family, or wise friends?

Prayer
(AI-generated style template — not a prophecy; pray in your own words)

Lord, thank You for Your Word. Help me understand and apply ${primary.reference}. Teach me to trust You, walk in wisdom, and seek counsel where needed. Amen.

---
Your question: “${message.slice(0, 200)}${message.length > 200 ? "…" : ""}”

Related passages: ${refs}

This is a Scripture fallback response (no paid AI model). Scripture is the authority; this tool only helps you find and reflect on it.`;
  }

  if (mode === "study") {
    const primary = passages[0];
    return `Passage
${primary.reference} (${primary.translation.name})

${primary.text}

What the text says
The words above are the verified ${version} text from the Harvest Souls Bible database. Start with what is written before adding outside ideas.

Context tip
Open the full chapter: ${primary.href}
Read the verses before and after so the passage is not taken alone.

Biblical explanation
Related passages for this question: ${refs}
Hold firmly to what the text clearly states. Treat application as wisdom to test in prayer and community. Christians may differ on secondary details.

Application
Ask: How does this passage call me to trust, repent, hope, obey, or love today? Choose one clear response.

Reflection
What is one takeaway from ${primary.reference} that you can put into practice this week?

---
This is a Scripture study fallback (no paid AI model). It does not claim divine revelation.`;
  }

  // Ask mode
  return `Understanding
You asked: “${message.slice(0, 280)}${message.length > 280 ? "…" : ""}”
Below is Scripture-related guidance based on passages that best match themes in that question. This does not claim to know God’s private will for you, and it is not a substitute for pastors, counselors, or wise friends.

Answer
Start with the passages below and read them in light of your specific question. Ask what the text clearly says about God, people, and wise response in situations like yours.

Scripture (${version})
${quotes}

Biblical explanation
These passages were selected because they relate to themes detected in your question. Read them in context by opening each reference in the Bible reader. Let Scripture speak first, then consider careful application to your situation.

1. Restate your question in one sentence.
2. Notice what each passage clearly says that connects to that question.
3. Look for repeated themes (faith, prayer, love, repentance, hope, wisdom, and so on).
4. Ask how the teaching of Jesus and the apostles shapes your next step for this issue.

Practical application
1. Pray through the passages above with your question in mind.
2. Write what the text clearly says (not what you wish it said).
3. Identify one next step consistent with the passage and with your question.
4. If the decision is major (job, relationships, finances, safety), seek trusted counsel as well.
5. Return to the same passage later in the week and note what becomes clearer.

Reflection
Which verse most clearly addresses what you are facing, and why?

Next step
Spend a few minutes reading ${passages[0].reference} in full chapter context, then write one sentence responding to God about your question.

---
This is a Scripture fallback response (no paid AI). Add a free Groq key or OpenAI credits anytime for fuller AI explanations. Scripture remains the foundation.`;
}
