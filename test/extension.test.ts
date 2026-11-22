import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

// Isolate XDG_DATA_HOME in a child because the extension uses process environment.
test("/park writes a model summary and does not write on model failure", async () => {
  const root = await mkdtemp(join(tmpdir(), "pi-park-extension-"));
  try {
    const extension = new URL('../dist/index.js', import.meta.url).href;
    const registry = new URL('../dist/registry.js', import.meta.url).href;
    const script = `
      import extension from ${JSON.stringify(extension)};
      import {discover} from ${JSON.stringify(registry)};
      let command; extension({registerCommand(_name, value) { command=value; }});
      let fail=false; const notices=[];
      const ctx={cwd:'/project', hasUI:true, model:{}, ui:{notify:(text)=>notices.push(text), confirm:async()=>false},
        sessionManager:{getSessionFile:()=>'/source.jsonl', getSessionId:()=>fail?'failed-id':'good-id', getHeader:()=>({cwd:'/project'}), buildSessionProjection:()=>({messages:[{role:'user',content:'Hello'}]})},
        modelRegistry:{complete:async()=>fail?{stopReason:'error',errorMessage:'offline',content:[]}:{stopReason:'stop',content:[{type:'text',text:'# Summary\\n\\nInteresting work.'}]}}};
      await command.handler('',ctx); fail=true; await command.handler('',ctx);
      const results=await discover(process.env.PI_PARK_DIR);
      console.log(JSON.stringify({results,notices}));`;
    const result = spawnSync(process.execPath, ["--input-type=module", "-e", script], { env: { ...process.env, XDG_DATA_HOME: root, PI_PARK_DIR: join(root, "custom-lot") }, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    const data = JSON.parse(result.stdout);
    assert.equal(data.results.length, 1);
    assert.equal(data.results[0].metadata.session_id, "good-id");
    assert.match(data.results[0].body, /Interesting work/);
    assert.match(data.notices.join("\n"), /offline/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
