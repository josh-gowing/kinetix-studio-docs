import { Hash, Link as LinkIcon } from "lucide-react";
import type { ApiItem } from "../types";
import { routeTo } from "../router";

function itemId(label: string) {
  return label.replace(/[^a-zA-Z0-9_.-]/g, "-");
}

export function ApiCard({ item, namespace }: { item: ApiItem; namespace: string }) {
  const id = itemId(item.label);
  const signature = item.detail || item.label;
  return (
    <article className="api-card" id={id}>
      <div className="api-card-title-row">
        <div>
          <code className="signature">{signature}</code>
          <span className={`kind-badge kind-${item.kind || "value"}`}>{item.kind || "value"}</span>
        </div>
        <button
          className="anchor-button"
          title="Copy link"
          onClick={() => {
            routeTo(`/api/${namespace}/${encodeURIComponent(item.label)}`);
            navigator.clipboard?.writeText(window.location.href);
          }}
        >
          <LinkIcon size={14} />
        </button>
      </div>
      <p>{item.documentation}</p>
      {item.insertText && item.kind === "function" ? (
        <div className="snippet-line"><Hash size={12} /><code>{item.insertText.replace(/\$\{\d+:([^}]+)\}/g, "$1")}</code></div>
      ) : null}
    </article>
  );
}
