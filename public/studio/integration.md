# Standalone architecture and host integration

KX Studio is now developed as a standalone application.

The previous host-injection architecture is retained internally because modular boundaries are useful, but the product no longer assumes that a separate main Kinetix application will provide its chart/data/workspace services.

## Standalone service boundaries

```text
KX Studio
  ├─ Monaco / IDE shell
  ├─ KX compiler + interpreter
  ├─ local Dataset Library
  │    ├─ CSV/TSV importer
  │    ├─ schema/role inference
  │    └─ IndexedDB persistence
  ├─ StandaloneDataBridge
  │    ├─ active OHLCV dataset
  │    ├─ arbitrary named datasets
  │    └─ market-data lifecycle events
  ├─ Lightweight Charts preview/chart surface
  └─ local workspace persistence
```

The interfaces in `src/services/contracts.ts` keep host boundaries separate from KX semantics. The desktop app now implements Tauri workspace persistence, native DuckDB plans, secure provider connections and acquisition jobs alongside the compatible browser/IndexedDB bridge. Visual preparation and generated KX share those same services; this is not a separate transformation runtime.

## Data abstraction

`MarketDataset` remains backward compatible for the active OHLCV chart.

`GenericDataset` represents arbitrary tabular/timestamped data.

`KinetixDataset = MarketDataset | GenericDataset` is the runtime-level union used by KX dataset objects.

See `DATA_ENGINE.md` for language semantics.
