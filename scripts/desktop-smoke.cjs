const { spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const crypto = require('node:crypto');
const packaged = process.argv[2];
const electron = packaged ? path.resolve(packaged) : require('electron');
const args = packaged ? ['--smoke-test'] : ['.', '--smoke-test'];
if (process.env.DESKTOP_SMOKE_USER_DATA_DIR) args.push('--smoke-user-data-dir', process.env.DESKTOP_SMOKE_USER_DATA_DIR);
// Root-only CI runners cannot use Chromium's user namespace sandbox. The game
// keeps renderer sandbox/contextIsolation enabled; this flag is test-runner only.
if (process.platform === 'linux' && process.getuid?.() === 0) args.push('--no-sandbox');
const child = spawn(electron, args, { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], env: process.env });
let output = '';
child.stdout.on('data', data => { output += data; process.stdout.write(data); });
child.stderr.on('data', data => process.stderr.write(data));
const timer = setTimeout(() => { child.kill(); console.error('Desktop smoke test timed out'); process.exitCode = 1; }, 45000);
child.on('error', error => { clearTimeout(timer); console.error(error); process.exitCode = 1; });
child.on('exit', code => {
  clearTimeout(timer);
  const ok = code === 0 && output.includes('DESKTOP_SMOKE_OK');
  const directory = path.resolve('test-results/desktop');
  fs.mkdirSync(directory, { recursive: true });
  const artifact = packaged ? path.join(path.dirname(electron), 'resources', 'app.asar') : path.resolve('electron/main.cjs');
  const result = { measuredAt: new Date().toISOString(), version: require('../package.json').version, kind: packaged ? 'packaged' : 'source', executable: electron, pid: child.pid, profile: process.env.DESKTOP_SMOKE_USER_DATA_DIR || path.join(os.tmpdir(), `moist-healing-smoke-${child.pid}`), artifactSha256: fs.existsSync(artifact) ? crypto.createHash('sha256').update(fs.readFileSync(artifact)).digest('hex') : null, ok, output };
  fs.writeFileSync(path.join(directory, `${result.kind}.json`), JSON.stringify(result, null, 2) + '\n');
  process.exitCode = ok ? 0 : 1;
});
