import { test } from "node:test";
import assert from "node:assert/strict";
import { SessionManager } from "@earendil-works/pi-coding-agent";
import { conversationText } from "../src/transcript.js";

test("projection excludes abandoned branches and honors context edits", () => {
  const session = SessionManager.inMemory();
  const root = session.appendMessage({ role: "user", content: "root", timestamp: Date.now() });
  session.appendMessage({ role: "user", content: "abandoned branch", timestamp: Date.now() });
  session.branch(root);
  const edited = session.appendMessage({ role: "user", content: "old secret", timestamp: Date.now() });
  session.appendContextEdit(edited, { content: "replacement" });
  const result = conversationText(session.buildSessionProjection());
  assert.match(result, /root/); assert.match(result, /replacement/);
  assert.doesNotMatch(result, /abandoned branch|old secret/);
});

test("projection includes compaction summaries and marks truncation", () => {
  const session = SessionManager.inMemory();
  session.appendMessage({ role: "user", content: "old history", timestamp: Date.now() });
  session.appendCompaction("important compacted context", null, 100);
  const result = conversationText(session.buildSessionProjection());
  assert.match(result, /important compacted context/);
  assert.match(conversationText(session.buildSessionProjection(), 20), /Earlier projected context omitted/);
});
