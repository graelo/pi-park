import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

test("preview uses bat without overriding its theme and falls back to Markdown", async () => {
  const root = await mkdtemp(join(tmpdir(), "pi-park-preview-"));
  try {
    const bin = join(root, "bin"), note = join(root, "note.md");
    await mkdir(bin);
    await writeFile(note, "# Hello\n");
    const env = { ...process.env, PATH: bin, PI_PARK_PREVIEW_PATHS: JSON.stringify([note]) };
    const run = () => spawnSync(process.execPath, [fileURLToPath(new URL("../dist/preview.js", import.meta.url)), "0"], { env, encoding: "utf8" });
    assert.equal(run().stdout, "# Hello\n");
    await writeFile(join(bin, "bat"), '#!/bin/sh\nprintf "args:%s\\n" "$*"\n/bin/cat\n', { mode: 0o755 });
    const colored = run();
    assert.equal(colored.status, 0);
    assert.equal(colored.stdout, `args:--color=always --paging=never --file-name ${note}\n# Hello\n`);
    await writeFile(join(bin, "bat"), "#!/bin/sh\nprintf partial\nexit 1\n", { mode: 0o755 });
    assert.equal(run().stdout, "# Hello\n");
  } finally { await rm(root, { recursive: true, force: true }); }
});
