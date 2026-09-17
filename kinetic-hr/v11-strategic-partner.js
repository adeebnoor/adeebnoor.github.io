/* Kinetic HR v1.1 — Strategic Partner Pilot layer */
(()=>{
'use strict';

const VERSION='KH-STRATEGIC-PARTNER-v1.1';
const q=(s,r=document)=>r.querySelector(s);
const qa=(s,r=document)=>[...r.querySelectorAll(s)];
const ar=()=>document.documentElement.dir==='rtl';
const L=(a,e)=>ar()?a:e;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>{if(v==null||String(v).trim()==='')return null;const n=Number(v);return Number.isFinite(n)?n:null};
const fmt=(v,d=0)=>Number.isFinite(Number(v))?new Intl.NumberFormat('en-US',{maximumFractionDigits:d,minimumFractionDigits:0}).format(Number(v)):'—';
const sar=v=>Number.isFinite(Number(v))?new Intl.NumberFormat('en-US',{maximumFractionDigits:0}).format(Number(v))+' '+L('ر.س','SAR'):'—';
const DAY=86400000;

const PRESETS={
  EDU:{hire:140000,transfer:20000,upskill:18000,contract:165000,gapDay:950,approval:{hire:30,transfer:14,upskill:7,contract:14},source:L('مرجع تجريبي توضيحي — التعليم','Illustrative pilot preset — Education')},
  HLT:{hire:220000,transfer:30000,upskill:25000,contract:300000,gapDay:1800,approval:{hire:45,transfer:21,upskill:10,contract:14},source:L('مرجع تجريبي توضيحي — الصحة','Illustrative pilot preset — Health')},
  MUN:{hire:150000,transfer:18000,upskill:20000,contract:180000,gapDay:900,approval:{hire:30,transfer:14,upskill:7,contract:14},source:L('مرجع تجريبي توضيحي — البلديات','Illustrative pilot preset — Municipal')},
  GOV:{hire:170000,transfer:15000,upskill:22000,contract:190000,gapDay:1000,approval:{hire:30,transfer:14,upskill:10,contract:14},source:L('مرجع تجريبي توضيحي — الخدمات الحكومية','Illustrative pilot preset — Government services')}
};

const DEMO_IMPACT={
  'demo-001':{perGap:66.67,unitAr:'طالب',unitEn:'students',labelAr:'طلاب معرضون لزيادة كثافة الفصول أو تغطية تعليمية غير مثالية',labelEn:'students exposed to higher class density or suboptimal teaching coverage',targetAr:'افتراض Pilot تركيبي — ليس مستهدفًا وطنيًا',targetEn:'Synthetic pilot assumption — not a national target'},
  'demo-002':{perGap:55,unitAr:'طالب',unitEn:'students',labelAr:'طلاب معرضون لتغطية تعليمية أقل من الخطة',labelEn:'students exposed to below-plan teaching coverage',targetAr:'افتراض Pilot تركيبي',targetEn:'Synthetic pilot assumption'},
  'demo-003':{perGap:45,unitAr:'طالب',unitEn:'students',labelAr:'طلاب معرضون لمرونة أقل في توزيع الشعب',labelEn:'students exposed to reduced timetable flexibility',targetAr:'افتراض Pilot تركيبي',targetEn:'Synthetic pilot assumption'},
  'demo-004':{perGap:6,unitAr:'ساعة تغطية سريرية/أسبوع',unitEn:'clinical coverage hours/week',labelAr:'ساعات تغطية حرجة معرضة للضغط التشغيلي',labelEn:'critical coverage hours exposed to operating pressure',targetAr:'افتراض Pilot تركيبي — يتطلب معايرة سريرية',targetEn:'Synthetic pilot assumption — clinical calibration required'},
  'demo-005':{perGap:4,unitAr:'ساعة تأخير قدرة/أسبوع',unitEn:'capacity-delay hours/week',labelAr:'ساعات قدرة إجرائية معرضة للتأخير',labelEn:'procedural-capacity hours exposed to delay',targetAr:'افتراض Pilot تركيبي — يتطلب معايرة سريرية',targetEn:'Synthetic pilot assumption — clinical calibration required'},
  'demo-007':{perGap:12,unitAr:'مهمة تفتيش/أسبوع',unitEn:'inspection tasks/week',labelAr:'مهام تفتيش معرضة للتأخير',labelEn:'inspection tasks exposed to delay',targetAr:'افتراض Pilot تركيبي',targetEn:'Synthetic pilot assumption'},
  'demo-008':{perGap:3,unitAr:'حزمة تخطيط/شهر',unitEn:'planning work packages/month',labelAr:'حزم تخطيط معرضة للتأخير',labelEn:'planning work packages exposed to delay',targetAr:'افتراض Pilot تركيبي',targetEn:'Synthetic pilot assumption'},
  'demo-010':{perGap:2,unitAr:'حزمة قرار/شهر',unitEn:'decision work packages/month',labelAr:'حزم تخطيط قوى عاملة معرضة للتأخير',labelEn:'workforce-planning decision packages exposed to delay',targetAr:'افتراض Pilot تركيبي',targetEn:'Synthetic pilot assumption'}
};

const SKILL_MAP=[
  {target:'226301',substitute:'325706',match:.72,days:45,missingAr:'تحليل المخاطر البيئية · المتطلبات التنظيمية البيئية',missingEn:'environmental risk analysis · environmental regulatory requirements',noteAr:'فرضية Pilot فقط؛ يلزم تحقق خبير المهنة والأهلية النظامية',noteEn:'Pilot hypothesis only; SME and regulatory eligibility validation required'},
  {target:'233014',substitute:'233030',match:.78,days:30,missingAr:'عمق محتوى المرحلة الثانوية · تصميم تقييمات متقدمة',missingEn:'secondary-level content depth · advanced assessment design',noteAr:'يتطلب تحقق المؤهل والترخيص/التكليف قبل النقل',noteEn:'Qualification and assignment eligibility must be validated before transfer'},
  {target:'242309',substitute:'242303',match:.68,days:45,missingAr:'نمذجة العرض والطلب · تخطيط السيناريوهات',missingEn:'supply-demand modelling · scenario planning',noteAr:'خريطة مهارات تجريبية غير رسمية',noteEn:'Illustrative, non-official skills map'}
];

if(typeof I18N!=='undefined'){
  const addCause=(k,arLabel,enLabel)=>{I18N.ar.cause[k]=arLabel;I18N.en.cause[k]=enLabel};
  addCause('long_term_absence','غياب طويل','long-term absence');
  addCause('return_from_absence','عودة من غياب','return from absence');
  addCause('internal_promotion','ترقية داخلية','internal promotion');
  addCause('role_transformation','تحول وظيفي','role transformation');
}

const EVENT_LABELS={
  resignation:['استقالة','Resignation'],termination:['إنهاء خدمة','Termination'],retirement:['تقاعد','Retirement'],transfer_out:['نقل خارج','Transfer out'],hire:['توظيف','Hire'],transfer_in:['نقل داخل','Transfer in'],demand_increase:['زيادة طلب','Demand increase'],demand_decrease:['خفض طلب','Demand decrease'],position_created_unfilled:['منصب جديد غير مشغول','Unfilled new position'],position_closed:['إغلاق منصب','Position closed'],long_term_absence:['إجازة/غياب طويل','Long-term absence'],return_from_absence:['عودة من غياب طويل','Return from long absence'],internal_promotion:['ترقية داخلية','Internal promotion'],role_transformation:['تحول وظيفي/فجوة مهارات','Role transformation / skill gap']
};

let compareSlots={A:null,B:null};
let transferOnly=false;
let applyingPreset=false;
let presetRenderGuard=false;

function ensureStrategicContext(){
  if(typeof SNAPSHOTS==='undefined')return;
  if(snapshotMode==='synthetic'){
    SNAPSHOTS.forEach(r=>{
      const x=DEMO_IMPACT[r.source_row];
      if(x){
        if(r.service_impact_per_gap_fte==null)r.service_impact_per_gap_fte=x.perGap;
        if(!r.service_impact_label_ar)r.service_impact_label_ar=x.labelAr;
        if(!r.service_impact_label_en)r.service_impact_label_en=x.labelEn;
        if(!r.service_impact_unit_ar)r.service_impact_unit_ar=x.unitAr;
        if(!r.service_impact_unit_en)r.service_impact_unit_en=x.unitEn;
        if(!r.service_impact_target_ref_ar)r.service_impact_target_ref_ar=x.targetAr;
        if(!r.service_impact_target_ref_en)r.service_impact_target_ref_en=x.targetEn;
      }
    });
  }
}

function serviceImpactFor(r,gap=deficit(r)){
  if(!r)return null;
  const per=num(r.service_impact_per_gap_fte);
  const label=ar()?r.service_impact_label_ar:r.service_impact_label_en;
  const unit=ar()?r.service_impact_unit_ar:r.service_impact_unit_en;
  const target=ar()?r.service_impact_target_ref_ar:r.service_impact_target_ref_en;
  if(per==null||!label||!unit)return null;
  return{value:Math.max(0,Number(gap||0))*per,perGap:per,label,unit,target:target||L('المصدر غير محدد','Source not specified')};
}
function fundingFor(r){
  const need=requiredFte(r),avail=availableFte(r),gap=deficit(r),raw=num(r.funded_fte);
  if(raw==null)return{known:false,fundedGap:null,unfundedGap:null};
  const fundedNeed=Math.max(0,Math.min(need,raw));
  const fundedGap=Math.max(0,fundedNeed-avail);
  return{known:true,fundedGap,unfundedGap:Math.max(0,gap-fundedGap)};
}
function strainFor(r){
  const u=num(r.utilization_rate),o=num(r.overtime_hours_per_fte_month),s=num(r.sick_leave_rate);
  if([u,o,s].filter(Number.isFinite).length<2)return null;
  let total=0,w=0;
  if(Number.isFinite(u)){total+=.5*Math.min(1,Math.max(0,(u-.8)/.2));w+=.5}
  if(Number.isFinite(o)){total+=.3*Math.min(1,Math.max(0,o/25));w+=.3}
  if(Number.isFinite(s)){total+=.2*Math.min(1,Math.max(0,s/.08));w+=.2}
  return Math.round(100*(w?total/w:0));
}
function presetFor(r){return r?PRESETS[r.sector]||null:null}
function transferable(donor){
  if(!donor)return 0;
  const reserve=Math.max(0,requiredFte(donor)*.05);
  return Math.max(0,surplus(donor)-reserve);
}
function transferOptions(r){
  return SNAPSHOTS
    .filter(d=>d.sector===r.sector&&String(d.ssco)===String(r.ssco)&&cellCode(d)!==cellCode(r)&&surplus(d)>0)
    .map(d=>({row:d,transferable:transferable(d),match:(d.level===r.level?1:0)+(d.category===r.category?1:0)}))
    .filter(x=>x.transferable>0)
    .sort((a,b)=>b.match-a.match||b.transferable-a.transferable);
}
function opportunityCost(r,horizon,costPerDay=null){
  if(!r)return null;
  const p=presetFor(r),daily=costPerDay??num(q('#v07-gapday-cost')?.value)??(snapshotMode==='synthetic'?p?.gapDay:null);
  if(daily==null)return null;
  const gapDays=deficit(r)*Math.max(0,Number(horizon||0));
  return{total:gapDays*daily,daily,gapDays,source:snapshotMode==='synthetic'?p?.source:L('مدخل جهة العمل','Entity-entered input')};
}
function actionPlanFor(r,days=30){
  if(!r)return null;
  const gap=deficit(r),p=presetFor(r),fund=fundingFor(r),donor=transferOptions(r)[0],impact=serviceImpactFor(r),opp=opportunityCost(r,days);
  let action,type,units,cost=null;
  if(donor){
    units=Math.min(gap,donor.transferable);
    type='transfer';
    action=L(`اختبر نقلًا داخليًا لـ ${fmt(units,1)} FTE من ${sectorCfg(donor.row.sector).locations.find(x=>x.id===donor.row.location)?.ar||donor.row.location} خلال 30 يومًا.`,`Test an internal transfer of ${fmt(units,1)} FTE from ${sectorCfg(donor.row.sector).locations.find(x=>x.id===donor.row.location)?.en||donor.row.location} within 30 days.`);
    cost=p?units*p.transfer:null;
  }else if(fund.known&&fund.unfundedGap>0){
    units=gap; type='fund_then_hire';
    action=L(`اعتمد تمويل ${fmt(fund.unfundedGap,1)} FTE أولًا، ثم افتح مسار توظيف/تغطية مؤقتة خلال 30 يومًا.`,`Secure funding for ${fmt(fund.unfundedGap,1)} FTE first, then open a hire/temporary-cover path within 30 days.`);
    cost=p?gap*p.hire:null;
  }else{
    units=gap;type='hire';
    action=L(`ابدأ توظيفًا مسرعًا مع تقييم تغطية مؤقتة لـ ${fmt(gap,1)} FTE خلال 30 يومًا.`,`Start accelerated hiring and assess temporary cover for ${fmt(gap,1)} FTE within 30 days.`);
    cost=p?gap*p.hire:null;
  }
  const riskParts=[];
  if(impact)riskParts.push(L(`${fmt(impact.value,0)} ${impact.unit}: ${impact.label}`,`${fmt(impact.value,0)} ${impact.unit}: ${impact.label}`));
  if(opp)riskParts.push(L(`تعرض مالي مرجعي لمدة ${days} يومًا: ${sar(opp.total)}`,`Reference ${days}-day financial exposure: ${sar(opp.total)}`));
  const risk=riskParts.join(' · ')||L('يلزم إدخال بيانات أثر الخدمة/التكلفة لتقدير مخاطر عدم التدخل.','Service-impact/cost inputs are required to quantify inaction risk.');
  return{action,type,units,cost,costSource:p?.source||L('غير متاح','Unavailable'),risk,donor};
}

function selectedRow(){
  return typeof selectedScenarioSource!=='undefined'&&selectedScenarioSource?getRowBySource(selectedScenarioSource):null;
}
function topRows(limit=5){
  return [...currentRows()].filter(r=>deficit(r)>0).sort((a,b)=>(decisionPriority(b).score??-1)-(decisionPriority(a).score??-1)).slice(0,limit);
}
function gapAge(r){return typeof gapAgeDays==='function'?gapAgeDays(r):null}
function accel(r){
  const s=surveillanceFor(r);
  if(!s?.dataSufficient)return null;
  if(s.ratio===null)return 0;
  return s.ratio;
}

function ensureShell(){
  ensureStrategicContext();
  const dashboard=q('#view-dashboard');
  const metrics=q('#executive-metrics');
  if(metrics&&!q('#v11-service-impact')){
    const el=document.createElement('article');el.id='v11-service-impact';el.className='v11-service-impact';metrics.insertAdjacentElement('afterend',el);
  }
  const exec=q('#v07-exec-translation');
  if(exec&&!q('#v11-delivery-strip')){
    const el=document.createElement('article');el.id='v11-delivery-strip';el.className='v11-delivery-strip';exec.insertAdjacentElement('afterend',el);
  }

  const controls=q('.scenario-controls');
  if(controls&&!q('#v11-scenario-stack')){
    const stack=document.createElement('div');stack.id='v11-scenario-stack';stack.className='v11-scenario-stack';
    stack.innerHTML='<div id="v11-ref-preset" class="v11-ref-preset"></div><div id="v11-do-nothing" class="v11-do-nothing"></div><div id="v11-skills" class="v11-skills"></div>';
    controls.appendChild(stack);
  }
  const result=q('.scenario-result');
  if(result&&!q('#v11-rebalance-impact')){
    result.insertAdjacentHTML('beforeend','<div id="v11-rebalance-impact" class="v11-rebalance-impact"></div><div id="v11-compare-panel" class="v11-compare-panel"></div>');
  }

  const data=q('#view-data');
  if(data&&!q('#v11-event-support')){
    data.insertAdjacentHTML('beforeend','<article id="v11-event-support" class="panel v11-data-panel"></article><article id="v11-production-readiness" class="panel v11-data-panel"></article>');
  }
  const occ=q('#view-occupations');
  if(occ&&!q('#v11-skill-map-panel'))occ.insertAdjacentHTML('beforeend','<article id="v11-skill-map-panel" class="panel v11-skill-map-panel"></article>');

  const auditTable=q('#view-audit .table-panel');
  if(auditTable&&!q('#v11-audit-filter')){
    const bar=document.createElement('div');bar.id='v11-audit-filter';bar.className='v11-audit-filter';
    bar.innerHTML=`<input id="v11-audit-search" type="search" placeholder="${L('ابحث في النوع، الخلية، المصدر أو التفاصيل','Search type, cell, source or detail')}"><select id="v11-audit-kind"><option value="">${L('كل أنواع السجل','All record types')}</option></select><span id="v11-audit-count"></span>`;
    auditTable.insertAdjacentElement('beforebegin',bar);
    q('#v11-audit-search').addEventListener('input',applyAuditFilter);
    q('#v11-audit-kind').addEventListener('change',applyAuditFilter);
  }

  const tabs=q('#view-gaps .toolbar-tabs');
  if(tabs&&!q('#v11-transfer-filter')){
    const b=document.createElement('button');b.id='v11-transfer-filter';b.className='v11-transfer-filter';b.type='button';b.textContent=L('قابلة للحل بالنقل','Transfer-solvable');
    tabs.appendChild(b);b.onclick=()=>{transferOnly=!transferOnly;b.classList.toggle('active',transferOnly);applyTransferFilter()};
  }

  const footer=q('.sidebar-footer');
  if(footer&&!q('#v11-sidebar-toggle')){
    const b=document.createElement('button');b.id='v11-sidebar-toggle';b.className='v11-sidebar-toggle';b.type='button';footer.prepend(b);
    b.onclick=()=>{const shell=q('.app-shell');const on=!shell.classList.contains('kh-sidebar-expanded');shell.classList.toggle('kh-sidebar-expanded',on);localStorage.setItem('kinetic_hr_sidebar_names',on?'1':'0');updateSidebarToggle()};
    if(localStorage.getItem('kinetic_hr_sidebar_names')==='1')q('.app-shell')?.classList.add('kh-sidebar-expanded');
    updateSidebarToggle();
  }

  const top=q('.top-actions');
  if(top&&!q('#v11-tour-btn')){
    const b=document.createElement('button');b.id='v11-tour-btn';b.className='utility-btn';b.type='button';b.textContent=L('جولة','Tour');top.insertBefore(b,top.firstChild);b.onclick=()=>openTour(true);
  }

  if(!q('#v11-tour-overlay')){
    document.body.insertAdjacentHTML('beforeend',`<div id="v11-tour-overlay" class="v11-overlay"><div class="v11-modal"><div class="v11-modal-head"><div><span class="panel-kicker">${L('جولة تعريفية','ONBOARDING')}</span><h2>${L('كيف تستخدم Kinetic HR في 3 خطوات','Use Kinetic HR in three steps')}</h2><p>${L('ابدأ من القرار، ثم افحص الدليل، ثم اختبر التدخل قبل الاعتماد.','Start from the decision, inspect the evidence, then test the intervention before approval.')}</p></div><button class="v11-modal-close" data-v11-close="tour">×</button></div><div class="v11-tour-steps"><div class="v11-tour-step"><b>1</b><strong>${L('افهم الأثر','Understand impact')}</strong><small>${L('ابدأ بالفجوة وأثرها على الخدمة، لا بعدد الوظائف فقط.','Start with the gap and service impact, not headcount alone.')}</small></div><div class="v11-tour-step"><b>2</b><strong>${L('راجع الدليل','Review evidence')}</strong><small>${L('افحص التسارع، عمر الفجوة، التمويل، ضغط الفريق وكفاية البيانات.','Review acceleration, gap age, funding, team strain and data sufficiency.')}</small></div><div class="v11-tour-step"><b>3</b><strong>${L('اختبر القرار','Test the decision')}</strong><small>${L('قارن التدخل مع عدم التدخل، ثم احفظ السيناريو الجاهز للقرار.','Compare action with doing nothing, then save a decision-ready scenario.')}</small></div></div><div class="v11-modal-actions"><button id="v11-tour-start" class="primary-btn">${L('ابدأ من طابور القرارات','Start with decision queue')}</button></div></div></div>
    <div id="v11-cards-overlay" class="v11-overlay"><div class="v11-modal"><div class="v11-modal-head"><div><span class="panel-kicker">${L('بطاقات قرار استباقية','PROACTIVE DECISION CARDS')}</span><h2>${L('معاينة قنوات الإنتاج','Production delivery preview')}</h2><p>${L('هذه النسخة لا ترسل رسائل فعلية. في الإنتاج تُربط البطاقات بـ Teams / Slack / Email مع RBAC وسجل موافقات.','This public demo does not send messages. Production connects cards to Teams / Slack / Email with RBAC and approval audit.')}</p></div><button class="v11-modal-close" data-v11-close="cards">×</button></div><div id="v11-cards-content"></div></div></div>`);
    qa('[data-v11-close]').forEach(b=>b.onclick=()=>q('#v11-'+b.dataset.v11Close+'-overlay')?.classList.remove('open'));
    q('#v11-tour-start').onclick=()=>{localStorage.setItem('kinetic_hr_onboarding_v11','1');q('#v11-tour-overlay').classList.remove('open');showView('dashboard');q('.queue-panel')?.scrollIntoView({behavior:'smooth',block:'center'})};
  }
}
function updateSidebarToggle(){
  const b=q('#v11-sidebar-toggle'),on=q('.app-shell')?.classList.contains('kh-sidebar-expanded');if(b)b.textContent=on?L('إخفاء الأسماء','Hide names'):L('إظهار الأسماء','Show names');
}

function renderServiceImpact(){
  const box=q('#v11-service-impact');if(!box)return;
  const r=topRows(1)[0];if(!r){box.innerHTML=`<div class="lead"><strong>${L('لا توجد فجوة نشطة','No active gap')}</strong></div>`;return}
  const imp=serviceImpactFor(r),plan=actionPlanFor(r,30),age=gapAge(r),sv=surveillanceFor(r),ratio=sv?.dataSufficient?sv.ratio:null;
  box.innerHTML=`<div class="lead"><span>${L('مؤشر أثر الخدمة','SERVICE IMPACT KPI')}</span><strong>${imp?esc(imp.label):L('أدخل مؤشر أثر الخدمة لهذه الخلية','Add a service-impact measure for this cell')}</strong><small>${esc(occupationLabel(r.ssco))} · ${esc(sectorCfg(r.sector).locations.find(x=>x.id===r.location)?.[ar()?'ar':'en']||r.location)}</small>${imp?`<em class="v11-source-pill">${esc(imp.target)}</em>`:''}</div><article><span>${L('الأثر الحالي','Current impact')}</span><strong>${imp?`${fmt(imp.value,0)} ${esc(imp.unit)}`:'—'}</strong><small>${L('يتناسب خطيًا مع الفجوة في نموذج الـPilot','Linear to gap in the pilot model')}</small></article><article><span>${L('عمر الفجوة','Gap age')}</span><strong>${age==null?'—':fmt(age)+' '+L('يوم','days')}</strong><small>${L('مدة استمرار العجز الحالي','Current deficit duration')}</small></article><article><span>${L('التسارع','Acceleration')}</span><strong>${ratio==null?'—':Number.isFinite(ratio)?fmt(ratio,2)+'×':'∞'}</strong><small>${sv?.dataSufficient?L('مقارنة بخط الأساس التاريخي','vs historical baseline'):L('بيانات الرصد غير كافية','Insufficient surveillance history')}</small></article>`;
}

function renderDelivery(){
  const box=q('#v11-delivery-strip');if(!box)return;
  box.innerHTML=`<div><strong>${L('بطاقات قرار استباقية جاهزة للتكامل','Proactive Decision Cards are integration-ready')}</strong><p><span class="v11-channel">Teams</span><span class="v11-channel">Slack</span><span class="v11-channel">Email</span> ${L('لا يوجد إرسال فعلي في النسخة العامة؛ تُعرض معاينة الرسالة ومسار القرار فقط.','No live delivery in the public demo; only the message and decision path are previewed.')}</p></div><div class="v11-delivery-actions"><button id="v11-preview-cards">${L('معاينة بطاقات القرار','Preview decision cards')}</button></div>`;
  q('#v11-preview-cards').onclick=openDecisionCards;
}

function patchCriticalCards(){
  qa('#signals-grid .signal-card').forEach(card=>{
    const btn=q('[data-detail]',card),head=q('.signal-head',card);if(!btn||!head)return;
    const r=getRowBySource(btn.dataset.detail);if(!r)return;
    q('.v11-critical-facts',card)?.remove();q('.v11-service-note',card)?.remove();
    const p=decisionPriority(r).score??0;if(p<70&&signalState(r)!=='alert')return;
    const age=gapAge(r),s=surveillanceFor(r),ratio=s?.dataSufficient?s.ratio:null,imp=serviceImpactFor(r);
    const facts=document.createElement('div');facts.className='v11-critical-facts';
    facts.innerHTML=`<div><span>${L('عمر الفجوة','Gap age')}</span><strong>${age==null?'—':fmt(age)+' '+L('يوم','days')}</strong></div><div><span>${L('نسبة التسارع','Acceleration')}</span><strong>${ratio==null?'—':Number.isFinite(ratio)?fmt(ratio,2)+'×':'∞'}</strong></div><div><span>${L('ضغط الفريق','Team strain')}</span><strong>${strainFor(r)??'—'}/100</strong></div>`;
    head.insertAdjacentElement('afterend',facts);
    if(imp){
      const n=document.createElement('div');n.className='v11-service-note';n.innerHTML=`<b>${L('أثر الخدمة','Service impact')}:</b> ${fmt(imp.value,0)} ${esc(imp.unit)} · ${esc(imp.label)}`;facts.insertAdjacentElement('afterend',n);
    }
  });
  qa('#decision-queue .queue-item').forEach(item=>{
    const r=getRowBySource(item.dataset.detail);if(!r)return;
    q('.v11-queue-facts',item)?.remove();
    const age=gapAge(r),ratio=accel(r);
    const s=document.createElement('small');s.className='v11-queue-facts';s.style.cssText='display:block;margin-top:3px;font-size:8px;color:#657d8b';
    s.textContent=L(`عمر الفجوة ${age==null?'—':fmt(age)+' يوم'} · التسارع ${ratio==null?'—':Number.isFinite(ratio)?fmt(ratio,2)+'×':'∞'}`,`Gap age ${age==null?'—':fmt(age)+'d'} · acceleration ${ratio==null?'—':Number.isFinite(ratio)?fmt(ratio,2)+'×':'∞'}`);
    q('div',item)?.appendChild(s);
  });
}

function bindPresetEdits(){
  ['v07-budget','v07-gapday-cost','v07-safety-pct',...['hire','transfer','upskill','contract'].flatMap(k=>['v07-approval-'+k,'v07-cost-'+k])].forEach(id=>{
    const el=q('#'+id);if(!el||el.dataset.v11Bound==='1')return;el.dataset.v11Bound='1';
    el.addEventListener('input',()=>{if(!applyingPreset)el.dataset.userEdited='1'});
  });
}
function applyPreset(){
  const r=selectedRow();if(!r||snapshotMode!=='synthetic')return false;
  bindPresetEdits();const p=presetFor(r);if(!p)return false;
  let changed=false;applyingPreset=true;
  const set=(id,v)=>{
    const el=q('#'+id);if(!el||el.dataset.userEdited==='1')return;
    if(String(el.value).trim()===''){el.value=String(v);changed=true}
  };
  set('v07-budget',Math.max(100000,Math.round(deficit(r)*(p.hire||0)*1.05)));
  set('v07-gapday-cost',p.gapDay);
  ['hire','transfer','upskill','contract'].forEach(k=>{set('v07-approval-'+k,p.approval[k]);set('v07-cost-'+k,p[k])});
  applyingPreset=false;return changed;
}
function renderPresetPanel(){
  const box=q('#v11-ref-preset'),r=selectedRow();if(!box||!r)return;const p=presetFor(r);
  if(!p){box.innerHTML='';return}
  box.innerHTML=`<div class="v11-section-head"><div><span>${L('قيم مرجعية للـPilot','PILOT REFERENCE PRESET')}</span><strong>${L('تعبئة تلقائية قابلة للتعديل','Auto-filled and editable')}</strong><small>${L('قيم توضيحية وليست أسعارًا رسمية. استبدلها ببيانات HR/Finance قبل الإنتاج.','Illustrative values, not official prices. Replace with verified HR/Finance inputs before production.')}</small></div><span class="v11-source-pill" style="background:#eef4f7;color:#607787!important">${esc(p.source)}</span></div><div class="v11-preset-grid"><div><span>${L('تكلفة توظيف/FTE','Hire / FTE')}</span><b>${sar(p.hire)}</b></div><div><span>${L('نقل داخلي/FTE','Transfer / FTE')}</span><b>${sar(p.transfer)}</b></div><div><span>${L('تأهيل/FTE','Upskill / FTE')}</span><b>${sar(p.upskill)}</b></div></div>`;
}
function renderDoNothing(){
  const box=q('#v11-do-nothing'),r=selectedRow();if(!box||!r)return;
  const horizon=Number(q('#scenario-horizon')?.value||180),cost=num(q('#v07-gapday-cost')?.value),opp=opportunityCost(r,horizon,cost),imp=serviceImpactFor(r),vals=scenarioValues(),impact=scenarioImpact(r,vals);
  const avoided=opp&&Number.isFinite(impact.gapDaysAvoided)?impact.gapDaysAvoided*opp.daily:null;
  box.innerHTML=`<div class="v11-section-head"><div><span>${L('سيناريو عدم التدخل','DO NOTHING SCENARIO')}</span><strong>${L('تكلفة الخمول / التعرض المالي المرجعي','Cost of inaction / reference financial exposure')}</strong><small>${opp?esc(opp.source):L('أدخل تكلفة FTE غير المغطى/يوم لاحتسابها','Enter uncovered FTE-day cost to calculate it')}</small></div><button id="v11-zero-actions" class="v11-zero-btn">${L('صفّر التدخلات','Set interventions to zero')}</button></div><div class="v11-do-grid"><div><span>${L('التعرض المالي عند عدم التدخل','Do-nothing exposure')}</span><b class="v11-do-cost">${opp?sar(opp.total):'—'}</b></div><div><span>${L('أثر الخدمة الحالي','Current service impact')}</span><b>${imp?`${fmt(imp.value,0)} ${esc(imp.unit)}`:'—'}</b></div><div><span>${L('تعرض مالي يتجنبه السيناريو','Exposure avoided by action')}</span><b class="v11-net-benefit">${avoided==null?'—':sar(avoided)}</b></div></div>`;
  q('#v11-zero-actions').onclick=()=>{['hire','transfer','upskill','contract'].forEach(k=>{const e=q('#'+k+'-range');if(e){e.value='0';e.dispatchEvent(new Event('input',{bubbles:true}))}})};
}
function renderSkills(){
  const box=q('#v11-skills'),r=selectedRow();if(!box||!r)return;
  const opts=SKILL_MAP.filter(x=>x.target===String(r.ssco));
  const transformEvents=eventsForCell(r).filter(e=>e.event_type==='role_transformation'&&num(e.skill_gap_fte)>0);
  box.innerHTML=`<div class="v11-section-head"><div><span>${L('خريطة المهارات البديلة','SKILLS SUBSTITUTION MAP')}</span><strong>${L('بدائل قابلة للنقل مع خطة تأهيل','Transferable-skill alternatives with upskill path')}</strong><small>${L('خريطة تجريبية وليست اعتمادًا رسميًا من Saudi Skills Taxonomy. يلزم تحقق SME/الترخيص.','Illustrative map, not an official Saudi Skills Taxonomy mapping. SME/licensing validation is required.')}</small></div></div>${transformEvents.length?`<div class="v11-service-note">${L('أحداث تحول وظيفي مسجلة','Role-transformation events')}: ${transformEvents.map(e=>fmt(e.skill_gap_fte,1)+' FTE').join(' · ')}</div>`:''}${opts.length?opts.map(o=>{const occ=sscoByCode(o.substitute);return `<div class="v11-skill-option"><div><strong>${esc(occ?.[ar()?'ar':'en']||o.substitute)} · SSCO ${o.substitute}</strong><small>${L('فجوات مهارية','Skill gaps')}: ${esc(ar()?o.missingAr:o.missingEn)} · ${esc(ar()?o.noteAr:o.noteEn)}</small></div><b>${fmt(o.match*100)}% · ${o.days}d</b></div>`}).join(''):`<div class="v11-service-note">${L('لا يوجد بديل تجريبي معرف لهذه المهنة بعد.','No illustrative substitute is mapped for this occupation yet.')}</div>`}`;
}
function renderRebalanceImpact(){
  const box=q('#v11-rebalance-impact'),r=selectedRow();if(!box||!r)return;
  const vals=scenarioValues(),impact=scenarioImpact(r,vals),transfer=Math.max(0,Number(vals.transfer||0));
  if(!transfer||!impact.donorCell){box.style.display='none';return}box.style.display='';
  const dp=decisionPriority(r),donor=getRowByCell(impact.donorCell),impBefore=serviceImpactFor(r,impact.beforeGap),impAfter=serviceImpactFor(r,impact.afterGap);
  box.innerHTML=`<div class="v11-section-head"><div><span>${L('أثر إعادة التوازن الداخلي','INTERNAL REBALANCING IMPACT')}</span><strong>${L('الأثر يظهر فورًا على المستلم والجهة المانحة','Immediate recipient + donor effect')}</strong></div></div><div class="v11-rebalance-grid"><div><span>${L('فجوة المستلم','Recipient gap')}</span><b>${fmt(impact.beforeGap,1)} → ${fmt(impact.afterGap,1)} FTE</b></div><div><span>${L('أولوية المستلم','Recipient priority')}</span><b>${dp.score??'—'} → ${impact.afterPriority??'—'}</b></div><div><span>${L('فجوة الجهة المانحة','Donor gap')}</span><b>${fmt(impact.donorAfterGap,1)} FTE</b></div><div><span>${L('عبء إضافي على المانح','Donor added burden')}</span><b>${fmt(impact.donorAddedBurden,1)}</b></div></div>${impBefore&&impAfter?`<div class="v11-service-note">${L('أثر الخدمة لدى المستلم','Recipient service impact')}: ${fmt(impBefore.value,0)} → ${fmt(impAfter.value,0)} ${esc(impBefore.unit)}</div>`:''}`;
}
function captureSlot(slot){
  const r=selectedRow();if(!r)return;
  const vals=scenarioValues(),impact=scenarioImpact(r,vals),imp=serviceImpactFor(r,impact.afterGap),opp=opportunityCost(r,impact.horizon,num(q('#v07-gapday-cost')?.value));
  compareSlots[slot]={created:new Date().toISOString(),source:r.source_row,cell:cellCode(r),vals:{...vals},impact:{...impact},serviceImpact:imp,doNothing:opp};
  renderCompare();
}
function renderCompare(){
  const box=q('#v11-compare-panel');if(!box)return;
  const card=(slot,label)=>{
    const x=compareSlots[slot];if(!x)return `<div class="v11-compare-slot"><h4>${label}</h4><small>${L('التقط الإعدادات الحالية للمقارنة.','Capture the current settings to compare.')}</small></div>`;
    const actionCost=Number.isFinite(x.impact.totalCostSar)?x.impact.totalCostSar:null;
    const avoided=x.doNothing&&Number.isFinite(x.impact.gapDaysAvoided)?x.impact.gapDaysAvoided*x.doNothing.daily:null;
    return `<div class="v11-compare-slot"><h4>${label}</h4><dl><dt>${L('الفجوة عند الأفق','Gap at horizon')}</dt><dd>${fmt(x.impact.afterGap,1)} FTE</dd><dt>${L('الأولوية بعد','Priority after')}</dt><dd>${x.impact.afterPriority??'—'}</dd><dt>${L('تكلفة التدخل','Action cost')}</dt><dd>${actionCost==null?'—':sar(actionCost)}</dd><dt>${L('تعرض متجنب','Exposure avoided')}</dt><dd>${avoided==null?'—':sar(avoided)}</dd><dt>${L('أثر الخدمة المتبقي','Remaining service impact')}</dt><dd>${x.serviceImpact?`${fmt(x.serviceImpact.value,0)} ${esc(x.serviceImpact.unit)}`:'—'}</dd></dl></div>`;
  };
  box.innerHTML=`<div class="v11-section-head"><div><span>${L('مقارنة سيناريوهين','SIDE-BY-SIDE SCENARIO COMPARISON')}</span><strong>${L('التقط إعدادين وقارن النتيجة مباشرة','Capture two configurations and compare outcomes')}</strong></div></div><div class="v11-compare-actions"><button id="v11-cap-a">${L('التقط كسيناريو A','Capture as A')}</button><button id="v11-cap-b">${L('التقط كسيناريو B','Capture as B')}</button><button id="v11-clear-compare">${L('مسح المقارنة','Clear')}</button></div><div class="v11-compare-grid">${card('A','A')}${card('B','B')}</div>`;
  q('#v11-cap-a').onclick=()=>captureSlot('A');q('#v11-cap-b').onclick=()=>captureSlot('B');q('#v11-clear-compare').onclick=()=>{compareSlots={A:null,B:null};renderCompare()};
}
function patchScenario(){
  const r=selectedRow();if(!r)return;
  const changed=applyPreset();
  renderPresetPanel();renderDoNothing();renderSkills();renderRebalanceImpact();renderCompare();
  if(changed&&!presetRenderGuard){
    presetRenderGuard=true;
    queueMicrotask(()=>{try{renderScenario()}finally{presetRenderGuard=false}});
  }
}

function enhanceBrief(){
  const overlay=q('#v07-brief-overlay');if(!overlay?.classList.contains('open'))return;
  const items=qa('.v07-brief-item',overlay),rows=topRows(items.length);
  items.forEach((item,i)=>{
    q('.v11-brief-decision',item)?.remove();q('.v11-brief-open-scenario',item)?.remove();
    const r=rows[i];if(!r)return;const plan=actionPlanFor(r,30);
    const d=document.createElement('div');d.className='v11-brief-decision';
    d.innerHTML=`<div><span>${L('الإجراء المقترح خلال 30 يومًا','Recommended action within 30 days')}</span><strong>${esc(plan.action)}</strong></div><div><span>${L('التكلفة التقريبية / المصدر','Approx. cost / source')}</span><strong>${plan.cost==null?'—':sar(plan.cost)} · ${esc(plan.costSource)}</strong></div><div><span>${L('المخاطر إذا لم يُتخذ إجراء','Risk if no action is taken')}</span><strong>${esc(plan.risk)}</strong></div>`;
    const inner=q('.v07-brief-item>div',item)||item;inner.prepend(d);
    const b=document.createElement('button');b.className='v11-brief-open-scenario';b.type='button';b.textContent=L('افتح في مختبر السيناريو','Open in Scenario Lab');
    b.onclick=()=>{selectedScenarioSource=r.source_row;q('#v07-brief-overlay')?.classList.remove('open');document.body.classList.remove('kh-brief-open');showView('scenario')};inner.appendChild(b);
  });
  const actions=q('.v07-brief-actions',overlay);
  if(actions&&!q('#v11-export-word',actions)){
    const w=document.createElement('button');w.id='v11-export-word';w.className='v11-export-btn';w.textContent=L('Word','Word');w.onclick=()=>exportBrief('doc');actions.prepend(w);
    const pp=document.createElement('button');pp.id='v11-export-ppt';pp.className='v11-export-btn';pp.textContent=L('PowerPoint','PowerPoint');pp.onclick=()=>exportBrief('ppt');actions.prepend(pp);
  }
}
function exportBrief(kind){
  const content=q('#v07-brief-content')?.innerHTML||'';if(!content)return;
  const title=L('موجز Kinetic HR التنفيذي','Kinetic HR Executive Brief');
  const html=`<!doctype html><html dir="${ar()?'rtl':'ltr'}"><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:Arial,Tahoma,sans-serif;padding:28px;color:#17384c}h1,h2{color:#102f43}article{border-bottom:1px solid #ddd;padding:10px 0}.v11-brief-decision{background:#f4f7f9;padding:10px;margin:8px 0}button{display:none}</style></head><body><h1>${title}</h1>${content}</body></html>`;
  const mime=kind==='doc'?'application/msword':'application/vnd.ms-powerpoint',ext=kind==='doc'?'doc':'ppt';
  const blob=new Blob([html],{type:mime+';charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`Kinetic-HR-Executive-Brief.${ext}`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}

function openDecisionCards(){
  const box=q('#v11-cards-content');if(!box)return;
  box.innerHTML=topRows(4).map(r=>{const plan=actionPlanFor(r,30),imp=serviceImpactFor(r),loc=sectorCfg(r.sector).locations.find(x=>x.id===r.location)?.[ar()?'ar':'en']||r.location;return `<article class="v11-decision-card ${signalState(r)==='alert'?'alert':''}"><h3>${esc(occupationLabel(r.ssco))} · ${esc(loc)}</h3><p><b>${L('تنبيه','Alert')}:</b> ${L('الخلية تجاوزت عتبة القرار الحالية.','This cell exceeds the current decision threshold.')} ${esc(plan.action)}</p><div class="v11-card-grid"><div><span>${L('الأولوية','Priority')}</span><strong>${decisionPriority(r).score??'—'}</strong></div><div><span>${L('أثر الخدمة','Service impact')}</span><strong>${imp?`${fmt(imp.value,0)} ${esc(imp.unit)}`:'—'}</strong></div><div><span>${L('التكلفة المرجعية','Reference cost')}</span><strong>${plan.cost==null?'—':sar(plan.cost)}</strong></div></div><div class="v11-card-actions"><button disabled title="${L('يتطلب RBAC وتكامل Production','Requires RBAC + production integration')}">${L('اعتماد','Approve')}</button><button disabled>${L('رفض','Reject')}</button><button data-v11-card-detail="${esc(r.source_row)}">${L('عرض التفاصيل','View details')}</button></div></article>`}).join('');
  qa('[data-v11-card-detail]',box).forEach(b=>b.onclick=()=>{q('#v11-cards-overlay').classList.remove('open');if(typeof openDrawer==='function')openDrawer(b.dataset.v11CardDetail)});
  q('#v11-cards-overlay').classList.add('open');
}

function renderDataPilot(){
  qa('.connector-card').forEach(c=>c.classList.add('v11-demo-connector'));
  const importLinks=qa('#view-data .import-footer a');
  if(importLinks[0]){importLinks[0].href='sample_position_snapshot_v11.csv';importLinks[0].textContent=L('تحميل Snapshot v1.1','Download Snapshot v1.1')}
  if(importLinks[1]){importLinks[1].href='sample_hr_event_log_v11.csv';importLinks[1].textContent=L('تحميل Event Log v1.1','Download Event Log v1.1')}
  const ev=q('#v11-event-support');if(ev)ev.innerHTML=`<div class="panel-head compact"><div><span class="panel-kicker">${L('تغطية أحداث الموارد البشرية','HR EVENT COVERAGE')}</span><h3>${L('أحداث قياسية ومتقدمة مدعومة','Standard + advanced workforce events')}</h3></div><code>KHDC-v0.9+</code></div><p style="font-size:9px;color:#647b89">${L('الأحداث المتقدمة لا تُجبر على معنى واحد: role_transformation يمكن أن يحمل skill_gap_fte دون تغيير العدد، بينما long_term_absence يخلق عجزًا مؤقتًا.','Advanced events are not forced into one meaning: role_transformation may carry skill_gap_fte without changing headcount, while long_term_absence creates a temporary capacity gap.')}</p><div class="v11-event-types">${Object.entries(EVENT_LABELS).map(([k,v])=>`<span class="${['long_term_absence','return_from_absence','internal_promotion','role_transformation'].includes(k)?'advanced':''}">${esc(ar()?v[0]:v[1])}</span>`).join('')}</div><div class="v11-compare-actions"><a class="v11-export-btn" href="sample_hr_event_log_v11.csv" download>${L('تحميل عينة الأحداث المتقدمة','Download advanced event sample')}</a><a class="v11-export-btn" href="pilot_reference_presets_v11.json" target="_blank" rel="noreferrer">${L('فتح القيم المرجعية للـPilot','Open pilot reference presets')}</a><a class="v11-export-btn" href="pilot_extension_dictionary_v11.md" target="_blank" rel="noreferrer">${L('دليل Pilot v1.1','Pilot v1.1 dictionary')}</a></div>`;
  const pr=q('#v11-production-readiness');if(pr)pr.innerHTML=`<div class="panel-head compact"><div><span class="panel-kicker">${L('جاهزية قنوات القرار','DECISION DELIVERY READINESS')}</span><h3>${L('ما الذي يعمل الآن وما الذي يتطلب Production Integration','What works now vs what needs production integration')}</h3></div></div><div class="v11-integration-grid"><div class="v11-integration-card"><strong>Microsoft Teams</strong><span>${L('غير متصل','Not connected')}</span><small>${L('في الإنتاج: بطاقة قرار + هوية المستخدم + RBAC + webhook/Graph + سجل موافقة.','Production: decision card + identity + RBAC + webhook/Graph + approval audit.')}</small></div><div class="v11-integration-card"><strong>Slack</strong><span>${L('غير متصل','Not connected')}</span><small>${L('في الإنتاج: App/Bot مصادق عليه مع أزرار إجراء مربوطة بحالة القرار.','Production: authenticated App/Bot with actions tied to decision state.')}</small></div><div class="v11-integration-card"><strong>Email</strong><span>${L('غير متصل','Not connected')}</span><small>${L('في الإنتاج: رسالة قرار قابلة للتتبع وروابط عميقة للمنصة؛ لا إرسال من النسخة العامة.','Production: traceable decision email with deep links; no sending from the public demo.')}</small></div></div>`;
}

function renderSkillMapPage(){
  const box=q('#v11-skill-map-panel');if(!box)return;
  box.innerHTML=`<div class="panel-head compact"><div><span class="panel-kicker">${L('طبقة المهارات القابلة للنقل','TRANSFERABLE SKILLS LAYER')}</span><h3>${L('من SSCO إلى بدائل مهارية قابلة للاختبار','From SSCO gaps to testable skill substitutes')}</h3></div><code>DEMO MAP</code></div><p style="font-size:9px;color:#647b89;line-height:1.6">${L('هذه الخريطة فرضيات Pilot وليست خريطة رسمية من Saudi Skills Taxonomy. الغرض اختبار سير العمل: بديل محتمل → فجوات مهارية → مدة Upskill → فحص الأهلية/الترخيص.','These mappings are pilot hypotheses, not official Saudi Skills Taxonomy mappings. They test the workflow: potential substitute → skill gaps → upskill duration → eligibility/licensing check.')}</p><div class="v11-skill-map-grid">${SKILL_MAP.map(m=>{const t=sscoByCode(m.target),s=sscoByCode(m.substitute);return `<div class="v11-skill-map-item"><strong>${esc(t?.[ar()?'ar':'en']||m.target)} ← ${esc(s?.[ar()?'ar':'en']||m.substitute)}</strong><small>${fmt(m.match*100)}% ${L('تطابق تجريبي','illustrative match')} · ${m.days} ${L('يوم تأهيل','day upskill')}<br>${esc(ar()?m.noteAr:m.noteEn)}</small></div>`}).join('')}</div>`;
}

function applyAuditFilter(){
  const table=q('#audit-body');if(!table)return;
  const term=(q('#v11-audit-search')?.value||'').trim().toLowerCase(),kind=q('#v11-audit-kind')?.value||'';
  let shown=0;qa('tr',table).forEach(tr=>{const cells=qa('td',tr),k=cells[1]?.textContent.trim()||'',txt=tr.innerText.toLowerCase(),ok=(!term||txt.includes(term))&&(!kind||k===kind);tr.hidden=!ok;if(ok)shown++});
  const n=q('#v11-audit-count');if(n)n.textContent=L(`${shown} سجل ظاهر`,`${shown} records shown`);
}
function patchAuditTools(){
  const sel=q('#v11-audit-kind');if(!sel)return;
  const current=sel.value,kinds=[...new Set(qa('#audit-body tr td:nth-child(2)').map(td=>td.textContent.trim()).filter(Boolean))].sort();
  sel.innerHTML=`<option value="">${L('كل أنواع السجل','All record types')}</option>`+kinds.map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');if(kinds.includes(current))sel.value=current;applyAuditFilter();
}

function applyTransferFilter(){
  const body=q('#gaps-body');if(!body)return;let shown=0;
  qa('tr',body).forEach(tr=>{const b=q('[data-detail]',tr);if(!b)return;const r=getRowBySource(b.dataset.detail),ok=!transferOnly||transferOptions(r).length>0;tr.hidden=!ok;if(ok)shown++});
  const cnt=q('#gap-row-count');if(cnt)cnt.textContent=L(`${shown} خلايا`,`${shown} cells`);
}
function patchGapBuffer(){
  const metrics=q('#gap-metrics');if(!metrics)return;
  q('.v11-buffer-metric',metrics)?.remove();
  const donors=currentRows().filter(r=>surplus(r)>0),safe=donors.reduce((a,r)=>a+transferable(r),0),solvable=currentRows().filter(r=>deficit(r)>0&&transferOptions(r).length>0).length;
  const card=document.createElement('article');card.className='mini-metric v11-buffer-metric';card.innerHTML=`<span>${L('احتياطي داخلي آمن','Safe internal buffer')}</span><strong>${fmt(safe,1)} FTE</strong><small style="display:block;margin-top:4px;color:#6c8391">${L(`${solvable} فجوات يمكن اختبار حلها بالنقل`,`${solvable} gaps have a testable transfer path`)}</small>`;metrics.appendChild(card);applyTransferFilter();
}

function patchArabicTechnicalTerms(){
  if(!ar())return;
  qa('.rate-unit').forEach(el=>{
    if(/100\s*FTE-mo/i.test(el.textContent))el.textContent=el.textContent.replace(/\/100\s*FTE-mo/i,'/100 وظيفة مكافئة-شهر');
  });
  qa('#executive-metrics .exec-metric strong').forEach(el=>{
    if(/100\s*FTE-mo/i.test(el.textContent))el.textContent=el.textContent.replace(/\/100\s*FTE-mo/i,'/100 وظيفة مكافئة-شهر');
  });
  const legend=q('#pulse-legend');
  if(legend)legend.innerHTML=legend.innerHTML.replaceAll('FTE-شهر','وظيفة مكافئة-شهر').replaceAll('FTE-month','وظيفة مكافئة-شهر');
}

function friendlyPeriod(){
  const el=q('#current-period-label');if(!el||typeof getWindows!=='function')return;
  const {current}=getWindows(),monthsAr=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'],monthsEn=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const s=current.start,e=current.end,month=ar()?monthsAr:monthsEn;
  const label=ar()?`آخر 30 يومًا · ${s.getUTCDate()} ${month[s.getUTCMonth()]} – ${e.getUTCDate()} ${month[e.getUTCMonth()]} ${e.getUTCFullYear()}`:`Last 30 days · ${s.getUTCDate()} ${month[s.getUTCMonth()]} – ${e.getUTCDate()} ${month[e.getUTCMonth()]} ${e.getUTCFullYear()}`;
  el.textContent=label;el.classList.add('v11-friendly-period');el.removeAttribute('dir');
}

function shouldSuppressAutoTour(){
  const p=new URLSearchParams(location.search),v=String(p.get('v')||'').toLowerCase();
  return p.has('review')||p.has('qa')||p.has('test')||v.includes('ci')||p.has('decision')||p.has('scenario');
}
function openTour(force=false){
  if(!force&&(localStorage.getItem('kinetic_hr_onboarding_v11')==='1'||shouldSuppressAutoTour()))return;
  q('#v11-tour-overlay')?.classList.add('open');
}

function renderStrategic(){
  ensureStrategicContext();ensureShell();friendlyPeriod();patchArabicTechnicalTerms();renderServiceImpact();renderDelivery();patchCriticalCards();patchScenario();renderDataPilot();renderSkillMapPage();patchAuditTools();patchGapBuffer();enhanceBrief();updateSidebarToggle();
}
let scheduled=false;
function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;renderStrategic()})}

function wrap(name){
  try{
    const fn=window[name];if(typeof fn!=='function'||fn.__v11)return;
    const w=function(...args){const out=fn.apply(this,args);schedule();return out};w.__v11=true;window[name]=w;
  }catch{}
}
['renderAll','renderDashboard','renderDecisionQueue','renderSignals','renderGaps','renderScenario','renderDataHub','renderOccupations','renderAudit','showView','openDrawer'].forEach(wrap);

const validateSnapshotsBase=typeof validateSnapshots==='function'?validateSnapshots:null;
if(validateSnapshotsBase)validateSnapshots=function(raw){
  const out=validateSnapshotsBase(raw);
  out.rows.forEach(r=>['service_impact_per_gap_fte'].forEach(k=>{if(r[k]!=null&&String(r[k]).trim()!==''){const v=Number(r[k]);if(Number.isFinite(v)&&v>=0)r[k]=v;else out.quality.warnings.push(`${r.source_row}: invalid optional ${k}`)}}));
  return out;
};

document.addEventListener('DOMContentLoaded',()=>{
  setTimeout(()=>{
    renderStrategic();
    if(localStorage.getItem('kinetic_hr_onboarding_v11')!=='1')setTimeout(()=>openTour(false),650);
    document.addEventListener('click',e=>{
      if(e.target.closest('#v07-brief-btn,.v07-inline-brief'))requestAnimationFrame(()=>setTimeout(enhanceBrief,0));
    });
  },0);
});
})();