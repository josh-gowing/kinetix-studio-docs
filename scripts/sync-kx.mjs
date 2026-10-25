import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const checkOnly = args.includes("--check");
const sourceArg = args.find((arg) => arg !== "--check");
const root = process.cwd();
const studioRoot = path.resolve(root, sourceArg || process.env.KX_STUDIO_ROOT || "../../Charting/kinetix-studio");
const apiSource = path.join(studioRoot, "public", "kx-api.json");
const examplesSource = path.join(studioRoot, "examples");

if (!fs.existsSync(apiSource)) {
  console.error(`KX API registry not found: ${apiSource}`);
  console.error("Pass a Kinetix Studio path: npm run sync:kx -- F:/path/to/kinetix-studio");
  process.exit(1);
}

const api = JSON.parse(fs.readFileSync(apiSource, "utf8"));
if (!api?.language || !api?.version || !Array.isArray(api?.items)) {
  console.error("The source kx-api.json does not look like a valid KX registry export.");
  process.exit(1);
}

const publicApi = path.join(root, "public", "kx-api.json");
const generatedApi = path.join(root, "src", "generated", "kx-api.json");
const serialized = `${JSON.stringify(api, null, 2)}\n`;

if (checkOnly) {
  const current = fs.existsSync(publicApi) ? fs.readFileSync(publicApi, "utf8") : "";
  if (current !== serialized) {
    console.error(`Docs registry is out of sync with KX ${api.version}. Run npm run sync:kx.`);
    process.exit(2);
  }
  console.log(`KX docs registry is current: KX ${api.version}, ${api.items.length} API entries.`);
  process.exit(0);
}

fs.mkdirSync(path.dirname(publicApi), { recursive: true });
fs.mkdirSync(path.dirname(generatedApi), { recursive: true });
fs.writeFileSync(publicApi, serialized);
fs.writeFileSync(generatedApi, serialized);

const publicExamples = path.join(root, "public", "examples");
fs.mkdirSync(publicExamples, { recursive: true });
const manifest = [];
if (fs.existsSync(examplesSource)) {
  for (const name of fs.readdirSync(examplesSource).filter((name) => name.toLowerCase().endsWith(".kx")).sort()) {
    fs.copyFileSync(path.join(examplesSource, name), path.join(publicExamples, name));
    manifest.push({ file: name, title: name.replace(/\.kx$/i, "") });
  }
}
fs.writeFileSync(path.join(publicExamples, "index.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Synced KX ${api.version}: ${api.items.length} API entries and ${manifest.length} examples from ${studioRoot}`);
