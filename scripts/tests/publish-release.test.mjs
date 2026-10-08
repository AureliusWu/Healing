import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const root = fileURLToPath(new URL('../../', import.meta.url));
const fixtures = JSON.parse(await readFile(path.join(root, 'electron/smoke-fixtures.json'), 'utf8'));
const version = '8.4.2';
const commit = 'a'.repeat(40);
const heading = 'v8.4.2 · 发布验收';
const files = ['MoistHealing-8.4.2-x64-Setup.exe', 'MoistHealing-8.4.2-x64-Portable.exe', 'MoistHealing-PWA-8.4.2.zip', 'release.json', 'SHA256SUMS.txt'];

// Run the actual publisher against a closed, deterministic GitHub protocol stub.
// Unrecognized requests fail; the subprocess cannot make real network writes.
function mockNetwork() {
  const scenario = process.env.RELEASE_TEST_CASE;
  const release = { id: 7, draft: true, target_commitish: process.env.GITHUB_SHA, html_url: 'https://example.test/v8.4.2', upload_url: 'https://uploads.example.test/assets{?name,label}', assets: [] };
  globalThis.fetch = async (input, options = {}) => {
    const url = new URL(input);
    const method = options.method || 'GET';
    const record = { method, pathname: url.pathname, name: url.searchParams.get('name') };
    if (url.hostname === 'api.github.com' && options.body) record.body = JSON.parse(options.body);
    appendFileSync('requests.ndjson', JSON.stringify(record) + '\n');
    const reply = (body, status = 200) => new Response(JSON.stringify(body), { status });
    if (url.hostname === 'uploads.example.test' && method === 'POST') {
      const data = Buffer.from(options.body);
      return reply({ state: 'uploaded', size: data.length, digest: scenario === 'bad-upload' ? 'sha256:wrong' : 'sha256:' + createHash('sha256').update(data).digest('hex') });
    }
    const prefix = '/repos/test-owner/test-repo';
    if (url.hostname !== 'api.github.com' || !url.pathname.startsWith(prefix)) throw new Error('Unexpected release request');
    const endpoint = url.pathname.slice(prefix.length);
    if (method === 'GET' && endpoint === '/releases/tags/v8.4.2') {
      if (scenario === 'published') return reply({ ...release, draft: false });
      if (scenario === 'foreign-draft') return reply({ ...release, target_commitish: 'b'.repeat(40) });
      if (scenario === 'retry-draft') return reply({ ...release, assets: [{ id: 12, name: 'release.json' }] });
      return reply({ message: 'Not Found' }, 404);
    }
    if (method === 'GET' && endpoint === '/git/ref/tags/v8.4.2') {
      return scenario === 'foreign-tag' ? reply({ object: { type: 'commit', sha: 'b'.repeat(40) } }) : reply({}, 404);
    }
    if (method === 'POST' && endpoint === '/releases') return reply(release);
    if (method === 'DELETE' && endpoint === '/releases/assets/12') return new Response(null, { status: 204 });
    if (method === 'PATCH' && endpoint === '/releases/7') return reply({ ...release, draft: false });
    throw new Error('Unexpected release operation: ' + method + ' ' + endpoint);
  };
}

async function publish(t, scenario, alter = () => {}) {
  const directory = await mkdtemp(path.join(tmpdir(), 'project1-release-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  for (const child of ['release-assets', 'docs/releases', 'electron']) await mkdir(path.join(directory, child), { recursive: true });
  const data = { fixtures: structuredClone(fixtures), heading, run: '12345' };
  alter(data);
  await writeFile(path.join(directory, 'package.json'), JSON.stringify({ version }));
  await writeFile(path.join(directory, 'docs/releases/v8.4.2.md'), '# ' + data.heading + '\n\n版本说明。\n');
  await writeFile(path.join(directory, 'electron/smoke-fixtures.json'), JSON.stringify(data.fixtures));
  for (const name of files.slice(0, 3)) {
    const binary = Buffer.alloc(1001);
    binary.write(name.endsWith('.exe') ? 'MZ' : 'PK');
    await writeFile(path.join(directory, 'release-assets', name), binary);
  }
  const mock = path.join(directory, 'mock-fetch.mjs');
  await writeFile(mock, "import { appendFileSync } from 'node:fs';\nimport { createHash } from 'node:crypto';\n(" + mockNetwork.toString() + ')();\n');
  const result = spawnSync(process.execPath, ['--import', mock, path.join(root, 'scripts/publish-release.mjs')], {
    cwd: directory, encoding: 'utf8', timeout: 10000,
    env: { ...process.env, GITHUB_REPOSITORY: 'test-owner/test-repo', GITHUB_SHA: commit, GITHUB_RUN_ID: data.run, GH_TOKEN: 'test-token', RELEASE_TEST_CASE: scenario },
  });
  assert.ifError(result.error);
  const log = await readFile(path.join(directory, 'requests.ndjson'), 'utf8').catch(error => { if (error.code === 'ENOENT') return ''; throw error; });
  return { ...result, directory, requests: log.trim() ? log.trim().split('\n').map(line => JSON.parse(line)) : [] };
}

test('publishes parseable metadata, actual complete-story contract, checksum lines and indexed title', async t => {
  const result = await publish(t, 'new');
  assert.equal(result.status, 0, result.stderr);
  const metadata = JSON.parse(await readFile(path.join(result.directory, 'release-assets/release.json'), 'utf8'));
  assert.deepEqual(metadata, { version, commit, build: 'https://github.com/test-owner/test-repo/actions/runs/12345', storyVersion: fixtures.final.storyVersion, saveSchema: fixtures.final.schema, compatibleStoryVersions: [fixtures.legacy.storyVersion, fixtures.final.storyVersion] });
  const checksumText = await readFile(path.join(result.directory, 'release-assets/SHA256SUMS.txt'), 'utf8');
  assert.ok(checksumText.endsWith('\n'));
  const checksums = checksumText.trim().split('\n');
  assert.equal(checksums.length, 4);
  for (let i = 0; i < checksums.length; i++) {
    const binary = await readFile(path.join(result.directory, 'release-assets', files[i]));
    assert.equal(checksums[i], createHash('sha256').update(binary).digest('hex') + '  ' + files[i]);
  }
  const creation = result.requests.find(request => request.method === 'POST' && request.pathname.endsWith('/releases'));
  assert.equal(creation.body.name, '湿性愈合 ' + heading);
  assert.deepEqual(result.requests.filter(request => request.name).map(request => request.name), files);
  assert.equal(result.requests.at(-1).method, 'PATCH');
  assert.equal(result.requests.at(-1).body.draft, false);
});

test('published versions cause no remote mutation', async t => {
  const result = await publish(t, 'published');
  assert.equal(result.status, 0, result.stderr);
  assert.ok(result.requests.every(request => request.method === 'GET'));
  assert.match(result.stdout, /immutable/);
});

for (const [scenario, message] of [['foreign-draft', /another commit/], ['foreign-tag', /different commit/]]) {
  test('rejects ' + scenario + ' before remote mutation', async t => {
    const result = await publish(t, scenario);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, message);
    assert.ok(result.requests.every(request => request.method === 'GET'));
  });
}

test('failed upload digest never makes a draft public', async t => {
  const result = await publish(t, 'bad-upload');
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /verification failed/);
  assert.ok(result.requests.every(request => request.method !== 'PATCH'));
});

test('same-commit draft retries replace only existing draft assets and verify all uploads', async t => {
  const result = await publish(t, 'retry-draft');
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.requests.filter(request => request.method === 'DELETE').map(request => request.pathname), ['/repos/test-owner/test-repo/releases/assets/12']);
  assert.equal(result.requests.filter(request => request.name).length, 5);
  assert.equal(result.requests.at(-1).method, 'PATCH');
});

for (const [name, alter, message] of [
  ['inconsistent route fixtures', data => { data.fixtures.cg.storyVersion = 'chapter1-v1'; }, /save fixtures/],
  ['wrong note heading', data => { data.heading = 'v8.4.1 · 旧版本'; }, /heading/],
  ['missing build run', data => { data.run = ''; }, /release context/],
]) {
  test('rejects ' + name + ' before any network request', async t => {
    const result = await publish(t, 'new', alter);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, message);
    assert.equal(result.requests.length, 0);
  });
}
