#!/usr/bin/env node
import { basename } from "node:path";
import { parkCli } from "./park-cli.js";
import { unpark } from "./unpark.js";

const command = basename(process.argv[1] ?? "");
const label = command === "pi-unpark" ? "pi-unpark" : "pi-park";
try {
  process.exitCode = command === "pi-unpark" ? await unpark() : await parkCli(process.argv.slice(2));
} catch (error) {
  console.error(`${label}: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
