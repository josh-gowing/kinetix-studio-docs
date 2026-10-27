import { AlertTriangle, ArrowRight, CheckCircle2, Info } from "lucide-react";
import { routeTo } from "../router";
import type { GuideId } from "../types";
import { CodeBlock } from "./CodeBlock";
import { multiAssetExample, pointInTimeExample, quickIndicator, quickStrategy, researchExample } from "../content/examples";

export function GuidePage({ id }: { id: GuideId }) {
  switch (id) {
    case "getting-started": return <GettingStarted />;
    case "language-basics": return <LanguageBasics />;
    case "script-types": return <ScriptTypes />;
    case "data": return <DataGuide />;
    case "strategies": return <StrategyGuide />;
    case "multi-asset": return <MultiAssetGuide />;
    case "point-in-time": return <PointInTimeGuide />;
    case "research": return <ResearchGuide />;
  }
}

function PageIntro({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return <header className="doc-intro"><span>{eyebrow}</span><h1>{title}</h1><p>{children}</p></header>;
}

function Callout({ type = "info", children }: { type?: "info" | "warning" | "success"; children: React.ReactNode }) {
  const Icon = type === "warning" ? AlertTriangle : type === "success" ? CheckCircle2 : Info;
  return <div className={`callout callout-${type}`}><Icon size={17} /><div>{children}</div></div>;
}

function Next({ label, route }: { label: string; route: string }) {
  return <button className="next-link" onClick={() => routeTo(route)}><span>Next</span><strong>{label}</strong><ArrowRight size={17} /></button>;
}

function GettingStarted() {
  return <div className="page prose-page">
    <PageIntro eyebrow="Guide 01" title="Getting Started">KX scripts live inside Kinetix Studio and operate directly on the chart or Data Library datasets you choose.</PageIntro>
    <h2>Choose the script type first</h2>
    <p>Every KX file begins with one root declaration. Use an <code>indicator</code> for reusable chart calculations, a <code>study</code> for research, a <code>strategy</code> for backtesting, a <code>pipeline</code> to prepare data, or a <code>library</code> for reusable modules.</p>
    <div className="declaration-grid">
      <code>indicator({`{ name, dataset?, overlay? }`})</code>
      <code>study({`{ name, dataset?, overlay? }`})</code>
      <code>strategy({`{ name, dataset, ... }`})</code>
      <code>library({`{ name }`})</code>
      <code>pipeline({`{ name }`})</code>
    </div>
    <h2>Your first indicator</h2>
    <p>The built-in market fields <code>open</code>, <code>high</code>, <code>low</code>, <code>close</code>, <code>volume</code> and <code>time</code> refer to the active script dataset.</p>
    <CodeBlock code={quickIndicator} />
    <Callout type="info"><strong>Dataset binding.</strong> A generic Indicator can omit <code>dataset</code> and later be attached to data in the Studio. Studies and Strategies can bind datasets directly in their declaration.</Callout>
    <h2>Your first strategy</h2>
    <p>KX Strategies evaluate sequentially on completed bars. A normal market entry generated on bar <em>N</em> fills on the next eligible bar according to the strategy execution model.</p>
    <CodeBlock code={quickStrategy} />
    <h2>Where to go next</h2>
    <p>Learn the difference between scalar values and Series before writing more complex KX. It is the most important mental model in the language.</p>
    <Next label="Language Basics" route="/guide/language-basics" />
  </div>;
}

function LanguageBasics() {
  return <div className="page prose-page">
    <PageIntro eyebrow="Guide 02" title="Language Basics">KX looks familiar if you know JavaScript or Pine, but its time-series semantics are explicit and deterministic.</PageIntro>
    <h2>Scalars and Series</h2>
    <p>A scalar is one value. A <code>Series&lt;number&gt;</code> is a value aligned across the active timeline. Market fields and most technical-analysis functions are Series.</p>
    <CodeBlock code={`const length = 20;              // scalar number\nconst average = ta.sma(close, length); // Series<number>\nconst above = close > average;         // Series<boolean>`} />
    <h2>History references</h2>
    <p>Series support historical indexing. <code>close[1]</code> means the previous aligned value, not future data.</p>
    <CodeBlock code={`const previousClose = close[1];\nconst change = close - close[1];`} />
    <h2>Missing values</h2>
    <p>KX exposes <code>na</code>, <code>isNa()</code> and <code>nz()</code>. Treat missing observations explicitly in research rather than silently turning them into zeros.</p>
    <CodeBlock code={`const safe = nz(externalSeries, 0);\nif (!isNa(close[20])) {\n  // enough history exists\n}`} />
    <h2>Control flow and collections</h2>
    <p>Use normal <code>if</code>, <code>for</code> and <code>for...of</code> control flow. KX also includes <code>array</code>, <code>map</code>, <code>set</code> and <code>object</code> namespaces for larger research workflows.</p>
    <CodeBlock code={`const symbols = data.list({ kind: "ohlcv", timeframe: "1D" });\nconst scores = map.create();\n\nfor (const dataset of symbols) {\n  const market = data.market(dataset);\n  map.set(scores, dataset, series.pctChange(market.close, 20));\n}`} />
    <Callout type="warning"><strong>No-lookahead is a language invariant.</strong> External data must be causally aligned. Functions that can expose future information require explicit lookahead permission.</Callout>
    <Next label="Script Types" route="/guide/script-types" />
  </div>;
}

function ScriptTypes() {
  return <div className="page prose-page">
    <PageIntro eyebrow="Guide 03" title="Script Types">The root declaration tells Kinetix what your script is allowed to do and how its outputs should be presented.</PageIntro>
    <h2>Indicator</h2><p>Use an Indicator for reusable visual calculations. Indicators can be generic and attached to a chart dataset later.</p>
    <CodeBlock code={`indicator({ name: "VWAP", overlay: true });\nconst value = ta.vwap(close, volume);\nplot.line(value, { title: "VWAP" });`} />
    <h2>Study</h2><p>Studies are research programs. They can load arbitrary data, compute Series, emit values and build structured <code>report.*</code> output without placing orders.</p>
    <CodeBlock code={researchExample} />
    <h2>Strategy</h2><p>Strategies have access to the deterministic broker runtime, account state, order submission and portfolio metrics.</p>
    <CodeBlock code={quickStrategy} />
    <h2>Pipeline</h2><p>Pipelines read/download data, transform native plans, validate and save immutable registered outputs. These operations are separate from Study/Strategy execution.</p><CodeBlock code={'pipeline({ name: "Inspect data" });\nconst raw = data.read("data/prices.csv", { scope: "workspace", format: "csv" });\nconsole.log(data.preview(raw, { limit: 25, includeTotal: false }));'}/><p><a href="#/studio/visual-data">Visual preparation</a> can generate an equivalent KX pipeline.</p>
    <h2>Library</h2><p>Libraries package reusable logic. Import them from other KX files instead of duplicating calculations or research helpers.</p>
    <CodeBlock code={`library({ name: "Research Helpers" });\n\nexport function zMomentum(series, length) {\n  return stats.zscore(series.pctChange(series, length));\n}`} />
    <Next label="Data & Datasets" route="/guide/data" />
  </div>;
}

function DataGuide() {
  return <div className="page prose-page">
    <PageIntro eyebrow="Guide 04" title="Data & Datasets">KX is data-vendor independent. Imported datasets retain their own metadata and can be read from any Indicator, Study or Strategy.</PageIntro>
    <h2>Primary market data</h2><p>The active dataset exposes the standard market Series directly: <code>open</code>, <code>high</code>, <code>low</code>, <code>close</code>, <code>volume</code> and <code>time</code>.</p>
    <h2>Another market dataset</h2>
    <CodeBlock code={`const spy = data.market("SPY_1D");\nconst marketTrend = spy.close > ta.sma(spy.close, 200);`} />
    <h2>Arbitrary imported data</h2>
    <CodeBlock code={`const earnings = data.dataset("EARNINGS_EVENTS");\nconst msftRows = data.filter(earnings, {\n  column: "symbol",\n  equals: "MSFT"\n});`} />
    <h2>Dynamic universes</h2>
    <CodeBlock code={`const universe = data.list({\n  kind: "ohlcv",\n  timeframe: "1D",\n  nameContains: "US_EQUITY",\n  field: "id"\n});`} />
    <Callout type="info"><strong>Use dataset IDs for reproducibility.</strong> Human-readable names can change; the stable Data Library identifier is the safest routing key for production research.</Callout>
    <Next label="Strategies & Orders" route="/guide/strategies" />
  </div>;
}

function StrategyGuide() {
  return <div className="page prose-page">
    <PageIntro eyebrow="Guide 05" title="Strategies & Orders">Strategies execute against a broker-aware sequential runtime rather than replaying precomputed signal arrays.</PageIntro>
    <h2>Strategy declaration</h2>
    <CodeBlock code={`strategy({\n  name: "Example",\n  dataset: "ASSET_1D",\n  initialCapital: 100000,\n  commissionType: "percent",\n  commission: 0.0001,\n  defaultQtyType: "percent_equity",\n  defaultQtyValue: 20\n});`} />
    <h2>Orders</h2><p>Use <code>strategy.entry()</code> for normal entries, <code>strategy.order()</code> for generic directional orders, <code>strategy.close()</code> for market exits and <code>strategy.exit()</code> for independent stops, targets, scale-outs and trails.</p>
    <CodeBlock code={`strategy.entry("Long", strategy.long);\n\nstrategy.exit("Protection", {\n  from: "Long",\n  qtyPercent: 100,\n  stop: strategy.positionAvgPrice * 0.97,\n  limit: strategy.positionAvgPrice * 1.06\n});`} />
    <h2>Live broker state</h2><p>Strategy code can inspect current position size, average price, equity, cash, open P&amp;L, exposure and instrument-specific position state.</p>
    <CodeBlock code={`if (strategy.positionSize == 0 && signal) {\n  strategy.entry("Long", strategy.long);\n}\n\nif (strategy.positionBarsHeld >= 40) {\n  strategy.close("Long");\n}`} />
    <Callout type="success"><strong>Deterministic execution.</strong> The same data, KX source and settings are designed to reproduce the same order sequence and result.</Callout>
    <Next label="Multi-Asset Portfolios" route="/guide/multi-asset" />
  </div>;
}

function MultiAssetGuide() {
  return <div className="page prose-page">
    <PageIntro eyebrow="Guide 06" title="Multi-Asset Portfolios">Trade many instruments against one account. Every accepted order consumes the same shared capital and buying power.</PageIntro>
    <CodeBlock code={multiAssetExample} />
    <h2>Why shared capital matters</h2><p>Three signals do not receive three independent accounts. Position limits, available cash, quantity rules and margin requirements are enforced at portfolio level.</p>
    <h2>Instrument-specific state</h2>
    <CodeBlock code={`strategy.positionSizeOf(dataset)\nstrategy.positionAvgPriceOf(dataset)\nstrategy.openPnlOf(dataset)\nstrategy.positionBarsHeldOf(dataset)\nstrategy.positionEntryTimeOf(dataset)`} />
    <h2>Asset-neutral instrument metadata</h2><p>Portfolio instruments can define cash or margin capital models, margin rates, point value, quantity step, minimum quantity, sector and tick size. The broker core is not tied to equities.</p>
    <Next label="Point-in-Time Data" route="/guide/point-in-time" />
  </div>;
}

function PointInTimeGuide() {
  return <div className="page prose-page">
    <PageIntro eyebrow="Guide 07" title="Point-in-Time Data">Event research is only meaningful when KX knows when information became observable—not merely the date a row describes.</PageIntro>
    <h2>Event time vs availability time</h2><p>A dataset may contain the time an event occurred and a later time at which that information became public. KX uses the configured availability timeline by default for causal research.</p>
    <CodeBlock code={pointInTimeExample} />
    <h2>Date-only sources</h2><p>If a historical source provides a date but no publication time, KX does not pretend midnight was the true availability time. Apply an explicit conservative lag when appropriate.</p>
    <CodeBlock code={`const events = data.dataset("DATE_ONLY_EVENTS", {\n  delay: "1d"\n});`} />
    <Callout type="warning"><strong>Point-in-time integrity starts with the source.</strong> KX can enforce an availability timestamp, but it cannot prove that a vendor's historical consensus estimate was genuinely known at that time.</Callout>
    <h2>Causal alignment</h2><p><code>data.align(..., {`{ mode: "previous" }`})</code> carries the latest observation that was actually available at or before the current strategy time.</p>
    <Next label="Research & Reports" route="/guide/research" />
  </div>;
}

function ResearchGuide() {
  return <div className="page prose-page">
    <PageIntro eyebrow="Guide 08" title="Research & Reports">Studies and Strategies can produce structured output that lives beyond the chart.</PageIntro>
    <CodeBlock code={researchExample} />
    <h2>Report primitives</h2><p>Use <code>report.metric()</code>, <code>report.table()</code>, <code>report.line()</code> and <code>report.histogram()</code> to build analysis that is independent of Strategy trades.</p>
    <h2>Inputs and presets</h2><p><code>input.*</code> values appear in Kinetix Studio's Inputs panel and can participate in saved presets and parameter sweeps.</p>
    <h2>Research Studio</h2><p>Saved runs capture exact source and input state. Compare runs, sweep numeric parameters, and segment research into train, validation and out-of-sample periods.</p>
    <Callout type="info"><strong>Keep research and optimisation separate.</strong> A parameter sweep is a tool for understanding model behaviour, not evidence that the best historical cell will generalise.</Callout>
    <Next label="API Reference" route="/api" />
  </div>;
}
