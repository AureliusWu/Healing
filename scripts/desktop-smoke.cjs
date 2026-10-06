const { spawn } = require('node:child_process');
const path = require('node:path');
const packaged = process.argv[2];
const electron = packaged ? path.resolve(packaged) : require('electron');
const args = packaged ? ['--smoke-test'] : ['.', '--smoke-test'];
// Root-only CI runners cannot use Chromium's user namespace sandbox. The game
// keeps renderer sandbox/contextIsolation enabled; this flag is test-runner only.
if (process.platform === 'linux' && process.getuid?.() === 0) args.push('--no-sandbox');
const child = spawn(electron, args, { stdio: ['ignore', 'pipe', 'pipe'], env: process.env });
let output = '';
child.stdout.on('data', data => { output += data; process.stdout.write(data); });
child.stderr.on('data', data => process.stderr.write(data));
const timer = setTimeout(() => { child.kill(); console.error('Desktop smoke test timed out'); process.exitCode = 1; }, 45000);
child.on('error', error => { clearTimeout(timer); console.error(error); process.exitCode = 1; });
child.on('exit', code => { clearTimeout(timer); process.exitCode = code === 0 && output.includes('DESKTOP_SMOKE_OK') ? 0 : 1; });
