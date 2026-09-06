const $ = selector => document.querySelector(selector);
const all = selector => [...document.querySelectorAll(selector)];
for (const a of all('.nav-links a')) if (a.pathname === location.pathname) a.setAttribute('aria-current', 'page');

// No HTML interpretation of search index strings, even if an entry contains markup.
export function safePostPath(value) {
  try {
    const url = new URL(value, location.origin);
    if (![location.origin, 'https://malu.moe'].includes(url.origin) || !url.pathname.startsWith('/post/')) return null;
    return url.pathname;
  } catch { return null; }
}
function resultCard(post) {
  const path = safePostPath(post.permalink);
  if (!path) return null;
  const wrapper = document.createElement('div'); wrapper.className = 'post';
  const a = document.createElement('a'); a.className = 'post-link'; a.href = path;
  const copy = document.createElement('div'); copy.className = 'post-copy';
  const detail = document.createElement('div'); detail.className = 'post-detail';
  const time = document.createElement('time'); time.dateTime = post.date; time.textContent = post.date.replaceAll('-', '.');
  const title = document.createElement('h3'); title.textContent = post.title;
  const summary = document.createElement('p'); summary.className = 'post-summary'; summary.textContent = post.summary;
  detail.append(time); copy.append(detail, title, summary); a.append(copy); wrapper.append(a);
  return wrapper;
}
async function search() {
  const input = $('#search-query'); if (!input) return;
  const results = $('#search-results'), list = $('#articles-list'), status = $('#search-status');
  const filters = all('.filter-item'), clear = $('.clear-search');
  const selected = new Set(); let fuse, entries, loading = false, timer;
  function render() {
    const query = input.value.trim().slice(0, 200);
    const active = query.length > 0 || selected.size > 0;
    clear.hidden = !active;
    if (!active) { results.hidden = true; list.hidden = false; status.textContent = ''; return; }
    if (!fuse) { status.textContent = loading ? '正在加载搜索…' : '搜索暂时不可用，可以继续浏览下方归档。'; return; }
    const matches = (query ? fuse.search(query).map(r => r.item) : entries)
      .filter(p => !selected.size || [...selected].some(c => p.categories.includes(c)));
    list.hidden = true; results.hidden = false; results.replaceChildren();
    for (const p of matches) { const card = resultCard(p); if (card) results.append(card); }
    status.textContent = matches.length ? `找到 ${matches.length} 篇文章` : '没有找到匹配的文章，试试其他关键词或清除筛选。';
  }
  async function init() {
    if (fuse || loading) return;
    loading = true; render();
    try {
      const [module, response] = await Promise.all([import('./vendor/fuse.mjs'), fetch('/index.json')]);
      if (!response.ok) throw new Error(`Index HTTP ${response.status}`);
      entries = (await response.json()).filter(p => safePostPath(p.permalink));
      fuse = new module.default(entries, {threshold:.3,ignoreLocation:true,keys:[{name:'title',weight:3},'contents','tags','categories']});
    } catch { status.textContent = '搜索暂时不可用，可以继续浏览下方归档。'; }
    finally { loading = false; render(); }
  }
  input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => { render(); init(); }, 100); });
  input.addEventListener('focus', init);
  for (const button of filters) button.addEventListener('click', () => {
    const value = button.dataset.value;
    selected.has(value) ? selected.delete(value) : selected.add(value);
    button.setAttribute('aria-pressed', String(selected.has(value)));
    render(); init();
  });
  clear.addEventListener('click', () => { selected.clear(); input.value = ''; filters.forEach(b=>b.setAttribute('aria-pressed','false')); render(); input.focus(); });
}
search();

const toc = $('.toc details');
if (toc) {
  const media = matchMedia('(min-width: 1180px)');
  const resize = () => { toc.open = media.matches; };
  resize(); media.addEventListener('change', resize);
  const links = all('.toc a');
  const headings = links.map(a => document.getElementById(decodeURIComponent(a.hash.slice(1)))).filter(Boolean);
  let queued = false;
  function mark() {
    queued = false;
    let current = headings[0];
    for (const h of headings) { if (h.getBoundingClientRect().top <= 130) current = h; }
    links.forEach(a => {
      if (decodeURIComponent(a.hash.slice(1)) === current?.id) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  }
  addEventListener('scroll', () => { if (!queued) { queued=true; requestAnimationFrame(mark); } }, {passive:true});
  mark();
}

let lightbox, returnFocus;
for (const link of all('.image-link')) link.addEventListener('click', e => {
  if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0) return;
  e.preventDefault();
  if (!lightbox) {
    lightbox = document.createElement('dialog'); lightbox.className='lightbox'; lightbox.setAttribute('aria-label','图片预览');
    const img=document.createElement('img'), toolbar=document.createElement('div'); toolbar.className='lightbox-toolbar';
    const caption=document.createElement('span'); caption.className='lightbox-caption';
    const original=document.createElement('a'); original.textContent='查看原图 ↗'; original.target='_blank'; original.rel='noopener noreferrer';
    const close=document.createElement('button'); close.type='button'; close.textContent='关闭 ✕'; close.addEventListener('click',()=>lightbox.close());
    toolbar.append(caption, original, close); lightbox.append(img, toolbar); document.body.append(lightbox);
    lightbox.addEventListener('click',event=>{if(event.target===lightbox) lightbox.close();});
    lightbox.addEventListener('close',()=>{document.body.style.overflow='';returnFocus?.focus();});
  }
  const source=link.querySelector('img');
  const img=lightbox.querySelector('img'); img.src=source?.currentSrc || link.href; img.alt=source?.alt || '文章图片';
  lightbox.querySelector('.lightbox-caption').textContent=img.alt;
  lightbox.querySelector('a').href=link.href; returnFocus=link;
  document.body.style.overflow='hidden'; lightbox.showModal();
});

for (const block of all('.article-post .highlight')) {
  const code = block.querySelector('code'); if (!code) continue;
  const button = document.createElement('button'); button.className='copyCodeButton'; button.type='button'; button.textContent='复制';
  button.addEventListener('click', async()=>{
    try { await navigator.clipboard.writeText(code.textContent); button.textContent='已复制'; }
    catch { button.textContent='请选中代码复制'; }
    setTimeout(()=>button.textContent='复制',2000);
  });
  block.append(button);
}
const commentButton = $('#load-comments');
if (commentButton) commentButton.addEventListener('click', () => {
  commentButton.disabled=true; commentButton.textContent='正在加载…';
  const script=document.createElement('script'); script.src='https://utteranc.es/client.js'; script.async=true; script.crossOrigin='anonymous';
  script.setAttribute('repo','malusama/malusama.github.io'); script.setAttribute('issue-term','pathname');
  script.setAttribute('theme',`github-${document.documentElement.dataset.userColorScheme}`);
  script.addEventListener('error',()=>{commentButton.disabled=false;commentButton.textContent='加载失败，点击重试';script.remove();});
  script.addEventListener('load',()=>{commentButton.hidden=true;});
  $('#comments-mount').append(script);
});
function setCommentTheme() {
  const frame=$('.utterances-frame');
  frame?.contentWindow.postMessage({type:'set-theme',theme:`github-${document.documentElement.dataset.userColorScheme}`},'https://utteranc.es');
}
addEventListener('onColorSchemeChange',setCommentTheme);
addEventListener('message',event=>{
  const frame=$('.utterances-frame');
  if (event.origin==='https://utteranc.es' && event.source===frame?.contentWindow) setCommentTheme();
});
