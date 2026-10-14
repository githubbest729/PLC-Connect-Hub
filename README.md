# PLC-Connect Hub
Offline-capable PWA for SCADA/PLC integration: tag mapper (Siemens S7, Allen-Bradley to Wonderware), Modbus/OPC quick tools, SQL and QuickScript vault, task and BOM tracker.

## Deploy
Push to GitHub, then Settings > Pages > Source: GitHub Actions. Open the site once online to cache assets.

## Notes
- Data is stored in browser localStorage on each device.
- Verify generated DAS item syntax against your DASSIDirect / DASABCIP / DASABTCP version.
- Bump `V` in service-worker.js after changing any file.