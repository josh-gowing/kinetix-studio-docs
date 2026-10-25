import { BookOpen, Braces, FileCode2, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { guides } from "../content/navigation";
import { routeTo } from "../router";
import type { KxRegistry } from "../types";

type SearchResult = { key: string; title: string; subtitle: string; route: string; type: "guide" | "api" | "example" };

export function SearchPalette({ registry, open, onClose }: { registry: KxRegistry; open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      window.setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  useEffect(() => {
    function key(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onClose]);

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const guideResults = guides
      .filter((g) => `${g.label} ${g.description}`.toLowerCase().includes(q))
      .map((g) => ({ key: `guide-${g.id}`, title: g.label, subtitle: g.description, route: `/guide/${g.id}`, type: "guide" as const }));
    const apiResults = registry.items
      .filter((item) => `${item.label} ${item.detail || ""} ${item.documentation}`.toLowerCase().includes(q))
      .slice(0, 18)
      .map((item) => {
        const namespace = item.label.includes(".") ? item.label.split(".")[0] : "globals";
        return { key: `api-${item.label}`, title: item.label, subtitle: item.documentation, route: namespace === "globals" ? "/api" : `/api/${namespace}/${encodeURIComponent(item.label)}`, type: "api" as const };
      });
    return [...guideResults, ...apiResults].slice(0, 20);
  }, [query, registry]);

  if (!open) return null;

  return <div className="search-overlay" onMouseDown={onClose}>
    <div className="search-dialog" onMouseDown={(e) => e.stopPropagation()}>
      <div className="search-input-row"><Search size={18} /><input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search guides, functions and namespaces…" /><button onClick={onClose}><X size={16} /></button></div>
      <div className="search-results">
        {!query ? <div className="search-empty"><kbd>Ctrl</kbd><span>+</span><kbd>K</kbd><p>Search the complete KX public API and documentation.</p></div> : null}
        {query && !results.length ? <div className="search-empty"><Search size={22} /><p>No KX documentation matched “{query}”.</p></div> : null}
        {results.map((result) => {
          const Icon = result.type === "guide" ? BookOpen : result.type === "example" ? FileCode2 : Braces;
          return <button key={result.key} onClick={() => { routeTo(result.route); onClose(); }}><Icon size={15} /><span><strong>{result.title}</strong><small>{result.subtitle}</small></span></button>;
        })}
      </div>
    </div>
  </div>;
}
