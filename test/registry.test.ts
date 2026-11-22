import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rename, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRegistration, decode, discover, encode, replaceRegistration } from "../src/registry.js";

const meta = { session_id: "id-1", session_file: "/some path/session.jsonl", original_cwd: "/project: one", parked_at: "2026-01-01T00:00:00Z" };

test("frontmatter preserves unusual values", () => {
  assert.deepEqual(decode(encode(meta, "# Summary\n\nNotes"))?.metadata, meta);
  assert.equal(decode("not frontmatter"), undefined);
});

test("moved registration is discovered and blocks silent replacement", async () => {
  const root = await mkdtemp(join(tmpdir(), "pi-park-"));
  try {
    const path = await createRegistration(root, meta, "Summary");
    await mkdir(join(root, "folder"));
    await rename(path, join(root, "folder", "renamed.md"));
    const registrations = await discover(root);
    assert.equal(registrations.length, 1);
    assert.equal(registrations[0].metadata.session_id, meta.session_id);
    await assert.rejects(createRegistration(root, meta, "new"), /already parked/);
    assert.match((await discover(root))[0].body, /Summary/);
    await replaceRegistration(registrations[0], meta, "Updated");
    assert.match((await discover(root))[0].body, /Updated/);
    await assert.rejects(replaceRegistration(registrations[0], meta, "Stale"), /changed/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
