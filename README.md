# PLC-Connect Hub v4.0
Offline PWA for SCADA/PLC integration plus a Node.js companion server for live PLC reads.

## Quick start
1. Install Node.js 18 or newer.
2. Windows: double-click `start.bat`. Mac/Linux: run `./start.sh`. Add `--mock` to test without a PLC (for example `start.bat --mock`).
3. Open http://localhost:3000 and install the app from your browser if you like.

Manual: `cd backend`, `npm install`, `npm start` (or `npm run mock`).

## Folders
- `frontend/`: the PWA (Tag Mapper, Protocols, Snippets, Projects, Live Data, first-run tour). Works offline.
- `backend/`: Express + Socket.io server and PLC drivers. See `backend/README.md`.

## Tag Mapper brands and examples
| Brand | Examples |
|---|---|
| Siemens S7 | DB1.DBD4, DB5.DBX0.1, MW20, M10.0 |
| Allen-Bradley | Motor1.Speed, N7:0, F8:5, B3:0/1 |
| Omron FINS | D100, CIO10, W5, H1, D100.05 |
| Mitsubishi MELSEC | D100, M10, X1F, Y20 |
| GE Fanuc SRTP | %R100, %I1, %Q10, %M5 (also gives iFIX fields) |

## Honest limits
- GE SRTP has no live driver. The Live tab offers it in mock mode only; use iFIX or an OPC server for real GE reads.
- Allen-Bradley, Omron, Mitsubishi and Siemens drivers were written from protocol specs and have not been tested on real hardware here. Try a non-critical PLC first.
- Live Data is read-only. Nothing is ever written to a PLC.