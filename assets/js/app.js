(function () {
  // Helpers: cookie
  function setCookie(name, value, days = 365) {
    const d = new Date();
    d.setTime(d.getTime() + days*24*60*60*1000);
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${d.toUTCString()}`;
  }
  function getCookie(name) {
    const v = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
    return v ? decodeURIComponent(v.pop()) : '';
  }

  // Banner
  const bannerImg = document.getElementById('banner-img');
  const bannerUrlInput = document.getElementById('banner-url');
  const saveBannerBtn = document.getElementById('save-banner');
  const defaultBanner = './img/banner.png';
  const savedBanner = getCookie('bannerUrl') || defaultBanner;
  bannerImg.src = savedBanner;
  bannerUrlInput.value = savedBanner;

  saveBannerBtn.addEventListener('click', () => {
    const url = bannerUrlInput.value.trim() || defaultBanner;
    setCookie('bannerUrl', url);
    bannerImg.src = url;
  });

  // Greeting + clock
  const greetingEl = document.getElementById('greeting');
  function updateClock() {
    const now = new Date();
    const hh = now.getHours();
    const mm = now.getMinutes().toString().padStart(2, '0');
    let greet = '晚上好';
    if (hh < 6) greet = '凌晨好';
    else if (hh < 12) greet = '上午好！';
    else if (hh < 18) greet = '下午好！';
    else greet = '晚上好！';
    greetingEl.textContent = `${greet} 现在是 ${hh}:${mm}`;
  }
  updateClock();
  setInterval(updateClock, 60 * 1000);

  // Hitokoto (一言)
  const hitokotoEl = document.getElementById('daily-hitokoto');
  fetch('https://v1.hitokoto.cn/?encode=json')
    .then(r => r.json())
    .then(j => {
      hitokotoEl.textContent = j.hitokoto ? j.hitokoto : '今日语句加载失败';
    })
    .catch(() => { hitokotoEl.textContent = '今日语句加载失败'; });

  // Search
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');
  const searchEngine = document.getElementById('search-engine');
  function doSearch() {
    const q = encodeURIComponent(searchInput.value.trim());
    if (!q) return;
    const url = searchEngine.value + q;
    window.open(url, '_blank');
  }
  searchBtn.addEventListener('click', doSearch);
  searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch(); });

  // Load navigation JSON
  function loadNav() {
    fetch('./assets/data/nav.json')
      .then(r => r.json())
      .then(data => renderNav(data))
      .catch(() => { document.getElementById('nav-root').textContent = '加载导航失败'; });
  }
  function renderNav(data) {
    const root = document.getElementById('nav-root');
    root.innerHTML = '';
    const tabs = data.tabs || [];
    tabs.forEach((tab, tabIndex) => {
      const card = document.createElement('div');
      // 使用 Tailwind 与自定义类组合
      card.className = 'nav-card bg-white p-4 rounded-xl shadow transform transition-all duration-300';
      const inner = document.createElement('div');
      inner.className = 'nav-card-inner';
      const title = document.createElement('h4');
      title.className = 'nav-card-title font-semibold mb-2 flex items-center justify-between';
      title.textContent = tab.title;
      inner.appendChild(title);

      const list = document.createElement('div');
      list.className = 'nav-items';

      (tab.items || []).forEach(it => {
        const a = document.createElement('a');
        a.href = it.url;
        a.target = '_blank';
        // nav-item 使用自定义样式，保留可点击区域
        a.className = 'nav-item';
        a.textContent = it.name;
        list.appendChild(a);
      });

      inner.appendChild(list);
      card.appendChild(inner);
      root.appendChild(card);

      // 添加入场动画：交错延迟
      const delay = (tabIndex * 80) + 'ms';
      card.style.animationDelay = delay;
      card.classList.add('animate-fade-in-up');
      // 最终将 opacity / transform 置为可见（CSS 动画处理）
      // 为保证 modal/渲染后可见，强制移除初始样式延迟展示
      setTimeout(() => { card.style.opacity = '1'; card.style.transform = 'none'; }, 50 + tabIndex * 70);
    });
  }
  loadNav();

  // Settings modal
  const settingsBtn = document.getElementById('settings-btn');
  const settingsModal = document.getElementById('settings-modal');
  const closeSettings = document.getElementById('close-settings');
  settingsBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
  closeSettings.addEventListener('click', () => settingsModal.classList.add('hidden'));

  // Countdown
  const countdownDateInput = document.getElementById('countdown-date');
  const countdownLabel = document.getElementById('countdown-label');
  const countdownDays = document.getElementById('countdown-days');
  const savedDate = getCookie('countdownDate') || '';
  if (savedDate) countdownDateInput.value = savedDate;
  function updateCountdown() {
    const val = countdownDateInput.value || getCookie('countdownDate') || '';
    if (!val) {
      countdownLabel.textContent = '距 XX 还有';
      countdownDays.textContent = '0 天';
      return;
    }
    const target = new Date(val + 'T00:00:00');
    const now = new Date();
    const diff = Math.ceil((target - now) / (1000*60*60*24));
    countdownLabel.textContent = `距 ${val} 还有`;
    countdownDays.textContent = `${diff} 天`;
  }
  countdownDateInput.addEventListener('change', () => {
    setCookie('countdownDate', countdownDateInput.value || '');
    updateCountdown();
  });
  updateCountdown();

  // City search (小米城市搜索)
  const citySearchBtn = document.getElementById('city-search-btn');
  const citySearchInput = document.getElementById('city-search');
  const cityResults = document.getElementById('city-results');
  const latInput = document.getElementById('lat-input');
  const lonInput = document.getElementById('lon-input');

  async function searchCities(name) {
    try {
      const url = name ? `https://weatherapi.market.xiaomi.com/wtr-v3/location/city/search?name=${encodeURIComponent(name)}&locale=zh_cn` :
        `https://weatherapi.market.xiaomi.com/wtr-v3/location/city/hots?locale=zh_cn`;
      const res = await fetch(url);
      const json = await res.json();
      // 返回的 cityInfo 结构参考 guide.md
      const cities = (json || []).filter(ci => ci.LocationKey && ci.LocationKey.startsWith('weathercn:')).map(ci => {
        return { label: `${ci.Name} (${ci.Affiliation})`, cityId: ci.LocationKey.split(':')[1] };
      });
      return cities;
    } catch (e) {
      return [];
    }
  }

  citySearchBtn.addEventListener('click', async () => {
    const name = citySearchInput.value.trim();
    cityResults.innerHTML = '搜索中...';
    const cities = await searchCities(name);
    cityResults.innerHTML = '';
    if (cities.length === 0) { cityResults.textContent = '未找到城市'; return; }
    cities.forEach(c => {
      const btn = document.createElement('button');
      btn.className = 'block w-full text-left px-2 py-1 border-b';
      btn.textContent = c.label;
      btn.addEventListener('click', () => {
        // 保存 locationKey (cityId) 并尝试拉取天气
        setCookie('locationKey', c.cityId);
        // clear lat/lon
        latInput.value = '';
        lonInput.value = '';
        cityResults.innerHTML = `已选择 ${c.label}`;
        fetchAndRenderWeather();
      });
      cityResults.appendChild(btn);
    });
  });

  // Weather fetching & rendering (小米天气)
  async function fetchAndRenderWeather() {
    const locationKeyCookie = getCookie('locationKey'); // city_num like 101010100
    let latitude = latInput.value || getCookie('latitude') || '0';
    let longitude = lonInput.value || getCookie('longitude') || '0';
    // If lat/lon input provided, save
    if (latInput.value) setCookie('latitude', latInput.value);
    if (lonInput.value) setCookie('longitude', lonInput.value);

    let q = '';
    if (locationKeyCookie) {
      q = `locationKey=weathercn%3A${encodeURIComponent(locationKeyCookie)}`;
    } else {
      q = `latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}`;
    }
    const sign = 'zUFJoAR2ZVrDy1vF3D07';
    const url = `https://weatherapi.market.xiaomi.com/wtr-v3/weather/all?${q}&isGlobal=false&locale=zh_cn&sign=${sign}&days=5`;
    try {
      const res = await fetch(url);
      const j = await res.json();
      renderWeather(j);
    } catch (e) {
      document.getElementById('current-weather').textContent = '天气加载失败';
    }
  }

  function renderWeather(data) {
    if (!data) return;
    // current
    const cur = data.current || {};
    const curHtml = `<div class="text-2xl font-bold">${cur.temperature?.value ?? '--'}${cur.temperature?.unit ?? ''}</div>
      <div class="text-sm text-gray-600">体感 ${cur.feelsLike?.value ?? '--'}${cur.feelsLike?.unit ?? ''} · 湿度 ${cur.humidity?.value ?? '--'}%</div>
      <div class="text-sm text-gray-500 mt-2">更新时间: ${cur.pubTime ?? ''}</div>`;
    document.getElementById('current-weather').innerHTML = curHtml;

    // five day
    const fd = data.forecastDaily || {};
    const temps = fd.temperature?.value || [];
    const weatherVals = fd.weather?.value || [];
    const precip = fd.precipitationProbability?.value || [];
    const fiveRoot = document.getElementById('five-day');
    fiveRoot.innerHTML = '';
    for (let i = 0; i < Math.max(temps.length, 5); i++) {
      const t = temps[i] || { from: '--', to: '--' };
      const w = weatherVals[i] || { from: '--' };
      const p = precip[i] ?? '--';
      const card = document.createElement('div');
      card.className = 'inline-block mr-3 p-3 border rounded';
      card.innerHTML = `<div class="font-semibold">${t.from}° / ${t.to}°</div><div class="text-sm text-gray-600">降雨概率: ${p}%</div><div class="text-sm">天气码: ${w.from}</div>`;
      fiveRoot.appendChild(card);
    }

    // hourly precip: try to use forecastHourly.weather or temperature to make a bar
    const hourly = data.forecastHourly?.weather?.value || [];
    const hourlyRoot = document.getElementById('hourly-precip');
    hourlyRoot.innerHTML = '';
    for (let i = 0; i < Math.min(12, hourly.length); i++) {
      const v = hourly[i];
      // 简单映射：若天气码 >=3 表示有雨，条高较大；否则小
      const height = (v >= 3) ? 60 + (v * 4) : 10 + (v * 4);
      const bar = document.createElement('div');
      bar.style.height = height + 'px';
      bar.style.width = '24px';
      bar.className = 'bg-blue-400 rounded';
      bar.title = `小时 ${i}: 天气码 ${v}`;
      hourlyRoot.appendChild(bar);
    }
  }

  // init weather on load with saved settings
  // restore lat/lon cookies to inputs
  if (getCookie('latitude')) latInput.value = getCookie('latitude');
  if (getCookie('longitude')) lonInput.value = getCookie('longitude');

  // load saved locationKey if any
  fetchAndRenderWeather();

  // Expose for debugging
  window.__dashboard = { fetchAndRenderWeather };

})();