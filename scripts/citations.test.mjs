import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {load} from 'cheerio';

test('research article citations resolve to all 13 sources and preserve specific sections', async () => {
  const $ = load(await readFile('public/post/hainan-toponymy/index.html', 'utf8'));
  const sources = $('.bibliography>li');
  assert.equal(sources.length, 13);
  const cited = new Set();
  $('.citation').each((_, node) => {
    const id = $(node).attr('data-reference');
    const source = $(`[id="${id}"]`);
    assert.equal(source.length, 1, id);
    assert.ok(source.find('a[href^="http"]').length, id);
    assert.equal($(node).attr('href'), '#' + id);
    cited.add(id);
  });
  assert.equal(cited.size, 13);
  assert.ok($('.citation[href="#ref-2"]').toArray().some(n => $(n).text().includes('表1及第3.3节')));
  assert.equal($('.paper-table').length, 4);
  assert.equal($('script[src^="/assets/citation-preview.js"]').length, 1);
  assert.equal($('.toc a').length, 13);
  const figures = $('.paper-figure');
  assert.equal(figures.length, 5);
  for (const figure of figures.toArray()) {
    const img = $(figure).find('img');
    assert.ok(img.attr('src').startsWith('/img/hainan-toponymy/'));
    assert.ok(img.attr('alt'));
    assert.ok(Number(img.attr('width')) > 0 && Number(img.attr('height')) > 0);
    assert.ok($(figure).find('figcaption .citation').length, 'Each figure credits a numbered source');
    await readFile('public' + img.attr('src'));
  }
  assert.ok(!$('.article-post').text().match(/LLM|资料卡|验收|选题初稿/));
});
