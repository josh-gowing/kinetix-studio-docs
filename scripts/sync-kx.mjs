import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const references = [
  ["workspaces", "Workspaces & shared libraries", "WORKSPACES.md", "Project roots, Explorer, imports and global reusable code."],
  ["pipelines", "KX pipelines & native data engine", "DATA_ENGINE.md", "Read, join, transform, validate, save and register data."],
  ["connections", "Connections & downloads", "V2.3_CONNECTIONS.md", "Provider setup, secure keys, download jobs, cancellation and resume."],
  ["research-studio", "Research Studio", "RESEARCH_STUDIO.md", "Reports, reproducible runs, comparisons, sweeps and chronological windows."],
  ["batch-pipelines", "Batch pipelines & language improvements", "V2.5_BATCH_PIPELINES.md", "Arrays, loops, per-instrument exceptions, diagnostics and sequential native batch workflows."],
  ["language-reference", "Language & runtime reference", "KX_LANGUAGE_FOUNDATION.md", "Detailed language, broker, portfolio and causal-data behavior."],
  ["integration", "Host integration", "INTEGRATION.md", "Embed Studio and connect workspace, data and chart services."]
];
const normalized = text => text.replace(/\r\n/g, "\n");
const hash = text => crypto.createHash("sha256").update(text).digest("hex");
const json = value => `${JSON.stringify(value, null, 2)}\n`;
function files(root, extension, prefix = "") {
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true }).sort((a,b) => a.name.localeCompare(b.name, "en")).flatMap(entry => {
    if (entry.isSymbolicLink()) return [];
    const name = prefix + entry.name;
    return entry.isDirectory() ? files(path.join(root, entry.name), extension, `${name}/`) : entry.isFile() && name.toLowerCase().endsWith(extension) ? [name] : [];
  });
}
export function collect(studioRoot, docsRoot) {
  const apiText = fs.readFileSync(path.join(studioRoot, "public/kx-api.json"), "utf8");
  const api = JSON.parse(apiText);
  if (!api.language || !api.version || !Array.isArray(api.items) || !Array.isArray(api.declarations) || !api.namespaces) throw new Error("Invalid KX registry export. Run npm run api:export in Studio first.");
  const studioVersion = JSON.parse(fs.readFileSync(path.join(studioRoot, "package.json"), "utf8")).version;
  const guides = references.map(([id, title, file, description]) => {
    const markdown = normalized(fs.readFileSync(path.join(studioRoot, file), "utf8"));
    return { id, title, description, markdown, source: file, origin: "studio", sha256: hash(markdown) };
  });
  for (const file of files(path.join(docsRoot, "content/studio"), ".json")) {
    const guide = JSON.parse(fs.readFileSync(path.join(docsRoot, "content/studio", file), "utf8"));
    if (!guide.id || !guide.title || !guide.description || !guide.markdown || guides.some(g => g.id === guide.id)) throw new Error(`Invalid or duplicate Studio guide: ${file}`);
    guides.push({ ...guide, source: `content/studio/${file}`, origin: "docs", sha256: hash(guide.markdown) });
  }
  const order = ["overview", "desktop", "workspaces", "connections", "visual-data", "pipelines", "batch-pipelines", "research-studio", "language-reference", "integration"];
  const rank = id => order.includes(id) ? order.indexOf(id) : order.length;
  guides.sort((a,b) => rank(a.id) - rank(b.id));
  const examples = files(path.join(studioRoot, "examples"), ".kx").map(file => {
    const code = normalized(fs.readFileSync(path.join(studioRoot, "examples", file), "utf8"));
    return { file, title: file.replace(/\.kx$/i, "").replace(/[_-]/g, " "), code, sha256: hash(code) };
  });
  const registrySource = path.join(studioRoot, "src/engine/apiRegistry.ts");
  const catalog = { studioVersion, languageVersion: api.version, registrySourceSha256: fs.existsSync(registrySource) ? hash(normalized(fs.readFileSync(registrySource,"utf8"))) : null, registrySha256: hash(json(api)), guides, examples };
  const outputs = new Map([
    ["public/kx-api.json", json(api)], ["src/generated/kx-api.json", json(api)],
    ["src/generated/studio-docs.json", json(catalog)],
    ["public/examples/index.json", json(examples.map(({ file, title }) => ({ file, title })))],
    ["public/studio/index.json", json(guides.map(({ id, title, description, source, sha256 }) => ({ id, title, description, source, sha256 })))]
  ]);
  for (const example of examples) outputs.set(`public/examples/${example.file}`, example.code);
  for (const guide of guides) outputs.set(`public/studio/${guide.id}.md`, guide.markdown);
  return { outputs, catalog };
}
export function synchronize(studioRoot, docsRoot, check = false) {
  const { outputs, catalog } = collect(studioRoot, docsRoot);
  const previousFile = path.join(docsRoot, "src/generated/sync-manifest.json");
  const previous = fs.existsSync(previousFile) ? JSON.parse(fs.readFileSync(previousFile, "utf8")) : { files: [] };
  const owned = name => /^(public\/(examples|studio)\/|public\/kx-api\.json$|src\/generated\/)/.test(name) && !name.split(/[\\/]/).includes("..") && !path.isAbsolute(name);
  if (!previous.files.every(owned)) throw new Error("Unsafe managed-file manifest; no files changed.");
  const obsolete = previous.files.filter(name => !outputs.has(name));
  const dirty = [...outputs].filter(([name, text]) => !fs.existsSync(path.join(docsRoot,name)) || normalized(fs.readFileSync(path.join(docsRoot,name),"utf8")) !== text).map(([name])=>name);
  const manifest = json({ files: [...outputs.keys()].sort(), studioVersion: catalog.studioVersion, languageVersion: catalog.languageVersion });
  if (check) {
    if (dirty.length || obsolete.some(name => fs.existsSync(path.join(docsRoot,name))) || !fs.existsSync(previousFile) || normalized(fs.readFileSync(previousFile,"utf8")) !== manifest) throw new Error(`Documentation is out of sync. Run npm run sync:kx. Changed: ${dirty.join(", ") || "manifest/stale files"}`);
  } else {
    for (const [name, text] of outputs) { const dest = path.join(docsRoot,name); fs.mkdirSync(path.dirname(dest),{recursive:true}); fs.writeFileSync(dest,text); }
    // Delete only exact files previously recorded by this tool; never an untracked directory.
    for (const name of obsolete) if (fs.existsSync(path.join(docsRoot,name))) fs.unlinkSync(path.join(docsRoot,name));
    fs.writeFileSync(previousFile,manifest);
  }
  return catalog;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2), check = args.includes("--check");
    const source = args.find(arg => arg !== "--check") || process.env.KX_STUDIO_ROOT || "../../Charting/kinetix-studio";
    const studioRoot = path.resolve(source);
    if (!check) {
      const exported = spawnSync(process.platform === "win32" ? "cmd.exe" : "npm", process.platform === "win32" ? ["/d", "/s", "/c", "npm run api:export"] : ["run", "api:export"], { cwd: studioRoot, stdio: "inherit" });
      if (exported.error || exported.status !== 0) throw new Error("Studio API export failed. Install Studio dependencies and retry sync; no docs snapshots were changed.");
    }
    const result = synchronize(studioRoot, process.cwd(), check);
    console.log(`${check ? "Verified" : "Synced"} Studio ${result.studioVersion} / KX ${result.languageVersion}: ${result.guides.length} Studio guides and ${result.examples.length} recursive examples.`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
