import { test } from "node:test";
import assert from "node:assert/strict";
import { homedir } from "node:os";
import { join } from "node:path";
import { lotPath } from "../src/registry.js";

test("parking lot override is absolute and falls back when empty", () => {
  const previousDir = process.env.PI_PARK_DIR, previousData = process.env.XDG_DATA_HOME;
  try {
    process.env.XDG_DATA_HOME = join(homedir(), "custom-data");
    delete process.env.PI_PARK_DIR;
    assert.equal(lotPath(), join(homedir(), "custom-data", "pi-park"));
    process.env.PI_PARK_DIR = "";
    assert.equal(lotPath(), join(homedir(), "custom-data", "pi-park"));
    process.env.PI_PARK_DIR = join(homedir(), "parking lot");
    assert.equal(lotPath(), join(homedir(), "parking lot"));
    process.env.PI_PARK_DIR = "relative/lot";
    assert.throws(() => lotPath(), /PI_PARK_DIR must be an absolute path/);
    delete process.env.PI_PARK_DIR; delete process.env.XDG_DATA_HOME;
    assert.equal(lotPath(), join(homedir(), ".local", "share", "pi-park"));
  } finally {
    if (previousDir === undefined) delete process.env.PI_PARK_DIR; else process.env.PI_PARK_DIR = previousDir;
    if (previousData === undefined) delete process.env.XDG_DATA_HOME; else process.env.XDG_DATA_HOME = previousData;
  }
});
