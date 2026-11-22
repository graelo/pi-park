import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

try {
  const paths: unknown = JSON.parse(process.env.PI_PARK_PREVIEW_PATHS ?? "[]");
  const index = Number(process.argv[2]);
  if (!Array.isArray(paths) || !Number.isInteger(index) || typeof paths[index] !== "string") throw new Error("Invalid selection");
  const markdown = await readFile(paths[index], "utf8");
  const rendered = spawnSync("bat", ["--color=always", "--paging=never", "--language=markdown"], {
    input: markdown, encoding: "utf8", maxBuffer: 16 * 1024 * 1024,
  });
  process.stdout.write(rendered.status === 0 ? rendered.stdout : markdown);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
