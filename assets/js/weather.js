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
    const url = `https://all.hlmirror.com/https://weatherapi.market.xiaomi.com/wtr-v3/weather/all?${baseParams}${locParam}&days=5&appKey=${encodeURIComponent(appKey)}&sign=${encodeURIComponent(sign)}&isGlobal=false&locale=zh_cn`;

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
        ? `https://all.hlmirror.com/https://weatherapi.market.xiaomi.com/wtr-v3/location/city/search?name=${encodeURIComponent(name)}&locale=zh_cn`
        : `https://all.hlmirror.com/https://weatherapi.market.xiaomi.com/wtr-v3/location/city/hots?locale=zh_cn`;
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

  // 新增：将搜索结果渲染到页面并处理选择
  async function bindCitySearchUI() {
    const btn = document.getElementById('city-search-btn');
    const input = document.getElementById('city-search');
    const results = document.getElementById('city-results');
    if (!btn || !input || !results) return;

    async function doSearch() {
      const q = input.value.trim();
      results.innerHTML = '搜索中...';
      const found = await searchCities(q);
      results.innerHTML = '';
      if (!found.length) { results.textContent = '未找到城市'; return; }
      found.forEach(c => {
        const row = document.createElement('div');
        row.className = 'py-1';
        const btnEl = document.createElement('button');
        btnEl.className = 'block w-full text-left px-2 py-1 hover:bg-gray-100';
        btnEl.textContent = c.label;
        btnEl.addEventListener('click', () => {
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
          results.innerHTML = `已选择 ${c.label}`;
          // 立即刷新天气
          fetchAndRenderWeather(true);
        });
        row.appendChild(btnEl);
        results.appendChild(row);
      });
    }

    btn.addEventListener('click', doSearch);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch(); });
  }

  // 在 init 时绑定 city search UI（调用于 window.Weather.init）
  window.Weather = {
    init: function(){ loadStatusCodes().then(() => { fetchAndRenderWeather(); bindCitySearchUI(); }); },
    refresh: fetchAndRenderWeather,
    searchCities // 暴露以便调试
  };
})();
