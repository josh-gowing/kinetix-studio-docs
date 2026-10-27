import catalog from "../generated/studio-docs.json";
import { guides } from "./navigation";
import type { KxRegistry } from "../types";
export type SearchResult = { key: string; title: string; subtitle: string; route: string; type: "guide" | "api" | "example" };
export function searchDocumentation(query: string, registry: KxRegistry): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const candidates: Array<SearchResult & { text: string }> = [
    ...catalog.guides.map(g => ({ key: `studio-${g.id}`, title: g.title, subtitle: g.description, route: `/studio/${g.id}`, type: "guide" as const, text: g.markdown })),
    ...guides.map(g => ({ key: `guide-${g.id}`, title: g.label, subtitle: g.description, route: `/guide/${g.id}`, type: "guide" as const, text: g.description })),
    ...registry.items.map(item => { const ns = item.label.includes(".") ? item.label.split(".")[0] : "globals"; return { key: `api-${item.label}`, title: item.label, subtitle: item.documentation, route: ns === "globals" ? "/api" : `/api/${ns}/${encodeURIComponent(item.label)}`, type: "api" as const, text: `${item.detail} ${item.documentation}` }; }),
    ...registry.declarations.map(item => ({ key: `declaration-${item.label}`, title: item.label, subtitle: item.documentation, route: "/api", type: "api" as const, text: `${item.signature} ${item.documentation}` })),
    ...registry.globalItems.map(item => ({ key: `global-${item.label}`, title: item.label, subtitle: item.documentation, route: "/api", type: "api" as const, text: `${item.detail} ${item.documentation}` })),
    ...catalog.examples.map(example => ({ key: `example-${example.file}`, title: example.title, subtitle: example.file, route: `/examples/${example.file.split("/").map(encodeURIComponent).join("/")}`, type: "example" as const, text: example.code }))
  ];
  const score = (item: SearchResult) => item.title.toLowerCase() === q ? 0 : item.title.toLowerCase().includes(q) ? 1 : 2;
  return candidates.filter(item => `${item.title} ${item.subtitle} ${item.text}`.toLowerCase().includes(q)).sort((a,b)=>score(a)-score(b)).slice(0,30);
}
