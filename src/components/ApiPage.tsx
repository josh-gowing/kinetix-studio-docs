import { Braces, ChevronRight, Search } from "lucide-react";
import type { KxRegistry } from "../types";
import { apiGroups } from "../content/navigation";
import { routeTo } from "../router";
import { ApiCard } from "./ApiCard";

export function ApiIndexPage({ registry }: { registry: KxRegistry }) {
  return <div className="page api-index-page">
    <header className="doc-intro"><span>Reference</span><h1>KX API Reference</h1><p>{registry.items.length} public API entries generated from the canonical KX {registry.version} registry used by Kinetix Studio tooling.</p></header>
    <div className="api-overview-card">
      <Braces size={20} />
      <div><strong>Canonical API registry</strong><p>The machine-readable registry is published with these docs so editor tooling and external assistants can reference the same public surface.</p></div>
      <a href="./kx-api.json" target="_blank" rel="noreferrer">View JSON</a>
    </div>
    <section className="api-declarations">
      <h2>Root declarations</h2>
      <div className="declaration-cards">
        {registry.declarations.map((item) => <div key={item.label}><code>{item.signature}</code><p>{item.documentation}</p></div>)}
      </div>
    </section>
    <section>
      <h2>Namespaces</h2>
      <div className="namespace-grid">
        {apiGroups.flatMap((group) => group.namespaces.map((namespace) => {
          const count = registry.namespaces[namespace]?.length ?? 0;
          return <button key={namespace} onClick={() => routeTo(`/api/${namespace}`)}>
            <div><code>{namespace}.*</code><span>{count} entries</span></div><ChevronRight size={16} />
          </button>;
        }))}
      </div>
    </section>
    <section className="globals-section">
      <h2>Global market values</h2>
      <div className="token-cloud">{registry.globals.map((value) => <code key={value}>{value}</code>)}</div>
    </section>
  </div>;
}

export function NamespacePage({ registry, namespace, item }: { registry: KxRegistry; namespace: string; item?: string }) {
  const items = registry.namespaces[namespace];
  if (!items) return <div className="page empty-state"><Search /><h1>Unknown namespace</h1><p><code>{namespace}</code> is not present in KX {registry.version}.</p></div>;
  const focusLabel = item ? decodeURIComponent(item) : undefined;
  return <div className="page namespace-page">
    <header className="doc-intro"><span>API namespace</span><h1><code>{namespace}.*</code></h1><p>{items.length} public {items.length === 1 ? "entry" : "entries"} in KX {registry.version}.</p></header>
    <div className="namespace-item-list">
      {items.map((entry) => <ApiCard key={entry.label} item={entry} namespace={namespace} />)}
    </div>
    {focusLabel ? <ScrollToApi label={focusLabel} /> : null}
  </div>;
}

function ScrollToApi({ label }: { label: string }) {
  const id = label.replace(/[^a-zA-Z0-9_.-]/g, "-");
  window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" }), 20);
  return null;
}
