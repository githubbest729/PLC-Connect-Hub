'use strict';
/* PLC connection wrappers. Every driver exposes read(address, type) and close(). Read-only. */
const net = require('net'), dgram = require('dgram');
const opt = n => { try { return require(n); } catch (e) { return null; } };
const ModbusRTU = opt('modbus-serial'), snap7 = opt('node-snap7'), eip = opt('ethernet-ip');
const TIMEOUT = 2000;
const available = () => ({ mock: true, modbus: !!ModbusRTU, s7: !!snap7, ab: !!eip, omron: true, mitsubishi: true, ge: false });

const PRIVATE = [/^10\./, /^192\.168\./, /^172\.(1[6-9]|2\d|3[01])\./, /^127\./];
function ipAllowed(ip) {
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip) || ip.split('.').some(x => +x > 255)) return false;
  const extra = (process.env.ALLOWED_IP_PREFIXES || '').split(',').map(s => s.trim()).filter(Boolean);
  return PRIVATE.some(r => r.test(ip)) || extra.some(p => ip.startsWith(p));
}

const words = t => /^(DINT|UDINT|REAL)$/.test(t) ? 2 : 1;
const f4 = n => +n.toFixed(4);
function decodeBE(b, t) {
  switch (t) {
    case 'UINT': return b.readUInt16BE(0);
    case 'DINT': return b.readInt32BE(0);
    case 'UDINT': return b.readUInt32BE(0);
    case 'REAL': return f4(b.readFloatBE(0));
    default: return b.readInt16BE(0);
  }
}

/* ---------- Modbus TCP (modbus-serial) ---------- */
async function modbus(cfg) {
  if (!ModbusRTU) throw new Error('modbus-serial is not installed. Run npm install in the backend folder.');
  const c = new ModbusRTU();
  await c.connectTCP(cfg.ip, { port: cfg.port || 502 });
  c.setID(cfg.slot == null ? 1 : cfg.slot);
  c.setTimeout(TIMEOUT);
  return {
    async read(addr, type) {
      const s = String(addr).trim();
      if (!/^\d{1,6}$/.test(s)) throw new Error('Modbus address must be a number such as 40001.');
      let fc = 3, num = +s; const M = { 0: 1, 1: 2, 3: 4, 4: 3 };
      if ((s.length === 5 || s.length === 6) && M[s[0]]) { fc = M[s[0]]; num = +s.slice(1); }
      const off = num - 1; if (off < 0) throw new Error('Register numbers start at 1.');
      if (fc <= 2) { const r = fc === 1 ? await c.readCoils(off, 1) : await c.readDiscreteInputs(off, 1); return !!r.data[0]; }
      const n = words(type), r = fc === 3 ? await c.readHoldingRegisters(off, n) : await c.readInputRegisters(off, n);
      let b = Buffer.from(r.buffer);
      if (cfg.swap && n === 2) b = Buffer.from([b[2], b[3], b[0], b[1]]);
      return decodeBE(b, type);
    },
    close() { try { c.close(() => {}); } catch (e) {} }
  };
}

/* ---------- Siemens S7 (node-snap7) ---------- */
function s7conv(t, bit, type) {
  if (t === 'X') return b => ((b[0] >> (+bit || 0)) & 1) === 1;
  if (t === 'B') return b => b[0];
  if (t === 'W') return b => type === 'UINT' ? b.readUInt16BE(0) : b.readInt16BE(0);
  return b => type === 'DINT' ? b.readInt32BE(0) : type === 'UDINT' ? b.readUInt32BE(0) : f4(b.readFloatBE(0));
}
function s7read(c, addr, type) {
  return new Promise((res, rej) => {
    const a = String(addr).toUpperCase().replace(/\s/g, ''), SZ = { X: 1, B: 1, W: 2, D: 4 };
    let m, conv;
    const done = (err, buf) => err ? rej(new Error('S7 read failed: ' + c.ErrorText(err))) : res(conv(buf));
    if ((m = a.match(/^DB(\d+)\.DB([XBWD])(\d+)(?:\.([0-7]))?$/))) {
      conv = s7conv(m[2], m[4], type); return c.DBRead(+m[1], +m[3], SZ[m[2]], done);
    }
    if ((m = a.match(/^([MIQ])([BWD])?(\d+)(?:\.([0-7]))?$/))) {
      if (!m[2] && m[4] === undefined) return rej(new Error('Bit addresses need a bit number, e.g. M10.0'));
      const t = m[2] || 'X', fn = { M: 'MBRead', I: 'EBRead', Q: 'ABRead' }[m[1]];
      conv = s7conv(t, m[4], type); return c[fn](+m[3], SZ[t], done);
    }
    rej(new Error('Unrecognised S7 address'));
  });
}
function s7(cfg) {
  if (!snap7) return Promise.reject(new Error('node-snap7 is not installed (it needs a C++ build toolchain). Use Mock mode or install it.'));
  return new Promise((res, rej) => {
    const c = new snap7.S7Client();
    c.ConnectTo(cfg.ip, cfg.rack == null ? 0 : cfg.rack, cfg.slot == null ? 1 : cfg.slot, e => {
      if (e) return rej(new Error('S7 connect failed: ' + c.ErrorText(e)));
      res({ read: (a, t) => s7read(c, a, t), close() { try { c.Disconnect(); } catch (x) {} } });
    });
  });
}

/* ---------- Allen-Bradley Logix (ethernet-ip) ---------- */
async function ab(cfg) {
  if (!eip) throw new Error('ethernet-ip is not installed. Run npm install in the backend folder.');
  const plc = new eip.Controller();
  await plc.connect(cfg.ip, cfg.slot == null ? 0 : cfg.slot);
  return {
    async read(a) { const t = new eip.Tag(String(a)); await plc.readTag(t); return t.value; },
    close() { try { (plc.destroy || plc.disconnect || (() => {})).call(plc); } catch (e) {} }
  };
}

/* ---------- Omron FINS/UDP (Node dgram, no extra dependency) ---------- */
function omron(cfg) {
  const sock = dgram.createSocket('udp4'); sock.on('error', () => {});
  const da1 = +cfg.ip.split('.')[3], sa1 = +(process.env.FINS_SA1 || 1); let sid = 0;
  const AREA = { CIO: [0xB0, 0x30], W: [0xB1, 0x31], H: [0xB2, 0x32], D: [0x82, 0x02] };
  return {
    read(addr, type) {
      return new Promise((res, rej) => {
        const m = /^(CIO|DM|D|W|H)(\d+)(?:\.(\d{1,2}))?$/i.exec(String(addr).trim());
        if (!m) return rej(new Error('Bad Omron address. Examples: D100, CIO10, D100.05'));
        const ar = m[1].toUpperCase() === 'DM' ? 'D' : m[1].toUpperCase(), word = +m[2], bit = m[3] === undefined ? null : +m[3];
        if (bit !== null && bit > 15) return rej(new Error('Bit must be 0 to 15'));
        const cnt = bit !== null ? 1 : words(type), s = ++sid & 255;
        const head = Buffer.from([0x80, 0, 2, 0, da1, 0, 0, sa1, 0, s]);
        const body = Buffer.from([1, 1, AREA[ar][bit !== null ? 1 : 0], word >> 8, word & 255, bit || 0, cnt >> 8, cnt & 255]);
        const timer = setTimeout(() => { sock.removeListener('message', on); rej(new Error('FINS timeout (check IP, node numbers and UDP port 9600)')); }, TIMEOUT);
        function on(msg) {
          if (msg.length < 14 || msg[9] !== s) return;
          clearTimeout(timer); sock.removeListener('message', on);
          if (msg[12] || msg[13]) return rej(new Error('FINS error code ' + msg[12].toString(16) + '/' + msg[13].toString(16)));
          const d = msg.subarray(14);
          if (bit !== null) return res(d[0] !== 0);
          if (cnt === 2) { const b = Buffer.from([d[2], d[3], d[0], d[1]]); return res(decodeBE(b, type)); }
          res(type === 'UINT' ? d.readUInt16BE(0) : d.readInt16BE(0));
        }
        sock.on('message', on);
        sock.send(Buffer.concat([head, body]), cfg.port || 9600, cfg.ip, err => { if (err) { clearTimeout(timer); sock.removeListener('message', on); rej(err); } });
      });
    },
    close() { try { sock.close(); } catch (e) {} }
  };
}

/* ---------- Mitsubishi MELSEC MC protocol 3E binary over TCP ---------- */
function mitsubishi(cfg) {
  return new Promise((resolve, reject) => {
    const s = net.connect({ host: cfg.ip, port: cfg.port || 5000 });
    s.setTimeout(TIMEOUT);
    let buf = Buffer.alloc(0), cur = null;
    const settle = (ok, v) => { if (!cur) return; const c = cur; cur = null; clearTimeout(c.t); ok ? c.res(v) : c.rej(v); };
    s.on('data', d => {
      buf = Buffer.concat([buf, d]);
      if (buf.length < 9) return;
      const len = buf.readUInt16LE(7);
      if (buf.length < 9 + len) return;
      const f = buf.subarray(0, 9 + len); buf = buf.subarray(9 + len);
      const end = f.readUInt16LE(9);
      end ? settle(false, new Error('MC end code 0x' + end.toString(16))) : settle(true, f.subarray(11));
    });
    s.on('timeout', () => { settle(false, new Error('MC timeout')); });
    s.on('error', e => { settle(false, e); reject(e); });
    s.on('close', () => settle(false, new Error('MC connection closed')));
    s.once('connect', () => {
      s.setTimeout(0);
      resolve({
        read(addr, type) {
          return new Promise((res, rej) => {
            const m = /^([DMXY])([0-9A-F]+)$/i.exec(String(addr).trim());
            if (!m) return rej(new Error('Bad MELSEC address. Examples: D100, M10, X1F, Y20'));
            const ar = m[1].toUpperCase(), bitDev = ar !== 'D';
            const num = parseInt(m[2], (ar === 'X' || ar === 'Y') ? 16 : 10), code = { D: 0xA8, M: 0x90, X: 0x9C, Y: 0x9D }[ar];
            const pts = !bitDev && words(type) === 2 ? 2 : 1;
            const f = Buffer.alloc(21);
            f.writeUInt16BE(0x5000, 0); f[2] = 0; f[3] = 0xFF; f.writeUInt16LE(0x03FF, 4); f[6] = 0;
            f.writeUInt16LE(12, 7); f.writeUInt16LE(0x0010, 9); f.writeUInt16LE(0x0401, 11); f.writeUInt16LE(bitDev ? 1 : 0, 13);
            f[15] = num & 255; f[16] = (num >> 8) & 255; f[17] = (num >> 16) & 255; f[18] = code; f.writeUInt16LE(pts, 19);
            cur = {
              res: d => {
                if (bitDev) return res((d[0] & 0x10) !== 0);
                if (pts === 2) return res(type === 'DINT' ? d.readInt32LE(0) : type === 'UDINT' ? d.readUInt32LE(0) : f4(d.readFloatLE(0)));
                res(type === 'UINT' ? d.readUInt16LE(0) : d.readInt16LE(0));
              },
              rej, t: setTimeout(() => { cur = null; rej(new Error('MC timeout')); }, TIMEOUT)
            };
            s.write(f);
          });
        },
        close() { s.destroy(); }
      });
    });
  });
}

/* ---------- GE SRTP: no driver in this build ---------- */
async function ge() {
  throw new Error('GE SRTP live reads are not supported in this build. Use Mock mode, or read through your iFIX or OPC server.');
}

/* ---------- Mock mode ---------- */
const BOOLRE = { modbus: /^[01]\d{4,5}$/, s7: /DBX|^[MIQ]\d+\.[0-7]$/, omron: /\.\d{1,2}$/, mitsubishi: /^[MXY]/, ge: /^%?[IQM]|\.\d/, ab: /\/\d+$/ };
function mock(proto, addr, type) {
  const a = String(addr).toUpperCase(); let h = 0;
  for (const ch of a) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const t = Date.now() / 1000;
  if (type === 'BOOL' || (!type && BOOLRE[proto] && BOOLRE[proto].test(a))) return Math.floor(t / 2 + h) % 2 === 0;
  const v = 50 + 40 * Math.sin(t / 4 + (h % 7));
  return type && type !== 'REAL' ? Math.round(v) : +v.toFixed(2);
}

async function createDriver(proto, cfg, useMock) {
  if (useMock) return { read: async (a, t) => mock(proto, a, t), close() {} };
  const f = { modbus, s7, ab, omron, mitsubishi, ge }[proto];
  if (!f) throw new Error('Unknown protocol ' + proto);
  return f(cfg);
}

module.exports = { createDriver, available, ipAllowed, mock };