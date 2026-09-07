import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, cp, symlink, readFile, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { load } from 'cheerio';

test('Markdown drafts, publication and removal update every generated surface from clean source', async () => {
  const project = resolve(import.meta.dirname, '..');
  const temp = await mkdtemp(join(tmpdir(), 'malu-authoring-'));
  const hugo = process.env.HUGO_BIN || (existsSync(join(project, '.tools/hugo')) ? join(project, '.tools/hugo') : 'hugo');
  const run = (script, args = []) => execFileSync(process.execPath, [join(temp, 'scripts', script), ...args], {
    cwd: temp, env: { ...process.env, HUGO_BIN: hugo }, stdio: 'pipe'
  });
  const output = p => readFile(join(temp, 'public', p), 'utf8');
  try {
    for (const p of ['content', 'layouts', 'static', 'scripts', 'hugo.toml', '.hugo-version', 'package.json']) {
      await cp(join(project, p), join(temp, p), { recursive: true });
    }
    await symlink(join(project, 'node_modules'), join(temp, 'node_modules'), 'dir');
    run('build.mjs');
    const originalPosts = JSON.parse(await output('index.json'));
    const original = originalPosts.length;
    run('build.mjs', ['--drafts']);
    const originalPreview = JSON.parse(await output('index.json')).length;
    run('new-post.mjs', ['restore-workflow-test', '恢复流程验证']);
    const source = join(temp, 'content/post/restore-workflow-test.md');
    const metadata = { title: '恢复流程验证', date: new Date().toISOString(), url: '/post/restore-workflow-test/', draft: true, tags: ['RestorationTest'], categories: ['恢复测试'] };
    const body = '\n\n这是一篇测试 Markdown 新文章，用来验证文章生成和各个列表同步更新。\n\n## 第一节\n\n```js\nconsole.log("<hello>");\n```\n\n## 第二节\n\n![本地图标](/img/favicon.ico)\n\n## 第三节\n\n[归档](/articles/)\n';
    await writeFile(source, JSON.stringify(metadata, null, 2) + body);
    run('build.mjs', ['--drafts']);
    assert.equal(JSON.parse(await output('index.json')).length, originalPreview + 1);
    assert.ok((await output('post/restore-workflow-test/index.html')).includes('恢复流程验证'));
    run('build.mjs');
    assert.equal(JSON.parse(await output('index.json')).length, original);
    assert.ok(!existsSync(join(temp, 'public/post/restore-workflow-test')));
    for (const p of ['index.html', 'articles/index.html', 'index.xml', 'sitemap.xml']) assert.ok(!(await output(p)).includes('restore-workflow-test'), p);
    metadata.draft = false;
    await writeFile(source, JSON.stringify(metadata, null, 2) + body);
    run('build.mjs');
    assert.equal(JSON.parse(await output('index.json')).length, original + 1);
    for (const p of ['index.html', 'articles/index.html', 'post/index.html', 'tags/restorationtest/index.html', 'categories/恢复测试/index.html', 'index.xml', 'post/index.xml', 'sitemap.xml']) {
      assert.ok((await output(p)).includes('restore-workflow-test'), p);
    }
    const $ = load(await output('post/restore-workflow-test/index.html'));
    assert.equal($('.toc a').length, 3);
    assert.ok($('.highlight code').text().includes('console.log("<hello>");'));
    assert.equal($('.article-post img').attr('data-original'), '/img/favicon.ico');
    assert.equal($('#load-comments').length, 1);
    assert.equal($('.suggested a[rel=prev]').length, 1);
    const backlinks = await Promise.all(originalPosts.map(async p => {
      const old = load(await output(decodeURI(p.permalink).slice(1) + 'index.html'));
      return old('.suggested a[rel=next]').attr('href') === '/post/restore-workflow-test/';
    }));
    assert.ok(backlinks.some(Boolean));
    const rss = load(await output('index.xml'), { xmlMode: true });
    assert.equal(rss('item').length, original + 1);
    assert.ok(load(rss('item').first().find('description').text()).text().includes('console.log'));
    await rm(source);
    run('build.mjs');
    assert.ok(!existsSync(join(temp, 'public/post/restore-workflow-test')));
    assert.equal(JSON.parse(await output('index.json')).length, original);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});
