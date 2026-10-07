import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const version = pkg.version;
const releaseDir = path.join(root, 'docs', 'releases');
const expected = `v${version}.md`;
const expectedPath = path.join(releaseDir, expected);
const indexPath = path.join(releaseDir, 'README.md');

function fail(message) {
  console.error(`RELEASE_NOTES_ERROR: ${message}`);
  process.exit(1);
}

if (!/^\d+\.\d+\.\d+$/.test(version)) {
  fail(`package.json version is not plain semver: ${version}`);
}

if (!fs.existsSync(expectedPath)) {
  fail(`missing docs/releases/${expected}`);
}

if (!fs.existsSync(indexPath)) {
  fail('missing docs/releases/README.md changelog index');
}

const indexText = fs.readFileSync(indexPath, 'utf8');
const noteFiles = fs.readdirSync(releaseDir)
  .filter((name) => /^v\d+\.\d+\.\d+\.md$/.test(name))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

for (const file of noteFiles) {
  const notePath = path.join(releaseDir, file);
  const noteText = fs.readFileSync(notePath, 'utf8').trim();
  const noteVersion = file.slice(0, -3);

  if (noteText.length < 80 || !noteText.includes(noteVersion)) {
    fail(`docs/releases/${file} must contain its version and a meaningful changelog`);
  }

  if (!indexText.includes(`](${file})`)) {
    fail(`docs/releases/README.md does not index ${file}`);
  }
}

if (!indexText.includes(`](${expected})`)) {
  fail(`current version ${expected} is not indexed`);
}

if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `version=${version}\n`);
}

console.log(`RELEASE_NOTES_OK version=${version} files=${noteFiles.length}`);
