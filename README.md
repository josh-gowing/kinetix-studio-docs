# Kinetix Studio documentation

This site combines the KX language/API reference, Studio manual, detailed source references and complete recursive example library. Studio and KX versions are displayed separately.

## Update the site from Studio

Default folders:

- Studio: `F:\Projects\Charting\kinetix-studio`
- Docs: `F:\Projects\Websites\kinetix-studio-docs`

In the docs repository:

```powershell
npm install
npm run sync:kx
npm test
npm run sync:kx:check
npm run build
```

`sync:kx` first runs Studio's `api:export` (Studio dependencies must be installed), then synchronizes:

- canonical API JSON to both public and rendered copies;
- all `.kx` examples recursively, preserving relative paths and filenames;
- the detailed Studio references listed in `scripts/sync-kx.mjs`;
- authored workflow guides under `content/studio/`;
- one generated catalog used by navigation, rendering, search and version labels;
- managed-file manifests and content hashes for drift checking.

Provide a different Studio checkout explicitly when needed:

```powershell
npm run sync:kx -- F:\path\to\kinetix-studio
```

Check mode is read-only and checks both registry copies, guides, examples, manifests, Studio version and registry-source fingerprint against the local Studio checkout. Sync removes only exact obsolete files recorded in its own previous manifest; unrelated files are retained. Missing required references fail before website snapshots are changed.

## Maintain comprehensive coverage

Every registered public API entry, declaration/global and namespace remains discoverable. The Studio manual covers five script types, workspaces/shared libraries, native pipelines, connections/jobs, visual transforms, versioned registration, editor/charts/settings/builds, strategy/portfolio semantics, point-in-time data and research workflows. Search includes complete Studio guide and example content as well as API documentation.

API changes and new nested examples sync automatically. A new UI feature still needs a written guide: add/update an authored guide in `content/studio/` or a canonical Studio reference, add that reference to the sync manifest if necessary, then run sync and tests. Do not edit generated JSON or copied public guides/examples directly. Keep unsupported capabilities and known boundaries explicit; documentation coverage does not prove acceptance of an individual trading strategy.

Canonical reference edits belong in Studio. Written workflow guides belong here. The synced catalog records the application version, language version and source hashes, without local absolute checkout paths.

## Preview and build

```powershell
npm run dev
npm run build
npm run preview
```

GitHub Pages uses `BASE_PATH=/kinetix-studio-docs/`. The workflow sets this from the repository name automatically. Test that base path when changing navigation/assets. Hash routes allow direct guide and nested-example links without server-side rewrites.

## Publish

Commit the source changes, generated snapshots and copied public assets. Push a review branch and merge it into the docs repository's `main` after checking the preview. The included GitHub Pages workflow runs tests/build and deploys `dist` on main pushes. Pushing an app-repository branch does not publish this website, and running a local build does not publish it either.

GitHub Pages must use GitHub Actions as its source. Review branches have their own test/build workflow and do not deploy the live site. CI validates committed snapshots without needing access to the separate Studio repository; local `sync:kx:check` is the check against a current Studio checkout.

Shortcut: npm run docs:update runs sync, snapshot tests and the production build together. Commit/push the resulting documentation changes separately when ready to publish.
