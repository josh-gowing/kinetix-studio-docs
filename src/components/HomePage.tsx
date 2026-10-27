import catalog from "../generated/studio-docs.json";
import { ArrowRight, BookOpen, Braces, ChartNoAxesCombined, Database, FlaskConical, Layers3, ShieldCheck } from "lucide-react";
import type { KxRegistry } from "../types";
import { routeTo } from "../router";
import { CodeBlock } from "./CodeBlock";
import { quickIndicator } from "../content/examples";

export function HomePage({ registry }: { registry: KxRegistry }) {
  return (
    <div className="page home-page">
      <section className="hero">
        <div className="eyebrow"><span className="status-dot" /> KX Language Reference · v{registry.version}</div>
        <h1>Code research without<br />Pine's ceiling.</h1>
        <p className="hero-copy">
          The language reference and application manual for Kinetix Studio.
          Build indicators, research Studies and deterministic multi-asset strategies against your own data.
        </p>
        <div className="hero-actions">
          <button className="primary-button" onClick={() => routeTo("/guide/getting-started")}>Get started <ArrowRight size={15} /></button>
          <button className="secondary-button" onClick={() => routeTo("/studio/overview")}>Studio manual</button><button className="secondary-button" onClick={() => routeTo("/api")}>Browse API</button>
        </div>
        <div className="hero-stats">
          <div><strong>{registry.items.length}</strong><span>API entries</span></div>
          <div><strong>{Object.keys(registry.namespaces).length}</strong><span>namespaces</span></div>
          <div><strong>{registry.declarations.length}</strong><span>script types</span></div>
          <div><strong>{catalog.studioVersion}</strong><span>Studio version</span></div>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <span>Language model</span>
          <h2>One language for charting, research and execution.</h2>
          <p>KX shares the same Series semantics across Indicators, Studies and Strategies, so the calculation you visualise is the calculation you can research and trade.</p>
        </div>
        <div className="feature-grid">
          <Feature icon={<ChartNoAxesCombined />} title="Indicators" text="Reusable calculations and visual overlays using the same market Series available to strategies." route="/guide/script-types" />
          <Feature icon={<FlaskConical />} title="Studies" text="Research imported datasets, produce report metrics, tables and charts without inventing trades." route="/guide/research" />
          <Feature icon={<Layers3 />} title="Strategies" text="Deterministic broker-aware execution with shared capital, portfolio positions and order state." route="/guide/strategies" />
          <Feature icon={<Database />} title="Pipelines" text="Download, clean, transform and register data visually or with KX, using the same native engine." route="/studio/visual-data" />
          <Feature icon={<Braces />} title="Libraries" text="Package reusable KX logic into importable modules instead of duplicating research code." route="/guide/script-types" />
        </div>
      </section>

      <section className="split-section">
        <div className="split-copy">
          <div className="section-kicker">A small first script</div>
          <h2>Series-first by design.</h2>
          <p>Market fields such as <code>close</code> are time-aligned Series. Technical functions return Series, and plots consume those same values directly.</p>
          <button className="text-button" onClick={() => routeTo("/guide/language-basics")}>Understand Series semantics <ArrowRight size={14} /></button>
        </div>
        <CodeBlock code={quickIndicator} />
      </section>

      <section className="section-block">
        <div className="section-heading compact">
          <span>Built for serious data</span>
          <h2>KX is not tied to a market-data vendor.</h2>
        </div>
        <div className="capability-list">
          <div><Database /><span><strong>Bring your own data</strong><small>OHLCV, events, fundamentals, trades, ticks and arbitrary research tables.</small></span></div>
          <div><ShieldCheck /><span><strong>Point-in-time aware</strong><small>Separate event time from information availability and keep causal alignment explicit.</small></span></div>
          <div><Layers3 /><span><strong>Shared-capital portfolios</strong><small>Route orders across instruments while every position competes for the same account.</small></span></div>
          <div><BookOpen /><span><strong>Canonical reference</strong><small>This site is generated from the same public API registry used by Kinetix Studio tooling.</small></span></div>
        </div>
      </section>
    </div>
  );
}

function Feature({ icon, title, text, route }: { icon: React.ReactNode; title: string; text: string; route: string }) {
  return (
    <button className="feature-card" onClick={() => routeTo(route)}>
      <span className="feature-icon">{icon}</span>
      <strong>{title}</strong>
      <p>{text}</p>
      <span className="feature-link">Read guide <ArrowRight size={13} /></span>
    </button>
  );
}
