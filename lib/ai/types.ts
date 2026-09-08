export type AiMode = "ask" | "study" | "devotional";

export type AiChatMessage = {
  role: "user" | "assistant";
  content: string;
};
