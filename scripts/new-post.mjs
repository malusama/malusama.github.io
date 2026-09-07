import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';

const [slug, title = slug] = process.argv.slice(2);
if (!slug || !/^[\p{L}\p{N}][\p{L}\p{N}-]*$/u.test(slug)) {
  throw new Error('Usage: npm run new -- my-post "文章标题" (slug: letters, numbers and hyphens)');
}
const dir = resolve(import.meta.dirname, '../content/post');
await mkdir(dir, { recursive: true });
const path = resolve(dir, `${slug}.md`);
if (existsSync(resolve(dir, `${slug}.html`)) || existsSync(resolve(dir, slug))) {
  throw new Error(`An article already uses the slug ${slug}`);
}
const date = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' }).replace(' ', 'T') + '+08:00';
const metadata = { title, date, url: `/post/${slug}/`, draft: true, tags: [], categories: [] };
await writeFile(path, JSON.stringify(metadata, null, 2) + '\n\n在这里写正文。\n', { flag: 'wx' });
console.log(`Created ${path}\nPreview: npm run build:drafts && npm run preview\nPublish: set draft to false, then npm run check.`);
