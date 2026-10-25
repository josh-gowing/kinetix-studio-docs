import { Github, Menu, Search } from "lucide-react";
import type { KxRegistry } from "../types";

export function Topbar({ registry, onSearch, onMenu }: { registry: KxRegistry; onSearch: () => void; onMenu: () => void }) {
  return <header className="topbar">
    <button className="mobile-menu" onClick={onMenu}><Menu size={18} /></button>
    <div className="topbar-title">KX <span>v{registry.version}</span></div>
    <div className="topbar-actions">
      <button onClick={onSearch}><Search size={15} /><span>Search</span></button>
      <a href="https://github.com/josh-gowing/kinetix-studio" target="_blank" rel="noreferrer"><Github size={16} /><span>GitHub</span></a>
    </div>
  </header>;
}
