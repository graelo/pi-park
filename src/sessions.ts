import { SessionManager, SettingsManager } from "@earendil-works/pi-coding-agent";
import { resolve } from "node:path";

/** Resolve an exact session ID; unlike Pi's prefix lookup, reject duplicates. */
export async function findSession(id: string, directory?: string): Promise<string> {
  const configured = directory ?? process.env.PI_CODING_AGENT_SESSION_DIR ?? SettingsManager.create(process.cwd()).getSessionDir();
  const sessions = await SessionManager.listAll(configured ? resolve(configured) : undefined);
  const matches = sessions.filter(session => session.id === id);
  if (matches.length === 0) throw new Error(`Session not found: ${id}`);
  if (matches.length > 1) throw new Error(`Session ID is ambiguous: ${id}`);
  return matches[0].path;
}
