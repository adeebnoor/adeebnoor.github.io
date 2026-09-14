/* Public intake: content is sent only to the private inquiry endpoint, never analytics. */
(() => {
  'use strict';
  const configNode = document.getElementById('site-inquiry-config');
  if (!configNode) return;
  const config = JSON.parse(configNode.textContent);
  const ar = document.documentElement.lang === 'ar';
  const say = (en, arabic) => ar ? arabic : en;
  const forms = [...document.querySelectorAll('[data-inquiry-form]')];
  const query = new URLSearchParams(location.search);
  const presets = { organizations: 'institution', investors: 'company', researchers: 'researcher', students: 'student' };
  function choose(form, name, value) {
    const control = form.elements.namedItem(name);
    if (control && [...control.options].some(option => option.value === value)) control.value = value;
  }
  forms.forEach(form => {
    if (form.dataset.kind === 'inquiry') {
      choose(form, 'audience', query.get('audience') || presets[location.hash.slice(1)] || '');
      choose(form, 'engagement', query.get('engagement') || '');
    }
    let requestId = crypto.randomUUID();
    let busy = false;
    let submittedFields = '';
    const status = form.querySelector('[data-form-status]');
    const button = form.querySelector('[type="submit"]');
    const originalLabel = button.textContent;
    button.disabled = false;
    const message = (text, state) => { status.textContent = text; status.dataset.state = state; };
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (busy || !form.reportValidity()) return;
      const input = Object.fromEntries(new FormData(form));
      if ((input.website || '').trim()) return;
      const signature = JSON.stringify(input);
      if (submittedFields && submittedFields !== signature) requestId = crypto.randomUUID();
      submittedFields = signature;
      const payload = { ...input, kind: form.dataset.kind, language: ar ? 'ar' : 'en', request_id: requestId, consent: input.consent === 'on' };
      busy = true;
      button.disabled = true;
      form.setAttribute('aria-busy', 'true');
      button.textContent = say('Sending…', 'جارٍ الإرسال…');
      message(say('Securely submitting your request…', 'جارٍ إرسال طلبك…'), 'pending');
      try {
        const response = await fetch(config.endpoint, {
          method: 'POST', credentials: 'omit', referrerPolicy: 'no-referrer',
          headers: { 'Content-Type': 'application/json', apikey: config.publicAnonKey, Authorization: 'Bearer ' + config.publicAnonKey },
          body: JSON.stringify(payload), signal: AbortSignal.timeout(20000)
        });
        const result = await response.json();
        if (!response.ok || result.ok !== true) throw new Error(response.status === 429 ? 'rate' : 'failed');
        const text = form.dataset.kind === 'updates'
          ? say('Your request is saved for review. This is not an active subscription; no automated newsletter is sent. Use the RSS feed for immediate updates.', 'حُفظ طلبك للمراجعة. هذا ليس اشتراكًا مفعّلًا، ولا تُرسل نشرة آلية. يمكنك متابعة المقالات فورًا عبر RSS.')
          : say('Your inquiry has been saved in Adeeb’s private inbox. Keep this reference: ', 'حُفظ طلبك في صندوق أديب الخاص. احتفظ بالمرجع: ') + requestId.slice(0, 8);
        message(text, 'success');
        form.reset();
        requestId = crypto.randomUUID();
        submittedFields = '';
        status.focus();
      } catch (error) {
        message(error.message === 'rate'
          ? say('Too many requests. Please try later, or use the email link below.', 'وصل عدد الطلبات إلى الحد المسموح. حاول لاحقًا أو استخدم رابط البريد أدناه.')
          : say('Delivery could not be confirmed. Your entries remain here; retry or use the email link below. A retry will not duplicate a saved request.', 'لم نتمكن من تأكيد التسليم. بياناتك ما زالت هنا؛ أعد المحاولة أو استخدم رابط البريد أدناه. لن تؤدي إعادة المحاولة إلى تكرار طلب محفوظ.'), 'error');
      } finally {
        busy = false;
        button.disabled = false;
        form.removeAttribute('aria-busy');
        button.textContent = originalLabel;
      }
    });
  });
  document.querySelectorAll('[data-intake-audience], [data-intake-engagement]').forEach(link => {
    link.addEventListener('click', () => {
      const form = forms.find(item => item.dataset.kind === 'inquiry');
      if (!form) return;
      if (link.dataset.intakeAudience) choose(form, 'audience', link.dataset.intakeAudience);
      if (link.dataset.intakeEngagement) choose(form, 'engagement', link.dataset.intakeEngagement);
    });
  });
})();
