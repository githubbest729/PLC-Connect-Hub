# Architecture (v4.0)

## Overview
Client-server. Browsers cannot open raw TCP/UDP sockets, so a small Node.js server speaks the PLC protocols and streams values to the PWA over Socket.io.

```
PWA (frontend/)  <-- Socket.io -->  Node server (backend/)  <-- Modbus TCP / S7 / EtherNet-IP / FINS / MC -->  PLCs
```
The PWA works fully offline without the server. Only the Live Data tab needs it. The server also serves `../frontend`, so one `npm start` is enough.

## Frontend modules
Classic scripts sharing globals, loaded in this order by `index.html`:
`js/db.js` > `js/tag-converter.js` > `js/validator.js` > `js/editor.js` > `js/templates.js` > `app.js` > `js/live-client.js` > `js/tour.js` > `sw-register.js`.

| File | Global | Role |
|---|---|---|
| js/db.js | DB | IndexedDB (snippets, tasks, bom) and sample data |
| js/tag-converter.js | TagConv | Siemens, Allen-Bradley, Omron, Mitsubishi, GE to Wonderware; GE iFIX fields; scaling; Modbus maths; CSV |
| js/validator.js | Validator | Modbus, IP, port and tag checks |
| js/editor.js | Editor | SQL and QuickScript format, minify, checks |
| js/templates.js | Tpl | HTML string templates |
| app.js | - | Hash routing, events, rendering, init |
| js/live-client.js | Live | Socket.io watchlist for the Live Data tab |
| js/tour.js | Tour | First-run tour, flag in localStorage key `plch_tour` |

## Backend modules
| File | Role |
|---|---|
| server.js | Express static server, Socket.io API, input validation, origin check, poll loops |
| plc-drivers.js | Modbus (modbus-serial), S7 (node-snap7), Logix (ethernet-ip), Omron FINS/UDP and Mitsubishi MC 3E (built in), GE (not supported), Mock mode |
| test-mock.js | Smoke test (`npm test`) |

## Socket.io API
Client to server: `subscribe` {id, protocol, ip, address, type, port, rack, slot, swap, intervalMs}, `unsubscribe` id.
Server to client: `hello`, `status`, `value`, `feed-error`. A feed stops after 3 consecutive read failures.

## Security
Read-only. Binds to 127.0.0.1, checks the Origin header on connections, limits targets to private IP ranges, validates every field, caps 20 feeds per connection.

## Offline
`service-worker.js` precaches the app shell and the Tailwind script and never touches `/socket.io/` requests. Bump `V` on every release.

## Known limits
GE SRTP has no live driver (mock only). Allen-Bradley, Omron, Mitsubishi and S7 drivers need validation on real hardware.