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

  const settingsBtn = document.getElementById('settings-btn');
  const settingsModal = document.getElementById('settings-modal');
  const settingsDialog = settingsModal ? settingsModal.querySelector('div') : null;
  const closeSettingsBtn = document.getElementById('close-settings');
  const saveSettings = document.getElementById('save-settings');

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
    setCookie('hitokotoSource', document.getElementById('hitokoto-source')?.value || '');
    // countdown color
    if (countdownColorInput && countdownColorInput.value) applyCountdownColor(countdownColorInput.value);
    // banner url saved by its button; but persist current value
    if (bannerUrlInput && bannerUrlInput.value) setCookie('bannerUrl', bannerUrlInput.value);
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
  });

  // attach events
  settingsBtn?.addEventListener('click', openSettings);
  closeSettingsBtn?.addEventListener('click', closeSettingsModal);
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
    }
  };

  function initFromCookies() {
    // restore banner url
    const b = getCookie('bannerUrl');
    if (b && bannerImg) bannerImg.src = b;
    // restore countdown visibility & name/date
    if (showCountdown) {
      const sc = getCookie('showCountdown');
      showCountdown.checked = (sc !== 'false');
    }
    if (countdownName) countdownName.value = getCookie('countdownName') || '';
    if (countdownDate) countdownDate.value = getCookie('countdownDate') || '';
  }

})();
