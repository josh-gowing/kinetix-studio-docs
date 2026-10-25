# Kinetix Studio — KX Documentation

Public documentation site for the KX language used by Kinetix Studio.

## Local development

```powershell
cd F:\Projects\Websites\kinetix-studio-docs
npm install
npm run dev
```

## Sync with the Kinetix Studio language registry

The default layout assumes:

- Docs: `F:\Projects\Websites\kinetix-studio-docs`
- Studio: `F:\Projects\Charting\kinetix-studio`

Run:

```powershell
npm run sync:kx
```

Or provide another source folder:

```powershell
npm run sync:kx -- F:\Projects\Charting\kinetix-studio
```

This copies the canonical `public/kx-api.json` plus `.kx` examples into the docs project.

## Production build

```powershell
npm run build
```

## GitHub Pages

The included `.github/workflows/deploy-pages.yml` deploys `main` automatically. In the GitHub repository, set **Settings → Pages → Source** to **GitHub Actions**.
