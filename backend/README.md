# PLC-Connect Hub backend (v4.0)
Node.js companion server. Browsers cannot open raw TCP/UDP sockets, so this bridges PLC protocols to the PWA over Socket.io. **Read-only: it never writes to a PLC.**

## Run
```
cd backend
npm install
npm start          # live mode
npm run mock       # simulated values, no PLC traffic
```
Open http://localhost:3000. The server also serves `../frontend`, so the PWA and Live Data tab work from the same origin.

`node-snap7` and `ethernet-ip` are optional dependencies. If `node-snap7` fails to build (it needs a C++ toolchain), the server still starts; Siemens reads then report that the driver is missing.

## Drivers
| Protocol | Library | Address examples | Default port |
|---|---|---|---|
| Modbus TCP | modbus-serial | 40001, 30010, 00001 | 502 |
| Siemens S7 | node-snap7 | DB1.DBD4, M10.0, MW20 | 102 |
| Allen-Bradley Logix | ethernet-ip | Motor1.Speed | 44818 |
| Omron FINS/UDP | built in (dgram) | D100, CIO10, D100.05 | 9600 |
| Mitsubishi MC 3E | built in (net) | D100, M10, X1F | 5000 |
| GE SRTP | none yet | mock only | 18245 |

Siemens S7-1200/1500: enable PUT/GET access and disable optimized block access on the DB. S7 rack 0, slot 1 (slot 2 on S7-300/400).
Omron: node numbers are assumed to be the last IP octet for the PLC; set `FINS_SA1` for the PC node (default 1).
Mitsubishi: enable an Ethernet port for MC protocol, binary, 3E frame. X and Y are hexadecimal on Q/L/iQ-R series.
The Omron, Mitsubishi and Allen-Bradley drivers are written from the protocol specs and have not been tested against real hardware. Validate on a non-critical PLC first.

## Environment variables
| Variable | Default | Purpose |
|---|---|---|
| PORT | 3000 | Listen port |
| HOST | 127.0.0.1 | Listen address. Keep localhost unless you add your own protection |
| ALLOWED_ORIGINS | (none) | Extra browser origins allowed to connect, comma separated (e.g. your GitHub Pages URL) |
| ALLOWED_IP_PREFIXES | (none) | Extra PLC IP prefixes beyond private ranges (10., 172.16-31., 192.168., 127.) |
| FINS_SA1 | 1 | Omron FINS source node |
| MOCK | 0 | Set to 1 for mock mode (same as --mock) |

## WebSocket API (Socket.io)
Client to server: `subscribe` {id, protocol, ip, address, type, port, rack, slot, swap, intervalMs}, `unsubscribe` id.
Server to client: `hello`, `status` {id, state}, `value` {id, value, ts, quality, mock}, `feed-error` {id, message, transient}.

## Safety
Anyone who can reach this server can make it poll PLCs on your network. It binds to localhost, only accepts browser connections from allowed origins, and only targets private IP ranges by default. Do not expose it to the internet.
If the PWA is hosted on HTTPS (for example GitHub Pages), Chrome and Firefox allow it to reach http://localhost; Safari may block that. Serving the PWA from this backend avoids the issue.