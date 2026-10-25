import { FileCode2, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { routeTo } from "../router";
import { CodeBlock } from "./CodeBlock";

type Example = { file: string; title: string };

export function ExamplesPage({ activeFile }: { activeFile?: string }) {
  const [examples, setExamples] = useState<Example[]>([]);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}examples/index.json`)
      .then((res) => res.json())
      .then((items: Example[]) => setExamples(items))
      .finally(() => setLoading(false));
  }, []);

  const active = useMemo(() => {
    const decoded = activeFile ? decodeURIComponent(activeFile) : undefined;
    return examples.find((entry) => entry.file === decoded) || examples[0];
  }, [activeFile, examples]);

  useEffect(() => {
    if (!active) return;
    setCode("");
    fetch(`${import.meta.env.BASE_URL}examples/${encodeURIComponent(active.file)}`)
      .then((res) => res.text())
      .then(setCode);
  }, [active]);

  return <div className="page examples-page">
    <header className="doc-intro"><span>Examples</span><h1>KX Examples</h1><p>Complete scripts synced from the Kinetix Studio examples directory.</p></header>
    {loading ? <div className="loading"><Loader2 className="spin" /> Loading examples…</div> : (
      <div className="examples-layout">
        <aside className="example-list">
          {examples.map((entry) => <button key={entry.file} className={entry.file === active?.file ? "active" : ""} onClick={() => routeTo(`/examples/${encodeURIComponent(entry.file)}`)}><FileCode2 size={14} /><span>{entry.title}</span></button>)}
        </aside>
        <section className="example-content">
          <div className="example-title"><span>Example</span><h2>{active?.title || "Select an example"}</h2></div>
          {active && code ? <CodeBlock code={code} label={active.file} /> : null}
        </section>
      </div>
    )}
  </div>;
}
