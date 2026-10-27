import { BookOpen, Braces, FileCode2, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { searchDocumentation, type SearchResult } from "../content/search";
import { routeTo } from "../router";
import type { KxRegistry } from "../types";



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
    return searchDocumentation(query, registry);
  }, [query, registry]);

  if (!open) return null;

  return <div className="search-overlay" onMouseDown={onClose}>
    <div role="dialog" aria-modal="true" aria-label="Search documentation" className="search-dialog" onMouseDown={(e) => e.stopPropagation()}>
      <div className="search-input-row"><Search size={18} /><input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search Studio, KX APIs and examples…" /><button aria-label="Close search" onClick={onClose}><X size={16} /></button></div>
      <div className="search-results">
        {!query ? <div className="search-empty"><kbd>Ctrl</kbd><span>+</span><kbd>K</kbd><p>Search the Studio manual, KX API reference and example code.</p></div> : null}
        {query && !results.length ? <div className="search-empty"><Search size={22} /><p>No KX documentation matched “{query}”.</p></div> : null}
        {results.map((result) => {
          const Icon = result.type === "guide" ? BookOpen : result.type === "example" ? FileCode2 : Braces;
          return <button key={result.key} onClick={() => { routeTo(result.route); onClose(); }}><Icon size={15} /><span><strong>{result.title}</strong><small>{result.subtitle}</small></span></button>;
        })}
      </div>
    </div>
  </div>;
}
