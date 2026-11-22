import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { createRegistration } from "../src/registry.js";

test("unpark handles cancellation, missing fzf, invalid selections and missing sources", async () => {
  const root = await mkdtemp(join(tmpdir(), "pi-unpark-errors-"));
  try {
    const lot = join(root, "lot"), bin = join(root, "bin"), marker = join(root, "launched");
    await mkdir(bin);
    await createRegistration(lot, { session_id: "id", session_file: join(root, "missing"), original_cwd: root, parked_at: "today" }, "Test");
    await writeFile(join(bin, "pi"), `#!/bin/sh\n/usr/bin/touch '${marker}'\n`, { mode: 0o755 });
    const program = `import { unpark } from ${JSON.stringify(new URL('../dist/unpark.js', import.meta.url).href)}; try { process.exitCode = await unpark(); } catch(e) { console.error(e.message); process.exitCode = 1; }`;
    const run = () => spawnSync(process.execPath, ["--input-type=module", "-e", program], { env: { ...process.env, PATH: bin, PI_PARK_DIR: lot, PI_CODING_AGENT_SESSION_DIR: root }, encoding: "utf8" });
    const missing = run(); assert.equal(missing.status, 1); assert.match(missing.stderr, /ENOENT/);
    await writeFile(join(bin, "fzf"), "#!/bin/sh\nexit 130\n", { mode: 0o755 });
    const cancelled = run(); assert.equal(cancelled.status, 0, cancelled.stderr);
    await writeFile(join(bin, "fzf"), '#!/bin/sh\nprintf "99\\tselected\\0"\n', { mode: 0o755 });
    const invalid = run(); assert.equal(invalid.status, 1); assert.match(invalid.stderr, /Invalid fzf selection/);
    await writeFile(join(bin, "fzf"), '#!/bin/sh\nprintf "0\\tselected\\0"\n', { mode: 0o755 });
    const absent = run(); assert.equal(absent.status, 1); assert.match(absent.stderr, /Session not found/);
    await assert.rejects(access(marker));
    // A file at the recorded path must not be trusted if its header has a different ID.
    await writeFile(join(root, "missing"), JSON.stringify({ type: "session", id: "unrelated", cwd: root }) + "\n");
    const mismatch = run(); assert.equal(mismatch.status, 1); assert.match(mismatch.stderr, /Session not found/);
    await assert.rejects(access(marker));
    await writeFile(join(root, "missing"), JSON.stringify({ type: "session", id: "id", cwd: root }) + "\n");
    await rm(join(bin, "pi"));
    const noPi = run(); assert.equal(noPi.status, 1); assert.match(noPi.stderr, /ENOENT/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
