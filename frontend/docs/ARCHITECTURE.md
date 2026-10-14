# Architecture

## Overview
Static PWA, no build step. All scripts are classic scripts that share globals, loaded in this order by `index.html`:
`js/db.js` > `js/tag-converter.js` > `js/validator.js` > `js/editor.js` > `js/templates.js` > `app.js` > `js/live-client.js` > `js/tour.js` > `sw-register.js`.

## Modules
| File | Global | Role |
|---|---|---|
| js/db.js | DB | IndexedDB (stores: snippets, tasks, bom), sample-data seeding |
| js/tag-converter.js | TagConv | S7 and Allen-Bradley to Wonderware, scaling, Modbus maths, CSV |
| js/validator.js | Validator | Modbus, IP, port and tag checks |
| js/editor.js | Editor | SQL and QuickScript format, minify, checks |
| js/templates.js | Tpl | HTML string templates |
| app.js | - | Hash routing, events, rendering, init |
| js/live-client.js | Live | Socket.io client for the Live Data tab (talks to ../backend) |
| js/tour.js | Tour | First-time product tour (spotlight and tooltips); remembers completion in localStorage key `plch_tour` |

## Offline
`service-worker.js` precaches the app shell and the Tailwind CDN script (cache-first, offline.html fallback). Bump `V` on every release.

## Data
Everything stays in the browser. Storage failure is handled: the UI still renders and a toast explains.