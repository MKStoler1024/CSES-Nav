(function () {
  function $(sel){ return document.querySelector(sel); }
  async function loadNav() {
    const root = $('#nav-root');
    if (!root) return;
    try {
      const r = await fetch('./assets/data/nav.json');
      const j = await r.json();
      renderNavTabs(root, j.tabs || []);
    } catch (e) { root.textContent = '加载导航失败'; }
  }

  function renderNavTabs(root, tabs) {
    root.innerHTML = '';
    const bar = document.createElement('div');
    bar.className = 'nav-tabs';
    const contentWrap = document.createElement('div');
    contentWrap.id = 'nav-content-area';
    contentWrap.className = 'nav-content mt-3';
    root.appendChild(bar);
    root.appendChild(contentWrap);

    const openTabs = tabs.map(t => ({ title: t.title, items: t.items || [] }));

    function renderTabButton(i) {
      const tb = document.createElement('div');
      tb.className = 'nav-tab';
      tb.dataset.index = i;
      tb.innerHTML = `<span class="nav-tab-title">${openTabs[i].title}</span>`;
      tb.addEventListener('click', () => activateTab(i));
      return tb;
    }

    function refresh(activeIndex = 0) {
      bar.innerHTML = '';
      openTabs.forEach((t, i) => {
        const b = renderTabButton(i);
        if (i === activeIndex) b.classList.add('active');
        bar.appendChild(b);
      });
      if (openTabs.length === 0) contentWrap.innerHTML = '<div class="p-3 text-sm text-gray-500">无标签</div>';
    }

    function activateTab(idx) {
      if (idx < 0 || idx >= openTabs.length) return;
      Array.from(bar.children).forEach(n => n.classList.remove('active'));
      if (bar.children[idx]) bar.children[idx].classList.add('active');
      renderContent(openTabs[idx], contentWrap);
    }

    refresh(0);
    if (openTabs.length) activateTab(0);
  }

  function renderContent(tab, contentWrap){
    contentWrap.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'nav-grid';
    (tab.items || []).forEach((it, idx) => {
      const card = document.createElement('div');
      card.className = 'nav-card fixed-card animate-fade-in-up';
      card.style.animationDelay = (idx * 30) + 'ms';
      const a = document.createElement('a');
      a.className = 'nav-item truncate';
      a.href = it.url;
      a.target = '_blank';
      a.textContent = it.name;
      card.appendChild(a);
      grid.appendChild(card);
    });
    contentWrap.appendChild(grid);
  }

  window.Nav = { init: loadNav };
 })();
