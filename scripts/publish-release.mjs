import { createHash } from 'node:crypto';
import { readFile, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';

const { version } = JSON.parse(await readFile('package.json', 'utf8'));
const { GITHUB_REPOSITORY: repository, GITHUB_SHA: sha, GITHUB_RUN_ID: run, GH_TOKEN: token } = process.env;
if (!/^\d+\.\d+\.\d+$/.test(version) || !/^[\w.-]+\/[\w.-]+$/.test(repository ?? '') || !/^[a-f0-9]{40}$/.test(sha ?? '') || !token) throw new Error('Missing or invalid release context');
const tag = `v${version}`;
const directory = 'release-assets';
const notes = await readFile(`docs/releases/${tag}.md`, 'utf8');
const names = [`MoistHealing-${version}-x64-Setup.exe`, `MoistHealing-${version}-x64-Portable.exe`, `MoistHealing-PWA-${version}.zip`];
for (const name of names) {
  const data = await readFile(path.join(directory, name));
  if (data.length < 1000 || (name.endsWith('.exe') ? data.toString('ascii', 0, 2) !== 'MZ' : data.toString('ascii', 0, 2) !== 'PK')) throw new Error(`Invalid release file: ${name}`);
}
await writeFile(path.join(directory, 'release.json'), JSON.stringify({ version, commit: sha, build: `https://github.com/${repository}/actions/runs/${run}`, storyVersion: 'chapter1-v1', saveSchema: 1 }, null, 2) + '\n');
names.push('release.json');
const sums = await Promise.all(names.map(async name => `${createHash('sha256').update(await readFile(path.join(directory, name))).digest('hex')}  ${name}`));
await writeFile(path.join(directory, 'SHA256SUMS.txt'), sums.join('\n') + '\n');
names.push('SHA256SUMS.txt');

async function api(endpoint, options = {}) {
  const response = await fetch(`https://api.github.com/repos/${repository}${endpoint}`, { ...options, headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2026-03-10', ...options.headers } });
  if (response.status === 404 && !options.method) return null;
  if (!response.ok) throw new Error(`GitHub ${response.status}: ${await response.text()}`);
  return response.status === 204 ? null : response.json();
}

let release = await api(`/releases/tags/${tag}`);
if (release && !release.draft) {
  console.log(`Published release is immutable; keeping ${release.html_url}`);
  process.exit(0);
}
if (release && release.target_commitish !== sha) throw new Error(`${tag} draft belongs to another commit; bump the version`);
const ref = await api(`/git/ref/tags/${tag}`);
if (ref && (ref.object.type !== 'commit' || ref.object.sha !== sha)) throw new Error(`${tag} already points to a different commit; bump the version`);
if (!release) release = await api('/releases', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tag_name: tag, target_commitish: sha, name: `湿性愈合 ${tag} · 生长痛`, body: notes, draft: true, prerelease: false }) });
// Only a draft for this exact tested commit may be repaired on retry.
for (const name of names) {
  const existing = release.assets.find(asset => asset.name === name);
  if (existing) await api(`/releases/assets/${existing.id}`, { method: 'DELETE' });
  const file = path.join(directory, name);
  const response = await fetch(`${release.upload_url.replace(/\{.*\}$/, '')}?name=${encodeURIComponent(name)}`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': name.endsWith('.json') ? 'application/json' : 'application/octet-stream', 'Content-Length': String((await stat(file)).size) }, body: await readFile(file),
  });
  if (!response.ok) throw new Error(`Upload ${name}: ${response.status} ${await response.text()}`);
  const uploaded = await response.json();
  const data = await readFile(file);
  if (uploaded.state !== 'uploaded' || uploaded.size !== data.length || (uploaded.digest && uploaded.digest !== `sha256:${createHash('sha256').update(data).digest('hex')}`)) throw new Error(`Uploaded file verification failed: ${name}`);
}
await api(`/releases/${release.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ draft: false, make_latest: 'true' }) });
console.log(`RELEASE_OK https://github.com/${repository}/releases/tag/${tag}`);
