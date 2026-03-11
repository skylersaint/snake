import { readFile, writeFile, mkdir, cp } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const distDir = join(root, 'dist');

const changelog = await readFile(join(root, 'CHANGELOG.md'), 'utf8');
const match = changelog.match(/^## \[(\d+\.\d+\.\d+)\]/m);
const version = match ? match[1] : '0.0.0';

await mkdir(distDir, { recursive: true });

const index = await readFile(join(root, 'index.html'), 'utf8');
const builtIndex = index.replace('%%VERSION%%', version);
await writeFile(join(distDir, 'index.html'), builtIndex);

await cp(join(root, 'app.js'), join(distDir, 'app.js'));
await cp(join(root, 'styles.css'), join(distDir, 'styles.css'));
await cp(join(root, 'CHANGELOG.md'), join(distDir, 'CHANGELOG.md'));

console.log(`Built dist with version ${version}`);
