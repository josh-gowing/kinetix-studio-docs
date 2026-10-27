# KX Language Foundation — KX 2.1

KX is the controlled TypeScript-like scripting language used by standalone **KX Studio**. Scripts do not receive unrestricted DOM, network, filesystem, browser or Tauri access. Market/research data enters through the Data Library and KX data APIs.

## v2.1 workspace-aware imports

KX scripts now retain physical scope/path metadata when used in the desktop IDE. Import paths resolve deterministically:

```kx
// relative to the importing project file
import library localUtil from "../scripts/local-util.kx";

// explicit active-workspace root
import library projectUtil from "@workspace/scripts/project-util.kx";

// explicit reusable global Kinetix Home
import library sharedUtil from "@global/Libraries/shared-util.kx";
```

Legacy basename-style imports remain compatible only when exactly one script matches. If a workspace resource and a global library resource share the same basename, KX reports the import as unresolved/ambiguous instead of silently choosing one. This makes project reproducibility explicit when reusable libraries are present.


## Script types

### Indicator

Indicators are reusable calculation/signal modules.

Generic Indicator:

```kx
indicator({
  name: "VWAP",
  overlay: true
});

const value = ta.vwap(close, volume);
plot.line(value, { title: "VWAP" });
export value;
```

Bare `open/high/low/close/volume/time` are generic Series inputs in this form. The file can compile/validate without loading market data and resolves those inputs from a parent Study/Strategy when imported.

Optional standalone visual binding:

```kx
indicator({
  name: "VWAP",
  dataset: "eur_usd_1d",
  overlay: true
});
```

A dataset-bound Indicator executes against that imported OHLCV dataset and opens Chart Preview for visual validation.

### Pipeline

Pipelines are KX data-engine programs. They may read approved workspace/global files, build lazy DuckDB-backed transformations, preview/validate results and save immutable registered dataset versions.

```kx
pipeline({ name: "Prepare Earnings" });
const raw = data.read("data/raw/earnings.parquet", { scope: "workspace" });
const clean = data.dedupe(raw, ["symbol", "fiscal_period"], { keep: "last" });
data.save(clean, {
  name: "earnings_pti",
  path: "data/processed/earnings.parquet",
  format: "parquet",
  versioned: true,
  kind: "fundamentals"
});
```

Native filesystem/data-mutation APIs are intentionally restricted to `pipeline()` scripts. A Study or Strategy using `data.read()`, `data.save()` or another native pipeline operation fails compilation with `KX5008`; historical backtests must consume already-created datasets rather than making mutable file/network calls.

### Study

Studies are visual/research programs. They can import Indicators, declare primary OHLCV, load any number of secondary datasets, create plots/panes/drawings and emit structured research output. They do not execute orders.

```kx
study({
  name: "Earnings Research",
  dataset: "eur_usd_1d",
  overlay: true
});

const earnings = data.dataset("earnings_results");
const surprise = earnings.eps_actual - earnings.eps_estimate;
plot.line(ta.ema(close, 20), { title: "EMA 20" });
```

### Strategy

Strategies are visual scripts with deterministic broker/backtest execution.

```kx
strategy({
  name: "EMA Cross",
  dataset: "eur_usd_1d",
  initialCapital: 100000,
  currency: "USD",
  commissionType: "percent",
  commission: 0.0001,
  slippage: 0,
  pyramiding: 1,
  defaultQtyType: "percent_equity",
  defaultQtyValue: 100
});

const fast = ta.ema(close, 20);
const slow = ta.ema(close, 50);

if (ta.crossover(fast, slow)) {
  strategy.entry("Long", strategy.long);
}
if (ta.crossunder(fast, slow)) {
  strategy.close("Long");
}
```

A Strategy **must** declare a primary OHLCV `dataset:`. Dataset economics (`pointValue`, `tickSize`, `currency`) are inherited automatically and may be overridden in the Strategy declaration.

## Strategy API — v1.8.6

### Directions

```kx
strategy.long
strategy.short
```

### Entries

Market entry:

```kx
strategy.entry("Long", strategy.long);
strategy.entry("Short", strategy.short);
```

Optional per-entry sizing overrides:

```kx
strategy.entry("Long", strategy.long, { qty: 2 });
strategy.entry("Long", strategy.long, { qtyPercent: 25 });
```

Pending limit entry:

```kx
strategy.entry("Pullback", strategy.long, { limit: limitPrice });
```

Pending stop entry:

```kx
strategy.entry("Breakout", strategy.long, { stop: triggerPrice });
```

Stop-limit entry:

```kx
strategy.entry("Breakout Pullback", strategy.long, { stop: triggerPrice, limit: limitPrice });
```

Generic directional order (net/reduce/reverse current exposure as required):

```kx
strategy.order("Adjust", strategy.short, { qty: 2 });
```

A pending order remains live until it fills, is replaced by another order with the same ID, or is cancelled. A stop-limit entry supplies both `stop` and `limit`; if the stop triggers intrabar but the OHLC path cannot prove a later limit fill, KX conservatively waits for a subsequent bar.

### Cancellation

```kx
strategy.cancel("Pullback");
strategy.cancelAll();
```

### Market close / scale-out

```kx
strategy.close("Long");
strategy.close("Long", { qty: 1 });
strategy.close("Long", { qtyPercent: 50 });
strategy.closeAll();
```

The first argument to `strategy.close()` references an entry ID. Quantity and percentage overrides support partial market exits.

### Protective stop / target

```kx
strategy.exit("Long Risk", "Long", {
  stop: stopPrice,
  limit: targetPrice
});
```

Equivalent `from` object form is also accepted:

```kx
strategy.exit("Long Risk", {
  from: "Long",
  stop: stopPrice,
  limit: targetPrice
});
```

`stop` and `limit` accept numeric scalars or `Series<number>`. Multiple `strategy.exit()` IDs may coexist for scale-outs. Exit quantity can be controlled with `qty` / `qtyPercent`, and a trailing exit can use `trailPoints` plus optional `trailOffset`.

```kx
strategy.exit("Target 1", "Long", { qtyPercent: 50, limit: target1 });
strategy.exit("Runner", "Long", { trailPoints: 4, trailOffset: 2 });
```

### Live broker state

Broker state is evaluated sequentially on each completed bar:

```kx
strategy.positionSize
strategy.positionAvgPrice
strategy.cash
strategy.availableCash
strategy.buyingPower
strategy.equity
strategy.openPnl
strategy.positionSide
strategy.pendingOrders
strategy.openPositions
strategy.grossExposure
strategy.netExposure
strategy.grossExposurePct
strategy.netExposurePct
```

For a single-instrument Strategy, `strategy.positionSize` is signed (positive long, negative short, zero flat). In a v1.8.6 portfolio Strategy, the unqualified `positionSize`/average/side refer to the primary Strategy instrument while the shared account fields refer to the complete portfolio. Named instruments are inspected with:

```kx
strategy.position("asset_b_1d")
strategy.positionSizeOf("asset_b_1d")
strategy.positionAvgPriceOf("asset_b_1d")
strategy.openPnlOf("asset_b_1d")
strategy.positionSideOf("asset_b_1d")
```

`strategy.cash` / `strategy.availableCash` are shared account cash in portfolio mode; entering a cash instrument reserves full notional while a margin instrument reserves configured margin capital.

### Strategy declaration options

Useful Strategy options include:

```kx
strategy({
  name: "Example",
  dataset: "es_1m",
  instruments: [
    "nq_1m",
    { dataset: "gc_1m", capitalModel: "margin", marginRate: 0.10, pointValue: 100, quantityStep: 1 }
  ],
  initialCapital: 100000,
  currency: "USD",
  commissionType: "cash_per_unit", // percent | cash_per_order | cash_per_unit
  commission: 1.25,
  slippage: 0.25,
  pyramiding: 1,
  maxPositions: 3,
  defaultQtyType: "fixed",          // fixed | percent_equity
  defaultQtyValue: 1,
  from: "2024-01-01",
  to: "2026-12-31"
});
```

`instruments` enables the shared-capital portfolio runtime. The primary `dataset` remains the Strategy decision clock. Each instrument may use dataset metadata or an object specification with `capitalModel`, `marginRate`, `pointValue`, `tickSize`, `quantityStep`, `minQuantity`, `sector`, and v1.8.6 `corporateActions`. `pointValue` / `tickSize` normally come from the relevant dataset unless overridden.

Orders route by dataset:

```kx
strategy.entry("NQ Long", strategy.long, { dataset: "nq_1m" });
strategy.exit("NQ Risk", "NQ Long", { dataset: "nq_1m", stop: stopPrice });
strategy.close("NQ Long", { dataset: "nq_1m" });
```

### Execution timing

The default `executionMode: "ohlc"` uses explicit deterministic semantics:

- logic is evaluated on completed bar N;
- market actions from N execute at N+1 open;
- pending limit/stop entries submitted on N are eligible from N+1 and remain live until filled/cancelled;
- protective instructions from N are active on N+1;
- stop gaps fill from the adverse bar open plus configured slippage;
- limit entries/exits may receive a better bar-open fill when the market gaps through the price;
- if both stop and target are touched and the OHLC path is unknowable, stop wins (conservative assumption);
- optional `from` / `to` bounds restrict broker execution while earlier loaded bars remain available for indicator warm-up.

Partial exits, stop-limit entries, trailing stops and broker-aware control flow are supported. v1.8 adds optional `executionMode: "bar_magnifier" | "trades" | "ticks"` plus `intrabarDataset`. Strategy logic remains on completed primary bars; fills can be reconstructed from the imported execution dataset. OHLC ambiguity remains conservative at whatever execution-data resolution is available.

## Series model

Time-indexed values are first-class typed Series:

```text
Series<number>
Series<boolean>
Series<string>
```

Arithmetic/comparison/conditional operations are pointwise:

```kx
const fast = ta.ema(close, 12);
const slow = ta.ema(close, 26);
const spread = fast - slow;
const bullish = fast > slow;
const previous = close[1];
```

Series-aware `if` conditions create per-bar execution masks. Strategy calls inside those blocks therefore become timestamped strategy signals instead of requiring explicit user loops.

## Universal Dataset model

OHLCV is one schema, not the definition of data in KX. Imported datasets can be classified as:

```text
ohlcv events fundamentals trades ticks mbo custom
```

Arbitrary columns remain available regardless of classification.

### Primary OHLCV

Study/Strategy and optionally standalone Indicator declarations use:

```kx
dataset: "eur_usd_1d"
```

Bare globals then resolve to that dataset:

```text
open high low close volume time
```

### Secondary/arbitrary data

```kx
const earnings = data.dataset("earnings_results");
const actual = earnings.column("eps_actual");
const estimate = earnings.column("eps_estimate");
const surprise = actual - estimate;
```

Timestamped numeric columns become Series; untimed/tabular values remain collections.

If an imported dataset defines an availability timestamp, `data.dataset()` uses that publication/availability timeline by default. This keeps an observation invisible until it was actually available to the strategy. Use `data.dataset("name", { timeline: "event" })` only when the raw event/effective timeline is intentionally required.

### Causal alignment / no lookahead

```kx
const known = data.align(earnings.eps_actual, {
  mode: "previous"
});
```

- `exact` — exact timestamp only
- `previous` — latest observation at/before target (default causal behavior)
- `next` — future observation; requires explicit lookahead permission
- `nearest` — may use future observation; requires explicit lookahead permission

`data.join()` follows the same principle.

### Data operations

```kx
data.dataset(...)
data.available(...)
data.align(...)
data.filter(...)
data.resample(...)
data.join(...)
data.current()
data.security(...)
data.market(...)
```

`data.market(dataset)` is the portfolio-oriented OHLCV accessor. It loads a named market dataset and causally aligns its fields to the current Strategy clock; the same dataset reference can be used in `strategy.entry(..., { dataset })`.

See `DATA_ENGINE.md` for the detailed storage/import contract.

## Standard-library namespaces

Current language surface includes:

- `ta.*`
- `stats.*`
- `math.*`
- `series.*`
- `data.*`
- `input.*`
- `plot.*`
- `pane.*`
- `draw.*`
- `map.*` / collection helpers
- `strategy.*`
- `console.*`
- `emit()`

The v1.8 executable time/session surface includes `time.year`, `time.month`, `time.day`, `time.dayOfMonth`, `time.dayOfWeek`, `time.hour`, `time.minute`, `time.second`, `time.parts()`, `time.timestamp()`, `time.isBetween()`, `time.isAfter()`, `time.isBefore()`, `session.define()`, `session.isOpen()`, `session.isFirstBar()`, and `session.isLastBar()`. Wider catalogue entries should still not be treated as runtime support unless wired into execution/tests.

## Renderer contract

KX never directly calls Lightweight Charts. It emits renderer-neutral plots, panes and drawing descriptors. Chart-native Lightweight Charts primitives keep script drawings attached to price/time scales during zoom, pan and price-scale changes.

Strategy executions are emitted as chart drawing descriptors so entry/exit markers use the same chart object path as other KX drawings.

## Incremental execution

The runtime can retain incremental Series/TA state for attached scripts. Historical prepends deliberately reseed recursive calculations where older data changes later state.

For the current standalone historical Strategy runtime, a Strategy run is deterministic over the declared imported dataset and optional backtest date bounds.

## Safety

KX enforces compute/work, statement, loop, recursion, dataset-request, plot and drawing limits. Debugger waiting/Visual Execution delay is excluded from the compute budget.

Arbitrary OS/network access remains outside the language sandbox.

## Point-in-time datasets and corporate actions — v1.8.6

When an imported dataset defines an availability timestamp, `data.dataset("...")` uses that timeline by default. Use `data.dataset("...", { timeline: "event" })` only when raw occurrence/effective time is intentionally required.

Corporate actions are attached to tradable instrument declarations, not hard-coded to a research method:

```kx
instruments: [{
  dataset: "ASSET_1D",
  corporateActions: ["ASSET_ACTIONS"]
}]
```

The broker supports split/reverse-split, cash-dividend and symbol-change actions. Market dataset adjustment metadata controls obvious double-application protection. Structured order rejection records expose `rejectionCode`, requested capital and available capital where applicable.

## Known Strategy gaps after v1.8.6

Not yet implemented:

- per-instrument bar-magnifier/trades/ticks routing inside portfolio mode (single-instrument v1.8 intrabar execution remains supported)
- cross-currency conversion and advanced margin/maintenance-liquidation rules
- borrow, funding and interest costs
- full exchange trading-calendar/delisting policies beyond v1.8.6 validation/gap flags
- broader release-level regression suite beyond the v1.8.6 integrity fixtures
- parameter sweeps, saved run comparison, walk-forward/out-of-sample research workflow
- Study report API/page and richer decision inspection

Unsupported future APIs should continue to produce diagnostics rather than silently assuming behavior.


## v1.9 research/report additions

Research output is a first-class KX surface:

```kx
report.metric("Metric", value);
report.table("Table", ["A", "B"], rows);
report.line("Series", numericSeries);
report.histogram("Distribution", numericSeries);
```

Research helpers added in v1.9:

```kx
stats.zscore(value, values)
stats.rank(value, values, "desc")
stats.percentileRank(value, values)
```

Strategy declarations may include passive `benchmarks: [...]`. KX `input.*` declarations can attach `group` and `tooltip` metadata consumed by the Inputs panel. Plot `priceScale` values `left`, `right`, and `none` are honored by Chart Preview; `none` uses an independent overlay scale.


## KX 2.0 language freeze

KX 2.0 uses `src/engine/apiRegistry.ts` as the canonical public API contract. The registry is exported to `public/kx-api.json` and is consumed by the editor and documentation site.

### Libraries

```kx
library({ name: "Research Utils" });
function pct(current, previous) { return ((current / previous) - 1) * 100; }
export pct;
```

```kx
import library Utils from "Libraries/Research Utils";
const util = Utils();
```

### Dynamic universes

`data.list({...})` returns Data Library dataset ids/names/symbols/summaries matching generic metadata filters. It is designed for cross-sectional and multi-asset research without hard-coded universe lists.

### Position lifecycle

Strategies may inspect `strategy.positionEntryTime`, `strategy.positionBarsHeld` and their `...Of(dataset)` portfolio variants. These are generic broker-state primitives for time stops, fixed-horizon research, rebalance periods and event-drift holding windows.

### Imported event columns

Dataset transforms address explicit imported columns before same-named dataset metadata. A table may therefore contain a timestamped column named `symbol` and still be filtered with `data.filter(events, { column: "symbol", equals: ... })` while `dataset.symbol` remains the dataset/instrument metadata value.


### Date-only / uncertain publication timing

Generic event/fundamental datasets without an `availabilityColumn` emit `KX6608` when `data.dataset()` would otherwise use raw event time by default. When only a conservative delay is known, shift observability explicitly:

```kx
const events = data.dataset("date_only_events", { delay: "1d" });
```

The delay changes the dataset observation timeline; it does not rewrite the original source row. This is useful for conservative date-only releases and other lagged information while preserving the raw/effective event timestamp for separate analysis.
