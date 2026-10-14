'use strict';
/* PLC-Connect Hub backend: Express + Socket.io bridge. READ-ONLY: it never writes to a PLC. */
const path = require('path'), http = require('http');
const express = require('express'), { Server } = require('socket.io');
const D = require('./plc-drivers');

const PORT = +process.env.PORT || 3000;
const HOST = process.env.HOST || '127.0.0.1';          // localhost only by default
const MOCK = process.argv.includes('--mock') || process.env.MOCK === '1';
const MAX_SUBS = 20, MAX_FAILS = 3;
const origins = ['http://localhost:' + PORT, 'http://127.0.0.1:' + PORT]
  .concat((process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean));

const app = express();
app.disable('x-powered-by');
app.use(express.static(path.join(__dirname, '..', 'frontend')));   // serves the PWA too
app.get('/health', (q, r) => r.json({ ok: true, mock: MOCK, drivers: D.available() }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: origins },
  // Browsers always send Origin on WebSocket upgrades, so this blocks other websites from driving the server.
  allowRequest: (req, cb) => { const o = req.headers.origin; cb(null, !o || origins.includes(o)); }
});

const PROTOS = ['modbus', 's7', 'ab', 'omron', 'mitsubishi', 'ge'];
const TYPES = ['', 'BOOL', 'INT', 'UINT', 'DINT', 'UDINT', 'REAL'];
const int = (v, lo, hi) => (v === undefined || v === null || v === '') ? null : (Number.isInteger(+v) && +v >= lo && +v <= hi ? +v : NaN);

function clean(r) {
  if (!r || typeof r !== 'object') return { err: 'Bad request' };
  if (!PROTOS.includes(r.protocol)) return { err: 'Unknown protocol' };
  if (!D.ipAllowed(String(r.ip || ''))) return { err: 'IP must be a private-network IPv4 address (set ALLOWED_IP_PREFIXES to allow others).' };
  const address = String(r.address || '').trim();
  if (!address || address.length > 64 || !/^[\w.%\[\]:\/-]+$/.test(address)) return { err: 'Invalid tag address' };
  const type = String(r.type || '').toUpperCase();
  if (!TYPES.includes(type)) return { err: 'Invalid data type' };
  const port = int(r.port, 1, 65535), rack = int(r.rack, 0, 15), slot = int(r.slot, 0, 247);
  if ([port, rack, slot].some(Number.isNaN)) return { err: 'Port, rack or slot out of range' };
  return { cfg: { protocol: r.protocol, ip: r.ip, address, type, port, rack, slot, swap: !!r.swap },
           every: Math.min(60000, Math.max(250, +r.intervalMs || 1000)) };
}

io.on('connection', sock => {
  const subs = new Map();
  const stop = id => { const s = subs.get(id); if (!s) return; s.stopped = true; clearTimeout(s.timer); try { s.drv && s.drv.close(); } catch (e) {} subs.delete(id); };
  sock.emit('hello', { mock: MOCK, drivers: D.available(), version: '4.0.0' });

  sock.on('subscribe', async req => {
    const id = String(req && req.id || '').slice(0, 40);
    const v = clean(req);
    if (!id || v.err) return sock.emit('feed-error', { id, message: v.err || 'Missing id' });
    stop(id);
    if (subs.size >= MAX_SUBS) return sock.emit('feed-error', { id, message: 'Too many active feeds' });
    const s = { stopped: false, drv: null, timer: null, fails: 0 };
    subs.set(id, s);
    try { s.drv = await D.createDriver(v.cfg.protocol, v.cfg, MOCK); }
    catch (e) { subs.delete(id); return sock.emit('feed-error', { id, message: e.message }); }
    if (s.stopped) { try { s.drv.close(); } catch (e) {} return; }
    sock.emit('status', { id, state: 'connected', mock: MOCK });
    const tick = async () => {
      if (s.stopped) return;
      try {
        const value = await s.drv.read(v.cfg.address, v.cfg.type);
        s.fails = 0;
        sock.emit('value', { id, value, ts: Date.now(), quality: 'good', mock: MOCK });
      } catch (e) {
        sock.emit('feed-error', { id, message: e.message, transient: true });
        if (++s.fails >= MAX_FAILS) { stop(id); return sock.emit('status', { id, state: 'disconnected' }); }
      }
      if (!s.stopped) s.timer = setTimeout(tick, v.every);
    };
    tick();
  });

  sock.on('unsubscribe', id => { stop(String(id)); sock.emit('status', { id: String(id), state: 'disconnected' }); });
  sock.on('disconnect', () => [...subs.keys()].forEach(stop));
});

server.listen(PORT, HOST, () => {
  console.log('PLC-Connect Hub backend v4.0.0');
  console.log('  URL:   http://' + (HOST === '0.0.0.0' ? 'localhost' : HOST) + ':' + PORT);
  console.log('  Mode:  ' + (MOCK ? 'MOCK (simulated values, no PLC traffic)' : 'LIVE (read-only PLC polling)'));
  console.log('  Drivers:', JSON.stringify(D.available()));
});
process.on('SIGINT', () => { io.close(); server.close(() => process.exit(0)); });