/**
 * Normalize AI answer text for display: strip Markdown markers so users
 * never see raw asterisks, and keep readable plain structure.
 */
export function stripMarkdownMarkers(text: string): string {
  return text
    .replace(/\*\*\*([\s\S]+?)\*\*\*/g, "$1")
    .replace(/\*\*([\s\S]+?)\*\*/g, "$1")
    .replace(/(^|[^*\w])\*([^*\n]+?)\*(?=[^*\w]|$)/g, "$1$2")
    .replace(/___([\s\S]+?)___/g, "$1")
    .replace(/__([\s\S]+?)__/g, "$1")
    .replace(/(^|[^_\w])_([^_\n]+?)_(?=[^_\w]|$)/g, "$1$2")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*\*\s+/gm, "• ")
    .replace(/^\s*-\s+/gm, "• ")
    .trim();
}

export type AnswerBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] };

const KNOWN_HEADINGS = new Set(
  [
    "understanding",
    "answer",
    "your question",
    "scripture",
    "biblical explanation",
    "practical application",
    "reflection",
    "next step",
    "passage",
    "what the text says",
    "context tip",
    "interpretation caution",
    "application",
    "observation",
    "meaning",
    "context",
    "prayer",
    "related passages",
    "how this helps",
    "simple takeaway",
    "try this",
  ].map((s) => s.toLowerCase())
);

function isHeadingLine(trimmed: string): boolean {
  const withoutColon = trimmed.replace(/:$/, "").trim();
  const base = withoutColon.split(/\s*[—(]/)[0]?.trim() || withoutColon;
  if (KNOWN_HEADINGS.has(base.toLowerCase())) return true;
  // "Scripture (KJV)" style
  const firstWord = base.split(/\s+/)[0]?.toLowerCase() || "";
  if (KNOWN_HEADINGS.has(firstWord) && base.length < 40) return true;
  return false;
}

/**
 * Parse stripped answer text into structured blocks for friendly UI layout.
 */
export function parseAnswerBlocks(raw: string): AnswerBlock[] {
  const text = stripMarkdownMarkers(raw);
  const lines = text.split(/\r?\n/);
  const blocks: AnswerBlock[] = [];
  let paragraph: string[] = [];
  let listItems: string[] = [];
  let listOrdered = false;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    const joined = paragraph.join(" ").replace(/\s+/g, " ").trim();
    if (joined) blocks.push({ type: "paragraph", text: joined });
    paragraph = [];
  };

  const flushList = () => {
    if (!listItems.length) return;
    blocks.push({ type: "list", ordered: listOrdered, items: listItems });
    listItems = [];
    listOrdered = false;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      flushParagraph();
      continue;
    }

    if (isHeadingLine(trimmed)) {
      flushList();
      flushParagraph();
      blocks.push({
        type: "heading",
        text: trimmed.replace(/:$/, "").trim(),
      });
      continue;
    }

    const numbered = trimmed.match(/^\d+[.)]\s+(.+)$/);
    const bullet = trimmed.match(/^•\s+(.+)$/);
    if (numbered || bullet) {
      flushParagraph();
      const ordered = Boolean(numbered);
      if (listItems.length && listOrdered !== ordered) flushList();
      listOrdered = ordered;
      listItems.push((numbered?.[1] || bullet?.[1] || "").trim());
      continue;
    }

    if (listItems.length) flushList();
    paragraph.push(trimmed);
  }

  flushList();
  flushParagraph();
  return blocks;
}
