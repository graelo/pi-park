import { constants } from "node:fs";
import { access, link, mkdir, open, readFile, readdir, rename, unlink } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { homedir } from "node:os";
import { isAbsolute, join } from "node:path";
import { parse, stringify } from "yaml";

export interface Metadata {
  session_id: string;
  session_file: string;
  original_cwd: string;
  parked_at: string;
}
export interface Registration { path: string; metadata: Metadata; body: string }

export function lotPath(): string {
  const override = process.env.PI_PARK_DIR;
  if (override) {
    if (!isAbsolute(override)) throw new Error("PI_PARK_DIR must be an absolute path");
    return override;
  }
  return join(process.env.XDG_DATA_HOME || join(homedir(), ".local", "share"), "pi-park");
}

export function decode(content: string): { metadata: Metadata; body: string } | undefined {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(content);
  if (!match) return undefined;
  try {
    const metadata: unknown = parse(match[1]);
    if (!metadata || typeof metadata !== "object") return undefined;
    const record = metadata as Record<string, unknown>;
    if (!["session_id", "session_file", "original_cwd", "parked_at"].every(k => typeof record[k] === "string" && record[k] !== "")) return undefined;
    return { metadata: record as unknown as Metadata, body: match[2] };
  } catch { return undefined; }
}

export function encode(metadata: Metadata, body: string): string {
  return `---\n${stringify(metadata)}---\n\n${body.trim()}\n`;
}

export async function discover(root: string): Promise<Registration[]> {
  const found: Registration[] = [];
  async function visit(dir: string): Promise<void> {
    let entries;
    try { entries = await readdir(dir, { withFileTypes: true }); }
    catch (e) { if ((e as NodeJS.ErrnoException).code === "ENOENT" && dir === root) return; throw e; }
    for (const entry of entries) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) await visit(path);
      else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
        const parsed = decode(await readFile(path, "utf8"));
        if (parsed) found.push({ path, ...parsed });
      }
    }
  }
  await visit(root);
  return found.sort((a, b) => a.path.localeCompare(b.path));
}

/** Create a registration exclusively; never overwrites user files. */
export async function createRegistration(root: string, metadata: Metadata, body: string): Promise<string> {
  if (!body.trim()) throw new Error("Summary is empty");
  await mkdir(root, { recursive: true, mode: 0o700 });
  const existing = (await discover(root)).filter(r => r.metadata.session_id === metadata.session_id);
  if (existing.length) throw new Error(`Session is already parked: ${existing.map(r => r.path).join(", ")}`);
  // Encode the ID instead of trusting it as a filename.
  const name = Buffer.from(metadata.session_id).toString("base64url");
  const path = join(root, `${name}.md`);
  const temporary = join(root, `.${randomUUID()}.tmp`);
  try {
    const file = await open(temporary, "wx", 0o600);
    try { await file.writeFile(encode(metadata, body), "utf8"); } finally { await file.close(); }
    // An exclusive hard link publishes the complete file without overwriting an existing note.
    await link(temporary, path);
  } finally { await unlink(temporary).catch(() => {}); }
  return path;
}

/** Replace a confirmed registration only if it has not changed since confirmation. */
export async function replaceRegistration(registration: Registration, metadata: Metadata, body: string): Promise<string> {
  if (!body.trim()) throw new Error("Summary is empty");
  const original = await readFile(registration.path, "utf8");
  const parsed = decode(original);
  if (!parsed || parsed.metadata.session_id !== metadata.session_id || parsed.body !== registration.body) throw new Error("Registration changed; retry parking");
  const temporary = `${registration.path}.${randomUUID()}.tmp`;
  try {
    const file = await open(temporary, "wx", 0o600);
    try { await file.writeFile(encode(metadata, body), "utf8"); } finally { await file.close(); }
    if (await readFile(registration.path, "utf8") !== original) throw new Error("Registration changed; retry parking");
    await rename(temporary, registration.path);
  } finally { await unlink(temporary).catch(() => {}); }
  return registration.path;
}

export async function exists(path: string): Promise<boolean> {
  try { await access(path, constants.F_OK); return true; } catch { return false; }
}
