# Using the desktop app

## Explorer and scripts

Open a workspace folder and use Explorer context menus to create files/folders, rename, move or delete entries. Select the script type when creating a .kx file. Promote reusable scripts to Kinetix Library or copy shared code into the workspace. Delete and Unregister are different: unregistering a native dataset keeps its saved data file.

Middle-click closes editor tabs. Drag .kx files into Studio to import them. Problems/Output stay in the bottom area; eligible panels can be docked into editor tabs. Use the command palette to find available commands.

## Run, Stop and output

Run executes the active script. Read Problems for compiler/runtime diagnostics and Output for logs, native I/O results and saved dataset references. Stop uses the supported runtime cancellation path; download jobs also expose Cancel/Resume in Data Jobs. A long native transform in visual preparation is not a cancellable acquisition job.

Pipeline execution prepares data. Indicators and Studies provide visuals/research output. Strategies produce broker/account results in Strategy Tester. A source file preview is not registration; saving/registering makes the dataset discoverable for other scripts.

## Charts and strategy inspection

Use the chart to inspect plots, named/lower panes, drawings and the OHLCV readout. Script properties provide Inputs, Style and Visibility where supported. Strategies expose trades, orders, open positions, rejection diagnostics, equity/drawdown and portfolio exposure views. Research reports and saved runs add metrics, tables, histograms, comparisons and sweeps.

The broker/runtime reference explains next-eligible-bar fills, order types, sizing, account models, intrabar modes, time/session behavior and portfolio restrictions. Chart display is not proof that a strategy has been causally validated.

## Settings

- General: global Kinetix Home, separate from your open workspace.
- Chart Preview: colors, candle bodies/wicks, grid, axes and free/magnet crosshair.
- Downloads: relative folder, destination, initial date range, preferred connection and optional snapshot reuse.
- Connections: provider profiles, request pacing/retries and masked API-key entry. On Windows, keys remain in Credential Manager rather than workspace scripts.

Reset appearance resets chart appearance while retaining the configured data location/download preferences. Provider/account access is still required for restricted feeds.

## Build or run locally

From the Studio repository, with Node/npm, Rust, Visual Studio C++ build tools and WebView2 installed:

```powershell
npm install
npm run desktop:dev
```

For a production frontend, executable and Windows installer:

```powershell
npm run desktop:build
```

Collected release files are under release/windows. A documentation sync/build does not build or release the desktop app. The package may retain a development-preview suffix until acceptance is complete.

## Troubleshooting

Check the root displayed next to a relative data path. Use the exact path/error and likely correction rather than moving data until it happens to work. For a provider rejection, Edit download and check the symbol, market, timeframe and dates; check saved key/access for authorization errors.

During the v2.4 verification, development-server module requests timed out in one environment; the built frontend completed native desktop workflow testing. A successful production build does not prove that every local development server is healthy. If startup remains on the recovery screen, record the message and terminal output for diagnosis.
