import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { SessionManager } from "@earendil-works/pi-coding-agent";
import { discover } from "../src/registry.js";

test("shell parking uses session storage and preserves notes on repeat", async () => {
  const root = await mkdtemp(join(tmpdir(), "pi-park-cli-"));
  try {
    const sessions = join(root, "sessions"), bin = join(root, "bin"), data = join(root, "data");
    await mkdir(sessions); await mkdir(bin);
    const source = SessionManager.create(root, sessions, { id: "test-session" });
    source.appendMessage({ role: "user", content: "An interesting conversation", timestamp: Date.now() });
    await writeFile(join(bin, "pi"), '#!/bin/sh\ntouch "$PI_TEST_CALLED"\n/bin/cat >/dev/null\n[ "$PI_TEST_FAIL" = 1 ] && exit 1\nprintf "# Summary\\n\\nSome interesting work.\\n"\n', { mode: 0o755 });
    const script = `import { parkCli } from ${JSON.stringify(new URL('../dist/park-cli.js', import.meta.url).href)}; try { process.exitCode=await parkCli(['--session','test-session','--summarize']); } catch(e) { console.error(e.message); process.exitCode=1; }`;
    const env = { ...process.env, PATH: `${bin}:${process.env.PATH}`, XDG_DATA_HOME: data, PI_CODING_AGENT_SESSION_DIR: sessions, PI_TEST_CALLED: join(root, "called") };
    const run = () => spawnSync(process.execPath, ["--input-type=module", "-e", script], { env, encoding: "utf8" });
    const manualScript = script.replace(",'--summarize'", "");
    const manual = spawnSync(process.execPath, ["--input-type=module", "-e", manualScript], { env, encoding: "utf8" });
    assert.equal(manual.status, 1);
    assert.match(manual.stderr, /Manual notes require a terminal/);
    await assert.rejects(access(join(root, "called")));
    assert.equal((await discover(join(data, "pi-park"))).length, 0);
    const failure = spawnSync(process.execPath, ["--input-type=module", "-e", script], { env: { ...env, PI_TEST_FAIL: "1" }, encoding: "utf8" });
    assert.equal(failure.status, 1);
    assert.match(failure.stderr, /Summary generation failed/);
    assert.equal((await discover(join(data, "pi-park"))).length, 0);
    const first = run(); assert.equal(first.status, 0, first.stderr);
    await access(join(root, "called"));
    const notes = await discover(join(data, "pi-park")); assert.equal(notes.length, 1); assert.match(notes[0].body, /interesting work/);
    const second = run(); assert.equal(second.status, 1); assert.match(second.stderr, /confirmation requires a terminal/);
    assert.equal((await discover(join(data, "pi-park")))[0].body, notes[0].body);
  } finally { await rm(root, { recursive: true, force: true }); }
});
