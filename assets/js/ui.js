(function () {
  function setCookie(name, value, days = 365) {
    const d = new Date(); d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${encodeURIComponent(value)};path=/;expires=${d.toUTCString()}`;
  }
  function getCookie(name) {
    const m = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
    return m ? decodeURIComponent(m[2]) : '';
  }
  function delCookie(name) { document.cookie = name + '=; Max-Age=0; path=/'; }

  const greetingEl = document.getElementById('greeting');
  const hitokotoEl = document.getElementById('daily-hitokoto');
  const bannerImg = document.getElementById('banner-img');
  const bannerUrlInput = document.getElementById('banner-url');
  const saveBannerBtn = document.getElementById('save-banner');

  const showCountdown = document.getElementById('show-countdown');
  const countdownName = document.getElementById('countdown-name');
  const countdownDate = document.getElementById('countdown-date');
  const countdownColorInput = document.getElementById('countdown-color');
  const countdownLabel = document.getElementById('countdown-label');
  const countdownDays = document.getElementById('countdown-days');

  // 新增：搜索引擎与一言来源、经纬度控件
  const searchEngineSelect = document.getElementById('search-engine');
  const defaultSearchSelect = document.getElementById('default-search-engine');
  const hitokotoSourceSelect = document.getElementById('hitokoto-source');
  const latInputElem = document.getElementById('lat-input');
  const lonInputElem = document.getElementById('lon-input');

  const settingsBtn = document.getElementById('settings-btn');
  const settingsModal = document.getElementById('settings-modal');
  const settingsDialog = settingsModal ? settingsModal.querySelector('div') : null;
  const closeSettingsBtn = document.getElementById('close-settings');
  const saveSettings = document.getElementById('save-settings');
  // 新增：底部取消、重置 banner 与预览引用
  const closeSettingsBottom = document.getElementById('close-settings-bottom');
  const resetBannerBtn = document.getElementById('reset-banner');
  const bannerPreview = document.getElementById('banner-preview');

  // 内置每日语句（高考 / 鼓励用语）
  const dailyQuotes = [
    "恭祝，恭祝，此战青云平步！",
    "十年磨一剑，今朝试锋芒！",
    "乘风破浪，金榜题名！",
    "笔下生花，梦想开花！",
    "全力以赴，不负韶华！",
    "沉着冷静，发挥最佳！",
    "志存高远，脚踏实地！",
    "信心满满，前程似锦！"
  ];

  function applyCountdownColor(color) {
    if (!color) color = getCookie('countdownColor') || getComputedStyle(document.documentElement).getPropertyValue('--countdown-color').trim() || '#0f172a';
    document.documentElement.style.setProperty('--countdown-color', color);
    if (countdownColorInput) countdownColorInput.value = color;
    setCookie('countdownColor', color);
  }

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

  async function loadHitokoto() {
    const src = getCookie('hitokotoSource') || (document.getElementById('hitokoto-source')?.value) || 'hitokoto';
    if (src === 'gaokao') {
      hitokotoEl.textContent = dailyQuotes[Math.floor(Math.random() * dailyQuotes.length)];
      return;
    }
    try {
      const r = await fetch('https://v1.hitokoto.cn/?encode=json');
      const j = await r.json();
      hitokotoEl.textContent = j.hitokoto || '今日语句加载失败';
    } catch {
      hitokotoEl.textContent = '今日语句加载失败';
    }
  }

  function updateCountdown() {
    const val = countdownDate?.value || getCookie('countdownDate') || '';
    const name = countdownName?.value || getCookie('countdownName') || '';
    if (!countdownLabel || !countdownDays) return;
    if (!val) {
      countdownLabel.textContent = name ? `距 ${name} 还有` : '距 XX 还有';
      countdownDays.textContent = '-- 天';
      return;
    }
    const target = new Date(val + 'T00:00:00');
    const diff = Math.ceil((target - new Date()) / (1000 * 60 * 60 * 24));
    countdownLabel.textContent = name ? `距 ${name} 还有` : `距 ${val} 还有`;
    countdownDays.textContent = `${diff} 天`;
  }

  // modal control
  function openSettings() {
    if (!settingsModal) return;
    // fill UI
    showCountdown && (showCountdown.checked = (getCookie('showCountdown') !== 'false'));
    countdownName && (countdownName.value = getCookie('countdownName') || '');
    countdownDate && (countdownDate.value = getCookie('countdownDate') || '');
    countdownColorInput && (countdownColorInput.value = getCookie('countdownColor') || '#0f172a');
    bannerUrlInput && (bannerUrlInput.value = getCookie('bannerUrl') || bannerUrlInput.value || './img/banner.png');
    // 回填默认搜索引擎与一言来源（修复：使用 hitokotoSourceSelect）
    if (defaultSearchSelect) {
      const dv = getCookie('defaultSearchEngine') || defaultSearchSelect.value;
      for (let i = 0; i < defaultSearchSelect.options.length; i++) {
        if (defaultSearchSelect.options[i].value === dv) defaultSearchSelect.selectedIndex = i;
      }
    }
    if (hitokotoSourceSelect) {
      const hv = getCookie('hitokotoSource') || hitokotoSourceSelect.value;
      for (let i = 0; i < hitokotoSourceSelect.options.length; i++) {
        if (hitokotoSourceSelect.options[i].value === hv) hitokotoSourceSelect.selectedIndex = i;
      }
    }
    // 回填经纬度输入框
    if (latInputElem) latInputElem.value = getCookie('latitude') || latInputElem.value || '';
    if (lonInputElem) lonInputElem.value = getCookie('longitude') || lonInputElem.value || '';

    loadHitokoto();
    settingsModal.classList.remove('hidden'); void settingsModal.offsetWidth;
    settingsModal.classList.add('show');
    document.addEventListener('keydown', escHandler);
  }
  function closeSettingsModal() {
    if (!settingsModal) return;
    settingsModal.classList.remove('show');
    setTimeout(()=>settingsModal.classList.add('hidden'), 260);
    document.removeEventListener('keydown', escHandler);
  }
  function escHandler(e){ if (e.key === 'Escape') closeSettingsModal(); }

  // save settings
  function saveAllSettings() {
    setCookie('showCountdown', showCountdown?.checked ? 'true' : 'false');
    setCookie('countdownName', countdownName?.value || '');
    setCookie('countdownDate', countdownDate?.value || '');
    // 保存一言来源与默认搜索引擎
    if (hitokotoSourceSelect) setCookie('hitokotoSource', hitokotoSourceSelect.value || '');
    if (defaultSearchSelect) setCookie('defaultSearchEngine', defaultSearchSelect.value || '');
    // countdown color
    if (countdownColorInput && countdownColorInput.value) applyCountdownColor(countdownColorInput.value);
    // banner url saved by its button; but persist current value
    if (bannerUrlInput && bannerUrlInput.value) setCookie('bannerUrl', bannerUrlInput.value);
    // 保存经纬度（若输入了合法数字）
    const numRe = /^-?\d+(\.\d+)?$/;
    if (latInputElem && latInputElem.value.trim() && numRe.test(latInputElem.value.trim())) setCookie('latitude', latInputElem.value.trim());
    else delCookie('latitude');
    if (lonInputElem && lonInputElem.value.trim() && numRe.test(lonInputElem.value.trim())) setCookie('longitude', lonInputElem.value.trim());
    else delCookie('longitude');
    // 立即将默认搜索引擎应用到主搜索框
    if (defaultSearchSelect && searchEngineSelect) {
      for (let i = 0; i < searchEngineSelect.options.length; i++) {
        if (searchEngineSelect.options[i].value === defaultSearchSelect.value) searchEngineSelect.selectedIndex = i;
      }
    }

    // apply visibility
    if (showCountdown && countdownLabel && countdownDays) {
      if (showCountdown.checked) { countdownLabel.style.display = ''; countdownDays.style.display = ''; }
      else { countdownLabel.style.display = 'none'; countdownDays.style.display = 'none'; }
    }
    loadHitokoto();
    closeSettingsModal();
  }

  // banner save
  saveBannerBtn?.addEventListener('click', () => {
    const url = (bannerUrlInput?.value || './img/banner.png').trim();
    setCookie('bannerUrl', url);
    if (bannerImg) bannerImg.src = url;
    if (bannerPreview) bannerPreview.src = url || './img/banner.png';
  });

  // 实时预览 banner URL（输入时预览，不保存）
  bannerUrlInput?.addEventListener('input', () => {
    const v = (bannerUrlInput.value || '').trim() || './img/banner.png';
    if (bannerPreview) bannerPreview.src = v;
  });
  
  // 恢复默认 banner（预览并立即写 cookie + 主 banner）
  resetBannerBtn?.addEventListener('click', () => {
    const def = './img/banner.png';
    bannerUrlInput.value = def;
    if (bannerPreview) bannerPreview.src = def;
    setCookie('bannerUrl', def);
    if (bannerImg) bannerImg.src = def;
  });

  // 新增：搜索区域交互绑定（回车、按钮、清除）
  function bindSearchUI() {
    const form = document.getElementById('search-form');
    const input = document.getElementById('search-input');
    const btn = document.getElementById('search-btn');
    const clear = document.getElementById('search-clear');
    const engine = document.getElementById('search-engine');

    function isLikelyUrl(s) {
      if (!s) return false;
      s = s.trim();
      // 已有协议
      if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(s)) return true;
      // 简单域名判断：包含点且无空白字符（排除一般搜索词）
      if (/\s/.test(s)) return false;
      // 要求至少有一个点且不是纯数字点组合
      if (/\./.test(s) && !/^[\d.]+$/.test(s)) return true;
      return false;
    }

    function doSearch() {
      if (!input) return;
      const q = input.value.trim();
      if (!q) return;
      // 若识别为 URL，则直接跳转（无协议自动补 https://）
      if (isLikelyUrl(q)) {
        let url = q;
        if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(url)) {
          url = 'https://' + url;
        }
        window.open(url, '_blank');
        return;
      }
      if (!engine) return;
      const url = engine.value + encodeURIComponent(q);
      window.open(url, '_blank');
    }

    form?.addEventListener('submit', (e) => { e.preventDefault(); doSearch(); });
    btn?.addEventListener('click', (e) => { e.preventDefault(); doSearch(); });
    input?.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); doSearch(); } });
    input?.addEventListener('input', () => {
      if (!clear) return;
      if (input.value.trim()) clear.classList.remove('hidden'); else clear.classList.add('hidden');
    });
    clear?.addEventListener('click', () => { if (!input) return; input.value = ''; clear.classList.add('hidden'); input.focus(); });
  }

  // attach events
  settingsBtn?.addEventListener('click', openSettings);
  closeSettingsBtn?.addEventListener('click', closeSettingsModal);
  closeSettingsBottom?.addEventListener('click', closeSettingsModal); // 底部取消按钮关闭
  saveSettings?.addEventListener('click', saveAllSettings);
  if (settingsModal && settingsDialog) {
    settingsModal.addEventListener('click', (e)=> { if (e.target === settingsModal) closeSettingsModal(); });
    settingsDialog.addEventListener('click', e => e.stopPropagation());
  }

  // public init
  window.UI = {
    init: function() {
      initFromCookies();
      updateClock(); setInterval(updateClock, 1000);
      updateCountdown(); setInterval(updateCountdown, 1000);
      loadHitokoto();
      applyCountdownColor(getCookie('countdownColor') || '#0f172a');
      // 新增：绑定搜索交互
      bindSearchUI();
      // 应用默认搜索引擎到页面主搜索框（若有保存）
      const dv = getCookie('defaultSearchEngine');
      if (dv && searchEngineSelect) {
        for (let i = 0; i < searchEngineSelect.options.length; i++) {
          if (searchEngineSelect.options[i].value === dv) searchEngineSelect.selectedIndex = i;
        }
      }
    }
  };

  function initFromCookies() {
    // restore banner url
    const b = getCookie('bannerUrl');
    if (b && bannerImg) bannerImg.src = b;
    if (b && bannerPreview) bannerPreview.src = b;
    // restore countdown visibility & name/date
    if (showCountdown) {
      const sc = getCookie('showCountdown');
      showCountdown.checked = (sc !== 'false');
    }
    if (countdownName) countdownName.value = getCookie('countdownName') || '';
    if (countdownDate) countdownDate.value = getCookie('countdownDate') || '';
    // restore default search engine & hitokotoSource & lat/lon to inputs (修复：使用 hitokotoSourceSelect)
    const dv = getCookie('defaultSearchEngine');
    if (dv && searchEngineSelect && defaultSearchSelect) {
      for (let i = 0; i < searchEngineSelect.options.length; i++) {
        if (searchEngineSelect.options[i].value === dv) searchEngineSelect.selectedIndex = i;
      }
      for (let i = 0; i < defaultSearchSelect.options.length; i++) {
        if (defaultSearchSelect.options[i].value === dv) defaultSearchSelect.selectedIndex = i;
      }
    }
    const hv = getCookie('hitokotoSource');
    if (hv && hitokotoSourceSelect) {
      for (let i = 0; i < hitokotoSourceSelect.options.length; i++) {
        if (hitokotoSourceSelect.options[i].value === hv) hitokotoSourceSelect.selectedIndex = i;
      }
    }
    if (latInputElem && getCookie('latitude')) latInputElem.value = getCookie('latitude');
    if (lonInputElem && getCookie('longitude')) lonInputElem.value = getCookie('longitude');
  }

})();
