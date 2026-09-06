import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {load} from 'cheerio';
const hash=s=>createHash('sha256').update(s).digest('hex');
async function files(dir='.'){
  const result=[];
  for(const e of await readdir(dir,{withFileTypes:true})){
    if(e.name.startsWith('.')||['node_modules','scripts','docs'].includes(e.name))continue;
    const path=dir==='.'?e.name:`${dir}/${e.name}`;
    if(e.isDirectory())result.push(...await files(path));else result.push(path);
  }
  return result;
}
const paths=await files(), existing=new Set(paths);
const baseline=JSON.parse(await readFile('scripts/content-baseline.json','utf8'));
const html=new Map(await Promise.all(paths.filter(p=>p.endsWith('.html')).map(async p=>[p,load(await readFile(p,'utf8'))])));
test('all original article text, code blocks, images and heading anchors are preserved',()=>{
  for(const [p,b]of Object.entries(baseline)){
    const $=html.get(p);assert.ok($,p);
    assert.equal(hash($('.article-post').text().replace(/\s+/g,' ').trim()),b.text,p);
    assert.equal($('.article-post img').length,b.images,p);
    assert.deepEqual($('.article-post pre').map((_,e)=>$(e).text()).get(),b.code,p);
    for(const id of b.anchors)assert.ok($('[id]').toArray().some(e=>$(e).attr('id')===id),`${p}#${id}`);
  }
});
test('internal links resolve with exact filename case; scripts are local and metadata is complete',()=>{
  for(const [p,$]of html){
    assert.ok(!$.html().includes('malu.ome'),p);
    if($('meta[http-equiv=refresh]').length)continue;
    assert.equal($('main').length,1,p);
    assert.equal($('.skip-link').attr('href'),'#main',p);
    $('.toc a, .article-post a.anchor').each((_,a)=>{
      const href=$(a).attr('href');assert.ok(href.startsWith('#'),p+': '+href);
      assert.ok($('[id]').toArray().some(e=>$(e).attr('id')===decodeURIComponent(href.slice(1))),p+': '+href);
    });
    assert.equal($('link[data-blog]').length,1,p);
    assert.ok($('meta[name=description]').attr('content'),p);
    assert.ok($('link[rel=canonical]').attr('href').startsWith('https://malu.moe/'),p);
    assert.equal($('script[src^="/ts/"]').length,0,p);
    assert.equal($('script[src^="http"]').length,0,p);
    assert.equal($('script:not([src]):not([type="application/ld+json"])').length,0,p);
    $('a[href^="/"]').each((_,a)=>{
      const u=new URL($(a).attr('href'),'https://malu.moe');
      let target=decodeURI(u.pathname).slice(1);if(!target||target.endsWith('/'))target+='index.html';
      assert.ok(existing.has(target),`${p}: ${target}`);
    });
  }
});
test('search index contains every article once, with usable dates and canonical paths',async()=>{
  const data=JSON.parse(await readFile('index.json','utf8'));
  assert.equal(data.length,[...html].filter(([path,$])=>path.startsWith('post/')&&$('.article-post').length).length);
  assert.equal(new Set(data.map(p=>p.permalink)).size,data.length);
  for(const p of data){assert.match(p.date,/^\d{4}-\d{2}-\d{2}$/);assert.ok(existing.has(decodeURI(p.permalink).slice(1)+'index.html'));assert.ok(p.minutes>=1);}
  const chongqing=data.find(p=>p.title.includes('重庆'));assert.ok(chongqing.minutes>1);
});
test('repeat build is byte-for-byte stable',async()=>{
  const selected=paths.filter(p=>/\.(html|xml|json)$/.test(p));
  const before=new Map(await Promise.all(selected.map(async p=>[p,hash(await readFile(p))])));
  execFileSync(process.execPath,['scripts/enhance.mjs'],{stdio:'pipe'});
  for(const[p,h]of before)assert.equal(hash(await readFile(p)),h,p);
});
