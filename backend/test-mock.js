'use strict';
/* Smoke test: starts the server in mock mode and checks that values stream. Run: npm test */
const path = require('path'), { spawn } = require('child_process'), { io } = require('socket.io-client');
const PORT = 3199;
const srv = spawn(process.execPath, [path.join(__dirname, 'server.js'), '--mock'], { env: Object.assign({}, process.env, { PORT: String(PORT) }), stdio: 'ignore' });
const fail = m => { console.error('FAIL: ' + m); srv.kill(); process.exit(1); };
setTimeout(() => {
  const s = io('http://127.0.0.1:' + PORT), got = [];
  s.on('connect_error', () => fail('cannot connect to the server'));
  s.on('feed-error', e => { if (!e.transient) fail(e.message); });
  s.on('value', v => got.push(v.value));
  s.on('connect', () => s.emit('subscribe', { id: 't', protocol: 'modbus', ip: '192.168.1.10', address: '40001', intervalMs: 250 }));
  setTimeout(() => { s.close(); srv.kill(); if (got.length < 2) fail('no values received'); console.log('PASS: received ' + got.length + ' mock values'); process.exit(0); }, 1800);
}, 1200);