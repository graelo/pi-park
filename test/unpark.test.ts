import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm, readFile, realpath } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { createRegistration } from "../src/registry.js";

 test("unpark forks the validated source in the caller's cwd", async () => {
  const root = await mkdtemp(join(tmpdir(), "pi-unpark-test-"));
  try {
    const lot = join(root, "data", "pi-park"), bin = join(root, "bin"), dest = join(root, "dest"), source = join(root, "source.jsonl"), log = join(root, "log");
    await mkdir(bin); await mkdir(dest);
    await writeFile(source, JSON.stringify({ type: "session", id: "test-session", cwd: "/gone" }) + "\n");
    await createRegistration(lot, { session_id: "test-session", session_file: source, original_cwd: "/gone", parked_at: "2026-01-01" }, "# Test");
    // Use bash explicitly because macOS /bin/sh does not support read -d.
    await writeFile(join(bin, "fzf"), '#!/bin/bash\nIFS= read -r -d "" line || true\nprintf "0\\tselected\\0"\n', { mode: 0o755 });
    await writeFile(join(bin, "pi"), '#!/bin/sh\nprintf "%s\\n%s\\n%s\\n" "$PWD" "$1" "$2" > "$PI_TEST_LOG"\n', { mode: 0o755 });
    const program = `import { unpark } from ${JSON.stringify(new URL('../dist/unpark.js', import.meta.url).href)}; process.exitCode = await unpark();`;
    const result = spawnSync(process.execPath, ["--input-type=module", "-e", program], { cwd: dest, env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, XDG_DATA_HOME: join(root, "data"), PI_TEST_LOG: log }, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(await readFile(log, "utf8"), `${await realpath(dest)}\n--fork\n${source}\n`);
  } finally { await rm(root, { recursive: true, force: true }); }
});
