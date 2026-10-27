# Kinetix Studio v2.2 — Native KX Data Engine

v2.2 adds a native DuckDB 2.0 LTS-backed transformation engine to the Tauri desktop application. The existing browser/IndexedDB Data Library remains compatible, while KX `pipeline()` scripts can now construct lazy data plans that execute in Rust/DuckDB without moving full source tables through the KX interpreter or React.

## Pipeline execution model

```text
KX pipeline()
    ↓ lazy DataPipelinePlan
NativeDataEngineClient / Tauri invoke
    ↓
Rust Data Engine
    ↓
DuckDB
    ↓
versioned CSV/Parquet + global dataset-version catalog
    ↓
existing Data Library / data.dataset() / backtester
```

Native file access is restricted to the active Workspace or configured global Kinetix Home. Relative paths, symlink/junction escape checks and explicit output scopes prevent a data script from silently traversing arbitrary filesystem locations. `study()` and `strategy()` scripts cannot call the native file/data mutation APIs; the compiler reports `KX5008`. This keeps historical strategy execution deterministic.

## `pipeline()`

```kx
pipeline({ name: "Clean Prices" });

const raw = data.read("data/raw", {
  scope: "workspace",
  format: "parquet",
  recursive: true
});

const clean = data.dedupe(raw, ["symbol", "time"], {
  keep: "last",
  orderBy: "time"
});

const validation = data.validate(clean, {
  requiredColumns: ["symbol", "time", "open", "high", "low", "close"],
  types: { symbol: "string", time: "number", close: "number" },
  timeColumn: "time",
  duplicateBy: ["symbol", "time"],
  open: "open", high: "high", low: "low", close: "close"
});

const saved = data.save(clean, {
  name: "prices_1d_clean",
  path: "data/processed/prices.parquet",
  format: "parquet",
  compression: "zstd",
  versioned: true,
  kind: "ohlcv",
  timeColumn: "time"
});
```

`data.read()` accepts CSV/TSV, JSON/JSONL and Parquet files. A directory may also be supplied; specify a format when a directory contains mixed formats, and set `recursive:true` when nested provider/chunk folders should be combined. DuckDB uses name-based union for multi-file inputs.

## Native transform API

The v2.2 pipeline surface is:

- `data.read(path, options)` — file or directory source;
- `data.select(table, columns)`;
- `data.rename(table, mapping)`;
- `data.sort(table, columns)`;
- `data.where(table, options)`;
- `data.dedupe(table, keys, options)`;
- `data.fillTable(table, column, value)`;
- `data.derive(table, column, expression)` — scalar DuckDB expression with statement/file/network administration blocked;
- `data.normalizeTime(table, column, options)` — normalises epoch seconds/ms/us/ns or parseable timestamps to epoch milliseconds;
- `data.joinBy(left, right, options)` — relational joins by one or more keys;
- `data.resampleOhlcv(table, options)` — native OHLCV aggregation;
- `data.preview(table, options)` — bounded preview, maximum 1,000 rows;
- `data.validate(table, options)` — required-column/logical-type schema validation plus timestamp/duplicate/OHLC/gap validation;
- `data.engineStatus()` — native engine/version/catalog diagnostics;
- `data.save(table, options)` — write and register immutable output.

Plans remain lazy until preview, validation or save. Large transforms therefore stay native instead of executing row-by-row in the interpreter.

Schema checks accept `requiredColumns` plus logical `types` (`number`, `string`, `boolean`, `datetime`). Missing required columns or type mismatches fail validation. The same assertions can be supplied to `data.save()` so structurally invalid data is not registered as a successful processed dataset.

## Versioning and provenance

`data.save()` defaults to versioned output. Kinetix writes the transformation to a temporary file, calculates SHA-256, and stores a content-addressed filename such as:

```text
data/processed/prices.a1b2c3d4e5f6.parquet
```

The global catalog lives under the Kinetix Home `Data` area and retains each registered version rather than replacing a logical dataset name. Catalog records include content hash, physical file, format, schema, row count, source/provider fields, retrieval time, requested/actual coverage, time and availability columns, timezone/adjustment metadata, validation results, and the pipeline script path/hash. Unregistering a native version removes its catalog record but deliberately does not delete the immutable data file.

The existing `data.dataset("name")` and strategy primary-dataset workflows can resolve the latest registered native version by logical name, or an exact native version ID for reproducible research.

## Current workflow and boundaries

`data.normalizeTime()` supports epoch seconds/milliseconds/microseconds/nanoseconds and timestamp strings with an explicit timezone/offset. Full conversion of naive local timestamps through named IANA zones is not implemented; Kinetix does not load a network/runtime ICU extension implicitly.

Provider HTTPS, credentials, rate intervals, pagination, retry/backoff, polling and resumable acquisition jobs are implemented through Data Connections and pipeline-only `data.download()`. See V2.3_CONNECTIONS.md.

Prepare data provides paged preview, ten editable/reorderable native transforms, full validation, immutable save/registration and equivalent KX script generation. It uses the same plans and services as pipeline scripts. Visual drafts live while the dialog is open; save generated KX to retain a recipe. Long transforms can scan the full source; this dialog does not provide query cancellation.

The manual Import dialog still supports the browser/IndexedDB path, while native pipelines/visual preparation use DuckDB. Native preview is bounded, but genuinely out-of-core strategy execution over multi-gigabyte tape data remains a separate future capability.

---

# KX Studio v1.8.6 — Universal Data Engine

> **Two data paths:** browser/manual imports persist datasets in IndexedDB and decode Parquet with `hyparquet`. Native pipelines and visual preparation use the bundled DuckDB service described above. The following sections explain generic dataset and runtime semantics; browser-import storage limits do not describe native preview/query capabilities.


KX Studio treats market bars as one dataset schema rather than the only kind of data the language understands.

## Dataset kinds

The local Data Library can store:

- `ohlcv` — timestamped open/high/low/close/volume bars
- `events` — economic calendars, news/event calendars, corporate actions, schedules
- `fundamentals` — earnings, estimates, revenue, balance-sheet/fundamental observations
- `trades` — timestamp/price/size (and optional side/venue/etc.)
- `ticks` — bid/ask or other timestamped quote data
- `mbo` — order-level event tables (stored generically in v1.4; book reconstruction is intentionally not implemented yet)
- `custom` — arbitrary timestamped or untimed research tables

Kinds are metadata, not artificial language silos. Any imported columns remain accessible from KX.

## Importing data

Open the **Data Library** from the database icon in the activity rail and choose **Import**.

v1.8 imports CSV, TSV, semicolon-delimited, pipe-delimited text, and Parquet (`.parquet` / `.pq`). The importer:

1. detects the delimiter;
2. reads the header row;
3. infers number/string/boolean/datetime column types;
4. identifies common semantic roles (`time`, `open`, `close`, `price`, `size`, etc.);
5. lets you override the dataset kind, time column, symbol, timeframe and semantic column roles;
6. normalises timestamp columns to epoch milliseconds;
7. sorts timestamped data chronologically;
8. excludes rows whose selected time column cannot be parsed, recording the excluded-row count in dataset metadata;
9. stores the result in IndexedDB so it survives a browser/app restart;
10. stores a lightweight dataset summary separately so Data Library browsing does not load/clone the full row payload;
11. records price-adjustment methodology and an optional publication/availability timestamp;
12. calculates a non-destructive validation summary for duplicate timestamps, non-monotonic time, invalid OHLC rows and suspicious gaps.

Date-only values such as `2026-01-15` are interpreted as UTC midnight. For event data where release time matters, prefer an ISO timestamp with an explicit timezone/offset, for example `2026-01-15T21:05:00Z`. Imported datasets can also store timezone, session, OHLCV bar timestamp convention (`bar_open` / `bar_close`), adjustment methodology and availability-column metadata. Kinetix does not invent publication times for uncertain/date-only source records.

### OHLCV role mapping

A file can use any header names. For example:

```text
Date,PX_OPEN,PX_HIGH,PX_LOW,PX_CLOSE,VOL
```

Map those columns to `time/open/high/low/close/volume` in the import dialog. KX then exposes both the original column and the canonical alias:

```kx
const es = data.dataset("My ES Bars");

// Both are valid if PX_CLOSE was mapped to role close.
const a = es.PX_CLOSE;
const b = es.close;
```

For a header that is not a valid KX identifier (for example `EPS Actual`), use `column()`:

```kx
const earnings = data.dataset("Earnings");
const actual = earnings.column("EPS Actual");
```

## Dataset object

Timestamped numeric/string/boolean columns are exposed as typed KX `Series`. Untimed table columns are exposed as arrays.

Common members:

```kx
const d = data.dataset("Earnings");

emit("name", d.name);
emit("kind", d.kind);
emit("rows", d.rowCount);

const actual = d.column("eps_actual");
const exists = d.hasColumn("eps_estimate");
```

For timestamped datasets, `d.time` is the canonical timestamp Series even if the original time column has another name.

## Core KX data API

### `data.dataset(nameOrId, options?)`

Loads any imported dataset from the local Data Library. If the dataset has an `availabilityColumn`, v1.8.6 defaults to that publication/availability timeline so later-published values cannot leak backward. The original event/effective timestamp remains available as an ordinary column.

```kx
const events = data.dataset("Events"); // availability timeline when configured
const knownValue = data.align(events.value, { mode: "previous" });

const rawEvents = data.dataset("Events", { timeline: "event" });
```

Options: `timeline: "availability" | "event"` and optional `availabilityColumn`. `timeline: "event"` is intentionally explicit because it may expose when something occurred rather than when a strategy could have known it.

### Portfolio market datasets and `data.market()`

v1.8.5 keeps data access separate from portfolio execution. Register tradable OHLCV datasets in the Strategy declaration, then use `data.market()` to read their causally aligned fields:

```kx
strategy({
  name: "Portfolio",
  dataset: "asset_a_1d",
  instruments: ["asset_b_1d", "asset_c_1d"]
});

const b = data.market("asset_b_1d");
if (ta.crossover(ta.ema(b.close, 20), ta.ema(b.close, 50))) {
  strategy.entry("B", strategy.long, { dataset: "asset_b_1d" });
}
```

The primary Strategy dataset is the decision clock. Secondary market values are aligned causally to that clock, while their orders fill on each instrument's own next eligible OHLCV bar. This is a general market-data/execution contract, not an equity- or event-specific workflow.

Per-instrument portfolio economics can come from dataset metadata or the Strategy instrument specification: capital model (`cash` / `margin`), margin rate, point value, tick size, quantity step, minimum quantity and sector. Cross-currency conversion is not yet implemented, so account/instrument currencies should currently be economically compatible.

### Corporate actions and adjustment methodology

A Strategy instrument can attach one or more generic corporate-action datasets with `corporateActions: [...]`. Recognized action types are split/reverse split, cash dividend and symbol change. Actions are processed before same-timestamp market bars.

Market datasets should declare one of `raw`, `split_adjusted`, `total_return`, `vendor_adjusted`, or `unknown`. Kinetix skips explicit split application for `split_adjusted`/`total_return` histories and skips explicit dividend cash application for `total_return` histories, recording that decision in the account-event ledger. `vendor_adjusted` and `unknown` remain explicit user/source responsibilities because vendor semantics differ.

### Dataset validation

Validation summaries are informational and reproducible, not a hidden cleaning pipeline. Kinetix flags duplicate timestamps, non-monotonic time, OHLC inconsistencies and suspicious interval gaps. It does not fabricate missing bars or silently alter prices. Exchange-specific holiday/calendar interpretation is still future work, so a flagged gap should be reviewed in source context.

### Primary Study dataset and `data.current()`

A Study declares its primary OHLCV dataset in code:

```kx
study({
    name: "EURUSD Research",
    dataset: "eur_usd_1d",
    overlay: true
});
```

`open`, `high`, `low`, `close`, `volume`, `time` and `data.current()` resolve to that script-declared dataset. This makes a Study reproducible without a manual chart-selection step.

### `data.security(symbol, options)`

Keeps the market-instrument request API for instrument/timeframe data. v1.8 confirms higher-timeframe OHLCV by default. If a higher-timeframe dataset timestamps bars at their opening time, the source values are shifted to their completion/availability time before a lower-timeframe script can consume them.

```kx
const daily = data.security("SPY", { timeframe: "1D" });
```

Relevant options include `confirmed` (default true), `lookahead` (default false), `alignment`, and `timestampConvention`. Set imported data to `bar_close` only when its timestamps really represent completed/available bars.

### `data.align(source, options)`

Aligns a timestamped Series or Dataset to the Study primary-dataset timeline.

```kx
const earnings = data.dataset("Earnings");
const surprise = earnings.eps_actual - earnings.eps_estimate;
const knownSurprise = data.align(surprise, { mode: "previous" });
```

`previous` means each chart bar can only see the latest observation whose timestamp is less than or equal to that bar's timestamp.

Supported modes:

- `exact` — only an observation at the exact timestamp
- `previous` — latest known observation at or before the target timestamp (default)
- `next` — future observation; rejected unless `lookahead: true`
- `nearest` — may choose a future observation; rejected unless `lookahead: true`

KX therefore defaults to causal/no-lookahead alignment.

### `data.filter(dataset, options)`

Filters a timestamped dataset by range and optional column criteria.

```kx
const earnings = data.dataset("Earnings");

const positive = data.filter(earnings, {
    from: "2024-01-01",
    to: "2026-12-31",
    column: "eps_surprise",
    gt: 0
});
```

Supported scalar criteria in v1.4: `equals`, `notEquals`, `gt`, `gte`, `lt`, `lte`.

### `data.resample(source, timeframe, options)`

Resamples a Series or timestamped Dataset into fixed buckets.

```kx
const daily = data.resample(close, "1d", { method: "last" });
```

Generic aggregation methods: `first`, `last`, `sum`, `mean`, `min`, `max`.

When resampling a Dataset with canonical OHLCV field names, KX automatically uses:

- open → first
- high → max
- low → min
- close → last
- volume → sum

### `data.join(left, right, options)`

Aligns right-side columns onto the left dataset's timeline.

```kx
const earnings = data.dataset("Earnings");
const macro = data.dataset("Macro");

const joined = data.join(earnings, macro, {
    mode: "previous",
    prefix: "macro_"
});

const cpiKnownAtEarnings = joined.macro_value;
```

The default is causal `previous` alignment. `next`/`nearest` requires explicit `lookahead: true`.

## Plotting unrelated datasets

A Study can plot a Series on its own timestamps. It does not have to be bar-for-bar with the primary OHLCV dataset.

```kx
study({ name: "Earnings Study" });

const earnings = data.dataset("sample-earnings");
const surprise = earnings.eps_actual - earnings.eps_estimate;

const earningsPane = pane.create("earnings", {
    title: "Earnings",
    height: 0.25
});

plot.histogram(surprise, {
    title: "EPS Surprise",
    pane: earningsPane
});
```

This is the foundation for later chart work where an instrument chart can coexist with earnings bars, event markers, alternative data, study outputs and strategy execution.

## Script-declared primary data

The Data Library is storage, not a chart selector. Imported OHLCV is referenced by dataset name/id from the Study itself:

```kx
study({
    name: "EURUSD Import Test",
    dataset: "eur_usd_1d",
    overlay: true
});

const fast = ta.ema(close, 20);
const slow = ta.ema(close, 50);
```

Secondary data is loaded explicitly where it is used:

```kx
const earnings = data.dataset("earnings_calendar");
const macro = data.dataset("macro_series");
```

KX compiles literal `data.dataset("...")` calls as dataset dependencies and reports missing datasets at runtime with explicit diagnostics.

## Browser import and execution limitations

Browser imports avoid loading every full dataset merely to list the Data Library, but the imported runtime representation is not out-of-core. Native bounded previews and transforms are described above.

- CSV/text and Parquet import still parse the selected file into an in-memory row representation before persistence. This is suitable for ordinary research/OHLCV and moderate intrabar files, not multi-gigabyte MBO archives.
- Parquet decoding supports common compressed encodings through the bundled browser-compatible decoder stack; unsupported/invalid files surface an import error rather than silently degrading.
- Trade/tick rows can now drive Strategy execution when selected as an intrabar execution dataset, but v1.8 does not model spread-side fills, queue priority or order-book state.
- MBO book reconstruction remains intentionally deferred.
- Dataset row payloads remain one IndexedDB record per imported dataset; v1.8 separately stores lightweight summaries for cheap browsing. Truly chunked storage/query pushdown remains future work without changing the KX `Dataset` abstraction.

Those limitations are implementation details. The KX language contract is intentionally generic so higher-performance storage can replace the backing store later without rewriting scripts.

## Standalone market-data rule (v1.4.3)

KX Studio does not synthesize chart/security data in normal standalone use.

- Data Library imports do not implicitly select a chart dataset.
- `study({ dataset: "..." })` declares the primary OHLCV dataset for that Study.
- `data.dataset("...")` declares/loads secondary or unrelated data dependencies.
- If timeframe metadata is missing, KX Studio infers common bar intervals from timestamp spacing.
- `data.security()` resolves matching imported OHLCV datasets only; missing symbols/timeframes return an explicit error.
- A Study that only uses `data.dataset()` may run without a primary OHLCV dataset.
- Accessing active-series globals (`open`, `high`, `low`, `close`, `volume`, `time`) without a primary OHLCV dataset returns a clear KX runtime diagnostic.


## Editable dataset metadata, price formatting and instrument economics

Imported datasets are resources rather than immutable files. The Data Library can update metadata in place while preserving the dataset ID and stored rows.

Editable fields currently include:

- **Name / KX reference** — the unique string used by `dataset: "..."` and `data.dataset("...")`. Renaming this requires updating scripts that reference the old name.
- **Title** — optional human-facing display label. This can be changed freely without affecting KX references.
- **Symbol** — instrument symbol metadata.
- **Timeframe** — e.g. `5m`, `1h`, `1D`.
- **Price precision** — automatic inference or an explicit 0–10 decimal override.
- **Tick size** — minimum price increment when known (for example ES = `0.25`).
- **Point value** — currency P&L generated by a one-point move for one unit/contract (for example ES = `50`, MES = `5`).
- **Currency** — report/accounting currency metadata inherited by Strategies unless overridden.
- **Timezone** — IANA timezone used by `time.*` / default sessions (for example `America/New_York`).
- **Session** — optional default session string such as `0930-1600:12345`.
- **Bar timestamp convention** — whether OHLCV timestamps represent bar open or bar close/availability; used by higher-timeframe no-lookahead handling.
- **Price adjustment** — `raw`, `split_adjusted`, `total_return`, `vendor_adjusted`, or `unknown`; used by v1.8.6 corporate-action double-count protection.
- **Availability timestamp** — optional publication/observable-time column for point-in-time event/fundamental datasets.
- **Validation summary** — read-only integrity status with duplicate timestamp, malformed OHLC and suspicious gap counts.

OHLCV imports infer price precision from price-role columns. The effective precision is propagated into the chart series as Lightweight Charts `priceFormat.precision` and `minMove`, so the chart price axis follows the actual dataset accuracy rather than a fixed two-decimal format. Existing datasets created before v1.4.3 are inferred from stored OHLC values at runtime.

v1.6 propagates tick size / point value / currency into the MarketDataset used by Strategies. Strategy P&L, MAE/MFE and percent-equity sizing therefore respect contract economics instead of treating every one-point move as one currency unit.


## Indicator datasets

A reusable Indicator does not require a dataset declaration. Its bare OHLCV Series are resolved by the importing Study/Strategy. An optional `dataset: "..."` declaration binds an Indicator only for standalone execution/visual validation.


## Exchange-aware daily OHLCV normalization

Use `data.normalizeDailyOhlcv` for daily US equity vendor bars. This is separate from numeric timestamp conversion and fixed-interval resampling. It uses the bundled **XNYS regular-session calendar, 1990–2035**, without a network dependency. NYSE sessions normally open at 09:30 and close at 16:00 New York time, with holidays, exceptional closures and early closes from the bundled schedule. US daylight saving changes the UTC times. Future emergency closures require a calendar update.

```kx
pipeline({ name: "Daily session preparation" });
const raw = data.read("data/raw/daily.parquet", { scope: "workspace" });
const daily = data.normalizeDailyOhlcv(raw, {
    timeColumn: "time",
    calendar: "XNYS",
    timestampMeaning: "utc_date",
    inputUnit: "ms",
    asOf: 1773172800000,
    publicationDelayMs: 60000
});
console.log(data.validate(daily, { timeColumn: "session_close" }));
console.log(data.save(daily, {
    name: "daily_prices",
    path: "data/processed/daily_prices.parquet",
    kind: "ohlcv",
    symbol: "AAPL",
    adjustmentMethod: "raw"
}));
```

**Set `asOf` to your source snapshot's actual cutoff in UTC epoch milliseconds.** The example uses 2026-03-10T20:00:00Z; replace it. It is not the current preparation time. A bar captured before its availability stays incomplete even if you run preparation tomorrow. Calendar close alone cannot prove vendor finality or account for late revisions: set a conservative `publicationDelayMs` and, if provided, `vendorAvailabilityColumn`. That optional column contains UTC timestamps or epoch milliseconds; availability is the later of vendor publication and session close plus delay. Vendor publication must describe the final daily record, not its first intraday update.

Timestamp meaning must be explicit:

- `utc_date`: the UTC calendar date identifies the vendor's trading session. The time-of-day is a label, not when the completed OHLCV was available. This is the initial policy for the tested LSE daily files; confirm vendor semantics before using a different source. A 13:00 UTC label does not make the daily close available at 13:00.
- `instant`: map the actual UTC timestamp to its New York local date. This is not a roll-forward/roll-back convention for timestamps labelled after midnight. Select the mode matching the vendor contract.

Temporal DATE/TIMESTAMP/TIMESTAMPTZ inputs are accepted; naive timestamps explicitly mean UTC in this operation. Strict ISO date/timestamp text is also accepted and preserved; missing offsets explicitly mean UTC. Clock-only TIME values, ambiguous locale dates and non-ISO text are rejected. Numeric `inputUnit` is `ms` by default, or explicit `s`, `us`, `ns`; units are never guessed. DATE at midnight in instant mode maps to the prior New York date, so use `utc_date` for date labels.

Every original input column, including the source timestamp, is preserved. Output columns are reserved:

| Column | Meaning |
| --- | --- |
| `session_date` | Trading-session date, `YYYY-MM-DD` |
| `session_open`, `session_close` | Regular-session boundaries, UTC epoch milliseconds |
| `available_at` | Earliest completed-bar availability under the supplied publication policy |
| `session_status` | `session`, `weekend` or `holiday` (includes exceptional closures) |
| `session_index` | Ordinal of a trading session, for calendar-aware gap detection |
| `is_complete` | Valid session with availability at or before the source snapshot cutoff |
| `snapshot_asof` | Supplied source snapshot cutoff, preserved for audit |
| `calendar_id` | Versioned bundled calendar identifier |

Non-session rows remain in preview/output for audit, with no close/availability and `is_complete: false`; they are never moved to a neighbouring session. Null/invalid/out-of-range input timestamps fail with a diagnostic. Existing output-column collisions fail. After normalization, keep the safety columns intact: select/rename/derive/fill/resample operations that discard or modify them are rejected. Perform those transforms first. If numeric timestamps require conversion, write a new column rather than overwriting the vendor timestamp.

Validation counts **missing trading sessions per `symbol`** between each instrument's observed first and last sessions. Rename a differently named ticker column to `symbol` first, or prepare one symbol at a time. Without a symbol column the table is treated as one instrument. Weekends, holidays, DST changes and early closes are not missing sessions. This checks internal gaps, not missing leading/trailing history outside the observed coverage.

Save automatically registers `timeColumn: "session_close"`, `availabilityColumn: "available_at"`, timeframe `1D`, New York timezone, bar-close convention and the calendar completion policy. Standard OHLC column roles are inferred; custom names need explicit roles. Strategy/market activation clocks completed rows at `available_at`, sorts them and excludes non-session/incomplete rows; source rows stay available in the native preview. KX `data.dataset`, `data.market` and `data.security` use the same completed data. `data.dataset(..., { timeline: "event" })` cannot bypass the daily availability guard. Market activation requires a single instrument; filter a multi-symbol table before saving individual market datasets. Existing datasets are unchanged until explicitly normalized.

In **Data Library → Prepare Data**, choose **Normalize daily trading sessions**, select the source timestamp column, choose its meaning and enter the source snapshot cutoff as an ISO UTC timestamp ending in `Z`. Optional numeric units, publication delay and vendor availability column are under Daily availability options. Add the step, update preview, validate, then save/register or generate KX. The UI selects the daily timeline fields automatically; generated KX reproduces the same operation.

Normalized daily tables are rejected as intrabar execution datasets; use actual intraday OHLCV, trades or ticks for bar magnification. The existing broker next-bar fill model is unchanged. The daily completion clock does not reconstruct intraday execution timestamps.


The registration role `"session_close": "time"` is intentional: it identifies the session timestamp, while the separate `availabilityColumn: "available_at"` governs observation. The original vendor timestamp remains a normal audit column with no competing time role. Saving replaces existing time-role assignments, so exactly one column has the `time` role. In strategy access the active clock is availability, which may be later than session close.


### Role-mapping validation

Native saves validate caller roles before applying daily defaults and before writing a processed file or registering a version. Keys must be existing output column names, values must be supported semantic roles, and at most one column may have the `time` role. For example, use `roles: { session_close: "time", close: "close" }`; `roles: { time: "session_close" }` is reversed and produces a diagnostic showing the corrected mapping. Daily normalization can infer standard OHLC roles and assigns its session-close time role automatically, so omit explicit roles unless custom column names need them. Multiple columns with the general `value` role remain supported. Existing pinned files and registrations are not rewritten; correct a malformed recipe and save a new immutable registration.


## KX 2.2 / Studio v2.5 batch pipelines

Arrays support `.length`, zero-based indexing and instance methods such as `.push()`, `.includes()`, `.slice()` and awaited sequential `.forEach(namedFunction)`. Existing array.* functions remain supported. Use try/catch around each instrument to recover from ordinary native failures; catch exposes message, code, operation and source location. throw and finally are supported. Stop and execution limits remain fatal. See V2.5_BATCH_PIPELINES.md and examples/pipelines/batch-daily-normalization-v2.5.kx for the complete contract, compatibility boundaries and acceptance recipe.


Vendor ISO text timestamps in Parquet are supported by daily normalization in v2.5. Only ISO dates/full timestamps are accepted; naive ISO times explicitly mean UTC, offsets are honored, and the original text remains unchanged. Ambiguous locale dates and invalid/clock-only values fail closed.
