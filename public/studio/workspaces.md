# Kinetix Studio — Workspaces & Global Library

Desktop Studio supports project folders independently of the global reusable-script library. Native data preparation, downloads and visual workflows complement the same workspace model.

## Two independent roots

Kinetix Studio now distinguishes two filesystem scopes:

1. **Kinetix Home** — the configurable global reusable-resource folder, normally `Documents/Kinetix Studio/`.
2. **Workspace** — an arbitrary project directory opened with **File → Open Folder**.

Opening `F:\Trading\Research\Example Research\` never changes Kinetix Home. Closing that folder leaves the global library available.

### Global Kinetix Home

```text
Documents/Kinetix Studio/
  Indicators/
  Studies/
  Strategies/
  Pipelines/
  Libraries/
  Templates/
```

The five KX script categories are visible under **KINETIX LIBRARY** in Explorer. Connection profiles are managed in Settings → Connections and the Downloads dialog; their configuration/checkpoints live in application data, and keys use Windows Credential Manager.

### Project workspace

A workspace is the actual directory tree on disk. Explorer shows folders, KX scripts, data files, JSON/configuration and other project resources without copying them into Kinetix Home.

```text
Example Research/
  data/
    raw/
    processed/
  scripts/
  strategies/
  studies/
  results/
  kinetix.project.json
```

## Commands

The File menu and command palette provide:

- **File: Open Folder**
- **File: Open Recent**
- **File: New File**
- **File: Save Workspace**
- **File: Close Folder**

Workspace Explorer context actions provide create file/folder, rename, move, delete, copy relative path and **Promote to Kinetix Library**.

Global library KX resources can be copied back into the active project with **Copy to Workspace**.

## Session persistence

Workspace UI state is keyed by the canonical project path. Kinetix remembers:

- open KX tabs;
- active KX file;
- expanded workspace directories;
- the existing global panel/layout state through the normal workspace store.

Recent workspaces are stored in Kinetix application data rather than in project folders.

## `kinetix.project.json`

**File → Save Workspace** writes/updates a small project configuration in the opened project root. v2.1 records the project name, conventional project paths, script-resolution policy and the configured global Kinetix Home.

Example:

```json
{
  "version": 1,
  "name": "Example Research Research",
  "paths": {
    "data": "./data",
    "scripts": "./scripts",
    "results": "./results"
  },
  "datasets": {},
  "scriptResolution": {
    "workspace": ".",
    "global": "@global/"
  },
  "globalLibrary": {
    "home": "C:\\Users\\Josh\\Documents\\Kinetix Studio"
  }
}
```

Large datasets are not copied into the project merely because a workspace is opened. Dataset registration/version pinning belongs to the Data Library/Data Engine milestones.

## KX path resolution

KX imports now understand physical script location.

### Project-relative

From `strategies/pead_v1.kx`:

```kx
import library util from "../scripts/research/util.kx";
```

resolves relative to the importing file.

### Explicit global library

```kx
import library util from "@global/Libraries/research-util.kx";
```

always resolves from Kinetix Home.

### Explicit workspace root

```kx
import library util from "@workspace/scripts/research/util.kx";
```

always resolves from the active project root.

Legacy basename imports remain supported only when the match is unambiguous. If both a project and global resource could satisfy the same basename, compilation intentionally fails and the author must use a relative, `@workspace/` or `@global/` path.

## Promote to Kinetix Library

Promoting a project KX script:

- copies the physical file into the matching global category;
- keeps the original workspace copy;
- refuses to silently overwrite an existing global resource;
- warns when the promoted script contains relative project dependencies;
- keeps the KX declaration type/category consistent.

The project can then explicitly import the reusable copy with `@global/...`. This avoids silently changing a research project when a global resource later evolves.

## Filesystem safety

Native project operations are restricted to the selected workspace root. Absolute paths, `..` traversal and paths that resolve through symlinks/junctions outside the root are rejected.

Global-library operations are restricted to the configured Kinetix Home and fixed library categories.

## Data workflows in the workspace

Workspace data previews provide Copy KX Reference, pipeline insertion/creation and Prepare data. Pipelines read scoped CSV/JSON/Parquet files or folders through the native data engine; visual preparation builds the same plans. Saved outputs are content-hashed and registered in Data Library. Native registered datasets and completed downloads also open in Prepare data.

Data Library → Download manages connections, provider requests and resumable jobs. The duplicate download activity-rail shortcut was removed in v2.4; Data Library and Home still provide download entry points. See DATA_ENGINE.md and V2.3_CONNECTIONS.md for scoped reads, transforms, immutable versions and acquisition details.

Strategies and historical backtests remain deterministic and do not perform acquisition or mutable native file operations. The generated KX pipeline is the reusable recipe for a visual workflow; save that script before closing the draft.
