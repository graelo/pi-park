import { spawnSync } from "node:child_process";

// Pi installs Git extensions with --omit=dev; it loads the TypeScript source
// directly and does not need the standalone CLI build in that installation.
const omitted = (process.env.npm_config_omit ?? "").split(/\s+/);
if (omitted.includes("dev")) {
  console.log("Skipping CLI build because dev dependencies are omitted.");
} else {
  const result = spawnSync("npm", ["run", "build"], { stdio: "inherit", shell: process.platform === "win32" });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}
