import { execFileSync } from 'node:child_process';
import { readFile, rm, rename, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';

const root = resolve(import.meta.dirname, '..');
const hugo = process.env.HUGO_BIN || (existsSync(resolve(root, '.tools/hugo')) ? resolve(root, '.tools/hugo') : 'hugo');
const pinned = (await readFile(resolve(root, '.hugo-version'), 'utf8')).trim();
const version = execFileSync(hugo, ['version'], { encoding: 'utf8' });
if (!version.startsWith(`hugo v${pinned}-`) && !version.startsWith(`hugo v${pinned} `)) {
  throw new Error(`Use Hugo ${pinned}; received ${version.trim()}`);
}
const staging = resolve(root, '.build');
await rm(staging, { recursive: true, force: true });
await mkdir(staging);
execFileSync(hugo, ['--source', root, '--destination', staging, ...(process.argv.includes('--drafts') ? ['--buildDrafts'] : [])], { cwd: root, stdio: 'inherit' });
execFileSync(process.execPath, [resolve(root, 'scripts/enhance.mjs')], { cwd: staging, stdio: 'inherit' });
// Do not replace the last preview until both generation stages have succeeded.
await rm(resolve(root, 'public'), { recursive: true, force: true });
await rename(staging, resolve(root, 'public'));
console.log('Site ready in public/.');
