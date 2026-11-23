import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, symlink, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createRegistration } from "../src/registry.js";

test("cli labels errors with the invoked command", async () => {
  const root = await mkdtemp(join(tmpdir(), "pi-park-cli-prefix-"));
  try {
    const lot = join(root, "lot"), bin = join(root, "bin"), sessions = join(root, "sessions");
    await mkdir(bin); await mkdir(sessions);
    await createRegistration(lot, { session_id: "id", session_file: join(root, "missing"), original_cwd: root, parked_at: "today" }, "Test");
    const target = fileURLToPath(new URL("../dist/cli.js", import.meta.url));
    // An isolated PATH with no fzf forces the unpark path into the cli catch block.
    const env = { ...process.env, PATH: bin, PI_PARK_DIR: lot, PI_CODING_AGENT_SESSION_DIR: sessions };
    const unparkLink = join(bin, "pi-unpark");
    await symlink(target, unparkLink);
    const unpark = spawnSync(process.execPath, [unparkLink], { env, encoding: "utf8" });
    assert.equal(unpark.status, 1, unpark.stderr);
    assert.match(unpark.stderr, /^pi-unpark: /);
    const parkLink = join(bin, "pi-park");
    await symlink(target, parkLink);
    const park = spawnSync(process.execPath, [parkLink, "--session", "nonexistent-id"], { env, encoding: "utf8" });
    assert.equal(park.status, 1, park.stderr);
    assert.match(park.stderr, /^pi-park: /);
  } finally { await rm(root, { recursive: true, force: true }); }
});
