import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {load} from 'cheerio';

test('research article citations resolve to all 17 numbered sources and preserve page qualifiers', async () => {
  const $ = load(await readFile('public/post/hainan-toponymy/index.html', 'utf8'));
  const sources = $('.bibliography>li');
  assert.equal(sources.length, 17);
  const cited = new Set();
  $('.citation').each((_, node) => {
    const id = $(node).attr('data-reference');
    const source = $(`[id="${id}"]`);
    assert.equal(source.length, 1, id);
    assert.ok(source.find('a[href^="http"]').length, id);
    assert.equal($(node).attr('href'), '#' + id);
    cited.add(id);
  });
  assert.equal(cited.size, 17);
  assert.ok($('.citation[href="#ref-4"]').toArray().some(n => $(n).text().includes('115—116页')));
  assert.equal($('.paper-table').length, 3);
  assert.equal($('script[src^="/assets/citation-preview.js"]').length, 1);
  assert.equal($('.toc a').length, 16);
  assert.ok(!$('.article-post').text().match(/LLM|资料卡|验收|选题初稿/));
});
