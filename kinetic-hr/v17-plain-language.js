/* Presentation only: plain-language explanations of existing, unchanged measurements. */
window.KHPlain = (() => {
  const L = (ar, en) => document.documentElement.lang === 'ar' ? ar : en;
  const n = value => Number.isFinite(value) ? new Intl.NumberFormat('en-US', {maximumFractionDigits: 2}).format(value) : '—';
  const capacity = value => L(value === 1 ? 'وظيفة واحدة بدوام كامل' : value === 2 ? 'وظيفتين بدوام كامل' : `${n(value)} ${Number.isInteger(value) && value >= 3 && value <= 10 ? 'وظائف' : 'وظيفة'} بدوام كامل`, `${n(value)} full-time role${value === 1 ? '' : 's'}`);
  const unit = () => L('بدوام كامل', 'full-time equivalent');
  const unitHelp = () => L('الأرقام تقيس حجم العمل: 1 بدوام كامل يعادل عمل موظف بدوام كامل، أو موظفين بنصف دوام. لا تعني بالضرورة عدد الأشخاص المطلوب توظيفهم.', 'These numbers measure workload: 1 full-time equivalent can be one full-time employee or two half-time employees. It is not necessarily the number of people to hire.');
  function trend(sv) {
    if (!sv?.dataSufficient) return L('سجل الأحداث غير مكتمل؛ لا يمكن تحديد ما إذا كان النقص يتزايد بسرعة أكبر.', 'The event history is incomplete, so we cannot tell whether new shortages are appearing faster.');
    if (sv.currentNewGapFte === 0) return L('لم يظهر نقص جديد خلال آخر 30 يومًا. النقص القائم ما زال يحتاج معالجة.', 'No new shortfall appeared in the last 30 days. Any existing shortfall still needs attention.');
    const first = L(`خلال آخر 30 يومًا، ظهر نقص جديد يعادل ${capacity(sv.currentNewGapFte)}.`, `Over the last 30 days, a new shortfall equivalent to ${capacity(sv.currentNewGapFte)} appeared.`);
    const comparison = sv.baselineRate === 0
      ? L('لم يُسجل نقص جديد في فترة المقارنة السابقة.', 'No new shortfall was recorded in the previous comparison period.')
      : Math.abs(sv.currentRate - sv.baselineRate) < 1e-9
        ? L('وتيرة ظهور النقص مماثلة للفترة السابقة.', 'New shortages are appearing at the same rate as in the previous period.')
        : sv.currentRate > sv.baselineRate
          ? L('النقص الجديد يظهر بوتيرة أسرع من الفترة السابقة.', 'New shortages are appearing faster than in the previous period.')
          : L('النقص الجديد يظهر بوتيرة أبطأ من الفترة السابقة.', 'New shortages are appearing more slowly than in the previous period.');
    return `${first} ${comparison}`;
  }
  function funding(f) {
    if (!f?.known) return L('حالة التمويل غير معروفة؛ راجعها مع المالية قبل اختيار الحل.', 'Funding is unknown; check with Finance before choosing an action.');
    return L(`من هذا النقص: ${n(f.fundedGap)} بتمويل متاح، و${n(f.unfundedGap)} تحتاج اعتماد تمويل. التنفيذ بعد استكمال الموافقات.`, `Of this shortfall, ${n(f.fundedGap)} has funding allocated and ${n(f.unfundedGap)} needs funding approval. Execution still requires the necessary approvals.`);
  }
  function summary(r, f, p) {
    if (!r) return L('لا يوجد نقص حالي في القطاع المحدد.', 'There is no current shortfall in the selected sector.');
    const location = sectorCfg(r.sector).locations.find(x => x.id === r.location)?.[document.documentElement.lang] || r.location;
    return [L(`${occupationLabel(r.ssco)} في ${location}: يوجد نقص يعادل ${capacity(deficit(r))}.`, `${occupationLabel(r.ssco)} in ${location}: the shortfall is equivalent to ${capacity(deficit(r))}.`), funding(f), trend(surveillanceFor(r)), p?.known ? L(`ضغط العمل على الفريق ${p.band === 'high' ? 'مرتفع' : p.band === 'medium' ? 'متوسط' : 'منخفض'}.`, `Team workload pressure is ${p.band}.`) : L('بيانات ضغط العمل غير متاحة.', 'Workload pressure data are unavailable.')].join(' ');
  }
  function newShortfall() {
    const all = currentRows(), ready = all.map(surveillanceFor).filter(s => s?.dataSufficient);
    return {value: ready.length ? ready.reduce((sum, s) => sum + s.currentNewGapFte, 0) : null, complete: ready.length === all.length, ready: ready.length, total: all.length};
  }
  const detailsLabel = () => L('تفاصيل الأرقام وطريقة الحساب', 'Numbers and calculation details');
  function detail(r, f, p) {
    const sv = surveillanceFor(r), dp = decisionPriority(r);
    const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const rows = [
      [L('رمز المهنة في التصنيف السعودي (SSCO)', 'Saudi occupation code (SSCO)'), r.ssco],
      [L('درجة أولوية المراجعة من 100 — ليست نسبة خطر', 'Review priority out of 100 — not a risk probability'), dp.score ?? '—'],
      [L('ضغط العمل من 100 — مؤشر تشغيلي وليس تشخيصًا طبيًا', 'Workload pressure out of 100 — an operational indicator, not a medical diagnosis'), p?.known ? p.score : '—'],
      [L('طريقة ترتيب الأولويات', 'Priority calculation method'), 'KH-PRIORITY-v0.8'],
      [L('تمويل متاح / يحتاج اعتماد تمويل (بدوام كامل)', 'Funding allocated / funding approval needed (full-time equivalent)'), f?.known ? `${n(f.fundedGap)} / ${n(f.unfundedGap)}` : '—'],
      [L('معدل ظهور نقص جديد لكل 100 دوام كامل خلال شهر', 'New shortfall rate per 100 full-time equivalents over a month'), sv?.dataSufficient ? n(sv.currentRate) : '—'],
      [L('المعدل السابق للمقارنة، بنفس الوحدة', 'Previous comparison rate, in the same unit'), sv?.dataSufficient ? n(sv.baselineRate) : '—'],
      [L('نسبة المعدل الحالي إلى السابق', 'Current rate divided by previous rate'), sv?.dataSufficient && Number.isFinite(sv.ratio) ? n(sv.ratio) + '×' : '—'],
      [L('قواعد التنبيه المستخدمة', 'Alert rules used'), 'KH-SURV-v0.9']
    ];
    return `<details class="kh-number-details"><summary>${detailsLabel()}</summary><p>${unitHelp()}</p><dl>${rows.map(([label, value]) => `<div><dt>${escape(label)}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl><p>${L('النقص الجديد هو ما ظهر خلال الفترة؛ وقد تحدث تغطية في الوقت نفسه. لذلك لا يساوي بالضرورة تغير إجمالي النقص. تتم مقارنة المعدلات بعد مراعاة حجم العمل المطلوب.', 'New shortfall is the amount that appeared during the period; coverage may also have improved. It is not necessarily the change in the total shortfall. Rate comparisons account for the amount of work required.')}</p></details>`;
  }
  return {n, capacity, unit, unitHelp, trend, funding, summary, newShortfall, detail, detailsLabel};
})();
