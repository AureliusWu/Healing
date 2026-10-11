import { createHash } from 'node:crypto';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, writeFile, mkdir, access, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

// The shipped installer changes registry/shortcuts. Only an ephemeral hosted
// Windows runner may execute this gate; local desktop tests use isolated ASAR.
if (process.platform !== 'win32' || process.env.CI !== 'true' || process.env.GITHUB_ACTIONS !== 'true' || process.env.RUNNER_OS !== 'Windows' || !process.env.RUNNER_TEMP || process.env.GITHUB_REPOSITORY !== 'AureliusWu/Healing') throw new Error('Installer smoke requires the Healing disposable Windows Actions runner');
const version = JSON.parse(await readFile('package.json', 'utf8')).version;
const previousVersion = '1.0.2';
if (version === previousVersion) throw new Error('Upgrade needs a newer package version');
const installer = path.resolve(`release/MoistHealing-${version}-x64-Setup.exe`);
await access(installer);
const runnerTemp = path.resolve(process.env.RUNNER_TEMP);
if (/\s/.test(runnerTemp)) throw new Error('NSIS smoke requires a runner temp path without spaces');
const sandbox = await mkdtemp(path.join(runnerTemp, 'Healing-installed-'));
const installation = path.join(sandbox, 'game');
const executable = path.join(installation, '湿性愈合.exe');
const profiles = [];
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;
const evidence = { previousVersion, version, measuredAt: new Date().toISOString(), installation, stages: [] };
async function request(url, headers = {}) {
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(180000) });
  if (!response.ok) throw new Error(`Read-only release download failed: HTTP ${response.status}`);
  return response;
}
async function run(file, args, expected = '', timeout = 180000) {
  return await new Promise((resolve, reject) => {
    const child = spawn(file, args, { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], env });
    let output = '';
    const timer = setTimeout(() => { child.kill(); reject(new Error('Installer/runtime validation timed out')); }, timeout);
    child.stdout.on('data', bytes => { output += bytes; process.stdout.write(bytes); });
    child.stderr.on('data', bytes => process.stderr.write(bytes));
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.once('exit', code => { clearTimeout(timer); code === 0 && (!expected || output.includes(expected)) ? resolve({ pid: child.pid, output }) : reject(new Error(`Installer/runtime validation failed: exit ${code}, required ${expected}`)); });
  });
}
async function executableVersion(file) {
  const { stdout } = await promisify(execFile)('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', '[System.Diagnostics.FileVersionInfo]::GetVersionInfo($env:HEALING_VALIDATION_EXE).ProductVersion'], { windowsHide: true, env: { ...env, HEALING_VALIDATION_EXE: file }, timeout: 10000 });
  // Windows may encode plain semver as its four-part product version.
  return stdout.trim().replace(/^(\d+\.\d+\.\d+)\.0$/, '$1');
}
function isolatedProfile(pid) {
  const directory = path.resolve(tmpdir(), `moist-healing-smoke-${pid}`);
  if (path.dirname(directory).toLowerCase() !== path.resolve(tmpdir()).toLowerCase() || !/^moist-healing-smoke-\d+$/.test(path.basename(directory))) throw new Error('Unsafe smoke profile');
  profiles.push(directory);
  return directory;
}
try {
  const apiHeaders = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...(process.env.GH_TOKEN ? { Authorization: `Bearer ${process.env.GH_TOKEN}` } : {}) };
  const release = await (await request(`https://api.github.com/repos/AureliusWu/Healing/releases/tags/v${previousVersion}`, apiHeaders)).json();
  if (release.draft || release.prerelease || release.tag_name !== `v${previousVersion}`) throw new Error('Expected an immutable public baseline release');
  const oldName = `MoistHealing-${previousVersion}-x64-Setup.exe`;
  const oldAsset = release.assets.find(asset => asset.name === oldName);
  const checksumAsset = release.assets.find(asset => asset.name === 'SHA256SUMS.txt');
  if (!oldAsset || !checksumAsset) throw new Error('Baseline installer/checksums absent');
  const checksums = await (await request(checksumAsset.browser_download_url)).text();
  const line = checksums.split(/\r?\n/).find(item => item.endsWith('  ' + oldName));
  const expectedDigest = line?.split('  ')[0];
  if (!/^[a-f0-9]{64}$/.test(expectedDigest || '')) throw new Error('Baseline checksum absent or malformed');
  const oldBytes = Buffer.from(await (await request(oldAsset.browser_download_url)).arrayBuffer());
  if (oldBytes.subarray(0, 2).toString() !== 'MZ' || oldBytes.length !== oldAsset.size || digest(oldBytes) !== expectedDigest || (oldAsset.digest && oldAsset.digest !== 'sha256:' + expectedDigest)) throw new Error('Baseline installer failed official size/SHA-256 verification');
  const oldInstaller = path.join(sandbox, oldName);
  await writeFile(oldInstaller, oldBytes);
  evidence.baselineInstallerSha256 = expectedDigest;
  evidence.currentInstallerSha256 = digest(await readFile(installer));
  // /D is deliberately the final argument, as required by NSIS.
  await run(oldInstaller, ['/S', '/currentuser', `/D=${installation}`]);
  await access(executable);
  evidence.baselineExecutableVersion = await executableVersion(executable);
  if (evidence.baselineExecutableVersion !== previousVersion) throw new Error('Installed baseline EXE version is not v1.0.2');
  const baseline = await run(executable, ['--smoke-test'], 'DESKTOP_SMOKE_OK', 60000);
  const profile = isolatedProfile(baseline.pid);
  await access(profile);
  evidence.stages.push({ name: 'baseline-installed', version: previousVersion, smoke: true, pid: baseline.pid });
  await run(installer, ['/S', '/currentuser', `/D=${installation}`]);
  await access(executable);
  evidence.upgradedExecutableVersion = await executableVersion(executable);
  if (evidence.upgradedExecutableVersion !== version) throw new Error('Installed upgraded EXE version is not the current package');
  const upgraded = await run(executable, ['--smoke-test', '--smoke-user-data-dir', profile], 'DESKTOP_UPGRADE_OK', 60000);
  if (!upgraded.output.includes('DESKTOP_SMOKE_OK')) throw new Error('Upgraded installed application failed complete runtime checks');
  const upgradeResult = JSON.parse(upgraded.output.split(/\r?\n/).find(line => line.startsWith('DESKTOP_UPGRADE_OK ')).slice('DESKTOP_UPGRADE_OK '.length));
  if (upgradeResult.version !== version || upgradeResult.saveSchema !== 1 || upgradeResult.sameProfile !== true) throw new Error('Installed version/profile does not match the upgrade gate');
  evidence.stages.push({ name: 'upgrade-installed', version, sameInstallation: true, sameProfile: true, actualPriorSaveRestored: true, smoke: true });
  evidence.installedAsarSha256 = digest(await readFile(path.join(installation, 'resources', 'app.asar')));
  evidence.builtAsarSha256 = digest(await readFile('release/win-unpacked/resources/app.asar'));
  if (evidence.installedAsarSha256 !== evidence.builtAsarSha256) throw new Error('Installed ASAR differs from the exact verified build');
  evidence.ok = true;
  console.log('INSTALLER_SMOKE_OK', JSON.stringify(evidence));
} finally {
  await mkdir('test-results/desktop', { recursive: true });
  await writeFile('test-results/desktop/installer-upgrade.json', JSON.stringify(evidence, null, 2) + '\n');
  for (const directory of profiles) {
    if (path.dirname(directory).toLowerCase() !== path.resolve(tmpdir()).toLowerCase() || !/^moist-healing-smoke-\d+$/.test(path.basename(directory))) throw new Error('Unsafe profile cleanup');
    await rm(directory, { recursive: true, force: true, maxRetries: 10, retryDelay: 500 });
  }
  if (path.dirname(sandbox).toLowerCase() !== runnerTemp.toLowerCase() || !path.basename(sandbox).startsWith('Healing-installed-')) throw new Error('Unsafe installer cleanup');
  await rm(sandbox, { recursive: true, force: true, maxRetries: 10, retryDelay: 500 });
}
