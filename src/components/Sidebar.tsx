import { BookOpen, Braces, ChevronDown, FileCode2, Home, Search } from "lucide-react";
import { useState } from "react";
import { apiGroups, guides } from "../content/navigation";
import { routeTo, type Route } from "../router";
import type { KxRegistry } from "../types";

export function Sidebar({ registry, route, onSearch }: { registry: KxRegistry; route: Route; onSearch: () => void }) {
  const [apiOpen, setApiOpen] = useState(true);
  const routeKey = route.type === "guide" ? `/guide/${route.id}` : route.type === "api" ? `/api/${route.namespace}` : route.type === "api-index" ? "/api" : route.type === "examples" ? "/examples" : "/";

  return <aside className="sidebar">
    <div className="brand-row" onClick={() => routeTo("/")}>
      <img src={`${import.meta.env.BASE_URL}kinetix-mark.png`} alt="Kinetix" />
      <div><strong>Kinetix Studio</strong><span>KX Documentation</span></div>
    </div>
    <button className="search-trigger" onClick={onSearch}><Search size={14} /><span>Search documentation</span><kbd>Ctrl K</kbd></button>
    <nav className="sidebar-nav">
      <button className={routeKey === "/" ? "active" : ""} onClick={() => routeTo("/")}><Home size={14} />Overview</button>
      <div className="nav-label">GUIDES</div>
      {guides.map((guide) => <button key={guide.id} className={routeKey === `/guide/${guide.id}` ? "active" : ""} onClick={() => routeTo(`/guide/${guide.id}`)}><BookOpen size={14} />{guide.label}</button>)}
      <div className="nav-label">REFERENCE</div>
      <button className={routeKey === "/api" ? "active" : ""} onClick={() => routeTo("/api")}><Braces size={14} />API Reference</button>
      <button className={routeKey === "/examples" ? "active" : ""} onClick={() => routeTo("/examples")}><FileCode2 size={14} />Examples</button>
      <button className="nav-disclosure" onClick={() => setApiOpen((v) => !v)}><ChevronDown size={13} className={apiOpen ? "open" : ""} />Namespaces <span>{Object.keys(registry.namespaces).length}</span></button>
      {apiOpen ? <div className="namespace-nav">
        {apiGroups.map((group) => <div key={group.label}><span>{group.label}</span>{group.namespaces.filter((ns) => registry.namespaces[ns]).map((ns) => <button key={ns} className={routeKey === `/api/${ns}` ? "active" : ""} onClick={() => routeTo(`/api/${ns}`)}><code>{ns}.*</code><small>{registry.namespaces[ns].length}</small></button>)}</div>)}
      </div> : null}
    </nav>
    <div className="sidebar-footer"><span>KX v{registry.version}</span><a href="https://github.com/josh-gowing/kinetix-studio" target="_blank" rel="noreferrer">Studio repo</a></div>
  </aside>;
}
