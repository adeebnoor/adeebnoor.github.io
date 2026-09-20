/* One evidence basis shared by the command centre, scenarios and exported decisions. */
window.KHDecision=(()=>{
 'use strict';
 const L=(a,e)=>document.documentElement.lang==='ar'?a:e;
 function forRow(r){
  const sv=surveillanceFor(r),sufficient=!!sv?.dataSufficient,w=getWindows(r),start=dUTC(r.event_history_start_date),end=dUTC(r.event_history_end_date);
  const first=w.baseline[0].start,last=w.current.end,day=86400000;
  const requiredDays=Math.round((last-first)/day)+1;
  const coveredDays=start&&end?Math.max(0,Math.round((Math.min(+end,+last)-Math.max(+start,+first))/day)+1):null;
  const coverage=coveredDays==null||eventMode==='gated'?null:Math.min(100,Math.round(coveredDays/requiredDays*100));
  let reason='';
  if(!sufficient){
   if(eventMode==='gated')reason=L('لم يُرفع سجل أحداث مرتبط','no linked event log has been imported');
   else if(DATA_QUALITY.events?.quarantined||DATA_QUALITY.snapshot?.quarantined)reason=L('توجد سجلات معزولة تحتاج مراجعة','quarantined records need review');
   else if(!start||!end||+start>+first||+end<+last)reason=L('سجل الأحداث غير مكتمل للفترة المطلوبة','event history does not cover the required period');
   else reason=L('لم تستوفِ الخلية شروط حجم البيانات أو صلاحية المقام','the group does not meet the minimum size or denominator requirements');
  }
  const basis=sufficient?'incidence-supported':'prevalence-only';
  const label=sufficient?L('قرار مدعوم بسجل الأحداث','Decision supported by event history'):L('قرار بناءً على نقص القدرة الحالي','Decision based on current capacity shortfall');
  const status=sufficient?(sv.alert?L('إنذار: معدل نشوء النقص تجاوز عتبة السياسة','Alert: the new-shortfall rate exceeds the policy threshold'):sv.monitor?L('مراقبة: لم يصل إلى عتبة الإنذار','Monitor: below the alert threshold'):L('لا يوجد إنذار تسارع وفق السياسة الحالية','No acceleration alert under the current policy')):L('معدل نشوء النقص غير متاح','New-shortfall rate unavailable')+' — '+reason;
  const source=L('نقص القدرة: لقطة القوى العاملة؛ معدل النشوء: ','Capacity shortfall: workforce snapshot; new-shortfall rate: ')+(sufficient?L('سجل الأحداث','event log'):L('غير مستخدم في القرار','excluded from the decision'));
  return{basis,label,status,reason,sufficient,alert:sufficient&&!!sv.alert,coverage,requiredDays,source};
 }
 function html(r){const e=forRow(r);return `<div class="v19-evidence" data-decision-basis="${e.basis}" data-source="${esc(r.source_row)}"><strong>${esc(e.label)}</strong><span>${esc(e.status)}</span></div>`}
 function fields(r){const e=forRow(r);return[
  [L('أساس القرار','Decision basis'),e.label],
  [L('حالة الرصد','Monitoring status'),e.status],
  [L('مصدر الأرقام','Measurement sources'),e.source],
  [L('تغطية الفترة المطلوبة بسجل الأحداث','Event-history time coverage'),e.coverage==null?L('غير معلومة','Unknown'):`${e.coverage}% — ${L('من فترة مطلوبة قدرها','of a required period of')} ${e.requiredDays} ${L('يومًا','days')}`],
  [L('حدود نسبة التغطية','Coverage limitation'),L('تغطية زمنية معلنة؛ اكتمال كل أحداث المصدر يحتاج تحقق الجهة','Declared time coverage; the entity must verify that all source events are present')]
 ]}
 const policyLabel=()=>L('سياسة الترصد v1','Surveillance policy v1')+' · '+KHPilot.revision();
 return{forRow,html,fields,policyLabel};
})();
