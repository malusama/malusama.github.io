const citations = [...document.querySelectorAll('.research-paper a.citation')];
if (citations.length) {
  const preview = document.createElement('aside');
  preview.id = 'citation-preview'; preview.className = 'citation-preview'; preview.hidden = true;
  preview.setAttribute('role', 'dialog'); preview.setAttribute('aria-labelledby', 'citation-preview-heading');
  const header = document.createElement('div'); header.className = 'citation-preview-header';
  const heading = document.createElement('p'); heading.id = 'citation-preview-heading'; heading.className = 'citation-preview-heading';
  const close = document.createElement('button'); close.type = 'button'; close.className = 'citation-preview-close'; close.textContent = '×'; close.setAttribute('aria-label', '关闭引文预览');
  const record = document.createElement('p'); record.className = 'citation-preview-record';
  const links = document.createElement('div'); links.className = 'citation-preview-links';
  const original = document.createElement('a'); original.textContent = '阅读原文 ↗'; original.target = '_blank'; original.rel = 'noopener noreferrer';
  const bibliography = document.createElement('a'); bibliography.textContent = '文末出处 ↓';
  header.append(heading, close); links.append(original, bibliography); preview.append(header, record, links); document.body.append(preview);
  const touch = matchMedia('(hover: none)');
  let active, timer;
  function hide(returnFocus = false) {
    clearTimeout(timer); preview.hidden = true;
    const previous = active; active = null;
    previous?.setAttribute('aria-expanded', 'false');
    if (returnFocus) { previous?.focus(); preview.hidden = true; active = null; previous?.setAttribute('aria-expanded', 'false'); }
  }
  function scheduleHide() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (!preview.contains(document.activeElement) && document.activeElement !== active) hide();
    }, 220);
  }
  function show(citation) {
    clearTimeout(timer);
    const source = document.getElementById(citation.dataset.reference);
    if (!source) return;
    active?.setAttribute('aria-expanded', 'false'); active = citation;
    heading.textContent = `参考文献 ${citation.textContent}`;
    record.textContent = source.textContent.replace(/\s+/g, ' ').trim();
    const url = source.querySelector('a[href]')?.href;
    original.hidden = !url || !/^https?:/.test(url);
    if (!original.hidden) original.href = url;
    bibliography.href = citation.hash;
    citation.setAttribute('aria-expanded', 'true'); preview.hidden = false;
    const anchor = citation.getBoundingClientRect();
    const box = preview.getBoundingClientRect();
    const gap = 10, inset = 16;
    const left = Math.max(inset, Math.min(anchor.left, innerWidth - box.width - inset));
    const below = innerHeight - anchor.bottom - gap - inset;
    const top = below >= box.height ? anchor.bottom + gap : Math.max(inset, anchor.top - box.height - gap);
    preview.style.left = `${left}px`; preview.style.top = `${Math.min(top, innerHeight - box.height - inset)}px`;
  }
  for (const citation of citations) {
    citation.setAttribute('aria-controls', preview.id); citation.setAttribute('aria-expanded', 'false'); citation.setAttribute('aria-haspopup', 'dialog');
    citation.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') show(citation); });
    citation.addEventListener('pointerleave', scheduleHide);
    citation.addEventListener('focus', () => show(citation));
    citation.addEventListener('blur', event => { if (!preview.contains(event.relatedTarget)) scheduleHide(); });
    citation.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
      if (touch.matches) { event.preventDefault(); show(citation); close.focus(); }
      else hide();
    });
  }
  preview.addEventListener('pointerenter', () => clearTimeout(timer));
  preview.addEventListener('pointerleave', () => { if (!preview.contains(document.activeElement)) scheduleHide(); });
  preview.addEventListener('focusin', () => clearTimeout(timer));
  preview.addEventListener('focusout', event => { if (!preview.contains(event.relatedTarget) && event.relatedTarget !== active) scheduleHide(); });
  close.addEventListener('click', () => hide(true));
  bibliography.addEventListener('click', () => hide());
  document.addEventListener('pointerdown', event => { if (!preview.contains(event.target) && !event.target.closest('.citation')) hide(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !preview.hidden) { event.preventDefault(); hide(true); } });
  addEventListener('scroll', () => {
    if (!active) return;
    // Focusing a citation may scroll it into view after the focus event.
    // Keep keyboard and touch previews attached to a visible focused source.
    const anchor = active.getBoundingClientRect();
    const focused = document.activeElement === active || preview.contains(document.activeElement);
    if (focused && anchor.bottom > 0 && anchor.top < innerHeight) show(active);
    else hide();
  }, {passive: true});
  addEventListener('resize', () => hide(), {passive: true});
}
