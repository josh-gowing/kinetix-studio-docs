import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import assert from "node:assert/strict";
const root=process.cwd(), read=name=>fs.readFileSync(path.join(root,name),"utf8").replace(/\r\n/g,"\n"), hash=text=>crypto.createHash("sha256").update(text).digest("hex");
const catalog=JSON.parse(read("src/generated/studio-docs.json")), registry=JSON.parse(read("src/generated/kx-api.json"));
assert.deepEqual(registry,JSON.parse(read("public/kx-api.json")),"Public and rendered registries differ");
assert.equal(hash(JSON.stringify(registry,null,2)+"\n"),catalog.registrySha256,"Registry/catalog snapshots differ");
assert.equal(registry.version,catalog.languageVersion);
assert.equal(new Set(catalog.guides.map(g=>g.id)).size,catalog.guides.length);
assert.equal(new Set(catalog.examples.map(e=>e.file)).size,catalog.examples.length);
for(const guide of catalog.guides){assert.equal(hash(guide.markdown),guide.sha256);assert.equal(read(`public/studio/${guide.id}.md`),guide.markdown);}
for(const example of catalog.examples){assert.equal(hash(example.code),example.sha256);assert.equal(read(`public/examples/${example.file}`),example.code);}
for(const id of ["overview","visual-data","desktop","connections","pipelines","workspaces","research-studio","language-reference","integration"])assert(catalog.guides.some(g=>g.id===id),`Missing capability guide ${id}`);
assert(registry.declarations.some(d=>d.label==="pipeline"),"Pipeline declaration missing");
assert(catalog.examples.some(e=>e.file.startsWith("v23/")),"Nested acquisition examples missing");
assert(registry.items.some(item=>item.label==="data.normalizeDailyOhlcv"),"Daily-session normalization API missing");
assert(catalog.examples.some(e=>e.file==="pipelines/daily-session-normalization.kx"),"Daily-session recipe missing");
assert(catalog.guides.find(g=>g.id==="visual-data").markdown.includes("source snapshot cutoff"),"Daily preparation instructions missing");
assert(catalog.guides.find(g=>g.id==="pipelines").markdown.includes('"session_close": "time"'),"Session time/availability role explanation missing");
assert(catalog.guides.some(g=>g.id==="batch-pipelines"&&g.markdown.includes("try/catch")),"Batch language guide missing");
assert(registry.items.some(item=>item.label==="array.forEach"),"Sequential array iteration API missing");
assert(catalog.examples.some(e=>e.file==="pipelines/batch-daily-normalization-v2.5.kx"),"Batch recipe missing");
const manifest=JSON.parse(read("src/generated/sync-manifest.json"));
for(const file of manifest.files)assert(fs.existsSync(path.join(root,file)),`Missing managed asset ${file}`);
assert.deepEqual(JSON.parse(read("public/examples/index.json")),catalog.examples.map(({file,title})=>({file,title})));
console.log(`Docs coverage: ${catalog.guides.length} Studio guides, ${catalog.examples.length} examples, ${registry.items.length} API entries; snapshot consistency PASS`);
