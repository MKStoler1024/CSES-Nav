(function () {
  // --- Helpers ---
  function setCookie(name, value, days = 365) {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${encodeURIComponent(value)};path=/;expires=${d.toUTCString()}`;
  }
  function getCookie(name) {
    const m = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
    return m ? decodeURIComponent(m[2]) : '';
  }
  function delCookie(name) { document.cookie = name + '=; Max-Age=0; path=/'; } // 新增删除 cookie
  function $(sel) { return document.querySelector(sel); }
  function $all(sel) { return Array.from(document.querySelectorAll(sel)); }

  // --- DOM refs (safe) ---
  const bannerImg = $('#banner-img');
  const bannerUrlInput = $('#banner-url');
  const saveBannerBtn = $('#save-banner');

  const greetingEl = $('#greeting');
  const hitokotoEl = $('#daily-hitokoto');

  const searchInput = $('#search-input');
  const searchBtn = $('#search-btn');
  const searchEngineSelect = $('#search-engine');

  const navRoot = $('#nav-root');

  const settingsBtn = $('#settings-btn');
  const settingsModal = $('#settings-modal');
  const settingsDialog = settingsModal ? settingsModal.querySelector('div') : null;
  const closeSettings = $('#close-settings');
  const saveSettingsBtn = $('#save-settings');

  const showCountdownCheckbox = $('#show-countdown');
  const countdownNameInput = $('#countdown-name');
  const countdownDateInput = $('#countdown-date');
  const defaultSearchSelect = $('#default-search-engine');
  const hitokotoSourceSelect = $('#hitokoto-source');

  const citySearchInput = $('#city-search');
  const citySearchBtn = $('#city-search-btn');
  const cityResults = $('#city-results');
  const latInput = $('#lat-input');
  const lonInput = $('#lon-input');

  const countdownLabel = $('#countdown-label');
  const countdownDays = $('#countdown-days');

  const currentWeatherEl = $('#current-weather');
  const fiveDayEl = $('#five-day');
  const hourlyRoot = $('#hourly-precip');

  // defaults
  const defaultBanner = './img/banner.png';
  const gaokaoPhrases = [
    "为梦想而战，坚持就是胜利。",
    "莫等闲，白了少年头，空悲切。",
    "愿你带着勇气与努力奔向更好的明天。"
  ];

  // --- 初始化从 cookie 读取并回填 UI ---
  function initFromCookies() {
    if (bannerImg && bannerUrlInput) {
      const savedBanner = getCookie('bannerUrl') || defaultBanner;
      bannerImg.src = savedBanner;
      bannerUrlInput.value = savedBanner;
    }
    const defEngine = getCookie('defaultSearchEngine');
    if (defEngine && searchEngineSelect && defaultSearchSelect) {
      [searchEngineSelect, defaultSearchSelect].forEach(sel => {
        for (let i = 0; i < sel.options.length; i++) {
          if (sel.options[i].value === defEngine) sel.selectedIndex = i;
        }
      });
    }
    if (showCountdownCheckbox) {
      const sc = getCookie('showCountdown');
      showCountdownCheckbox.checked = (sc !== 'false');
      if (countdownLabel && countdownDays) {
        if (sc === 'false') { countdownLabel.style.display = 'none'; countdownDays.style.display = 'none'; }
        else { countdownLabel.style.display = ''; countdownDays.style.display = ''; }
      }
    }
    if (countdownNameInput) countdownNameInput.value = getCookie('countdownName') || '';
    if (countdownDateInput) countdownDateInput.value = getCookie('countdownDate') || '';

    const hsrc = getCookie('hitokotoSource');
    if (hsrc && hitokotoSourceSelect) {
      for (let i = 0; i < hitokotoSourceSelect.options.length; i++) {
        if (hitokotoSourceSelect.options[i].value === hsrc) hitokotoSourceSelect.selectedIndex = i;
      }
    }
    if (latInput && getCookie('latitude')) latInput.value = getCookie('latitude');
    if (lonInput && getCookie('longitude')) lonInput.value = getCookie('longitude');
  }

  // --- Banner 保存 ---
  saveBannerBtn?.addEventListener('click', () => {
    const url = (bannerUrlInput?.value || defaultBanner).trim();
    setCookie('bannerUrl', url);
    if (bannerImg) bannerImg.src = url;
  });

  // --- 搜索逻辑 ---
  function doSearch() {
    if (!searchInput || !searchEngineSelect) return;
    const q = searchInput.value.trim();
    if (!q) return;
    window.open(searchEngineSelect.value + encodeURIComponent(q), '_blank');
  }
  searchBtn?.addEventListener('click', doSearch);
  searchInput?.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });

  // --- 时钟（每秒） ---
  function updateClock() {
    if (!greetingEl) return;
    const now = new Date();
    const hh = now.getHours();
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    let greet = '晚上好！';
    if (hh < 6) greet = '凌晨好！';
    else if (hh < 12) greet = '上午好！';
    else if (hh < 18) greet = '下午好！';
    greetingEl.textContent = `${greet} 现在是 ${hh}:${mm}:${ss}`;
  }
  updateClock();
  setInterval(updateClock, 1000);

  // --- 每日一句 ---
  async function loadHitokoto() {
    if (!hitokotoEl) return;
    const src = getCookie('hitokotoSource') || hitokotoSourceSelect?.value || 'hitokoto';
    if (src === 'gaokao') { hitokotoEl.textContent = gaokaoPhrases[Math.floor(Math.random() * gaokaoPhrases.length)]; return; }
    try {
      const res = await fetch('https://v1.hitokoto.cn/?encode=json');
      const j = await res.json();
      hitokotoEl.textContent = j.hitokoto || '今日语句加载失败';
    } catch (e) { hitokotoEl.textContent = '今日语句加载失败'; }
  }
  loadHitokoto();

  // --- 导航：浏览器式标签栏（顶部）---
  async function loadNav() {
    if (!navRoot) return;
    try {
      const r = await fetch('./assets/data/nav.json');
      const j = await r.json();
      renderNavTabs(j.tabs || []);
    } catch (e) {
      navRoot.textContent = '加载导航失败';
    }
  }

  function renderNavTabs(tabs) {
    navRoot.innerHTML = '';
    // tab bar
    const bar = document.createElement('div');
    bar.className = 'nav-tabs';
    navRoot.appendChild(bar);
    // content area (single)
    const contentWrap = document.createElement('div');
    contentWrap.id = 'nav-content-area';
    contentWrap.className = 'nav-content mt-3';
    navRoot.appendChild(contentWrap);

    // build tabs
    const openTabs = []; // {title, items}
    tabs.forEach((t, idx) => {
      openTabs.push({ title: t.title, items: t.items || [] });
    });

    function renderTabButton(tabIndex) {
      const tb = document.createElement('div');
      tb.className = 'nav-tab';
      tb.dataset.index = tabIndex;
      tb.style.display = 'inline-flex';
      tb.style.alignItems = 'center';
      tb.style.gap = '8px';
      tb.style.paddingRight = '6px';
      const title = document.createElement('span');
      title.textContent = openTabs[tabIndex].title;
      const closeBtn = document.createElement('button');
      closeBtn.className = 'ml-2 text-sm';
      closeBtn.style.background = 'transparent';
      closeBtn.style.border = 'none';
      closeBtn.style.cursor = 'pointer';
      closeBtn.textContent = '✕';
      tb.appendChild(title);
      tb.appendChild(closeBtn);
      // click to activate
      tb.addEventListener('click', (e) => {
        if (e.target === closeBtn) return; // handled below
        activateTab(tabIndex);
      });
      // close handler
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeTab(tabIndex);
      });
      return tb;
    }

    function refreshTabBar(activeIndex = 0) {
      bar.innerHTML = '';
      openTabs.forEach((t, i) => {
        const btn = renderTabButton(i);
        if (i === activeIndex) btn.classList.add('active');
        bar.appendChild(btn);
      });
      // ensure there's always at least one tab visible
      if (openTabs.length === 0) {
        contentWrap.innerHTML = '<div class="p-3 text-sm text-gray-500">无标签</div>';
      }
    }

    function activateTab(idx) {
      if (idx < 0 || idx >= openTabs.length) return;
      // update active class
      $all('.nav-tab').forEach(n => n.classList.remove('active'));
      const tabsEls = bar.children;
      if (tabsEls[idx]) tabsEls[idx].classList.add('active');
      // render content
      renderNavContent(openTabs[idx], contentWrap);
    }

    function closeTab(idx) {
      if (idx < 0 || idx >= openTabs.length) return;
      openTabs.splice(idx, 1);
      // re-render bar and choose new active
      const newIndex = Math.max(0, Math.min(idx, openTabs.length - 1));
      refreshTabBar(newIndex);
      if (openTabs.length) activateTab(newIndex);
      else contentWrap.innerHTML = '<div class="p-3 text-sm text-gray-500">无标签</div>';
    }

    // initialize
    refreshTabBar(0);
    if (openTabs.length) activateTab(0);
  }

  function renderNavContent(tab, contentWrap) {
    if (!contentWrap) contentWrap = $('#nav-content-area');
    if (!contentWrap) return;
    contentWrap.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'nav-content';
    (tab.items || []).forEach((it, idx) => {
      const card = document.createElement('div');
      card.className = 'nav-card animate-fade-in-up';
      card.style.animationDelay = (idx * 30) + 'ms';
      const a = document.createElement('a');
      a.className = 'nav-item';
      a.href = it.url;
      a.target = '_blank';
      a.textContent = it.name;
      card.appendChild(a);
      grid.appendChild(card);
    });
    contentWrap.appendChild(grid);
  }

  // --- 设置模态（重写，支持遮罩点击与 ESC） ---
  function openSettings() {
    if (!settingsModal) return;
    // fill UI from cookies
    showCountdownCheckbox && (showCountdownCheckbox.checked = (getCookie('showCountdown') !== 'false'));
    countdownNameInput && (countdownNameInput.value = getCookie('countdownName') || countdownNameInput.value || '');
    countdownDateInput && (countdownDateInput.value = getCookie('countdownDate') || countdownDateInput.value || '');
    defaultSearchSelect && (defaultSearchSelect.value = getCookie('defaultSearchEngine') || defaultSearchSelect.value);
    hitokotoSourceSelect && (hitokotoSourceSelect.value = getCookie('hitokotoSource') || hitokotoSourceSelect.value);
    bannerUrlInput && (bannerUrlInput.value = getCookie('bannerUrl') || bannerUrlInput.value || defaultBanner);

    settingsModal.classList.remove('hidden');
    // force reflow then add show for animation
    void settingsModal.offsetWidth;
    settingsModal.classList.add('show');
    // esc handler
    document.addEventListener('keydown', escHandler);
  }
  function closeSettingsModal() {
    if (!settingsModal) return;
    settingsModal.classList.remove('show');
    // wait animation then hide
    setTimeout(() => {
      settingsModal.classList.add('hidden');
    }, 260);
    document.removeEventListener('keydown', escHandler);
  }
  function escHandler(e) { if (e.key === 'Escape') closeSettingsModal(); }

  // overlay click to close (only if click outside dialog)
  if (settingsModal && settingsDialog) {
    settingsModal.addEventListener('click', (e) => {
      if (e.target === settingsModal) closeSettingsModal();
    });
    settingsDialog.addEventListener('click', (e) => { e.stopPropagation(); }); // prevent
  }

  settingsBtn?.addEventListener('click', openSettings);
  closeSettings?.addEventListener('click', closeSettingsModal);

  // 保存设置并立即生效
  saveSettingsBtn?.addEventListener('click', () => {
    showCountdownCheckbox && setCookie('showCountdown', showCountdownCheckbox.checked ? 'true' : 'false');
    countdownNameInput && setCookie('countdownName', countdownNameInput.value || '');
    countdownDateInput && setCookie('countdownDate', countdownDateInput.value || '');
    defaultSearchSelect && setCookie('defaultSearchEngine', defaultSearchSelect.value || '');
    hitokotoSourceSelect && setCookie('hitokotoSource', hitokotoSourceSelect.value || '');
    // apply default search engine to select
    if (defaultSearchSelect && searchEngineSelect) {
      for (let i = 0; i < searchEngineSelect.options.length; i++) {
        if (searchEngineSelect.options[i].value === defaultSearchSelect.value) searchEngineSelect.selectedIndex = i;
      }
    }
    // toggle countdown visibility
    if (showCountdownCheckbox && countdownLabel && countdownDays) {
      if (showCountdownCheckbox.checked) { countdownLabel.style.display = ''; countdownDays.style.display = ''; }
      else { countdownLabel.style.display = 'none'; countdownDays.style.display = 'none'; }
    }
    loadHitokoto();
    closeSettingsModal();
  });

  // --- 城市搜索（小米）/ 选择（已增强：兼容多种字段并返回经纬度） ---
  async function searchCities(name) {
    try {
      const url = name
        ? `https://weatherapi.market.xiaomi.com/wtr-v3/location/city/search?name=${encodeURIComponent(name)}&locale=zh_cn`
        : `https://weatherapi.market.xiaomi.com/wtr-v3/location/city/hots?locale=zh_cn`;
      const r = await fetch(url);
      const j = await r.json();

      // 规范化返回：支持 array 或 { data: [...] } 等格式
      const list = Array.isArray(j) ? j : (Array.isArray(j?.data) ? j.data : []);
      const cities = (list || []).map(ci => {
        const locKey = ci.LocationKey || ci.locationKey || ci.key || '';
        const nameVal = ci.Name || ci.name || ci.name || '';
        const aff = ci.Affiliation || ci.affiliation || '';
        // 尝试提取 city id（如 weathercn:101120309 -> 101120309）
        let cityId = '';
        if (locKey) {
          const parts = String(locKey).split(':');
          cityId = parts.length > 1 ? parts[1] : parts[0];
        } else if (ci.city_num) {
          cityId = String(ci.city_num);
        }
        const latitude = ci.latitude || ci.lat || ci.Latitude || '';
        const longitude = ci.longitude || ci.lon || ci.Longitude || '';
        return {
          label: aff ? `${nameVal} (${aff})` : nameVal || locKey,
          cityId,
          latitude,
          longitude
        };
      }).filter(x => x.cityId); // 仅保留有 cityId 的项
      return cities;
    } catch (e) {
      return [];
    }
  }

  // 替换结果点击处理：保存 cityId 以及可能的经纬度（仅保存有效数字）
  citySearchBtn?.addEventListener('click', async () => {
    if (!citySearchInput || !cityResults) return;
    const name = citySearchInput.value.trim();
    cityResults.textContent = '搜索中...';
    const found = await searchCities(name);
    cityResults.innerHTML = '';
    if (!found.length) { cityResults.textContent = '未找到城市'; return; }
    found.forEach(c => {
      const btn = document.createElement('button');
      btn.className = 'block w-full text-left px-2 py-1 border-b';
      btn.textContent = c.label;
      btn.addEventListener('click', () => {
        // 存储 cityId（仅数字部分）
        setCookie('locationKey', c.cityId);

        // 仅在经纬度为有效数字时保存；否则删除对应 cookie
        const latVal = c.latitude ?? '';
        const lonVal = c.longitude ?? '';
        const validNum = v => typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v.trim());
        if (validNum(latVal)) {
          setCookie('latitude', latVal.trim());
          if (latInput) latInput.value = latVal.trim();
        } else {
          delCookie('latitude');
          if (latInput) latInput.value = '';
        }
        if (validNum(lonVal)) {
          setCookie('longitude', lonVal.trim());
          if (lonInput) lonInput.value = lonVal.trim();
        } else {
          delCookie('longitude');
          if (lonInput) lonInput.value = '';
        }

        cityResults.innerHTML = `已选择 ${c.label}`;
        // 立即拉取天气（强制刷新）
        fetchAndRenderWeather(true);
      });
      cityResults.appendChild(btn);
    });
  });

  // 载入天气码映射（statuscode.json）
  let statusMap = {};
  async function loadStatusCodes() {
    try {
      const r = await fetch('./assets/data/statuscode.json');
      const j = await r.json();
      const arr = j?.weatherinfo || [];
      arr.forEach(item => { statusMap[String(item.code)] = item.wea; });
    } catch (e) {
      // ignore
    }
  }

  // banner 右侧天气元素引用
  const bannerWeatherEl = $('#banner-weather');
  const bwDesc = $('#bw-desc');
  const bwTemp = $('#bw-temp');
  const bwFeels = $('#bw-feels');
  const bwUpdate = $('#bw-update');

  // helper: 根据天气 code 返回样式类
  function mapCodeToClass(code) {
    const c = Number(code);
    if (Number.isNaN(c)) return 'weather-unknown';
    // 优先判断极端与特殊码
    if (c === 0) return 'weather-sunny';
    if (c === 53) return 'weather-dust';
    if (c === 18 || c === 35) return 'weather-fog';
    if (c === 4 || c === 5) return 'weather-storm';
    if (c >= 3 && c <= 12) return 'weather-rain';
    if (c >= 13 && c <= 17) return 'weather-snow';
    if (c === 1 || c === 2) return 'weather-cloudy';
    if ((c >= 20 && c <= 31) || c === 29 || c === 30 || c === 31) return 'weather-dust';
    return 'weather-unknown';
  }

  // 天气拉取（仅 current），每 10 分钟刷新
  let weatherTimer = null;
  async function fetchAndRenderWeather(force = false) {
    // 确保已有 statusMap
    if (Object.keys(statusMap).length === 0) await loadStatusCodes();

    const locationKey = getCookie('locationKey'); // city_num like 101010100

    // 读取优先级：输入框 -> cookie -> '0'
    let latRaw = (latInput && typeof latInput.value === 'string' && latInput.value.trim() !== '') ? latInput.value.trim() : (getCookie('latitude') || '0');
    let lonRaw = (lonInput && typeof lonInput.value === 'string' && lonInput.value.trim() !== '') ? lonInput.value.trim() : (getCookie('longitude') || '0');

    // 清理可能的非法字符串
    if (String(latRaw).toLowerCase() === 'null' || String(latRaw).toLowerCase() === 'undefined' || latRaw === '') latRaw = '0';
    if (String(lonRaw).toLowerCase() === 'null' || String(lonRaw).toLowerCase() === 'undefined' || lonRaw === '') lonRaw = '0';

    const numRe = /^-?\d+(\.\d+)?$/;
    if (!numRe.test(String(latRaw))) latRaw = '0';
    if (!numRe.test(String(lonRaw))) lonRaw = '0';

    if (latRaw === '0') delCookie('latitude');
    if (lonRaw === '0') delCookie('longitude');

    // 始终包含经纬度与固定参数；若有 locationKey 则同时带上
    const baseParams = `latitude=${encodeURIComponent(latRaw)}&longitude=${encodeURIComponent(lonRaw)}`;
    const locParam = locationKey ? `&locationKey=weathercn%3A${encodeURIComponent(locationKey)}` : '';
    const sign = 'zUFJoAR2ZVrDy1vF3D07';
    const appKey = 'weather20151024';
    const url = `https://weatherapi.market.xiaomi.com/wtr-v3/weather/all?${baseParams}${locParam}&days=5&appKey=${encodeURIComponent(appKey)}&sign=${encodeURIComponent(sign)}&isGlobal=false&locale=zh_cn`;

    try {
      const res = await fetch(url);
      const j = await res.json();
      // render current only
      const cur = j?.current || {};
      const temp = cur.temperature?.value ?? '--';
      const unit = cur.temperature?.unit ?? '℃';
      const feels = cur.feelsLike?.value ?? '--';
      const codeRaw = cur.weather ?? cur.weatherCode ?? '';
      const code = String(codeRaw ?? '');
      const desc = statusMap[code] || (Array.isArray(codeRaw) ? codeRaw.join(',') : '未知');
      const pubTime = cur.pubTime || (j?.pubTime || '');

      if (bwDesc) { bwDesc.textContent = desc; bwDesc.classList.add('force-inherit'); }
      if (bwTemp) { bwTemp.textContent = `${temp}${unit}`; bwTemp.classList.add('force-inherit'); }
      if (bwFeels) { bwFeels.textContent = `体感 ${feels}${cur.feelsLike?.unit ?? unit}`; bwFeels.classList.add('force-inherit'); }
      if (bwUpdate) { bwUpdate.textContent = `更新时间 ${pubTime ? pubTime.replace('T',' ').replace(/\+.*$/,'') : '--'}`; bwUpdate.classList.add('force-inherit'); }

      // 根据 code 选择背景类
      if (bannerWeatherEl) {
        // 移除已有 weather- 类（以 weather- 开头）
        Array.from(bannerWeatherEl.classList).forEach(cl => {
          if (cl.startsWith('weather-')) bannerWeatherEl.classList.remove(cl);
        });
        const cls = mapCodeToClass(code);
        bannerWeatherEl.classList.add(cls);
      }
    } catch (e) {
      if (bwDesc) bwDesc.textContent = '天气加载失败';
      if (bwTemp) bwTemp.textContent = '-- ℃';
      if (bwFeels) bwFeels.textContent = '体感 -- ℃';
      if (bwUpdate) bwUpdate.textContent = '';
      if (bannerWeatherEl) {
        Array.from(bannerWeatherEl.classList).forEach(cl => {
          if (cl.startsWith('weather-')) bannerWeatherEl.classList.remove(cl);
        });
        bannerWeatherEl.classList.add('weather-unknown');
      }
    }

    if (weatherTimer) clearTimeout(weatherTimer);
    weatherTimer = setTimeout(fetchAndRenderWeather, 10 * 60 * 1000);
  }

  // --- 倒计时（每秒更新） ---
  function updateCountdown() {
    if (!countdownDays || !countdownLabel) return;
    const val = countdownDateInput?.value || getCookie('countdownDate') || '';
    const name = countdownNameInput?.value || getCookie('countdownName') || '';
    if (!val) {
      countdownLabel.textContent = name ? `距 ${name} 还有` : '距 XX 还有';
      countdownDays.textContent = '-- 天';
      return;
    }
    const target = new Date(val + 'T00:00:00');
    const now = new Date();
    const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    countdownLabel.textContent = name ? `距 ${name} 还有` : `距 ${val} 还有`;
    countdownDays.textContent = `${diffDays} 天`;
  }
  setInterval(updateCountdown, 1000);
  updateCountdown();

  // --- 启动流程 ---
  initFromCookies();
  loadNav();
  fetchAndRenderWeather();

  // 启动时加载天气映射并拉取一次天气
  loadStatusCodes().then(() => fetchAndRenderWeather(true));

  // expose debug
  window.__dashboard = { fetchAndRenderWeather, loadHitokoto, updateCountdown, openSettings, closeSettingsModal };
})();