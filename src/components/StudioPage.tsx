import { Children, isValidElement, type ReactNode } from "react";
import { useEffect } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import catalog from "../generated/studio-docs.json";
import { CodeBlock } from "./CodeBlock";

const plainText = (node: ReactNode): string => Children.toArray(node).map(child => isValidElement<{ children?: ReactNode }>(child) ? plainText(child.props.children) : String(child)).join("");
export const headingId = (value: string) => value.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, "").trim().replace(/\s+/g, "-");
const linkFor = (href: string) => {
  if (href.startsWith("#")) return href;
  const [file, anchor] = href.split("#");
  const target = catalog.guides.find(g => g.source === file || g.source.split("/").pop() === file.split("/").pop());
  if (target) return `#/studio/${target.id}${anchor ? `/${encodeURIComponent(anchor)}` : ""}`;
  const example = catalog.examples.find(e => e.file === file.replace(/^examples\//, ""));
  if (example) return `#/examples/${example.file.split("/").map(encodeURIComponent).join("/")}`;
  if (/^https?:|^mailto:/i.test(href)) return href;
  return undefined;
};
export function StudioPage({ id, anchor }: { id: string; anchor?: string }) {
  const guide = catalog.guides.find(guide => guide.id === id);
  useEffect(() => { if (anchor) requestAnimationFrame(() => document.getElementById(anchor)?.scrollIntoView()); }, [id, anchor]);
  if (!guide) return <div className="page"><h1>Guide not found</h1><a href="#/studio/overview">Open the Studio manual</a></div>;
  const headings = [...guide.markdown.matchAll(/^##\s+(.+)$/gm)].map(match => match[1]);
  return <article className="page prose-page studio-manual">
    <header className="doc-intro"><span>Studio manual · {catalog.studioVersion}</span><h1>{guide.title}</h1><p>{guide.description}</p><small>KX language reference: {catalog.languageVersion} · {guide.origin === "studio" ? `Synced from ${guide.source}` : "Studio workflow guide"}</small></header>
    {!!headings.length && <nav className="manual-toc" aria-label="On this page"><strong>On this page</strong>{headings.map((title,index) => <button key={index} onClick={() => document.getElementById(headingId(title))?.scrollIntoView({ behavior: "smooth" })}>{title}</button>)}</nav>}
    <Markdown remarkPlugins={[remarkGfm]} components={{
      h1: ({ children }) => <h2>{children}</h2>,
      h2: ({ children }) => <h2 id={headingId(plainText(children))}>{children}</h2>,
      h3: ({ children }) => <h3 id={headingId(plainText(children))}>{children}</h3>,
      pre: ({ children }) => <>{children}</>,
      code: ({ children, className }) => className || String(children).includes("\n") ? <CodeBlock code={String(children).replace(/\n$/, "")} label={className?.replace("language-", "") || "Code"}/> : <code>{children}</code>,
      a: ({ href, children }) => {
        const url = linkFor(href || "");
        if (!url) return <span>{children}</span>;
        return <a href={url} onClick={href?.startsWith("#") ? e => { e.preventDefault(); document.getElementById(href.slice(1))?.scrollIntoView(); } : undefined} target={/^https?:/.test(url) ? "_blank" : undefined} rel="noreferrer">{children}</a>;
      },
      table: ({ children }) => <div className="manual-table"><table>{children}</table></div>
    }}>{guide.markdown.replace(/^# .+\r?\n/, "")}</Markdown>
    <p className="manual-source">This manual describes implemented behavior; provider access and documented engine limits still apply. API signatures come from the synchronized KX registry.</p>
  </article>;
}
