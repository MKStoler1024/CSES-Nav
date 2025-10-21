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

  window.Weather = {
    init: function(){ loadStatusCodes().then(fetchAndRenderWeather); },
    refresh: fetchAndRenderWeather
  };
})();
