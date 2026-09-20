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
  EDU:{hire:140000,transfer:20000,upskill:18000,contract:165000,gapDay:950,approval:{hire:30,transfer:14,upskill:7,contract:14},get source(){return L('مرجع تجريبي توضيحي — التعليم','Illustrative pilot preset — Education')}},
  HLT:{hire:220000,transfer:30000,upskill:25000,contract:300000,gapDay:1800,approval:{hire:45,transfer:21,upskill:10,contract:14},get source(){return L('مرجع تجريبي توضيحي — الصحة','Illustrative pilot preset — Health')}},
  MUN:{hire:150000,transfer:18000,upskill:20000,contract:180000,gapDay:900,approval:{hire:30,transfer:14,upskill:7,contract:14},get source(){return L('مرجع تجريبي توضيحي — البلديات','Illustrative pilot preset — Municipal')}},
  GOV:{hire:170000,transfer:15000,upskill:22000,contract:190000,gapDay:1000,approval:{hire:30,transfer:14,upskill:10,contract:14},get source(){return L('مرجع تجريبي توضيحي — الخدمات الحكومية','Illustrative pilot preset — Government services')}}
};

const DEMO_IMPACT={
  'demo-001':{perGap:66.67,unitAr:'طالب',unitEn:'students',labelAr:'طلاب معرضون لزيادة كثافة الفصول أو تغطية تعليمية غير مثالية',labelEn:'students exposed to higher class density or suboptimal teaching coverage',targetAr:'افتراض تجريبي توضيحي — ليس مستهدفًا وطنيًا',targetEn:'Synthetic pilot assumption — not a national target'},
  'demo-002':{perGap:55,unitAr:'طالب',unitEn:'students',labelAr:'طلاب معرضون لتغطية تعليمية أقل من الخطة',labelEn:'students exposed to below-plan teaching coverage',targetAr:'افتراض تجريبي توضيحي',targetEn:'Synthetic pilot assumption'},
  'demo-003':{perGap:45,unitAr:'طالب',unitEn:'students',labelAr:'طلاب معرضون لمرونة أقل في توزيع الشعب',labelEn:'students exposed to reduced timetable flexibility',targetAr:'افتراض تجريبي توضيحي',targetEn:'Synthetic pilot assumption'},
  'demo-004':{perGap:6,unitAr:'ساعة تغطية سريرية/أسبوع',unitEn:'clinical coverage hours/week',labelAr:'ساعات تغطية حرجة معرضة للضغط التشغيلي',labelEn:'critical coverage hours exposed to operating pressure',targetAr:'افتراض تجريبي توضيحي — يتطلب معايرة سريرية',targetEn:'Synthetic pilot assumption — clinical calibration required'},
  'demo-005':{perGap:4,unitAr:'ساعة تأخير قدرة/أسبوع',unitEn:'capacity-delay hours/week',labelAr:'ساعات قدرة إجرائية معرضة للتأخير',labelEn:'procedural-capacity hours exposed to delay',targetAr:'افتراض تجريبي توضيحي — يتطلب معايرة سريرية',targetEn:'Synthetic pilot assumption — clinical calibration required'},
  'demo-007':{perGap:12,unitAr:'مهمة تفتيش/أسبوع',unitEn:'inspection tasks/week',labelAr:'مهام تفتيش معرضة للتأخير',labelEn:'inspection tasks exposed to delay',targetAr:'افتراض تجريبي توضيحي',targetEn:'Synthetic pilot assumption'},
  'demo-008':{perGap:3,unitAr:'حزمة تخطيط/شهر',unitEn:'planning work packages/month',labelAr:'حزم تخطيط معرضة للتأخير',labelEn:'planning work packages exposed to delay',targetAr:'افتراض تجريبي توضيحي',targetEn:'Synthetic pilot assumption'},
  'demo-010':{perGap:2,unitAr:'حزمة قرار/شهر',unitEn:'decision work packages/month',labelAr:'حزم تخطيط قوى عاملة معرضة للتأخير',labelEn:'workforce-planning decision packages exposed to delay',targetAr:'افتراض تجريبي توضيحي',targetEn:'Synthetic pilot assumption'}
};

const SKILL_MAP=[
  {target:'226301',substitute:'325706',match:.72,days:45,missingAr:'تحليل المخاطر البيئية · المتطلبات التنظيمية البيئية',missingEn:'environmental risk analysis · environmental regulatory requirements',noteAr:'فرضية تجريبية فقط؛ يلزم تحقق خبير المهنة والأهلية النظامية',noteEn:'Pilot hypothesis only; SME and regulatory eligibility validation required'},
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
    action=L(`جرّب تغطية ما يعادل ${KHPlain.capacity(units)} بنقل داخلي من ${sectorCfg(donor.row.sector).locations.find(x=>x.id===donor.row.location)?.ar||donor.row.location} خلال 30 يومًا.`,`Test covering the equivalent of ${KHPlain.capacity(units)} by transfer from ${sectorCfg(donor.row.sector).locations.find(x=>x.id===donor.row.location)?.en||donor.row.location} within 30 days.`);
    cost=p?units*p.transfer:null;
  }else if(fund.known&&fund.unfundedGap>0){
    units=gap; type='fund_then_hire';
    action=L(`اطلب اعتماد تمويل ما يعادل ${KHPlain.capacity(fund.unfundedGap)}. وبالتوازي، قارن التوظيف والتغطية المؤقتة للجزء الممول، بعد الموافقات.`,`Request funding for the equivalent of ${KHPlain.capacity(fund.unfundedGap)}. In parallel, compare hiring and temporary cover for the funded portion, subject to approvals.`);
    cost=p?gap*p.hire:null;
  }else{
    units=gap;type='hire';
    action=L(`راجع التمويل والموافقات، ثم قارن التوظيف والتغطية المؤقتة لنقص يعادل ${KHPlain.capacity(gap)}.`,`Check funding and approvals, then compare hiring and temporary cover for a shortfall equivalent to ${KHPlain.capacity(gap)}.`);
    cost=p?gap*p.hire:null;
  }
  const riskParts=[];
  if(impact)riskParts.push(L(`${fmt(impact.value,0)} ${impact.unit}: ${impact.label}`,`${fmt(impact.value,0)} ${impact.unit}: ${impact.label}`));
  if(opp)riskParts.push(L(`تكلفة تقديرية لاستمرار النقص لمدة ${days} يومًا: ${sar(opp.total)}`,`Reference ${days}-day cost of continued shortfall: ${sar(opp.total)}`));
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

function renderNextAction(){
  const view=q('#view-dashboard');if(!view)return;
  let box=q('#v16-next-action');if(!box){box=document.createElement('article');box.id='v16-next-action';view.prepend(box)}
  const r=topRows(1)[0];if(!r){box.innerHTML=`<h2>${L('ماذا أفعل غدًا؟','What should I do tomorrow?')}</h2><p>${L('لا توجد فجوة نشطة في القطاع الحالي. راجع جودة البيانات واستمر في الرصد.','No active gap in this sector. Review data quality and continue monitoring.')}</p>`;return}
  const plan=actionPlanFor(r,30),fund=fundingFor(r),loc=sectorCfg(r.sector).locations.find(x=>x.id===r.location)?.[ar()?'ar':'en']||r.location;
  const units=plan.type==='transfer'?Math.min(30,Math.floor(plan.units)):Math.min(30,Math.ceil(plan.units));
  let tomorrow,owner,deliverable;
  if(plan.type==='transfer'&&units>0){tomorrow=L(`اطلب مراجعة إمكانية نقل تغطية تعادل ${KHPlain.capacity(units)} إلى ${loc}، مع التحقق من احتياطي الجهة المانحة.`,`Request an eligibility review for transferring ${fmt(units)} ${KHPlain.unit()} to ${loc}, including the donor's remaining capacity.`);owner=L('تخطيط القوى العاملة + شريك الموارد البشرية','Workforce Planning + HR business partner');deliverable=L('قائمة مرشحين مؤهلين، موافقة الجهة المانحة، وتقدير تكلفة قابل للمراجعة.','An eligible candidate list, donor approval and a reviewable cost estimate.')}
  else if(plan.type==='fund_then_hire'){tomorrow=L(`اطلب اعتماد تمويل ما يعادل ${KHPlain.capacity(fund.unfundedGap)}، وراجع الحلول المتاحة للجزء الممول بالتوازي.`,`Request funding for the equivalent of ${KHPlain.capacity(fund.unfundedGap)}, and review options for the funded portion in parallel.`);owner=L('الموارد البشرية + المالية','HR + Finance');deliverable=L('تحديد مصدر التمويل وصاحب الموافقة وموعد الرد، مع تقييم تغطية مؤقتة.','Identify the funding source, approver and response date; assess temporary cover.')}
  else{tomorrow=L(`اطلب خطة توظيف وتغطية مؤقتة لنقص يعادل ${KHPlain.capacity(deficit(r))} في ${loc}.`,`Request a recruitment and temporary-cover plan for the ${fmt(deficit(r),1)} ${KHPlain.unit()} gap in ${loc}.`);owner=L('الاستقطاب + مدير التشغيل','Talent Acquisition + Operations');deliverable=L('خطة بمسؤول واضح ومهلة بدء وتكلفة ومؤشر لقياس التحسن.','A plan with an owner, start date, cost and improvement measure.')}
  box.innerHTML=`<div class="v16-action-main"><span>${L('أول إجراء مقترح · حسب أولوية القطاع','FIRST PROPOSED ACTION · SECTOR PRIORITY')}</span><h2>${L('ماذا أفعل غدًا؟','What should I do tomorrow?')}</h2><p>${esc(tomorrow)}</p><small>${esc(occupationLabel(r.ssco))} · ${esc(loc)} · ${L('أولوية','Priority')} ${decisionPriority(r).score??'—'}</small></div><div class="v16-action-detail"><strong>${L('المسؤول المقترح','Suggested owner')}</strong><p>${owner}</p><strong>${L('ما المطلوب بنهاية الغد؟','Tomorrow’s deliverable')}</strong><p>${deliverable}</p></div><div class="v16-action-buttons"><button id="v16-try-next" type="button">${L('جرّب الإجراء المقترح','Try the proposed action')}</button><button id="v16-next-evidence" type="button">${L('راجع الدليل','Review evidence')}</button><small>${L('اقتراح للمراجعة البشرية؛ لا ينفّذ نقلًا أو توظيفًا.','For human review; no transfer or hiring is executed.')}</small></div>`;
  q('#v16-next-evidence').onclick=()=>openDrawer(r.source_row);
  q('#v16-try-next').onclick=()=>{selectedScenarioSource=r.source_row;showView('scenario');['hire','transfer','upskill','contract'].forEach(k=>q('#'+k+'-range').value='0');if(plan.type==='transfer'&&units>0){q('#scenario-donor').value=cellCode(plan.donor.row);q('#transfer-range').value=String(units)}else if(plan.type==='hire')q('#hire-range').value=String(units);renderScenario();q('#view-scenario').scrollIntoView({block:'start',behavior:'smooth'})};
}

function renderServiceImpact(){
  const box=q('#v11-service-impact');if(!box)return;
  const r=topRows(1)[0];if(!r){box.innerHTML=`<div class="lead"><strong>${L('لا توجد فجوة نشطة','No active gap')}</strong></div>`;return}
  const imp=serviceImpactFor(r),plan=actionPlanFor(r,30),age=gapAge(r),sv=surveillanceFor(r),ratio=sv?.dataSufficient?sv.ratio:null;
  box.innerHTML=`<div class="lead"><span>${L('مؤشر أثر الخدمة','SERVICE IMPACT KPI')}</span><strong>${imp?esc(imp.label):L('أدخل مؤشر أثر الخدمة لهذه الخلية','Add a service-impact measure for this cell')}</strong><small>${esc(occupationLabel(r.ssco))} · ${esc(sectorCfg(r.sector).locations.find(x=>x.id===r.location)?.[ar()?'ar':'en']||r.location)}</small>${imp?`<em class="v11-source-pill">${esc(imp.target)}</em>`:''}</div><article><span>${L('الأثر الحالي','Current impact')}</span><strong>${imp?`${fmt(imp.value,0)} ${esc(imp.unit)}`:'—'}</strong><small>${L('يتناسب خطيًا مع الفجوة في نموذج التجربة المؤسسية','Linear to gap in the pilot model')}</small></article><article><span>${L('عمر الفجوة','Gap age')}</span><strong>${age==null?'—':fmt(age)+' '+L('يوم','days')}</strong><small>${L('مدة استمرار العجز الحالي','Current deficit duration')}</small></article><article><span>${L('التسارع','Acceleration')}</span><strong>${ratio==null?'—':Number.isFinite(ratio)?fmt(ratio,2)+'×':'∞'}</strong><small>${sv?.dataSufficient?L('مقارنة بخط الأساس التاريخي','vs historical baseline'):L('بيانات الرصد غير كافية','Insufficient surveillance history')}</small></article>`;
}

function renderDelivery(){
  const box=q('#v11-delivery-strip');if(!box)return;
  box.innerHTML=`<div><strong>${L('بطاقات قرار استباقية جاهزة للتكامل','Proactive Decision Cards are integration-ready')}</strong><p><span class="v11-channel">Teams</span><span class="v11-channel">Slack</span><span class="v11-channel">${L('البريد الإلكتروني','Email')}</span> ${L('لا يوجد إرسال فعلي في النسخة العامة؛ تُعرض معاينة الرسالة ومسار القرار فقط.','No live delivery in the public demo; only the message and decision path are previewed.')}</p></div><div class="v11-delivery-actions"><button id="v11-preview-cards">${L('معاينة بطاقات القرار','Preview decision cards')}</button></div>`;
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

const presetFields=['v07-budget','v07-gapday-cost','v07-safety-pct',...['hire','transfer','upskill','contract'].flatMap(k=>['v07-approval-'+k,'v07-cost-'+k])];
const cellDrafts=new Map();let activeDraftKey=null;
const captureDraft=()=>Object.fromEntries(presetFields.map(id=>{const el=q('#'+id);return [id,{value:el?.value||'',edited:el?.dataset.userEdited==='1'}]}));
function bindPresetEdits(){
  presetFields.forEach(id=>{const el=q('#'+id);if(!el||el.dataset.v11Bound==='1')return;el.dataset.v11Bound='1';el.addEventListener('input',()=>{if(!applyingPreset)el.dataset.userEdited='1'})});
}
function applyPreset(){
  const r=selectedRow();if(!r||!q('#v07-budget'))return false;
  bindPresetEdits();const key=[snapshotMode,snapshotImportedAt||'demo',r.source_row].join('|');
  if(key===activeDraftKey)return false;
  if(activeDraftKey)cellDrafts.set(activeDraftKey,captureDraft());
  activeDraftKey=key;
  const saved=cellDrafts.get(key),p=snapshotMode==='synthetic'?presetFor(r):null;
  const values={'v07-safety-pct':5,'v07-budget':p?Math.max(100000,Math.round(deficit(r)*p.hire*1.05)):'','v07-gapday-cost':p?p.gapDay:(num(r.cost_per_uncovered_fte_day)??'')};
  ['hire','transfer','upskill','contract'].forEach(k=>{values['v07-approval-'+k]=p?p.approval[k]:'';values['v07-cost-'+k]=p?p[k]:''});
  applyingPreset=true;
  for(const id of presetFields){const el=q('#'+id);if(!el)continue;el.value=saved?saved[id].value:String(values[id]??'');el.dataset.userEdited=saved?.[id]?.edited?'1':'0'}
  applyingPreset=false;return true;
}
document.addEventListener('kinetic:reset',()=>{cellDrafts.clear();activeDraftKey=null});
function renderPresetPanel(){
  const box=q('#v11-ref-preset'),r=selectedRow();if(!box||!r)return;
  const p=snapshotMode==='synthetic'?presetFor(r):null,custom=presetFields.some(id=>q('#'+id)?.dataset.userEdited==='1');
  const heading=p?(custom?L('قيم معدّلة بواسطة المستخدم','User-adjusted values'):L('قيم تجريبية مكتملة وقابلة للتعديل','Complete, editable demo defaults')):L('مدخلات الجهة المستوردة','Imported entity inputs');
  const note=p?L('هذه افتراضات للتجربة وليست أسعار سوق معتمدة. تشمل التكلفة والميزانية ومهل الموافقة لكل تدخل.','These are illustrative assumptions, not validated market prices. Costs, budget and approval delays are filled for every intervention.'):L('لا تُنسخ القيم التجريبية إلى بيانات الجهة. راجع التكاليف ومهل الموافقة قبل الاعتماد.','Demo assumptions are not copied into entity data. Review costs and approval delays before approval.');
  box.innerHTML=`<div class="v11-section-head"><div><span>${L('افتراضات السيناريو ومصدرها','SCENARIO ASSUMPTIONS & SOURCE')}</span><strong>${heading}</strong><small>${note}</small></div>${p?`<span class="v11-source-pill">${esc(p.source)}</span>`:''}</div><div class="v16-default-grid">${['hire','transfer','upskill','contract'].map(k=>`<div><strong>${{hire:L('التوظيف','Hire'),transfer:L('النقل','Transfer'),upskill:L('التأهيل','Upskill'),contract:L('التعاقد','Contract')}[k]}</strong><span>${num(q('#v07-cost-'+k)?.value)==null?'—':sar(num(q('#v07-cost-'+k).value))}</span><small>${L('مهلة الموافقة','Approval delay')}: ${q('#v07-approval-'+k)?.value||'—'} ${L('يومًا','days')}</small></div>`).join('')}</div>`;
  let ready=q('#v16-scenario-ready');if(!ready){ready=document.createElement('div');ready.id='v16-scenario-ready';q('.scenario-actions')?.insertAdjacentElement('afterend',ready)}
  ready.innerHTML=`<div><strong>${heading}</strong><small>${p?L('يمكنك تجربة التدخل مباشرة؛ راجع الافتراضات أو عدّلها عند الحاجة.','Try an intervention immediately; inspect or adjust assumptions as needed.'):note}</small></div><button id="v16-edit-defaults" type="button">${L('راجع القيم','Review values')}</button>`;
  q('#v16-edit-defaults').onclick=()=>{q('#v14-advanced').open=true;q('#v07-reality-panel').open=true;q('#v07-budget').focus();q('#v07-reality-panel').scrollIntoView({block:'center',behavior:'smooth'})};
}
function renderDoNothing(){
  const box=q('#v11-do-nothing'),r=selectedRow();if(!box||!r)return;
  const horizon=Number(q('#scenario-horizon')?.value||180),cost=num(q('#v07-gapday-cost')?.value),opp=opportunityCost(r,horizon,cost),imp=serviceImpactFor(r),vals=scenarioValues(),impact=scenarioImpact(r,vals);
  const avoided=opp&&Number.isFinite(impact.gapDaysAvoided)?impact.gapDaysAvoided*opp.daily:null;
  box.innerHTML=`<div class="v11-section-head"><div><span>${L('سيناريو عدم التدخل','DO NOTHING SCENARIO')}</span><strong>${L('التكلفة التقديرية لاستمرار النقص','Estimated cost of continued shortfall')}</strong><small>${opp?esc(opp.source):L('أدخل تكلفة يوم واحد من النقص بدوام كامل لاحتسابها','Enter cost per full-time-equivalent day of shortfall to calculate it')}</small></div><button id="v11-zero-actions" class="v11-zero-btn">${L('صفّر التدخلات','Set interventions to zero')}</button></div><div class="v11-do-grid"><div><span>${L('تكلفة استمرار النقص دون إجراء','Cost if no action is taken')}</span><b class="v11-do-cost">${opp?sar(opp.total):'—'}</b></div><div><span>${L('أثر الخدمة الحالي','Current service impact')}</span><b>${imp?`${fmt(imp.value,0)} ${esc(imp.unit)}`:'—'}</b></div><div><span>${L('تكلفة نقص قد يوفرها السيناريو','Shortfall cost avoided by action')}</span><b class="v11-net-benefit">${avoided==null?'—':sar(avoided)}</b></div></div>`;
  q('#v11-zero-actions').onclick=()=>{['hire','transfer','upskill','contract'].forEach(k=>{const e=q('#'+k+'-range');if(e){e.value='0';e.dispatchEvent(new Event('input',{bubbles:true}))}})};
}
function renderSkills(){
  const box=q('#v11-skills'),r=selectedRow();if(!box||!r)return;
  const opts=SKILL_MAP.filter(x=>x.target===String(r.ssco));
  const transformEvents=eventsForCell(r).filter(e=>e.event_type==='role_transformation'&&num(e.skill_gap_fte)>0);
  box.innerHTML=`<div class="v11-section-head"><div><span>${L('خريطة المهارات البديلة','SKILLS SUBSTITUTION MAP')}</span><strong>${L('بدائل قابلة للنقل مع خطة تأهيل','Transferable-skill alternatives with upskill path')}</strong><small>${L('خريطة تجريبية وليست اعتمادًا رسميًا من التصنيف السعودي للمهارات. يلزم تحقق الخبير المختص والترخيص.','Illustrative map, not an official Saudi Skills Taxonomy mapping. SME/licensing validation is required.')}</small></div></div>${transformEvents.length?`<div class="v11-service-note">${L('أحداث تحول وظيفي مسجلة','Role-transformation events')}: ${transformEvents.map(e=>fmt(e.skill_gap_fte,1)+' FTE').join(' · ')}</div>`:''}${opts.length?opts.map(o=>{const occ=sscoByCode(o.substitute);return `<div class="v11-skill-option"><div><strong>${esc(occ?.[ar()?'ar':'en']||o.substitute)} · SSCO ${o.substitute}</strong><small>${L('فجوات مهارية','Skill gaps')}: ${esc(ar()?o.missingAr:o.missingEn)} · ${esc(ar()?o.noteAr:o.noteEn)}</small></div><b>${fmt(o.match*100)}% · ${o.days}d</b></div>`}).join(''):`<div class="v11-service-note">${L('لا يوجد بديل تجريبي معرف لهذه المهنة بعد.','No illustrative substitute is mapped for this occupation yet.')}</div>`}`;
}
function renderRebalanceImpact(){
  const box=q('#v11-rebalance-impact'),r=selectedRow();if(!box||!r)return;
  const vals=scenarioValues(),impact=scenarioImpact(r,vals),transfer=Math.max(0,Number(vals.transfer||0));
  if(!transfer||!impact.donorCell){
    box.style.display='';
    box.innerHTML=`<div class="v11-rebalance-empty"><div><strong>${L('أثر إعادة التوازن الداخلي','Internal rebalancing impact')}</strong><p>${L('اختبر نقل المواهب بين الجهات، وقارن أثر القرار على فجوة المستلم والجهة المانحة.','Test internal transfers and compare the effect on both the recipient and donor workforce gaps.')}</p><button type="button" id="v15-choose-donor">${L('استعرض مصادر النقل','Explore transfer sources')}</button></div><div><small>${L('الفجوة الحالية','Current gap')}</small><b>${fmt(impact.beforeGap,1)} ${KHPlain.unit()}</b></div></div>`;
    q('#v15-choose-donor').onclick=()=>{const advanced=q('#v14-advanced');if(advanced)advanced.open=true;q('#scenario-donor').focus();q('#scenario-donor').scrollIntoView({block:'center',behavior:'smooth'})};
    return
  }box.style.display='';
  const dp=decisionPriority(r),donor=getRowByCell(impact.donorCell),impBefore=serviceImpactFor(r,impact.beforeGap),impAfter=serviceImpactFor(r,impact.afterGap);
  box.innerHTML=`<div class="v11-section-head"><div><span>${L('أثر إعادة التوازن الداخلي','INTERNAL REBALANCING IMPACT')}</span><strong>${L('الأثر يظهر فورًا على المستلم والجهة المانحة','Immediate recipient + donor effect')}</strong></div></div><div class="v11-rebalance-grid"><div><span>${L('فجوة المستلم','Recipient gap')}</span><b>${fmt(impact.beforeGap,1)} → ${fmt(impact.afterGap,1)} ${KHPlain.unit()}</b></div><div><span>${L('أولوية المستلم','Recipient priority')}</span><b>${dp.score??'—'} → ${impact.afterPriority??'—'}</b></div><div><span>${L('فجوة الجهة المانحة','Donor gap')}</span><b>${fmt(impact.donorAfterGap,1)} ${KHPlain.unit()}</b></div><div><span>${L('عبء إضافي على المانح','Donor added burden')}</span><b>${fmt(impact.donorAddedBurden,1)}</b></div></div>${impBefore&&impAfter?`<div class="v11-service-note">${L('أثر الخدمة لدى المستلم','Recipient service impact')}: ${fmt(impBefore.value,0)} → ${fmt(impAfter.value,0)} ${esc(impBefore.unit)}</div>`:''}`;
}
function captureSlot(slot){
  const r=selectedRow();if(!r)return;
  const vals=scenarioValues(),impact=scenarioImpact(r,vals),imp=serviceImpactFor(r,impact.afterGap),opp=opportunityCost(r,impact.horizon,num(q('#v07-gapday-cost')?.value));
  compareSlots[slot]={created:new Date().toISOString(),source:r.source_row,cell:cellCode(r),vals:{...vals},impact:{...impact},serviceImpact:imp?{...imp,unitAr:r.service_impact_unit_ar||imp.unit,unitEn:r.service_impact_unit_en||imp.unit}:null,doNothing:opp};
  renderCompare();
}
function renderCompare(){
  const box=q('#v11-compare-panel');if(!box)return;
  const card=(slot,label)=>{
    const x=compareSlots[slot];if(!x)return `<div class="v11-compare-slot"><h4>${label}</h4><small>${L('التقط الإعدادات الحالية للمقارنة.','Capture the current settings to compare.')}</small></div>`;
    const actionCost=Number.isFinite(x.impact.totalCostSar)?x.impact.totalCostSar:null;
    const avoided=x.doNothing&&Number.isFinite(x.impact.gapDaysAvoided)?x.impact.gapDaysAvoided*x.doNothing.daily:null;
    return `<div class="v11-compare-slot"><h4>${label}</h4><dl><dt>${L('الفجوة عند الأفق','Gap at horizon')}</dt><dd>${fmt(x.impact.afterGap,1)} ${KHPlain.unit()}</dd><dt>${L('الأولوية بعد','Priority after')}</dt><dd>${x.impact.afterPriority??'—'}</dd><dt>${L('تكلفة التدخل','Action cost')}</dt><dd>${actionCost==null?'—':sar(actionCost)}</dd><dt>${L('تكلفة نقص متجنبة','Shortfall cost avoided')}</dt><dd>${avoided==null?'—':sar(avoided)}</dd><dt>${L('أثر الخدمة المتبقي','Remaining service impact')}</dt><dd>${x.serviceImpact?`${fmt(x.serviceImpact.value,0)} ${esc(ar()?x.serviceImpact.unitAr:x.serviceImpact.unitEn)}`:'—'}</dd></dl></div>`;
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
    const b=document.createElement('button');b.className='v11-brief-open-scenario';b.type='button';b.textContent=L('جرّب الحلول في مختبر السيناريو','Compare options in Scenario Lab');
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
  box.innerHTML=topRows(4).map(r=>{const plan=actionPlanFor(r,30),imp=serviceImpactFor(r),loc=sectorCfg(r.sector).locations.find(x=>x.id===r.location)?.[ar()?'ar':'en']||r.location;return `<article class="v11-decision-card ${signalState(r)==='alert'?'alert':''}"><h3>${esc(occupationLabel(r.ssco))} · ${esc(loc)}</h3><p><b>${L('تنبيه','Alert')}:</b> ${L('الخلية تجاوزت عتبة القرار الحالية.','This cell exceeds the current decision threshold.')} ${esc(plan.action)}</p><div class="v11-card-grid"><div><span>${L('الأولوية','Priority')}</span><strong>${decisionPriority(r).score??'—'}</strong></div><div><span>${L('أثر الخدمة','Service impact')}</span><strong>${imp?`${fmt(imp.value,0)} ${esc(imp.unit)}`:'—'}</strong></div><div><span>${L('التكلفة المرجعية','Reference cost')}</span><strong>${plan.cost==null?'—':sar(plan.cost)}</strong></div></div><div class="v11-card-actions"><button disabled title="${L('يتطلب إعداد الصلاحيات والربط بنظام الجهة','Requires access permissions and a connection to your system')}">${L('اعتماد','Approve')}</button><button disabled>${L('رفض','Reject')}</button><button data-v11-card-detail="${esc(r.source_row)}">${L('عرض التفاصيل','View details')}</button></div></article>`}).join('');
  qa('[data-v11-card-detail]',box).forEach(b=>b.onclick=()=>{q('#v11-cards-overlay').classList.remove('open');if(typeof openDrawer==='function')openDrawer(b.dataset.v11CardDetail)});
  q('#v11-cards-overlay').classList.add('open');
}

function renderDataPilot(){
  qa('.connector-card').forEach(c=>c.classList.add('v11-demo-connector'));
  const importLinks=qa('#view-data .import-footer a');
  if(importLinks[0]){importLinks[0].href='sample_position_snapshot_v11.csv';importLinks[0].textContent=L('تحميل لقطة القوى العاملة v1.1','Download Snapshot v1.1')}
  if(importLinks[1]){importLinks[1].href='sample_hr_event_log_v11.csv';importLinks[1].textContent=L('تحميل سجل الأحداث v1.1','Download Event Log v1.1')}
  const ev=q('#v11-event-support');if(ev)ev.innerHTML=`<div class="panel-head compact"><div><span class="panel-kicker">${L('تغطية أحداث الموارد البشرية','HR EVENT COVERAGE')}</span><h3>${L('أحداث قياسية ومتقدمة مدعومة','Standard + advanced workforce events')}</h3></div><code>KHDC-v0.9+</code></div><p style="font-size:9px;color:#647b89">${L('الأحداث المتقدمة لا تُجبر على معنى واحد: role_transformation يمكن أن يحمل skill_gap_fte دون تغيير العدد، بينما long_term_absence يخلق عجزًا مؤقتًا.','Advanced events are not forced into one meaning: role_transformation may carry skill_gap_fte without changing headcount, while long_term_absence creates a temporary capacity gap.')}</p><div class="v11-event-types">${Object.entries(EVENT_LABELS).map(([k,v])=>`<span class="${['long_term_absence','return_from_absence','internal_promotion','role_transformation'].includes(k)?'advanced':''}">${esc(ar()?v[0]:v[1])}</span>`).join('')}</div><div class="v11-compare-actions"><a class="v11-export-btn" href="sample_hr_event_log_v11.csv" download>${L('تحميل عينة الأحداث المتقدمة','Download advanced event sample')}</a><a class="v11-export-btn" href="pilot_reference_presets_v11.json" target="_blank" rel="noreferrer">${L('فتح القيم المرجعية للتجربة المؤسسية','Open pilot reference presets')}</a><a class="v11-export-btn" href="pilot_extension_dictionary_v11.md" target="_blank" rel="noreferrer">${L('دليل التجربة المؤسسية v1.1','Pilot v1.1 dictionary')}</a></div>`;
  const pr=q('#v11-production-readiness');if(pr)pr.innerHTML=`<div class="panel-head compact"><div><span class="panel-kicker">${L('جاهزية قنوات القرار','DECISION DELIVERY READINESS')}</span><h3>${L('ما الذي يعمل الآن وما الذي يتطلب تكامل مؤسسي فعلي','What works now vs what needs production integration')}</h3></div></div><div class="v11-integration-grid"><div class="v11-integration-card"><strong>Microsoft Teams</strong><span>${L('غير متصل','Not connected')}</span><small>${L('في الإنتاج: بطاقة قرار + هوية المستخدم + RBAC + webhook/Graph + سجل موافقة.','Production: decision card + identity + RBAC + webhook/Graph + approval audit.')}</small></div><div class="v11-integration-card"><strong>Slack</strong><span>${L('غير متصل','Not connected')}</span><small>${L('في الإنتاج: تطبيق أو مساعد آلي مصادق عليه مع أزرار إجراء مربوطة بحالة القرار.','Production: authenticated App/Bot with actions tied to decision state.')}</small></div><div class="v11-integration-card"><strong>${L('البريد الإلكتروني','Email')}</strong><span>${L('غير متصل','Not connected')}</span><small>${L('في الإنتاج: رسالة قرار قابلة للتتبع وروابط عميقة للمنصة؛ لا إرسال من النسخة العامة.','Production: traceable decision email with deep links; no sending from the public demo.')}</small></div></div>`;
}

function renderSkillMapPage(){
  const box=q('#v11-skill-map-panel');if(!box)return;
  box.innerHTML=`<div class="panel-head compact"><div><span class="panel-kicker">${L('طبقة المهارات القابلة للنقل','TRANSFERABLE SKILLS LAYER')}</span><h3>${L('هل توجد مهارات داخلية يمكن الاستفادة منها؟','From SSCO gaps to testable skill substitutes')}</h3></div><code>${L('خريطة تجريبية','DEMO MAP')}</code></div><p style="font-size:9px;color:#647b89;line-height:1.6">${L('هذه الخريطة فرضيات التجربة المؤسسية وليست خريطة رسمية من التصنيف السعودي للمهارات. الغرض اختبار سير العمل: بديل محتمل → فجوات مهارية → مدة التأهيل → فحص الأهلية/الترخيص.','These mappings are pilot hypotheses, not official Saudi Skills Taxonomy mappings. They test the workflow: potential substitute → skill gaps → upskill duration → eligibility/licensing check.')}</p><div class="v11-skill-map-grid">${SKILL_MAP.map(m=>{const t=sscoByCode(m.target),s=sscoByCode(m.substitute);return `<div class="v11-skill-map-item"><strong>${esc(t?.[ar()?'ar':'en']||m.target)} ← ${esc(s?.[ar()?'ar':'en']||m.substitute)}</strong><small>${fmt(m.match*100)}% ${L('تطابق تجريبي','illustrative match')} · ${m.days} ${L('يوم تأهيل','day upskill')}<br>${esc(ar()?m.noteAr:m.noteEn)}</small></div>`}).join('')}</div>`;
}

const normalizeAuditText=value=>String(value||'').toLowerCase().normalize('NFKC').replace(/[\u064b-\u065f\u0670]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/[٠-٩]/g,c=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(c)));
function applyAuditFilter(){
  const table=q('#audit-body');if(!table)return;
  const words=normalizeAuditText(q('#v11-audit-search')?.value).trim().split(/\s+/).filter(Boolean),kind=q('#v11-audit-kind')?.value||'',sector=q('#v16-audit-sector')?.value||'',from=q('#v16-audit-from')?.value||'',to=q('#v16-audit-to')?.value||'',order=q('#v16-audit-order')?.value||'newest';
  const records=qa('tr[data-audit-kind]',table);let shown=0;
  records.sort((a,b)=>(Number(a.dataset.auditTime)-Number(b.dataset.auditTime))*(order==='oldest'?1:-1)).forEach(tr=>{const text=normalizeAuditText(tr.innerText+' '+tr.dataset.auditContext+' '+tr.dataset.auditKind),date=tr.dataset.auditDate||'',ok=words.every(word=>text.includes(word))&&(!kind||tr.dataset.auditKind===kind)&&(!sector||tr.dataset.auditSector===sector)&&(!from||date>=from)&&(!to||(date&&date<=to));tr.hidden=!ok;if(ok)shown++;table.appendChild(tr)});
  const n=q('#v11-audit-count');if(n)n.textContent=L(`${shown} من ${records.length} سجل`,`${shown} of ${records.length} records`);
  const empty=q('#v16-audit-empty');if(empty){empty.hidden=shown>0;empty.textContent=from&&to&&from>to?L('تاريخ البداية يجب أن يسبق تاريخ النهاية.','Start date must be on or before end date.'):L('لا توجد نتائج تطابق الفلاتر. جرّب توسيع التاريخ أو مسح الفلاتر.','No records match these filters. Widen the dates or clear the filters.')}
}
document.addEventListener('kinetic:auditrender',()=>patchAuditTools());
function patchAuditTools(){
  const sel=q('#v11-audit-kind'),bar=q('#v11-audit-filter');if(!sel||!bar)return;
  const body=q('#audit-body');if(body?.querySelector('tr')&&!body.querySelector('tr[data-audit-kind]')&&body.querySelector('td')?.colSpan!==6)return;
  const current=sel.value,kinds=[...new Set(qa('#audit-body tr[data-audit-kind]').map(tr=>tr.dataset.auditKind).filter(Boolean))].sort();
  sel.innerHTML=`<option value="">${L('كل أنواع السجل','All record types')}</option>`+kinds.map(k=>`<option value="${esc(k)}">${esc(auditKindLabel(k))}</option>`).join('');if(kinds.includes(current))sel.value=current;
  if(!q('#v16-audit-advanced')){
    bar.insertAdjacentHTML('afterend','<div id="v16-audit-advanced" class="v16-audit-advanced"></div><p id="v16-audit-empty" class="v16-audit-empty" role="status" hidden></p>');
  }
  const advanced=q('#v16-audit-advanced'),language=document.documentElement.lang;
  if(advanced.dataset.language!==language){
    const values=Object.fromEntries(qa('input,select',advanced).map(el=>[el.id,el.value]));
    advanced.innerHTML=`<label><span>${L('القطاع','Sector')}</span><select id="v16-audit-sector"><option value="">${L('كل القطاعات','All sectors')}</option>${Object.entries(CONFIG.sectors).map(([k,v])=>`<option value="${k}">${esc(v[ar()?'ar':'en'])}</option>`).join('')}</select></label><label><span>${L('من تاريخ','From date')}</span><input id="v16-audit-from" type="date"></label><label><span>${L('إلى تاريخ','To date')}</span><input id="v16-audit-to" type="date"></label><label><span>${L('ترتيب السجل','Record order')}</span><select id="v16-audit-order"><option value="newest">${L('الأحدث أولًا','Newest first')}</option><option value="oldest">${L('الأقدم أولًا','Oldest first')}</option></select></label><button id="v16-audit-clear" type="button">${L('مسح الفلاتر','Clear filters')}</button>`;
    advanced.dataset.language=language;
    for(const [id,value] of Object.entries(values)){const el=q('#'+id);if(el)el.value=value}
    qa('input,select',advanced).forEach(el=>el.addEventListener('change',applyAuditFilter));
    q('#v16-audit-clear').onclick=()=>{q('#v11-audit-search').value='';sel.value='';q('#v16-audit-sector').value='';q('#v16-audit-from').value='';q('#v16-audit-to').value='';q('#v16-audit-order').value='newest';applyAuditFilter()};
  }
  q('#v11-audit-search').placeholder=L('ابحث بعدة كلمات: المهنة، الموقع، المصدر، نوع السجل أو التفاصيل','Search multiple words: occupation, location, source, record type or detail');
  q('#v11-audit-search').setAttribute('aria-label',L('البحث في سجل القرارات','Search decision ledger'));sel.setAttribute('aria-label',L('تصفية نوع السجل','Filter record type'));
  applyAuditFilter();
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
  const card=document.createElement('article');card.className='mini-metric v11-buffer-metric';card.innerHTML=`<span>${L('احتياطي داخلي آمن','Safe internal buffer')}</span><strong>${fmt(safe,1)} ${KHPlain.unit()}</strong><small style="display:block;margin-top:4px;color:#6c8391">${L(`${solvable} فجوات يمكن اختبار حلها بالنقل`,`${solvable} gaps have a testable transfer path`)}</small>`;metrics.appendChild(card);applyTransferFilter();
}

function patchArabicTechnicalTerms(){
  if(!ar())return;
  qa('.rate-unit').forEach(el=>{
    if(/100\s*FTE-mo/i.test(el.textContent))el.textContent=el.textContent.replace(/\/100\s*FTE-mo/i,'/100 وظيفة مكافئة-شهر');
  });
  qa('#executive-metrics .exec-metric strong .v09-unit').forEach(el=>{
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

document.addEventListener('kinetic:languagechange',()=>{
  const openIds=['tour','cards'].filter(id=>q('#v11-'+id+'-overlay')?.classList.contains('open'));
  q('#v11-tour-overlay')?.remove();q('#v11-cards-overlay')?.remove();ensureShell();
  for(const id of openIds){if(id==='cards')openDecisionCards();else openTour(true)}
});
function renderStrategic(){
  const search=q('#v11-audit-search');if(search)search.placeholder=L('ابحث في النوع، الخلية، المصدر أو التفاصيل','Search type, cell, source or detail');
  const transfer=q('#v11-transfer-filter');if(transfer)transfer.textContent=L('قابلة للحل بالنقل','Transfer-solvable');
  const tour=q('#v11-tour-btn');if(tour)tour.textContent=L('جولة','Tour');

  ensureStrategicContext();ensureShell();friendlyPeriod();patchArabicTechnicalTerms();renderServiceImpact();renderNextAction();renderDelivery();patchCriticalCards();patchScenario();renderDataPilot();renderSkillMapPage();patchAuditTools();patchGapBuffer();enhanceBrief();updateSidebarToggle();
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