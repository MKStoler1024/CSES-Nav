(function () {
  // 等 DOM ready
  function ready(fn){ if (document.readyState!='loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }

  ready(function(){
    try { window.UI && window.UI.init(); } catch(e){ console.error(e); }
    try { window.Weather && window.Weather.init(); } catch(e){ console.error(e); }
    try { window.Nav && window.Nav.init(); } catch(e){ console.error(e); }
    // 暴露快捷方法
    window.__dashboard = window.__dashboard || {};
    window.__dashboard.refreshWeather = () => window.Weather && window.Weather.refresh && window.Weather.refresh();
  });
})();
