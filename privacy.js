/* The preference applies to this browser; no network request is needed. */
(() => {
  'use strict';
  if (!document.querySelector('[data-analytics-privacy]')) return;
  const ar = document.documentElement.lang === 'ar';
  const status = document.getElementById('privacy-status');
  const disable = document.getElementById('privacy-disable');
  const enable = document.getElementById('privacy-enable');
  const key = 'adeeb_analytics_optout';
  const say = (en, arabic) => ar ? arabic : en;
  const signal = () => navigator.globalPrivacyControl === true || ['1', 'yes'].includes(String(navigator.doNotTrack || window.doNotTrack || '').toLowerCase());
  function render() {
    try {
      const stopped = localStorage.getItem(key) === '1';
      const browserSignal = signal();
      status.dataset.error = 'false';
      status.textContent = browserSignal
        ? say('Analytics are off because this browser sends a privacy signal. Allowing analytics here will not override that signal.', 'الإحصاءات متوقفة لأن المتصفح يرسل إشارة خصوصية. السماح بها هنا لن يتجاوز هذه الإشارة.')
        : stopped
          ? say('Analytics are off in this browser.', 'الإحصاءات متوقفة في هذا المتصفح.')
          : say('Analytics are allowed in this browser. This preference page itself is not tracked.', 'الإحصاءات مسموحة في هذا المتصفح. لا تُسجّل زيارة صفحة الخيارات هذه نفسها.');
      disable.disabled = stopped;
      enable.disabled = !stopped;
    } catch (_) {
      status.dataset.error = 'true';
      status.textContent = signal()
        ? say('Analytics are off because this browser sends a privacy signal. Browser storage is unavailable, so a separate preference cannot be saved.', 'الإحصاءات متوقفة لأن المتصفح يرسل إشارة خصوصية. تخزين المتصفح غير متاح، لذلك لا يمكن حفظ اختيار إضافي.')
        : say('Browser storage is unavailable, so this preference cannot be saved. Analytics may still use temporary anonymous identifiers. Enable Do Not Track or Global Privacy Control in your browser to stop analytics.', 'تخزين المتصفح غير متاح، لذلك لا يمكن حفظ هذا الاختيار. قد تستمر الإحصاءات بمعرّفات مجهولة مؤقتة. فعّل إشارة عدم التتبع أو التحكم العام في الخصوصية في المتصفح لإيقافها.');
      disable.disabled = true;
      enable.disabled = true;
    }
  }
  function choose(stopped) {
    try {
      if (stopped) localStorage.setItem(key, '1');
      else localStorage.removeItem(key);
      window.dispatchEvent(new Event('portfolio-analytics-preference-change'));
      render();
    } catch (_) {
      status.dataset.error = 'true';
      status.textContent = say('The browser could not save this preference. Enable Do Not Track or Global Privacy Control in your browser to stop analytics, or check its storage settings.', 'تعذّر على المتصفح حفظ هذا الاختيار. فعّل إشارة عدم التتبع أو التحكم العام في الخصوصية لإيقاف الإحصاءات، أو تحقّق من إعدادات التخزين.');
    }
  }
  disable.addEventListener('click', () => choose(true));
  enable.addEventListener('click', () => choose(false));
  window.addEventListener('storage', event => { if (event.key === key || event.key === null) render(); });
  render();
})();
