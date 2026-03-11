import { readFile, writeFile, mkdir, cp } from 'node:fs/promises';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const root = new URL('..', import.meta.url).pathname;
const distDir = join(root, 'dist');

const exec = promisify(execFile);

async function readVersionFromTag() {
  try {
    const { stdout } = await exec('git', ['describe', '--tags', '--abbrev=0'], { cwd: root });
    const tag = stdout.trim();
    if (!tag) return null;
    return tag.startsWith('v') ? tag.slice(1) : tag;
  } catch {
    return null;
  }
}

async function readVersionFromChangelog() {
  const changelog = await readFile(join(root, 'CHANGELOG.md'), 'utf8');
  const match = changelog.match(/^## \[(\d+\.\d+\.\d+)\]/m);
  return match ? match[1] : null;
}

const version =
  (await readVersionFromTag()) ||
  (await readVersionFromChangelog()) ||
  '0.0.0';

await mkdir(distDir, { recursive: true });

const index = await readFile(join(root, 'index.html'), 'utf8');
const builtIndex = index.replace('%%VERSION%%', version);
await writeFile(join(distDir, 'index.html'), builtIndex);

await cp(join(root, 'app.js'), join(distDir, 'app.js'));
await cp(join(root, 'styles.css'), join(distDir, 'styles.css'));
await cp(join(root, 'CHANGELOG.md'), join(distDir, 'CHANGELOG.md'));

console.log(`Built dist with version ${version}`);
