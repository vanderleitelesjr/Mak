(() => {
  const tabs = [...document.querySelectorAll('[data-page]')];
  const pages = [...document.querySelectorAll('.game-page')];
  const select = (id, focus = false) => {
    const target = tabs.find(tab => tab.dataset.page === id) || tabs[0];
    for (const tab of tabs) {
      const active = tab === target;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    }
    for (const page of pages) page.hidden = page.id !== target.dataset.page;
    if (focus) target.focus();
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  const open = id => {
    if (location.hash === `#${id}`) select(id);
    else location.hash = id;
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => open(tab.dataset.page));
    tab.addEventListener('keydown', event => {
      const next = { ArrowDown: (i + 1) % tabs.length, ArrowRight: (i + 1) % tabs.length,
        ArrowUp: (i + tabs.length - 1) % tabs.length, ArrowLeft: (i + tabs.length - 1) % tabs.length,
        Home: 0, End: tabs.length - 1 }[event.key];
      if (next === undefined) return;
      event.preventDefault();
      open(tabs[next].dataset.page);
      select(tabs[next].dataset.page, true);
    });
  });
  document.querySelectorAll('[data-open]').forEach(button => button.addEventListener('click', () => {
    const id = button.dataset.open;
    open(id);
    document.getElementById(id).focus({ preventScroll: true });
  }));
  window.addEventListener('hashchange', () => select(location.hash.slice(1)));
  select(location.hash.slice(1));
})();
