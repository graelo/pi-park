import { readFile } from "node:fs/promises";

try {
  const paths: unknown = JSON.parse(process.env.PI_PARK_PREVIEW_PATHS ?? "[]");
  const index = Number(process.argv[2]);
  if (!Array.isArray(paths) || !Number.isInteger(index) || typeof paths[index] !== "string") throw new Error("Invalid selection");
  process.stdout.write(await readFile(paths[index], "utf8"));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
