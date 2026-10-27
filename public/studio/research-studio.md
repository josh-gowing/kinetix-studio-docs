# KX Studio v1.9 Research Studio

v1.9 turns the existing deterministic backtester and Study runtime into a repeatable research workflow. The feature set is deliberately strategy-agnostic: the same run/preset/sweep/report tooling can be used for technical systems, multi-asset portfolios, event studies, futures/FX/crypto research, cross-sectional work, or any other KX Study/Strategy.

## Research panel

The bottom **Research** tab contains five views:

- **Current** — current Strategy statistics, passive benchmark summaries, and custom `report.*` output.
- **Runs** — save the current result with its exact KX source and input overrides. Saved runs persist in IndexedDB rather than localStorage so equity/trade/order histories are not constrained by small browser storage quotas.
- **Compare** — compare up to three saved runs. Strategy runs show normalized equity and core metrics; Study/Strategy custom `report.metric()` values are also compared.
- **Sweep** — run one- or two-axis numeric parameter sweeps over `input.int` / `input.float` values. Strategies capture Strategy statistics; Studies and Strategies can both capture `report.metric()` outputs. A sweep is capped at 100 combinations per invocation to protect the UI/runtime.
- **Train / OOS** — run explicit Train, Validation and Out-of-Sample windows, or generate rolling chronological train/test windows. Window runs retain normal indicator warm-up history while broker activity is constrained to the requested Strategy execution window.

The rolling-window runner is an evaluation workflow. It does **not** silently choose the best parameter set on each training period; automated train-optimise-test policy selection is intentionally not inferred by the platform.

## `report.*`

Studies and Strategies can create a Research Report without forcing research into a trade ledger:

```kx
report.metric("Average return", averageReturn, { format: "percent" });
report.table("Buckets", ["Bucket", "N", "Return"], rows);
report.line("Forward return", forwardReturnSeries);
report.histogram("Distribution", returnSeries);
```

Supported calls:

- `report.metric(label, value, options?)`
- `report.table(title, columns, rows)`
- `report.line(title, series, options?)`
- `report.histogram(title, series, options?)`

`report.*` is captured once for the research result; it is not multiplied by the Strategy's sequential per-bar broker evaluation.

## Inputs, presets, Style and Visibility

The script settings panel now has:

- **Inputs** — current `input.*` values, grouped with optional `group` and `tooltip` metadata.
- **Style** — UI overrides for plot colour/line width.
- **Visibility** — show/hide individual script plots without editing KX source.

Input presets save the current overrides by script and can be reapplied later. Plot UI overrides are separate from KX source and do not mutate the script.

Example:

```kx
const fast = input.int("Fast EMA", 20, {
  min: 5,
  max: 80,
  step: 5,
  group: "Signal",
  tooltip: "Fast trend length"
});
```

## Passive benchmarks

Strategies may declare one or more passive benchmark datasets:

```kx
strategy({
  name: "Portfolio Research",
  dataset: "PORTFOLIO_CLOCK",
  benchmarks: [
    "BENCHMARK_A",
    { dataset: "BENCHMARK_B", label: "Reference B" }
  ]
});
```

Kinetix reports benchmark return, Strategy return and excess return over the Strategy equity range. Benchmarks are reference series; they do not consume portfolio capital or create broker positions.

## Cross-sectional helpers

v1.9 adds generic research helpers:

```kx
stats.zscore(value, values)
stats.rank(value, values, "desc")
stats.percentileRank(value, values)
```

These operate on numeric arrays/Series and are not tied to any market, strategy or event type.

## Independent plot scales

`priceScale` is honored by Chart Preview:

```kx
plot.line(primarySeries, { title: "Price model", priceScale: "right" });
plot.line(auxiliarySeries, { title: "Unrelated scale", priceScale: "none" });
```

- `right` uses the normal right scale.
- `left` uses a visible left scale.
- `none` gives that plot an independent overlay scale without a visible axis.

Named/lower panes continue to work with `pane:`.

## Strategy Tester additions

v1.9 adds:

- portfolio gross-exposure %, net-exposure %, and concurrent-position charts;
- passive benchmark comparison summaries;
- richer selected Trade and Order inspectors;
- visible rejection diagnostics and machine-readable rejection codes;
- Trades, Equity and Orders CSV exports.

The diagnostics can explain broker/order rejections such as insufficient capital, maximum positions, invalid price/tick, or minimum quantity. Kinetix does not claim to infer why an arbitrary user-written boolean expression evaluated false; that requires explicit script/report instrumentation.

## Persistence and reproducibility

A saved research run stores:

- script/file identity;
- exact source text;
- input overrides;
- optional execution window;
- Strategy report including equity/trades/orders when applicable;
- custom Research Report output.

Saved research runs and sweeps use IndexedDB. Small UI configuration such as input presets and plot overrides remains lightweight local UI state.

## Validation

Run:

```bash
npm run engine:check
npm run integrity:test
npm run research:test
```

`research:test` covers `report.*`, grouped input metadata, Strategy execution windows, passive benchmarks, cross-sectional stats helpers and research persistence fallback behaviour.
