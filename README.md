# PLC-Connect Hub
Offline-capable PWA for SCADA and PLC integration work.

- **Tag Mapper**: Siemens S7 and Allen-Bradley addresses to Wonderware syntax, plus bulk CSV import and export.
- **Protocols**: Modbus register calculator and IP:port quick-copy.
- **Snippets**: SQL and QuickScript vault stored in IndexedDB.
- **Projects**: Kanban board and AED BOM with 5% VAT.

## Run locally
`npm start` (or any static server). Service workers need http://localhost or HTTPS.

## Deploy to GitHub Pages
Push to `main`, then Settings > Pages > Source: GitHub Actions. The workflow in `.github/workflows/deploy.yml` publishes the site.

## Before going live
Replace `USERNAME` and `REPO` in `sitemap.xml` and `robots.txt`, and the contact in `security.txt`. Bump `V` in `service-worker.js` after changing any file.

DAS item syntax differs between DASSIDirect, DASABCIP and DASABTCP versions. Verify generated items before bulk import.