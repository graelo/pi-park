import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, copyFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SessionManager } from "@earendil-works/pi-coding-agent";
import { findSession } from "../src/sessions.js";

test("session lookup requires an exact unique ID", async () => {
  const root = await mkdtemp(join(tmpdir(), "pi-park-sessions-"));
  try {
    const session = SessionManager.create(root, root, { id: "unique-session" });
    session.appendMessage({ role: "user", content: "A session", timestamp: Date.now() });
    const file = session.getSessionFile(); assert.ok(file);
    assert.equal(await findSession("unique-session", root), file);
    await assert.rejects(findSession("unique", root), /Session not found/);
    await assert.rejects(findSession("missing", root), /Session not found/);
    await copyFile(file, join(root, "duplicate.jsonl"));
    await assert.rejects(findSession("unique-session", root), /ambiguous/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
