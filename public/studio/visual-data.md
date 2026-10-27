# Visual data preparation

## Open a source

Choose Data Library → Prepare data, Prepare data in a workspace file preview, or Prepare data on a completed download. Registered native dataset cards and previews also offer this action. The file must be inside the current workspace or Kinetix Home. Open the matching workspace if a registered file belongs elsewhere.

Source options expose file format, CSV delimiter/header/comment prefix, nested JSON records path and recursive folder reads. Completed-download handoff preserves the saved raw path and provider-specific source options; it does not start another download.

## Preview and transform

Preview returns 25 rows per page without requiring a complete count. Use Previous/Next to inspect pages. Operations still apply to the full dataset; sorting and joins can scan all rows.

| Step | Inputs and behavior |
| --- | --- |
| Select columns | Choose the columns to retain |
| Rename column | Choose an existing column and its new name |
| Filter rows | Column, condition and explicitly typed comparison value; use Is missing for nulls |
| Sort rows | Columns in selection order, ascending or descending |
| Remove duplicates | Key columns, first/last policy and optional ordering column |
| Fill missing values | Column and replacement value |
| Calculate column | Output name and a restricted expression such as close * volume |
| Normalize time | Input column/unit, optional output column; converts to epoch milliseconds |
| Normalize daily trading sessions | XNYS session dates, DST-aware open/close, availability and snapshot completion; original timestamps retained |
| Join data | Second scoped file/folder, matching left/right key columns, join type and prefix |
| Resample OHLCV | Millisecond time column, fixed bar interval, price/volume columns and optional symbol grouping |

Add the step, then Update preview. You can edit, reorder and remove steps. Source/step changes mark the previous preview as stale; stale results cannot be paged, validated or saved as the current result.

For a multi-symbol resample, normalize time first and group by symbol. Joins require equal numbers of left/right keys in corresponding order. More complex right-side preprocessing can be added in generated KX.

## Validate and save

Choose a dataset name, relative output path, destination and Parquet or CSV format. Under Dataset time and roles, configure time/availability, timezone, price adjustment, optional symbol/timeframe and OHLCV roles. OHLCV output needs a time column.

Validate full dataset checks the entire result. Review warnings about missing values, duplicate/non-monotonic timestamps and malformed prices. Missing market sessions are not automatically evidence of corruption.

Save and register writes a content-hashed immutable output and registers it in Data Library. Parquet uses ZSTD. Source files and existing saved versions are preserved. The confirmation supplies a pinned data.dataset reference. Inspect the registered preview before using it in research.

## Keep the recipe as KX

Generate KX script reproduces the source options, ordered transforms, preview, validation and versioned save through the existing KX APIs. Choose Copy KX script or Open as pipeline, then save the .kx file. Running it should reproduce the visual result.

Visual drafts live while the dialog is open; they are not automatically saved as reusable recipes. Existing arbitrary KX scripts cannot be reverse-engineered into visual steps. Native operations may scan large data, and this dialog does not provide query cancellation.

## Prepare daily US equity bars

Choose **Normalize daily trading sessions**, select the source timestamp column, then choose its meaning: **UTC date is the vendor's session label** for date-labelled daily files, or **Actual instant → New York local date** for genuine UTC event timestamps. Do not infer the convention solely from the hour displayed in a vendor file.

Enter the **source snapshot cutoff (UTC)** as an ISO timestamp ending in `Z`, for example `2026-10-27T20:30:00Z`. Use the actual time the source was captured, not a later preparation time. A partial daily bar must remain incomplete when reopened tomorrow. Daily availability options expose numeric units, a conservative publication delay and an optional final-publication timestamp column. Calendar close cannot by itself establish vendor finality.

The bundled XNYS regular-session calendar supports 1990–2035, including US daylight saving, holidays, exceptional closures and early closes. Future exceptional closures require a calendar update. Original columns remain unchanged; new session/availability/completion columns appear in the preview. Wide previews scroll horizontally inside the table, while the form stays in place.

After adding the step, update the preview and validate. Calendar-aware missing-session checks exclude weekends and holidays and count internal gaps per `symbol`. Rename a different ticker column to `symbol` first, or prepare one instrument at a time. The operation does not certify missing leading/trailing history outside the observed bounds.

Saving selects session-close time, `available_at`, a daily timeframe and New York timezone automatically. The metadata role `"session_close":"time"` is intentional and unique: it identifies the session timestamp. The separate availability column controls strategy observation. The original vendor timestamp stays available for audit without a competing time role.

Incomplete and non-session rows remain visible in the native preview but cannot enter primary strategy bars or external KX strategy timelines. Normalized daily rows are not intrabar execution data; use genuine intraday bars, trades or ticks for that purpose. Preserve the reserved session safety columns in subsequent transforms. Market activation requires a single instrument.

Generate KX script emits the equivalent `data.normalizeDailyOhlcv()` operation and versioned save. See **KX pipelines & native data engine → Exchange-aware daily OHLCV normalization** for the complete field contract and **pipelines/daily-session-normalization.kx** in Examples for an editable recipe. Replace its example snapshot cutoff before running it.
