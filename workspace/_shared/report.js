/* Shared report image viewer: no dependencies, network calls or content rewriting. */
(() => {
  if (window.__makReportViewer) return;
  window.__makReportViewer = true;
  const ready = () => {
    const images = () => [...document.querySelectorAll('img')].filter(image => !image.closest('.mak-lightbox'));
    let dialog, stage, display, caption, counter, download, original, note, zoom, current = 0, restoreFocus;
    const button = (label, action) => { const node = document.createElement('button'); node.type = 'button'; node.textContent = label; node.addEventListener('click', action); return node; };
    const show = image => {
      if (!dialog) {
        dialog = document.createElement('dialog'); dialog.className = 'mak-lightbox'; dialog.setAttribute('aria-label', 'Image preview');
        const toolbar = document.createElement('div'); toolbar.className = 'mak-lightbox-toolbar';
        caption = document.createElement('span'); caption.className = 'mak-lightbox-caption';
        counter = document.createElement('span');
        original = document.createElement('a'); original.target = '_blank'; original.rel = 'noreferrer'; original.textContent = 'Open original';
        download = document.createElement('a'); download.textContent = 'Download';
        zoom = button('100%', () => { stage.classList.toggle('actual'); zoom.textContent = stage.classList.contains('actual') ? 'Fit' : '100%'; });
        toolbar.append(caption, counter, button('Previous', () => change(-1)), button('Next', () => change(1)), zoom, original, download, button('Close', () => dialog.close()));
        stage = document.createElement('div'); stage.className = 'mak-lightbox-stage'; display = document.createElement('img'); stage.append(display);
        display.addEventListener('click', () => zoom.click());
        note = document.createElement('p'); note.className = 'mak-lightbox-note'; note.setAttribute('role', 'status');
        display.addEventListener('error', () => { note.textContent = 'Image unavailable. Try Open original.'; });
        dialog.append(toolbar, stage, note); document.body.append(dialog);
        dialog.addEventListener('close', () => restoreFocus?.focus({ preventScroll: true }));
        dialog.addEventListener('keydown', event => { if (event.key === 'ArrowRight') { event.preventDefault(); change(1); } if (event.key === 'ArrowLeft') { event.preventDefault(); change(-1); } });
        dialog.addEventListener('click', event => { if (event.target === stage) dialog.close(); });
      }
      const collection = images(); current = collection.indexOf(image);
      const url = image.currentSrc || image.src;
      let filename = 'image'; try { filename = decodeURIComponent(new URL(url, location.href).pathname.split('/').pop()) || filename; } catch { /* Data URLs use the fallback. */ }
      caption.textContent = image.alt || filename; counter.textContent = `${current + 1} / ${collection.length}`;
      display.src = url; display.alt = image.alt || filename; original.href = url; download.href = url; download.download = filename;
      if (location.pathname.startsWith('/mobile/view/')) { const saved = new URL(url, location.href); saved.searchParams.set('download', '1'); download.href = saved.href; }
      stage.classList.remove('actual'); zoom.textContent = '100%'; note.textContent = 'Arrow keys to browse · Esc to close';
      if (!dialog.open) { restoreFocus = image; dialog.showModal(); }
    };
    const change = delta => { const all = images(); if (all.length) show(all[(current + delta + all.length) % all.length]); };
    const prepare = root => { for (const image of root.querySelectorAll('img:not([data-mak-zoom])')) { if (image.closest('.mak-lightbox')) continue; image.dataset.makZoom = 'true'; if (!image.hasAttribute('tabindex')) image.tabIndex = 0; if (!image.title) image.title = 'Open image · download available in preview'; } };
    prepare(document);
    new MutationObserver(records => { if (records.some(record => [...record.addedNodes].some(node => node.nodeType === 1 && !node.closest?.('.mak-lightbox')))) prepare(document); }).observe(document.body, { childList: true, subtree: true });
    document.addEventListener('click', event => { const image = event.target.closest?.('img[data-mak-zoom]'); if (!image || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return; event.preventDefault(); event.stopImmediatePropagation(); show(image); }, true);
    document.addEventListener('keydown', event => { if ((event.key === 'Enter' || event.key === ' ') && event.target.matches?.('img[data-mak-zoom]')) { event.preventDefault(); event.stopImmediatePropagation(); show(event.target); } }, true);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true }); else ready();
})();
