import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {load} from 'cheerio';

test('research article citations resolve to all 21 sources and preserve specific sections', async () => {
  const $ = load(await readFile('public/post/hainan-toponymy/index.html', 'utf8'));
  const sources = $('.bibliography>li');
  assert.equal(sources.length, 21);
  const cited = new Set();
  $('.citation').each((_, node) => {
    const id = $(node).attr('data-reference');
    const source = $(`[id="${id}"]`);
    assert.equal(source.length, 1, id);
    assert.ok(source.find('a[href^="http"]').length, id);
    assert.equal($(node).attr('href'), '#' + id);
    cited.add(id);
  });
  assert.equal(cited.size, 21);
  assert.ok($('.citation[href="#ref-2"]').toArray().some(n => $(n).text().includes('表1及第3.3节')));
  assert.equal($('.paper-table').length, 8);
  assert.equal($('script[src^="/assets/citation-preview.js"]').length, 1);
  assert.equal($('.toc a').length, 14);
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


test('phonetic annotations preserve language scope and no-translation markup', async () => {
  const $ = load(await readFile('public/post/hainan-toponymy/index.html', 'utf8'));
  for (const node of $('.ipa').toArray()) {
    assert.equal($(node).attr('translate'), 'no');
    assert.ok(['lic', 'nan', 'cmn'].includes($(node).attr('lang')));
    assert.match($(node).text(), /^\[[^\[\]]+\]$/);
  }
  assert.ok($('.ipa[lang="lic"]').toArray().some(n => $(n).text() === '[ɓaw˩˩]'));
  assert.ok($('.ipa[lang="cmn"]').toArray().some(n => $(n).text() === '[niou˧˥ lou˥˩]'));
  assert.ok($('.article-post').text().includes('牛漏本地海南话的完整音标仍缺'));
});
