import { readdir, readFile, writeFile, copyFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';
import { load } from 'cheerio';

const root = process.cwd();
const esc = (s = '') => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const correct = s => s.replaceAll('https://malu.ome', 'https://malu.moe').replaceAll('http://malu.ome', 'https://malu.moe');
async function walk(dir) {
  const result = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || ['node_modules', 'scripts', 'docs'].includes(e.name)) continue;
    const path = join(dir, e.name);
    if (e.isDirectory()) result.push(...await walk(path));
    else if (/\.(html|xml|json)$/.test(e.name) && !e.name.startsWith('package')) result.push(path);
  }
  return result;
}
const paths = await walk(root);
const pages = new Map();
for (const path of paths.filter(p => p.endsWith('.html'))) pages.set(relative(root, path), load(correct(await readFile(path, 'utf8'))));
const canonicalPaths = new Map([...pages.keys()].map(p => ['/' + p.replace(/index\.html$/, '').toLowerCase(), '/' + p.replace(/index\.html$/, '')]));
function fixInternalURL(value) {
  if (!value || (!value.startsWith('/') && !/^https?:\/\//.test(value))) return value;
  try {
    const u = new URL(value, 'https://malu.moe');
    if (u.origin !== 'https://malu.moe') return value;
    const canonical = canonicalPaths.get(decodeURI(u.pathname).toLowerCase());
    if (canonical) u.pathname = canonical;
    return value.startsWith('/') ? u.pathname + u.search + u.hash : u.href;
  } catch { return value; }
}
const oldIndex = JSON.parse(correct(await readFile('index.json', 'utf8')));
const oldByPath = new Map(oldIndex.map(p => [decodeURI(new URL(p.permalink, 'https://malu.moe').pathname), p]));
const posts = new Map();
const imageMetadata = JSON.parse(await readFile('assets/image-metadata.json', 'utf8'));
const imageHosts = new Set(['blog-malu.oss-accelerate.aliyuncs.com', 'blog-malu.oss-cn-beijing.aliyuncs.com', 'malu-picture.oss-cn-beijing.aliyuncs.com']);
const imageURL = (src, width) => {
  if (!src) return '';
  const u = new URL(src, 'https://malu.moe');
  if (imageHosts.has(u.hostname)) {
    u.protocol = 'https:';
    u.searchParams.set('x-oss-process', `image/auto-orient,1/resize,w_${width},limit_1/quality,q_82/format,webp`);
  }
  return u.href;
};
for (const [path, $] of pages) {
  if (!path.startsWith('post/') || !$('.article-post').length) continue;
  const url = '/' + path.replace(/index\.html$/, '');
  const prior = oldByPath.get(url) || {};
  const title = $('.article-header h1').text().trim();
  const date = $('meta[property="article:published_time"]').attr('content')?.slice(0, 10);
  if (!date) throw new Error(`Missing publication date: ${path}`);
  const content = $('.article-post').text().replace(/\s+/g, ' ').trim();
  const firstParagraph = $('.article-post p').filter((_, p) => $(p).text().trim().length > 15).first().text().trim();
  const summary = (firstParagraph || content).replace(/\s+/g, ' ').slice(0, 92);
  const tags = prior.tags || $('.post-meta .tags a').map((_, a) => $(a).text()).get();
  const categories = prior.categories || [];
  const cjk = (content.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu) || []).length;
  const words = (content.replace(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu, ' ').match(/[\p{L}\p{N}]+/gu) || []).length;
  const minutes = Math.max(1, Math.ceil(cjk / 350 + words / 220));
  const travel = ['旅游', '游记', '外出'].some(t => [...tags, ...categories].includes(t)) || ['重庆打卡', '北京北京', '古德寺', '故宫', '东湖绿道'].some(t => path.includes('/'+t+'/'));
  const image = travel ? $('.article-post img').first().attr('data-original') || $('.article-post img').first().attr('src') : '';
  posts.set(url, { title, date, permalink: encodeURI(url), tags, categories, contents: content, summary, minutes, image });
}
const sorted = [...posts.values()].sort((a,b) => b.date.localeCompare(a.date));
const card = (p, rich = false) => `<div class="post"><a href="${esc(p.permalink)}" class="post-link${rich && p.image ? ' has-image' : ''}"><div class="post-copy"><div class="post-detail"><time datetime="${p.date}">${p.date.replaceAll('-', '.')}</time>${rich && (p.categories[0] || p.tags[0]) ? `<span class="post-category">${esc((p.categories[0] || p.tags[0]) === 'Life' ? '生活' : (p.categories[0] || p.tags[0]))}</span>` : ''}</div><h3>${esc(p.title)}</h3>${rich ? `<p class="post-summary">${esc(p.summary)}</p>` : ''}</div>${rich && p.image ? `<img class="post-thumbnail" src="${esc(imageURL(p.image, 320))}" alt="" width="160" height="112" loading="lazy" decoding="async">` : ''}</a></div>`;
const nav = `<nav class="navbar" aria-label="主导航"><div class="container nav-inner"><a class="brand" href="/"><span aria-hidden="true">😎</span> Malu Blog</a><div class="nav-links"><a href="/articles/">文章</a><a href="/about/">关于</a><button id="dark-mode-button" type="button" aria-label="切换配色" title="切换配色"><span aria-hidden="true">◐</span></button></div></div></nav>`;
if (!pages.has('about/index.html')) pages.set('about/index.html', load(pages.get('index.html').html()));
await mkdir('assets/vendor', { recursive: true });
await copyFile('node_modules/fuse.js/dist/fuse.mjs', 'assets/vendor/fuse.mjs');
await copyFile('node_modules/fuse.js/LICENSE', 'assets/vendor/FUSE-LICENSE');
const version = createHash('sha256').update(await readFile('assets/blog.css')).update(await readFile('assets/blog.js')).update(await readFile('assets/theme.js')).digest('hex').slice(0, 12);
for (const [path, $] of pages) {
  const canonical = 'https://malu.moe/' + path.replace(/index\.html$/, '');
  const redirect = $('meta[http-equiv="refresh"]');
  if (redirect.length) {
    redirect.attr('content', fixInternalURL(redirect.attr('content').replace(/^0;\s*url=/i, '')) ? '0; url=' + fixInternalURL(redirect.attr('content').replace(/^0;\s*url=/i, '')) : redirect.attr('content'));
    $('link[rel=canonical]').each((_, e)=>$(e).attr('href', fixInternalURL($(e).attr('href'))));
    await writeFile(path, $.html()); continue;
  }
  const post = posts.get('/' + path.replace(/index\.html$/, ''));
  $('html').attr('lang', 'zh-CN');
  $('body').removeClass('dark').addClass('blog');
  $('script').each((_, e) => {
    if ($(e).attr('type') !== 'application/ld+json') $(e).remove();
    else $(e).text($(e).text().replaceAll('malu.ome', 'malu.moe'));
  });
  $('link[data-blog], meta[name="referrer"], link[rel="canonical"]').remove();
  $('meta[http-equiv="x-ua-compatible"], meta[http-equiv="Content-Security-Policy"]').remove();
  $('head').append("<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'self'; script-src 'self' https://utteranc.es; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; connect-src 'self' https://utteranc.es; frame-src https://utteranc.es; object-src 'none'; base-uri 'self'; form-action 'self'\">");
  $('link[rel="stylesheet"][href^="/sass/"]').remove();
  $('meta[name="theme-color"]').attr('content', '#202123');
  $('head').append(`<meta name="referrer" content="strict-origin-when-cross-origin"><link rel="canonical" href="${esc(canonical)}"><link data-blog rel="stylesheet" href="/assets/blog.css?v=${version}"><script src="/assets/theme.js?v=${version}"></script><script type="module" src="/assets/blog.js?v=${version}"></script>`);
  $('.navbar').replaceWith(nav);
  $('.skip-link').remove();
  $('body').prepend('<a class="skip-link" href="#main">跳到正文</a>');
  $('main').first().attr('id', 'main');
  $('.footer').replaceWith('<footer class="footer"><div class="container footer-inner"><span>Malu Blog · 记录与分享</span><nav aria-label="页脚"><a href="/index.xml">RSS 订阅</a><a href="https://github.com/malusama">GitHub ↗</a></nav></div></footer>');
  if (path === 'index.html') {
    $('title').text('Malu Blog · 技术、旅行与日常');
    $('main').html(`<div class="container home"><section class="intro"><p class="eyebrow">MALU / 随手记录</p><h1>折腾技术，<br>也看看世界<span class="accent">。</span></h1><p class="intro-description">记录技术折腾、旅行与日常。<br>把走过的地方，和弄明白的事情，慢慢写下来。</p><div class="intro-links"><a href="/about/">关于我 <span aria-hidden="true">↗</span></a><a href="https://github.com/malusama">GitHub <span aria-hidden="true">↗</span></a><a href="/index.xml">RSS <span aria-hidden="true">↗</span></a></div></section><section class="recent"><div class="section-heading"><h2>最近文章</h2><a href="/articles/">全部 ${posts.size} 篇 <span aria-hidden="true">→</span></a></div><div class="posts">${sorted.slice(0, 10).map(p => card(p, true)).join('')}</div></section></div>`);
  } else if (path === 'about/index.html') {
    $('title').text('关于 | Malu Blog');
    $('main').html('<div class="container about-page"><p class="eyebrow">ABOUT / 关于</p><h1>你好，我是 Malu<span class="accent">。</span></h1><div class="article-post"><p>这里是我的个人博客，记录技术折腾、旅行与日常。</p><p>从代码与工具，到城市里的街巷和电影取景地，把感兴趣的事情慢慢整理在这里。</p><p><a href="/articles/">翻翻文章归档 →</a></p><p><a href="https://github.com/malusama">在 GitHub 找到我 ↗</a></p><p><a href="/index.xml">通过 RSS 订阅更新 →</a></p></div></div>');
  } else if (post) {
    const content = $('.article-post').first();
    content.find('.image-link').each((_, a) => $(a).replaceWith($(a).contents()));
    content.find('img').each((_, img) => {
      const e = $(img); let src = e.attr('data-original') || e.attr('src');
      if (!src) return;
      if (imageHosts.has(new URL(src, 'https://malu.moe').hostname)) src = new URL(src.replace(/^http:/, 'https:'), 'https://malu.moe').href;
      const dimensions = imageMetadata[src];
      if (dimensions) e.attr({width: dimensions.width, height: dimensions.height});
      e.attr({'data-original': src, loading: 'lazy', decoding: 'async'});
      if (imageHosts.has(new URL(src, 'https://malu.moe').hostname)) {
        e.attr('src', imageURL(src, 960)).attr('srcset', [480, 768, 960, 1440].map(w => `${imageURL(src, w)} ${w}w`).join(', ')).attr('sizes', '(max-width: 767px) calc(100vw - 48px), 720px');
      }
      if (!e.closest('a').length) e.wrap(`<a class="image-link" href="${esc(src)}" aria-label="放大图片：${esc(e.attr('alt') || post.title)}"></a>`);
    });
    const headings = content.find('h2, h3').map((i, e) => {
      if (!$(e).attr('id')) $(e).attr('id', `section-${i + 1}`);
      const h = {id:$(e).attr('id'), text:$(e).text().trim(), level:e.tagName};
      $(e).find('a.anchor').attr({'aria-label': `链接到${h.text}`, href: '#' + encodeURIComponent(h.id)});
      return h;
    }).get();
    const toc = headings.length > 2 ? `<aside class="toc"><details open><summary>本文目录</summary><nav aria-label="本文目录">${headings.map(h => `<a class="toc-${h.level}" href="#${encodeURIComponent(h.id)}">${esc(h.text)}</a>`).join('')}</nav></details></aside>` : '';
    const suggested = $('.suggested').first().clone();
    suggested.find('a[rel="prev"]').attr('title', '上一篇').find('span').text('上一篇');
    suggested.find('a[rel="next"]').attr('title', '下一篇').find('span').text('下一篇');
    const tagHTML = post.tags.map(t => `<a href="/tags/${encodeURIComponent(t.toLowerCase())}/">${esc(t === 'Life' ? '生活' : t)}</a>`).join('');
    const cover = post.image ? `<figure class="article-cover"><a class="image-link" href="${esc(post.image.replace('http:', 'https:'))}" aria-label="放大封面"><img src="${esc(imageURL(post.image, 960))}" srcset="${[480,768,960,1440].map(w => `${esc(imageURL(post.image,w))} ${w}w`).join(', ')}" sizes="(max-width: 767px) calc(100vw - 48px), 720px" alt="${esc(post.title)}" width="720" height="405" fetchpriority="high" decoding="async"></a></figure>` : '';
    $('main').html(`<div class="reading-layout${toc ? ' with-toc' : ''}"><article class="reading-main"><header class="article-header"><a class="back-link" href="/articles/">← 全部文章</a><h1>${esc(post.title)}</h1><div class="post-meta"><time datetime="${post.date}">${post.date.replaceAll('-', '.')}</time><span>约 ${post.minutes} 分钟阅读</span></div><div class="tags">${tagHTML}</div></header>${cover}<div class="article-post">${content.html()}</div>${suggested.length ? $.html(suggested) : ''}<section class="comments" aria-label="文章评论"><h2>聊两句</h2><p>评论使用 GitHub 账号，点击后加载。</p><button type="button" id="load-comments">加载评论</button><div id="comments-mount"></div></section></article>${toc}</div>`);
  } else {
    $('.post').each((_, el) => {
      const href = $(el).find('a').first().attr('href');
      if (!href) return;
      const p = posts.get(decodeURI(new URL(href, 'https://malu.moe').pathname));
      if (p) $(el).replaceWith(card(p));
    });
    if (path === 'articles/index.html') {
      $('title').text('文章归档 | Malu Blog');
      $('header h1').text('文章归档'); $('header .subtitle').text(`${posts.size} 篇记录，关于技术、旅行与日常。`);
      $('#search-query').attr({'placeholder':'搜索文章、内容或标签…','aria-label':'搜索文章、内容或标签','maxlength':'200'}).before('<label class="search-label" for="search-query">找一篇文章</label>');
      // Rebuild controls so repeated builds remain identical, with search before filters.
      $('.search-label').remove();
      $('#search-query').before('<label class="search-label" for="search-query">找一篇文章</label>');
      $('.filter-container').remove();
      const categories = new Map();
      sorted.forEach(p => p.categories.forEach(c => categories.set(c,(categories.get(c)||0)+1)));
      $('#search-query').after(`<div class="filter-container" aria-label="按分类筛选">${[...categories].map(([c,n])=>`<button class="filter-item" type="button" data-value="${esc(c)}" data-type="categories" aria-pressed="false">${esc(c)}<span>${n}</span></button>`).join('')}<button class="clear-search" type="button" hidden>清除筛选</button></div><p id="search-status" role="status" aria-live="polite"></p>`);
      $('#search-status').slice(1).remove();
      $('#search-results').attr('hidden', '').removeAttr('style');
    }
    if (path === '404.html') $('main').html('<p class="eyebrow">404 / 迷路了</p><h1>这一页不在这里。</h1><p>可以回到首页，或者在归档里找找。</p><p><a href="/">回到首页 →</a>　<a href="/articles/">文章归档 →</a></p>');
    $('h1').each((_, el) => { const t=$(el).text().trim(); if(['Tags','Categories','Posts'].includes(t)) $(el).text({Tags:'标签',Categories:'分类',Posts:'文章'}[t]); });
  }
  const description = post?.summary || 'Malu 的个人博客，记录技术折腾、旅行与日常。';
  $('meta[name="description"],meta[name="twitter:description"],meta[property="og:description"],meta[itemprop="description"]').attr('content', description);
  $('meta[property="og:site_name"]').attr('content', 'Malu Blog');
  $('meta[property="og:title"],meta[name="twitter:title"],meta[itemprop="name"],meta[name="application-name"]').attr('content', $('title').text());
  $('a[target="_blank"]').attr('rel','noopener noreferrer');
  $('a[href]').each((_,e)=>{
    let href = $(e).attr('href');
    if (href.startsWith('https://malu.moe/#')) {
      const fragment = new URL(href).hash;
      if ($('[id]').toArray().some(el=>$(el).attr('id')===decodeURIComponent(fragment.slice(1)))) href=fragment;
    }
    $(e).attr('href', fixInternalURL(href));
  });
  await mkdir(join(root, path, '..'), {recursive: true});
  $('body').contents().filter((_, node) => node.type === 'text' && !node.data.trim()).remove();
  await writeFile(path, $.html().trim() + '\n');
}
await writeFile('index.json', JSON.stringify(sorted.map(({image, ...p})=>p)) + '\n');
for (const path of paths.filter(p => p.endsWith('.xml'))) {
  const xml = correct(await readFile(path, 'utf8')).replace(/https:\/\/malu\.moe[^<\s"']*/g, value => fixInternalURL(value));
  await writeFile(path, xml);
}
console.log(`Enhanced ${pages.size} pages; ${posts.size} articles. Assets ${version}.`);
