# PLC-Connect Hub
Offline-capable PWA for SCADA and PLC integration work.

- **Tag Mapper**: Siemens S7, Allen-Bradley, Omron, Mitsubishi and GE addresses to Wonderware syntax (GE also gets iFIX database fields), plus bulk CSV import and export.
- **Protocols**: Modbus register calculator and IP:port quick-copy.
- **Live Data**: read-only live values from the companion server in `../backend` (see backend/README.md).
- **Snippets**: SQL and QuickScript vault stored in IndexedDB.
- **Projects**: Kanban board and AED BOM with 5% VAT.
- **Tour**: first-run guided tour. Replay it with the Help button; clear localStorage key `plch_tour` to reset.

## Run locally
`npm start` (or any static server). Service workers need http://localhost or HTTPS.

## Deploy to GitHub Pages
Publish the contents of this frontend folder as the root of its own repository (the workflow must sit at the repo root). The Live Data tab still needs the local backend, with ALLOWED_ORIGINS set to your Pages origin. Simplest option: skip Pages and let the backend serve this folder.
Push to `main`, then Settings > Pages > Source: GitHub Actions. The workflow in `.github/workflows/deploy.yml` publishes the site.

## Before going live
Replace `USERNAME` and `REPO` in `sitemap.xml` and `robots.txt`, and the contact in `security.txt`. Bump `V` in `service-worker.js` after changing any file.

DAS item syntax differs between DASSIDirect, DASABCIP and DASABTCP versions. Verify generated items before bulk import.