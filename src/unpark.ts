import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { relative } from "node:path";
import { discover, lotPath, type Registration } from "./registry.js";
import { findSession } from "./sessions.js";

async function validSource(registration: Registration): Promise<string> {
  const { session_file: path, session_id: id } = registration.metadata;
  try {
    const first = (await readFile(path, "utf8")).split("\n", 1)[0];
    const header = JSON.parse(first);
    if (header.type === "session" && header.id === id) return path;
  } catch { /* Try Pi's configured session storage. */ }
  return findSession(id);
}

export async function unpark(): Promise<number> {
  const root = lotPath();
  const registrations = await discover(root);
  if (!registrations.length) { console.error(`No parked sessions found in ${root}`); return 1; }
  // Use numeric tokens for selection/preview; fzf never interprets a filename as shell code.
  // Display path text separately, with line breaks escaped for readability.
  const lines = registrations.map((r, i) => `${i}\t${relative(root, r.path).replaceAll("\n", "\\n").replaceAll("\r", "\\r")}`);
  const helper = new URL("./preview.js", import.meta.url).pathname;
  const child = spawn("fzf", ["--read0", "--print0", "--delimiter=\t", "--with-nth=2..", "--preview", `node '${helper.replaceAll("'", "'\\''")}' {1}`, "--preview-window=right:60%:wrap"], {
    stdio: ["pipe", "pipe", "inherit"], env: { ...process.env, PI_PARK_PREVIEW_PATHS: JSON.stringify(registrations.map(r => r.path)) },
  });
  let output = "";
  child.stdout.setEncoding("utf8");
  child.stdout.on("data", chunk => { output += chunk; });
  const result = new Promise<number>((resolve, reject) => { child.on("error", reject); child.on("close", code => resolve(code ?? 1)); });
  child.stdin.end(lines.join("\0") + "\0");
  const code = await result;
  if (code === 130 || code === 1) return 0;
  if (code !== 0) throw new Error(`fzf exited with status ${code}`);
  const index = Number(output.split("\t", 1)[0]);
  if (!Number.isInteger(index) || index < 0 || index >= registrations.length) throw new Error("Invalid fzf selection");
  const path = await validSource(registrations[index]);
  const pi = spawn("pi", ["--fork", path], { stdio: "inherit" });
  return await new Promise<number>((resolve, reject) => { pi.on("error", reject); pi.on("close", code => resolve(code ?? 1)); });
}
