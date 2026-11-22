import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

test("prepare builds normally and skips when dev dependencies are omitted", async () => {
  const root = await mkdtemp(join(tmpdir(), "pi-park-prepare-"));
  try {
    const bin = join(root, "bin"); await mkdir(bin);
    await writeFile(join(bin, "npm"), '#!/bin/sh\nprintf "%s\\n" "$*"\n', { mode: 0o755 });
    const script = fileURLToPath(new URL("../scripts/prepare.mjs", import.meta.url));
    const run = (omit: string) => spawnSync(process.execPath, [script], { env: { ...process.env, PATH: bin, npm_config_omit: omit }, encoding: "utf8" });
    const regular = run(""); assert.equal(regular.status, 0); assert.match(regular.stdout, /run build/);
    const production = run("dev optional"); assert.equal(production.status, 0); assert.match(production.stdout, /Skipping CLI build/); assert.doesNotMatch(production.stdout, /run build/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
