import type { SessionProjection } from "@earendil-works/pi-coding-agent";

/** Summarize Pi's active projected context rather than abandoned branches or raw edits. */
export function conversationText(projection: SessionProjection, limit = 160000): string {
  const messages = projection.messages.filter(message => ["user", "assistant", "compactionSummary", "branchSummary", "custom"].includes(message.role));
  const text = messages.map(message => JSON.stringify(message)).join("\n");
  if (text.length <= limit) return text;
  return `[Earlier projected context omitted: ${text.length - limit} characters]\n${text.slice(-limit)}`;
}
