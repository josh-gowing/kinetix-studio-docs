import { FileCode2 } from "lucide-react";
import { routeTo } from "../router";
import catalog from "../generated/studio-docs.json";
import { CodeBlock } from "./CodeBlock";

export function ExamplesPage({ activeFile }: { activeFile?: string }) {
  const active = activeFile ? catalog.examples.find(example => example.file === activeFile) : catalog.examples[0];
  return <div className="page examples-page">
    <header className="doc-intro"><span>Examples · Studio {catalog.studioVersion}</span><h1>KX Examples</h1><p>Complete scripts synchronized recursively from Studio. Folder names distinguish versioned workflows and examples with the same filename.</p></header>
    <div className="examples-layout"><aside className="example-list">{catalog.examples.map(entry => <button key={entry.file} className={entry.file === active?.file ? "active" : ""} onClick={() => routeTo(`/examples/${entry.file.split("/").map(encodeURIComponent).join("/")}`)}><FileCode2 size={14}/><span>{entry.title}<small>{entry.file}</small></span></button>)}</aside>
      <section className="example-content">{active ? <><div className="example-title"><span>Example</span><h2>{active.title}</h2><a href={`${import.meta.env.BASE_URL}examples/${active.file.split("/").map(encodeURIComponent).join("/")}`} download>Download .kx</a></div><CodeBlock code={active.code} label={active.file}/></> : <div className="empty-state"><h2>Example not found</h2><p>Select an example from the list.</p></div>}</section>
    </div>
  </div>;
}
