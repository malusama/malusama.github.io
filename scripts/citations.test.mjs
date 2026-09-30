import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {load} from 'cheerio';

test('research article citations resolve to all 20 sources and preserve specific sections', async () => {
  const $ = load(await readFile('public/post/hainan-toponymy/index.html', 'utf8'));
  const sources = $('.bibliography>li');
  assert.equal(sources.length, 20);
  const cited = new Set();
  $('.citation').each((_, node) => {
    const id = $(node).attr('data-reference');
    const source = $(`[id="${id}"]`);
    assert.equal(source.length, 1, id);
    assert.ok(source.find('a[href^="http"]').length, id);
    assert.equal($(node).attr('href'), '#' + id);
    cited.add(id);
  });
  assert.equal(cited.size, 20);
  assert.ok($('.citation[href="#ref-2"]').toArray().some(n => $(n).text().includes('表1及第3.3节')));
  assert.equal($('.paper-table').length, 10);
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
  assert.ok(!$('.bibliography a').toArray().some(a => /toonkam|wiktionary|zhongguodiqing|voicedic|fx361|guifanku/.test($(a).attr('href'))));
});

test('synthetic pronunciation demos disclose provenance and resolve to valid local WAV files', async () => {
  const $ = load(await readFile('public/post/hainan-toponymy/index.html', 'utf8'));
  const metadata = JSON.parse(await readFile('docs/hainan-toponymy-audio.json', 'utf8'));
  assert.equal($('.ipa-play').length, 22);
  assert.equal($('script[src^="/assets/phonetic-audio.js"]').length, 1);
  assert.match($('.pronunciation-note').text(), /非母语录音/);
  for (const node of $('.ipa-play').toArray()) {
    const button = $(node);
    const src = button.attr('data-audio');
    const record = metadata.find(item => src.endsWith('/' + item.file));
    assert.ok(record);
    const mandarin = button.attr('lang') === 'cmn';
    assert.equal(record.kind, mandarin ? 'synthetic-mandarin-utterance' : 'synthetic-contour-demonstration');
    assert.equal(button.text(), record.targetIPA);
    assert.match(button.attr('aria-label'), /合成示范/);
    const wav = await readFile('public' + src);
    assert.equal(wav.subarray(0, 4).toString(), 'RIFF');
    assert.equal(wav.subarray(8, 12).toString(), 'WAVE');
    assert.ok(wav.length > 1000);
    if (mandarin) {
      // Regression guard for the reported unnatural splicing/resynthesis:
      // the delivered samples must be a contiguous range of the neural source.
      const source = await readFile('docs/hainan-toponymy-audio-sources/' + record.source);
      const pcm = bytes => {
        for (let offset = 12; offset + 8 <= bytes.length;) {
          const size = bytes.readUInt32LE(offset + 4);
          if (bytes.subarray(offset, offset + 4).toString() === 'data') return bytes.subarray(offset + 8, offset + 8 + size);
          offset += 8 + size + (size % 2);
        }
        assert.fail('Missing PCM data chunk');
      };
      const [start, end] = record.sourceFrameRange;
      assert.deepEqual(pcm(wav), pcm(source).subarray(start * 2, end * 2));
    }
  }
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
