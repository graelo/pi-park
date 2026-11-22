#!/usr/bin/env node
import { basename } from "node:path";
import { parkCli } from "./park-cli.js";
import { unpark } from "./unpark.js";

try {
  const command = basename(process.argv[1]);
  process.exitCode = command === "pi-unpark" ? await unpark() : await parkCli(process.argv.slice(2));
} catch (error) {
  console.error(`pi-park: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
