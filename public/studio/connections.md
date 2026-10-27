# v2.3 Data Connections and native acquisition

Development preview: **2.3.0-dev.1**, branch `v2.3-data-connections`. The v2.2 review checkpoint remains on `main` at `e578328`.

## Use the workflow

Open **Download data** on Home, **Data Library → Download**, or the cloud icon. Choose a **Data source**, then enter its inputs once. LSE needs a symbol and From/To dates; Alpha Vantage needs a symbol; the public ZipLime and Quant500 snapshots need no symbol or dates. Choose the destination and **Start download**. The app builds provider paths, parameters, polling and filenames automatically.

If the source needs a connection, **Set up connection** opens the matching provider template. Save your API key in the masked field, then return to the download. Existing saved connections and keys are retained. Public ZipLime and Quant500 connections need no key. Keys and provider pacing can also be managed in **Settings → Connections**. **Settings → Downloads** saves default destination, relative folder, initial date range, preferred connection and snapshot reuse.

**Advanced options** holds output overrides, snapshot reuse and a read-only generated request. Custom HTTP exposes the method, path and parameters it needs; polling, pagination, JSON pointers and checksums stay under Advanced. Provider symbol/date fields and editable query parameters are never shown as duplicate inputs.

**Data Jobs** shows progress and the next useful action. A failed HTTP 400/404 request offers **Edit download**, rebuilding known provider requests from their inputs instead of repeating obsolete defaults. Retry is available for transient failures. Old history receives corrected HTTP guidance too; HTTP 400 is not described as a redirect error. Job paths and technical details are collapsed.

Once complete, **Create pipeline** creates a workspace pipeline that previews, validates, saves a versioned Parquet output and registers it in Data Library. Edit `processed` to add transforms and configure the appropriate dataset kind/time/availability columns before using it for research. Code **Libraries** contain reusable KX functions; **Data Library** contains registered datasets. Pipelines prepare these datasets for Studies and Strategies.

Raw inputs remain separate from processed outputs. Filenames include content hashes. Existing raw and processed files are never overwritten by these operations. The original job location is displayed; a reference from another workspace cannot silently be inserted into the current one.

## Generic HTTP

`data.download(request)` is available only in `pipeline()` scripts. Both compiler and runtime reject native network/data operations from Strategies, including computed access or aliases. Saved datasets remain usable by deterministic backtests, charts and research.

```kx
const downloaded = data.download({
    connection: "provider",
    path: "/prices.csv",
    query: { symbol: "AAPL" },
    outputPath: "data/raw/provider/prices.csv",
    scope: "workspace",
    resumeExisting: true
});
const raw = data.read(downloaded.path, { scope: "workspace", format: "csv" });
```

A connection has an HTTPS base URL, authentication (`none`, `bearer`, header API key or query API key), request interval and maximum GET retries. Query parameters are strings. POST accepts a JSON body. POST is not automatically retried, because repeating a POST can create another provider job. An explicit retry/resume can repeat it.

The raw response streams to disk. The default byte limit is 2 GiB across a job; `maxBytes` can explicitly select up to 100 GiB. Structured JSON record validation is limited to 50 MiB per page. HTTP 429 and transient 5xx responses use bounded retry/backoff, including numeric Retry-After values. Public connections follow up to five HTTPS redirects; authenticated connections do not redirect credentials to another endpoint. Use the final provider origin for authenticated downloads.

`resumeExisting` defaults to false, so a normal request fetches a new snapshot. Opting in reuses a matching completed snapshot only after verifying its raw hashes, or resumes its matching unfinished job. Request identity includes the connection configuration, query/body and output context. Reusing a completed snapshot deliberately does not check for newer provider data. Disable the flag to refresh it.

Cancelled/interrupted GET transfers resume using a strong ETag, If-Range and a verified complete remaining Content-Range. If the server sends a fresh 200 response, Kinetix restarts the partial file. A server without a strong validator is redownloaded rather than spliced onto unknown bytes. A declared SHA-256 must match before publication. Cancellation stops requests, polling, waits and streaming; verification/publication also checks cancellation before committing an output.

## Pagination and chunking

Pagination supports page numbers, offsets and JSON cursors. Supply its query `parameter`, `recordsPointer`, `maxPages`, and a `nextPointer` for cursor mode. Page/offset modes accept `step` and optional `pageSize`; without pageSize they stop on an empty array. Cursor mode stops on an absent/null/empty next cursor. Repeated cursors fail instead of looping indefinitely. Reaching maxPages while more data may remain reports an incomplete job.

Each page is an immutable file in a job-specific raw folder. The checkpoint advances after publication, so restart does not repeat a page that already committed. A completed paginated reference reads only that job's folder. The byte limit covers all pages together.

For date/symbol acquisition, use ordinary KX loops around download requests with `resumeExisting: true`; completed chunks are verified and reused on rerun. `examples/v23/lse-ohlcv-chunks.kx` shows this. `dateWindows()` in the source planner produces inclusive non-overlapping calendar chunks, including leap dates.

## Provider sources

| Source | Implemented request and source reference |
| --- | --- |
| London Strategic Edge | The existing downloader's `/v3/export` contract, X-API-Key, 202 job_id, `/v3/jobs/{id}` polling, ready file download and checksum verification. The provider job ID and resolved file path survive restart. |
| Alpha Vantage | [EARNINGS API](https://www.alphavantage.co/documentation/), query-key authentication from the OS vault, quarterlyEarnings validation. HTTP-200 API error/rate-limit objects are rejected as data. |
| ZipLime | [Publisher dataset](https://huggingface.co/datasets/ZipLime/earnings-calendar), pinned revision `f8d9be6f6b22a107edbd497bb01cf779cc292880`, announcements/earnings Parquet files and publisher SHA-256 values. Update the revision and hashes together to adopt a newer snapshot. |
| Quant500 | [Open data and field dictionary](https://quant500.com/data), `/api/descarga/anuncios.csv`, public CSV with `comment: "#"` for its metadata lines. |

`data.read(..., { recordsPath: ["quarterlyEarnings"] })` reads the nested array through the same native engine. No separate Python transformation engine is introduced. Quant500's time/source/quality flags remain in the data. Alpha Vantage's date-only reportedDate is not assigned a verified intraday availability time. The example retains that limitation in saved metadata.

## Credentials and persistence

Provider keys use Windows Credential Manager under the application identifier, connection ID and provider origin. Changing the provider origin cannot forward the old key. The frontend receives only a configured/not-configured status. Keys entered in the credential field are not stored in profiles.json, workspace snapshots, KX examples or request checkpoints. Request query/body values are saved as job configuration; credentials belong in the connection credential field. Request URLs with embedded credentials and API-key query arguments in scripts are rejected; the native client injects the configured credential at request time. Errors omit provider response bodies and credential-bearing URLs.

Profiles and job checkpoints are under the user's application-data connections directory. Raw files are under the explicitly selected workspace or Kinetix Home. Profiles are global to this app account, not copied into workspace projects. Jobs stop when the application process closes and can resume after reopening; they are not an operating-system background service. OS credential storage currently targets Windows. OAuth/browser login, automatic daily account-budget discovery and provider billing checks are not implemented.

## Examples

- `examples/v23/generic-http.kx`
- `examples/v23/paginated-json.kx`
- `examples/v23/alpha-vantage-earnings.kx`
- `examples/v23/lse-ohlcv-chunks.kx`

LSE and Alpha Vantage contracts are covered by local fixtures. Live authenticated account acceptance must use keys entered by the user in the app; the existing Python script's keys are not imported automatically.

LSE downloads now expose Market and Timeframe dropdowns (US stocks and 1d by default). Options use the official LSE Data 3.0 client market codes and candle resolutions, including 1m, 5m, 15m, 30m, 1h, 4h and 1d. Edit download restores these choices; older requests retain the original defaults. Market/timeframe appear in generated raw filenames. Forex/crypto slash-pair symbols are preserved in requests and converted to safe filenames. Feed availability still depends on the provider/account. Reference: https://github.com/londonstrategicedge/lse-data/blob/main/lse/data3.py
