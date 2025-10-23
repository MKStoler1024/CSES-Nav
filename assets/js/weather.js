(function () {
  function getCookie(name) {
    const m = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
    return m ? decodeURIComponent(m[2]) : '';
  }
  function delCookie(name) { document.cookie = name + '=; Max-Age=0; path=/'; }
  // 新增：写 cookie 辅助
  function setCookie(name, value, days = 365) {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${encodeURIComponent(value)};path=/;expires=${d.toUTCString()}`;
  }

  const bwDesc = document.getElementById('bw-desc');
  const bwTemp = document.getElementById('bw-temp');
  const bwFeels = document.getElementById('bw-feels');
  const bwUpdate = document.getElementById('bw-update');
  const bannerWeatherEl = document.getElementById('banner-weather');

  let statusMap = {};

  async function loadStatusCodes() {
    try {
      const r = await fetch('./assets/data/statuscode.json');
      const j = await r.json();
      (j?.weatherinfo || []).forEach(item => statusMap[String(item.code)] = item.wea);
    } catch (e) { /* ignore */ }
  }

  function mapCodeToClass(code) {
    const c = Number(code);
    if (Number.isNaN(c)) return 'weather-unknown';
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

  let timer = null;
  async function fetchAndRenderWeather() {
    if (Object.keys(statusMap).length === 0) await loadStatusCodes();

    const locationKey = getCookie('locationKey');
    let lat = (document.getElementById('lat-input')?.value || getCookie('latitude') || '0').trim();
    let lon = (document.getElementById('lon-input')?.value || getCookie('longitude') || '0').trim();
    if (['null','undefined',''].includes(String(lat).toLowerCase())) lat = '0';
    if (['null','undefined',''].includes(String(lon).toLowerCase())) lon = '0';
    if (!/^-?\d+(\.\d+)?$/.test(lat)) lat = '0';
    if (!/^-?\d+(\.\d+)?$/.test(lon)) lon = '0';
    if (lat === '0') delCookie('latitude'); if (lon === '0') delCookie('longitude');

    const baseParams = `latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}`;
    const locParam = locationKey ? `&locationKey=weathercn%3A${encodeURIComponent(locationKey)}` : '';
    const sign = 'zUFJoAR2ZVrDy1vF3D07';
    const appKey = 'weather20151024';
    const url = `https://weatherapi.market.xiaomi.com/wtr-v3/weather/all?${baseParams}${locParam}&days=5&appKey=${encodeURIComponent(appKey)}&sign=${encodeURIComponent(sign)}&isGlobal=false&locale=zh_cn`;

    try {
      const res = await fetch(url);
      const j = await res.json();
      const cur = j?.current || {};
      const temp = cur.temperature?.value ?? '--';
      const unit = cur.temperature?.unit ?? '℃';
      const feels = cur.feelsLike?.value ?? '--';
      const code = String(cur.weather ?? '');
      const desc = statusMap[code] || '未知';
      const pub = cur.pubTime || j?.pubTime || '';

      if (bwDesc) { bwDesc.textContent = desc; bwDesc.classList.add('force-inherit'); }
      if (bwTemp) { bwTemp.textContent = `${temp}${unit}`; bwTemp.classList.add('force-inherit'); }
      if (bwFeels) { bwFeels.textContent = `体感 ${feels}${cur.feelsLike?.unit ?? unit}`; bwFeels.classList.add('force-inherit'); }
      if (bwUpdate) { bwUpdate.textContent = `更新时间 ${pub ? pub.replace('T',' ').replace(/\+.*$/,'') : '--'}`; bwUpdate.classList.add('force-inherit'); }

      if (bannerWeatherEl) {
        Array.from(bannerWeatherEl.classList).forEach(cl => { if (cl.startsWith('weather-')) bannerWeatherEl.classList.remove(cl); });
        bannerWeatherEl.classList.add(mapCodeToClass(code));
      }
    } catch (e) {
      if (bwDesc) bwDesc.textContent = '天气加载失败';
      if (bwTemp) bwTemp.textContent = '-- ℃';
      if (bwFeels) bwFeels.textContent = '体感 -- ℃';
      if (bwUpdate) bwUpdate.textContent = '';
      if (bannerWeatherEl) {
        Array.from(bannerWeatherEl.classList).forEach(cl => { if (cl.startsWith('weather-')) bannerWeatherEl.classList.remove(cl); });
        bannerWeatherEl.classList.add('weather-unknown');
      }
    }

    if (timer) clearTimeout(timer);
    timer = setTimeout(fetchAndRenderWeather, 10 * 60 * 1000);
  }

  // 新增：城市搜索（兼容多种返回结构），返回标准化数组
  async function searchCities(name) {
    try {
      const url = name
        ? `https://weatherapi.market.xiaomi.com/wtr-v3/location/city/search?name=${encodeURIComponent(name)}&locale=zh_cn`
        : `https://weatherapi.market.xiaomi.com/wtr-v3/location/city/hots?locale=zh_cn`;
      const res = await fetch(url);
      const j = await res.json();

      const list = Array.isArray(j) ? j : (Array.isArray(j?.data) ? j.data : []);
      const cities = (list || []).map(ci => {
        const locKey = ci.LocationKey || ci.locationKey || ci.key || '';
        const nameVal = ci.Name || ci.name || ci.name || '';
        const aff = ci.Affiliation || ci.affiliation || '';
        let cityId = '';
        if (locKey) {
          const parts = String(locKey).split(':');
          cityId = parts.length > 1 ? parts[1] : parts[0];
        } else if (ci.city_num) {
          cityId = String(ci.city_num);
        }
        const latitude = (ci.latitude || ci.lat || ci.Latitude || '').toString();
        const longitude = (ci.longitude || ci.lon || ci.Longitude || '').toString();
        return {
          label: aff ? `${nameVal} (${aff})` : nameVal || locKey,
          cityId,
          latitude,
          longitude
        };
      }).filter(x => x.cityId);
      return cities;
    } catch (e) {
      return [];
    }
  }

  // 新增：将搜索结果渲染到页面并处理选择（卡片式样式）
  async function bindCitySearchUI() {
    const btn = document.getElementById('city-search-btn');
    const input = document.getElementById('city-search');
    const results = document.getElementById('city-results');
    if (!btn || !input || !results) return;

    function showLoading() {
      results.innerHTML = '<div class="city-loading">搜索中...</div>';
    }
    function showNoResults() {
      results.innerHTML = '<div class="text-sm text-gray-500">未找到城市</div>';
    }

    async function doSearch() {
      const q = input.value.trim();
      // 若为空则获取热门城市（hots）
      // 当 q === '' 时，searchCities('') 会请求 hots 接口
      // 不再提示“请输入城市名”
      // 仍保留输入时的搜索行为
      // show loading
      showLoading();
      const found = await searchCities(q);
      results.innerHTML = '';
      if (!found.length) { showNoResults(); return; }

      const wrap = document.createElement('div');
      wrap.className = 'city-list grid gap-2';
      found.forEach(c => {
        const card = document.createElement('div');
        card.className = 'city-card flex items-center justify-between p-2 border rounded-lg';
        // left: info
        const info = document.createElement('div');
        info.className = 'city-info';
        const title = document.createElement('div');
        title.className = 'city-card-title font-medium';
        title.textContent = c.label;
        const meta = document.createElement('div');
        meta.className = 'city-card-meta text-xs text-gray-500 mt-1';
        const parts = [];
        if (c.cityId) parts.push(`ID: ${c.cityId}`);
        if (c.latitude) parts.push(`lat: ${c.latitude}`);
        if (c.longitude) parts.push(`lon: ${c.longitude}`);
        meta.textContent = parts.join(' · ');
        info.appendChild(title);
        info.appendChild(meta);

        // right: select button
        const actionWrap = document.createElement('div');
        actionWrap.className = 'city-action flex flex-col items-end gap-1';
        const selBtn = document.createElement('button');
        selBtn.className = 'city-select-btn px-3 py-1 bg-indigo-600 text-white rounded text-sm';
        selBtn.textContent = '选择';
        selBtn.addEventListener('click', () => {
          // 保存 locationKey 与可能的经纬度（仅保存合法数字）
          setCookie('locationKey', c.cityId);
          const validNum = v => typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v.trim());
          if (validNum(c.latitude)) {
            setCookie('latitude', c.latitude.trim());
            const latInput = document.getElementById('lat-input'); if (latInput) latInput.value = c.latitude.trim();
          } else {
            delCookie('latitude'); const latInput = document.getElementById('lat-input'); if (latInput) latInput.value = '';
          }
          if (validNum(c.longitude)) {
            setCookie('longitude', c.longitude.trim());
            const lonInput = document.getElementById('lon-input'); if (lonInput) lonInput.value = c.longitude.trim();
          } else {
            delCookie('longitude'); const lonInput = document.getElementById('lon-input'); if (lonInput) lonInput.value = '';
          }
          results.innerHTML = `<div class="text-sm text-green-600">已选择 ${c.label}</div>`;
          // 立即刷新天气
          fetchAndRenderWeather(true);
        });

        // optional quick-open icon
        const openBtn = document.createElement('button');
        openBtn.className = 'city-open-btn text-xs text-gray-500 hover:text-gray-800';
        openBtn.title = '在新标签页打开城市详情（若有）';
        openBtn.textContent = '↗';
        openBtn.addEventListener('click', () => {
          // 尝试打开一个搜索结果页面（以 city 名称搜索）
          const url = `https://www.google.com/search?q=${encodeURIComponent(c.label)}`;
          window.open(url, '_blank');
        });

        actionWrap.appendChild(selBtn);
        actionWrap.appendChild(openBtn);

        card.appendChild(info);
        card.appendChild(actionWrap);

        wrap.appendChild(card);
      });
      results.appendChild(wrap);
    }

    btn.addEventListener('click', doSearch);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); doSearch(); } });

    // 初次绑定时，默认展示热门城市
    doSearch();
  }

  // 在 init 时绑定 city search UI（调用于 window.Weather.init）
  window.Weather = {
    init: function(){ loadStatusCodes().then(() => { fetchAndRenderWeather(); bindCitySearchUI(); }); },
    refresh: fetchAndRenderWeather,
    searchCities // 暴露以便调试
  };
})();
