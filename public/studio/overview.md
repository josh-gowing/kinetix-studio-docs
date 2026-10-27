# Kinetix Studio

Kinetix Studio is a general-purpose market research and backtesting app. The Studio version and KX language version are separate: an application update does not necessarily introduce a new language version.

## A complete workflow

1. Open a project folder from Home or File → Open Folder.
2. Inspect a CSV, JSON or Parquet file in Explorer, or open Data Library → Download to acquire data.
3. Choose Prepare data, add transforms, update the preview and validate the result.
4. Save and register a versioned output in Data Library. Copy its pinned reference for reproducible research.
5. Create an Indicator, Study or Strategy bound to that dataset, then Run.
6. Inspect Problems, Output, chart results, Research Studio and Strategy Tester as appropriate. Save scripts and generated pipeline recipes in your workspace.

## Five script types

| Type | Use it for | Result |
| --- | --- | --- |
| Indicator | Reusable calculations, chart signals and overlays | Series and visual output |
| Study | Investigating data without inventing trades | Charts, tables and research reports |
| Strategy | Testing trading rules with the broker/account model | Trades, orders, positions and performance |
| Pipeline | Reading, downloading, transforming and saving data | Versioned registered datasets |
| Library | Sharing reusable KX functions and utilities | Code imported by other scripts |

The native mutable data operations belong in Pipelines. Study/Strategy execution remains deterministic and does not perform acquisition or native file mutation.

## Three places to keep things

- Workspace: project files, local scripts and data under the folder you opened.
- Kinetix Library: reusable scripts shared across projects in Kinetix Home.
- Data Library: registered datasets, their metadata and reproducible version references. This is different from a Library script.

A workspace-relative path includes every folder from the workspace root to the dataset. It is not relative to the pipeline script's own folder. Copy KX Reference from a preview to avoid guessing.

## Capabilities and where to learn them

| Area | Documentation |
| --- | --- |
| Language syntax, Series, collections, missing values, reusable modules | Language Basics, Language & runtime reference, API Reference |
| Files, imports, global code and project sessions | [Workspaces](WORKSPACES.md) |
| Native file/folder reads, joins, filters, derived columns, validation, versioned saves | [Data engine and pipelines](DATA_ENGINE.md) |
| Provider keys, downloads, pagination, cancellation and resume | [Connections & downloads](V2.3_CONNECTIONS.md) |
| Visual preparation and generated KX | [Visual data preparation](visual-data.json) |
| Editor, chart, panels, settings and desktop builds | [Editor, charts & settings](desktop.json) |
| Broker-aware orders, portfolio capital, intrabar execution and corporate actions | Strategies, Multi-Asset Portfolios, Point-in-Time Data, Language & runtime reference |
| Reports, comparisons, saved runs, sweeps and chronological windows | [Research Studio](RESEARCH_STUDIO.md) |
| Every registered public function, declaration and global | API Reference and searchable namespaces |
| Working code, including nested versioned examples | Examples |

## Limits are part of the documentation

Do not assume every market/provider offers every interval or dataset. A date-only event timestamp does not establish when information became tradable. Portfolio intrabar routing, financing/cross-currency models and full out-of-core execution have documented boundaries. Consult the detailed language/runtime and research references before interpreting a backtest as realistic execution.

## v2.5 batch pipelines

KX 2.2 supports array `.length` and member methods, try/catch/throw/finally, and sequential named-function forEach. Build instrument-specific paths/names in loops, validate before saving, collect results and continue after an individual native failure. Stop and resource limits remain fatal. See **Batch pipelines & language improvements** for supported syntax and the reusable batch daily-normalization example. Existing native/calendar/point-in-time safeguards still apply.
