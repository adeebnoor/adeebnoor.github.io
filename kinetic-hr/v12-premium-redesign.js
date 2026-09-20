/* Kinetic HR v1.2 — Premium landing + Scenario Lab redesign */
(()=>{
'use strict';

const V12='KH-VISUAL-v1.2';
const q=(s,r=document)=>r.querySelector(s);
const qa=(s,r=document)=>[...r.querySelectorAll(s)];
const isAr=()=>document.documentElement.dir==='rtl';
const L=(ar,en)=>isAr()?ar:en;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>{if(v==null||String(v).trim()==='')return null;const n=Number(v);return Number.isFinite(n)?n:null};
const fmt=(v,d=0)=>Number.isFinite(Number(v))?new Intl.NumberFormat('en-US',{maximumFractionDigits:d,minimumFractionDigits:0}).format(Number(v)):'—';
const sar=v=>Number.isFinite(Number(v))?new Intl.NumberFormat('en-US',{maximumFractionDigits:0}).format(Number(v))+' '+L('ر.س','SAR'):'—';

function row12(){
  try{
    if(typeof selectedScenarioSource!=='undefined'&&selectedScenarioSource)return getRowBySource(selectedScenarioSource);
    return currentRows().find(r=>deficit(r)>0)||currentRows()[0]||null;
  }catch{return null}
}
function locName(r){
  try{return sectorCfg(r.sector).locations.find(x=>x.id===r.location)?.[isAr()?'ar':'en']||r.location}catch{return r?.location||'—'}
}
function funding12(r){
  if(!r)return{known:false,funded:0,unfunded:0};
  const gap=deficit(r),raw=num(r.funded_fte);
  if(raw==null)return{known:false,funded:0,unfunded:gap};
  const fundedNeed=Math.max(0,Math.min(requiredFte(r),raw));
  const funded=Math.max(0,fundedNeed-availableFte(r));
  return{known:true,funded,unfunded:Math.max(0,gap-funded)};
}
function serviceImpact12(r,gap=null){
  if(!r)return null;
  const per=num(r.service_impact_per_gap_fte);
  if(per==null)return null;
  const g=gap==null?deficit(r):Math.max(0,Number(gap)||0);
  return{
    value:g*per,
    unit:isAr()?(r.service_impact_unit_ar||''):(r.service_impact_unit_en||''),
    label:isAr()?(r.service_impact_label_ar||''):(r.service_impact_label_en||''),
    source:isAr()?(r.service_impact_target_ref_ar||''):(r.service_impact_target_ref_en||'')
  };
}
function gapAge12(r){
  try{return typeof gapAgeDays==='function'?gapAgeDays(r):null}catch{return null}
}
function accel12(r){
  try{
    const s=surveillanceFor(r);
    if(!s?.dataSufficient)return null;
    if(s.ratio==null)return 0;
    return s.ratio;
  }catch{return null}
}
function safePriority(r){
  try{return decisionPriority(r).score??null}catch{return null}
}

function shouldBypassLanding(){
  const p=new URLSearchParams(location.search);
  return p.has('review')||p.has('qa')||p.has('test')||p.has('app')||p.has('view')||String(p.get('v')||'').toLowerCase().includes('ci')||sessionStorage.getItem('kinetic_hr_entered_v12')==='1';
}
function enterApp(view='dashboard'){
  sessionStorage.setItem('kinetic_hr_entered_v12','1');
  document.body.classList.remove('v12-landing-mode');
  if(typeof showView==='function')showView(view);
  window.scrollTo({top:0,behavior:'instant'});
}
function showLanding(){
  document.body.classList.add('v12-landing-mode');
  try{localStorage.setItem('kinetic_hr_onboarding_v11','1')}catch{}
  q('#v11-tour-overlay')?.classList.remove('open');
  window.scrollTo({top:0,behavior:'instant'});
}
function miniChartSvg(){
  return '<svg viewBox="0 0 420 125" aria-hidden="true"><path class="area" d="M10,92 C75,78 105,84 150,65 C210,42 260,59 315,38 C350,28 380,34 410,22 L410,120 L10,120 Z"></path><path class="base" d="M10,68 C80,65 140,58 205,60 C270,58 335,54 410,50"></path><path class="line" d="M10,92 C75,78 105,84 150,65 C210,42 260,59 315,38 C350,28 380,34 410,22"></path></svg>';
}
function landingHtml(){
  const ar=isAr();
  return `
  <div class="v12-landing-nav">
    <div class="v12-brand"><div class="v12-logo">K</div><div class="v12-brand-copy"><strong>Kinetic HR</strong><span>${L('للقوى العاملة… بقرار أذكى','Workforce intelligence for better decisions')}</span></div></div>
    <nav class="v12-landing-links">
      <a href="#v12-idea">${L('الفكرة','Concept')}</a>
      <a href="#v12-features">${L('المزايا','Features')}</a>
      <a href="#v12-value">${L('كيف يفيد المنظومة','System value')}</a>
      <a href="#v12-before-after">${L('قبل وبعد','Before & after')}</a>
      <a href="#v12-modules">${L('نظرة على المنصة','Platform')}</a>
    </nav>
    <div class="v12-landing-actions"><button class="v12-lang" id="v12-lang">${ar?'English':'العربية'} ◉</button><button class="v12-enter" data-v12-enter="dashboard">${L('دخول المنصة ←','Enter platform →')}</button></div>
  </div>

  <section class="v12-hero" id="v12-idea">
    <div class="v12-hero-copy">
      <span class="v12-hero-kicker">● ${L('منصة قرار واستباق للقوى العاملة','WORKFORCE EARLY-WARNING & DECISION INTELLIGENCE')}</span>
      <h1><em>Kinetic HR</em><br>${L('منصة إنذار مبكر وقرار ذكي لفجوات القوى العاملة','Early warning and decision intelligence for workforce gaps')}</h1>
      <p>${L('تكشف المنصة فجوات القوى العاملة قبل أن تتحول إلى أزمة تشغيلية، وتحوّل بيانات الموارد البشرية إلى رؤية تنفيذية تربط الفجوة بأثرها على الخدمة والتمويل والخيارات الممكنة، حتى يصل صانع القرار إلى إجراء واضح يمكن الدفاع عنه وقياس أثره.','Kinetic HR detects workforce gaps before they become operating crises and translates HR data into executive decisions linked to service impact, funding and actionable scenarios.')}</p>
      <div class="v12-hero-cta"><button class="solid" data-v12-enter="dashboard">${L('دخول المنصة ←','Enter platform →')}</button><button class="ghost" data-v12-scroll="v12-before-after">◉ ${L('شاهد مثال قبل وبعد','See before/after example')}</button></div>
      <div class="v12-hero-proof"><span><b>${L('إنذار مبكر','Early warning')}</b><small>${L('قبل تفاقم الفجوة','before gaps escalate')}</small></span><span><b>${L('قرار قابل للتدقيق','Auditable decision')}</b><small>${L('من المصدر إلى الإجراء','source to action')}</small></span><span><b>${L('أثر خدمة واضح','Service impact')}</b><small>${L('بلغة القيادة والمستفيد','executive + citizen language')}</small></span></div>
    </div>
    <div class="v12-hero-visual">
      <div class="v12-laptop">
        <div class="v12-laptop-screen"><div class="v12-mini-app"><div class="v12-mini-main"><div class="v12-mini-top"><strong>${L('مركز قيادة القوى العاملة','Workforce Command Center')}</strong><span>${L('آخر 30 يومًا','Last 30 days')}</span></div><div class="v12-mini-kpis"><div class="v12-mini-kpi"><span>${L('الأولوية','Priority')}</span><b>88</b></div><div class="v12-mini-kpi"><span>${L('الفجوة','Gap')}</span><b>18</b></div><div class="v12-mini-kpi"><span>${L('ممولة','Funded')}</span><b>12</b></div><div class="v12-mini-kpi"><span>${L('غير ممولة','Unfunded')}</span><b>6</b></div></div><div class="v12-mini-chart">${miniChartSvg()}</div><div class="v12-mini-bottom"><div class="v12-mini-panel"></div><div class="v12-mini-panel"></div></div></div><div class="v12-mini-side"><i class="active"></i><i></i><i></i><i></i><i></i></div></div></div>
        <div class="v12-laptop-base"></div>
      </div>
      <div class="v12-floating-note"><b>${L('من بيانات الموارد البشرية إلى قرار يصنع فرقًا حقيقيًا','From HR data to decisions that make a real difference')}</b><span>▥ ▥ ▥ ↗</span></div>
    </div>
  </section>

  <section class="v12-section" id="v12-features">
    <div class="v12-section-head"><div><span>${L('المزايا الرئيسية','CORE CAPABILITIES')}</span><h2>${L('من بيانات الموارد البشرية إلى أثر حقيقي','From workforce data to measurable service impact')}</h2><p>${L('ليس Dashboard آخر. المنصة تجمع القياس، التفسير التنفيذي، السيناريوهات، التمويل، أثر الخدمة وسجل التدقيق في رحلة قرار واحدة.','Not another dashboard. Kinetic HR connects measurement, executive translation, scenarios, funding, service impact and auditability in one decision journey.')}</p></div></div>
    <div class="v12-feature-grid">
      ${featureCard('⌕',L('كشف مبكر للفجوات','Early gap detection'),L('يرصد تدهور القدرة ويقارنها بخط أساس تاريخي قبل أن تتفاقم المشكلة.','Detects deterioration against a historical baseline before it escalates.'))}
      ${featureCard('▣',L('ترجمة تنفيذية للقرار','Executive translation'),L('يحوّل المؤشرات التقنية إلى إجراء مطلوب، توقيت، تكلفة ومخاطر عدم التدخل.','Turns technical metrics into action, timing, cost and inaction risk.'))}
      ${featureCard('↗',L('مختبر السيناريوهات','Scenario Lab'),L('اختبر التوظيف والنقل والتأهيل والتعاقد قبل اعتماد القرار.','Test hiring, transfer, upskilling and contracting before approval.'))}
      ${featureCard('✓',L('قابلية التدقيق','Auditability'),L('كل نتيجة مرتبطة بالمصدر والإصدار والبصمة وسجل القرار.','Every result is tied to source, version, fingerprint and decision history.'))}
      ${featureCard('◎',L('أثر الخدمة','Service impact'),L('يربط فجوة القوى العاملة بما يتأثر فعليًا في الخدمة أو المستفيد.','Connects workforce gaps to actual service or beneficiary impact.'))}
      ${featureCard('⛓',L('جاهزية التكامل','Integration readiness'),L('مصمم ليتصل بـHRMS والمالية وقنوات القرار المؤسسية في بيئة الإنتاج.','Designed for HRMS, finance and enterprise decision-channel integration.'))}
    </div>
  </section>

  <section class="v12-section alt" id="v12-value">
    <div class="v12-section-head"><div><span>${L('قيمة المنظومة','SYSTEM VALUE')}</span><h2>${L('كيف يفيد Kinetic HR كل طرف؟','How Kinetic HR helps each stakeholder')}</h2><p>${L('القيمة لا تتوقف عند إدارة الموارد البشرية؛ القرار يمتد إلى التشغيل والمالية والقيادة وجودة الخدمة.','The value extends beyond HR into operations, finance, leadership and service quality.')}</p></div></div>
    <div class="v12-stakeholders">
      ${stakeCard('◉',L('قيادات الموارد البشرية','HR leaders'),L('تخطيط أدق، تمييز الممول وغير الممول، ومسارات تدخل قابلة للتنفيذ.','Better planning, funded/unfunded distinction and executable intervention paths.'))}
      ${stakeCard('⚙',L('الجهات التشغيلية','Operations'),L('تحديد أين تتعرض استمرارية الخدمة للخطر وأين يمكن إعادة توزيع القدرة.','See where service continuity is at risk and where capacity can be rebalanced.'))}
      ${stakeCard('▥',L('القيادات التنفيذية','Executives'),L('أولوية قرار واحدة مدعومة بالأثر والتكلفة والمخاطر والبدائل.','One decision priority supported by impact, cost, risk and alternatives.'))}
      ${stakeCard('⌂',L('الجهات الحكومية','Government entities'),L('رفع كفاءة الإنفاق واستدامة الخدمة مع مسار تدقيق مؤسسي واضح.','Improve spending efficiency and service resilience with an auditable trail.'))}
    </div>
  </section>

  <section class="v12-section soft" id="v12-before-after">
    <div class="v12-section-head"><div><span>${L('قبل وبعد','BEFORE & AFTER')}</span><h2>${L('من استجابة متأخرة إلى جاهزية استباقية','From reactive staffing to proactive workforce readiness')}</h2><p>${L('المثال أدناه مأخوذ من بيانات العرض التجريبية، وليس من بيانات جهة حكومية حقيقية.','The example below uses synthetic demo data, not live government data.')}</p></div></div>
    <div class="v12-before-after">
      <div class="v12-ba after"><span class="v12-ba-tag">${L('بعد Kinetic HR','After')}</span><h3>${L('قرار واضح قبل أن تتفاقم المشكلة','A clear decision before the problem escalates')}</h3><ul><li>${L('إنذار مبكر مبني على خط أساس تاريخي','Early warning based on historical baseline')}</li><li>${L('تمييز الفجوة الممولة وغير الممولة','Funded vs unfunded gap distinction')}</li><li>${L('أثر الخدمة ظاهر بلغة المستفيد','Service impact stated in beneficiary terms')}</li><li>${L('اختبار النقل والتوظيف والتأهيل قبل القرار','Test transfer, hiring and upskilling before approval')}</li><li>${L('مسار قرار قابل للتدقيق والإعادة','Auditable and reproducible decision trail')}</li></ul><div class="v12-example" id="v12-example"></div></div>
      <div class="v12-vs"><b>VS</b></div>
      <div class="v12-ba before"><span class="v12-ba-tag">${L('قبل','Before')}</span><h3>${L('رؤية مجزأة ومخاطر تظهر متأخرة','Fragmented visibility and late risk recognition')}</h3><ul><li>${L('الفجوة تظهر كرقم HR دون أثر خدمة واضح','Gap appears as an HR number without service impact')}</li><li>${L('لا تمييز واضح بين الحاجة والتمويل المعتمد','Operational need and approved funding are mixed')}</li><li>${L('قرارات النقل أو التوظيف تعتمد على البحث اليدوي','Transfer and hiring decisions rely on manual search')}</li><li>${L('صعوبة مقارنة تكلفة التدخل مع عدم التدخل','Action cost is not compared with inaction')}</li><li>${L('المعرفة والقرارات موزعة بين ملفات ورسائل','Decision memory is scattered across files and messages')}</li></ul></div>
    </div>
  </section>

  <section class="v12-section" id="v12-modules">
    <div class="v12-section-head"><div><span>${L('نظرة على المنصة','PLATFORM MODULES')}</span><h2>${L('رحلة قرار متكاملة من الإشارة إلى الإجراء','An integrated journey from signal to action')}</h2></div></div>
    <div class="v12-module-grid">
      ${moduleCard(L('مركز القيادة','Command Center'),L('الرؤية التنفيذية في مكان واحد','Executive visibility in one place'))}
      ${moduleCard(L('مختبر السيناريو','Scenario Lab'),L('محاكاة الخيارات وقياس أثرها','Simulate options and compare impact'))}
      ${moduleCard(L('الذاكرة المؤسسية','Institutional Memory'),L('توثيق القرارات والمصدر والمنهج','Document decisions, sources and methods'))}
      ${moduleCard(L('بوابة الجودة','Quality Gate'),L('فحص صلاحية البيانات قبل القياس','Validate data before measurement'))}
    </div>
  </section>

  <section class="v12-final-cta"><div><h2>${L('ابدأ من الفجوة… وانتهِ بقرار يمكن الدفاع عنه','Start with the gap. End with a defensible decision.')}</h2><p>${L('ادخل المنصة واستعرض الرحلة الكاملة باستخدام بيانات Pilot التجريبية.','Enter the platform and explore the full journey using synthetic pilot data.')}</p></div><button data-v12-enter="dashboard">${L('دخول المنصة ←','Enter platform →')}</button></section>
  <footer class="v12-footer"><div class="v12-brand"><div class="v12-logo">K</div><div class="v12-brand-copy"><strong>Kinetic HR</strong><span>${L('لقوى عاملة أكثر جاهزية','For a more ready workforce')}</span></div></div><small>${L('نسخة Pilot عامة · البيانات المعروضة تركيبية وليست بيانات جهة حكومية فعلية','Public pilot · displayed data are synthetic, not live government data')}</small></footer>
  `;
}
function featureCard(icon,title,body){return `<article class="v12-feature"><div class="v12-feature-icon">${icon}</div><h3>${title}</h3><p>${body}</p></article>`}
function stakeCard(icon,title,body){return `<article class="v12-stake"><div class="v12-stake-icon">${icon}</div><div><h3>${title}</h3><p>${body}</p></div></article>`}
function moduleCard(title,body){return `<article class="v12-module"><div class="v12-module-preview"><i></i><i></i></div><h3>${title}</h3><p>${body}</p></article>`}

function injectLanding(){
  let land=q('#v12-landing');
  if(!land){land=document.createElement('div');land.id='v12-landing';document.body.prepend(land)}
  land.innerHTML=landingHtml();
  qa('[data-v12-enter]',land).forEach(b=>b.onclick=()=>enterApp(b.dataset.v12Enter||'dashboard'));
  qa('[data-v12-scroll]',land).forEach(b=>b.onclick=()=>q('#'+b.dataset.v12Scroll)?.scrollIntoView({behavior:'smooth'}));
  const lb=q('#v12-lang',land);
  if(lb)lb.onclick=()=>{q('#lang-toggle')?.click();setTimeout(()=>{injectLanding();if(document.body.classList.contains('v12-landing-mode'))showLanding()},40)};
  renderLandingExample();
}
function renderLandingExample(){
  const box=q('#v12-example');if(!box)return;
  let r=null;try{r=currentRows().find(x=>deficit(x)>0)||currentRows()[0]}catch{}
  if(!r){box.innerHTML='';return}
  const f=funding12(r),imp=serviceImpact12(r),age=gapAge12(r),ratio=accel12(r);
  let transfer=0;
  try{
    const donor=SNAPSHOTS.filter(d=>d.sector===r.sector&&String(d.ssco)===String(r.ssco)&&cellCode(d)!==cellCode(r)&&surplus(d)>0).sort((a,b)=>surplus(b)-surplus(a))[0];
    if(donor)transfer=Math.max(0,surplus(donor)-requiredFte(donor)*.05);
  }catch{}
  box.innerHTML=`<div><span>${L('الفجوة الحالية','Current gap')}</span><strong>${fmt(deficit(r),1)} ${KHPlain.unit()}</strong></div><div><span>${L('التمويل','Funding')}</span><strong>${f.known?`${fmt(f.funded,1)} ${L('بتمويل متاح','funded')} · ${fmt(f.unfunded,1)} ${L('تحتاج تمويلًا','need funding')}`:'—'}</strong></div><div><span>${L('أثر الخدمة','Service impact')}</span><strong>${imp?`${fmt(imp.value,0)} ${esc(imp.unit)}`:'—'}</strong></div><div><span>${L('تغطية داخلية يمكن بحث نقلها','Capacity to consider for transfer')}</span><strong>${transfer?fmt(transfer,1)+' '+KHPlain.unit():'—'}</strong></div>`;
}

function ensureOverviewButton(){
  const top=q('.top-actions');const existing=q('#v12-overview-btn');if(existing)existing.textContent=L('عن المنصة','Overview');if(!top||existing)return;
  const b=document.createElement('button');b.id='v12-overview-btn';b.className='utility-btn';b.type='button';b.textContent=L('عن المنصة','Overview');b.onclick=()=>{sessionStorage.removeItem('kinetic_hr_entered_v12');injectLanding();showLanding()};top.insertBefore(b,top.firstChild);
}

function ensureScenarioStructure(){
  const view=q('#view-scenario');if(!view)return;
  if(!q('#v12-scenario-head',view)){
    const head=document.createElement('div');head.id='v12-scenario-head';head.className='v12-scenario-head';
    head.innerHTML=`<div class="v12-scenario-title"><div class="v12-scenario-icon">⚗</div><div><small>${L('الرئيسية  ‹  مختبر السيناريو','Home  ‹  Scenario Lab')}</small><h2>${L('مختبر السيناريو','Scenario Lab')}</h2><p>${L('اختبر القرار وقارن أثره على الفجوة والخدمة والتمويل قبل الاعتماد.','Test a decision and compare its effect on workforce gap, service and funding before approval.')}</p></div></div><div class="v12-period-card"><i>◷</i><div><span>${L('الفترة الزمنية','Time horizon')}</span><strong id="v12-period-value">—</strong></div><em>${L('نشط','Active')}</em></div>`;
    view.prepend(head);
  }
  if(!q('#v12-scenario-kpis',view)){
    const k=document.createElement('div');k.id='v12-scenario-kpis';k.className='v12-scenario-kpis';q('.scenario-shell',view)?.insertAdjacentElement('beforebegin',k);
  }
  const result=q('.scenario-result',view);
  if(result&&!q('#v12-scenario-viz',result)){
    const viz=document.createElement('div');viz.id='v12-scenario-viz';viz.className='v12-scenario-viz';result.prepend(viz);
  }
  const controls=q('.scenario-controls',view);
  const compare=q('#v11-compare-panel');
  // Comparison is placed alongside the skills panel below the two-column workspace.

  if(!q('#v12-scenario-extras',view)){
    const ex=document.createElement('div');ex.id='v12-scenario-extras';ex.className='v12-scenario-extras';q('.scenario-shell',view)?.insertAdjacentElement('afterend',ex);
  }
  const extras=q('#v12-scenario-extras',view),skills=q('#v11-skills'),saved=q('.saved-scenarios-panel',view);
  if(extras&&skills&&skills.parentElement!==extras)extras.appendChild(skills);
  if(extras&&compare&&compare.parentElement!==extras)extras.appendChild(compare);
  if(extras&&saved&&saved.parentElement!==extras)extras.appendChild(saved);
}
function scenarioVals12(){
  try{return scenarioValues()}catch{return{horizonDays:Number(q('#scenario-horizon')?.value||180),hire:Number(q('#hire-range')?.value||0),transfer:Number(q('#transfer-range')?.value||0),upskill:Number(q('#upskill-range')?.value||0),contract:Number(q('#contract-range')?.value||0)}}
}
function impact12(r,vals){
  try{return scenarioImpact(r,vals)}catch{return{beforeGap:deficit(r),afterGap:deficit(r),afterPriority:safePriority(r),horizon:Number(vals.horizonDays||180),actualTransfer:Number(vals.transfer||0)}}
}
function sampledGap12(r,vals,impact,day){
  try{
    if(typeof interventionEffectAtDay==='function'){
      const tr=impact.actualTransfer??Number(vals.transfer||0);
      const gain=
        interventionEffectAtDay('hire',Number(vals.hire||0),day,r)+
        interventionEffectAtDay('transfer',tr,day,r)+
        interventionEffectAtDay('upskill',Number(vals.upskill||0),day,r)+
        interventionEffectAtDay('contract',Number(vals.contract||0),day,r);
      return Math.max(0,requiredFte(r)-(availableFte(r)+gain));
    }
  }catch{}
  const h=Math.max(1,Number(impact.horizon||vals.horizonDays||180));
  return impact.beforeGap+(impact.afterGap-impact.beforeGap)*(day/h);
}
function linePath(points,w,h,p,max){
  return points.map((v,i)=>{const x=p+i*(w-2*p)/(points.length-1),y=h-p-(v/max)*(h-2*p);return `${i?'L':'M'}${x.toFixed(1)},${y.toFixed(1)}`}).join(' ');
}
function areaPath(points,w,h,p,max){
  const line=linePath(points,w,h,p,max);const endX=w-p,startX=p,base=h-p;return `${line} L${endX},${base} L${startX},${base} Z`;
}
function renderScenarioViz(){
  const box=q('#v12-scenario-viz'),r=row12();if(!box||!r)return;
  const vals=scenarioVals12(),impact=impact12(r,vals),horizon=Math.max(30,Number(impact.horizon||vals.horizonDays||180)),samples=7;
  const gaps=[],base=[];for(let i=0;i<samples;i++){const day=Math.round(horizon*i/(samples-1));gaps.push(sampledGap12(r,vals,impact,day));base.push(deficit(r))}
  const max=Math.max(1,...base,...gaps)*1.12,w=620,h=260,p=40;
  const path=linePath(gaps,w,h,p,max),bpath=linePath(base,w,h,p,max),area=areaPath(gaps,w,h,p,max);
  const impBefore=serviceImpact12(r,impact.beforeGap),impAfter=serviceImpact12(r,impact.afterGap),priority=safePriority(r);
  box.innerHTML=`<div class="v12-chart-card"><div class="v12-chart-head"><div><strong>${L('أثر التدخل المتوقع على الفجوة','Expected intervention effect on the gap')}</strong><small>${L('المسار الأخضر يوضح السيناريو الحالي، والخط المتقطع يمثل عدم التدخل.','Green shows the current scenario; dotted gray represents no intervention.')}</small></div><div class="v12-chart-legend"><span><i></i>${L('مع التدخل','With action')}</span><span><i class="base"></i>${L('بدون تدخل','No action')}</span></div></div><div class="v12-chart-svg"><svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${L('الفجوة المتوقعة خلال الأفق الزمني','Projected workforce gap over the selected horizon')}"><g stroke="#edf2f5" stroke-width="1">${[0,1,2,3].map(i=>{const y=p+i*(h-2*p)/3;return `<line x1="${p}" x2="${w-p}" y1="${y}" y2="${y}"/><text x="${p-10}" y="${y+4}" text-anchor="end" font-size="12" fill="#6882a1" stroke="none">${fmt(max*(1-i/3),1)}</text>`}).join('')}</g><path d="${area}" fill="rgba(13,179,154,.10)"/><path d="${bpath}" fill="none" stroke="#aab8c4" stroke-width="2.4" stroke-dasharray="6 6"/><path d="${path}" fill="none" stroke="#0db39a" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>${gaps.map((v,i)=>{const x=p+i*(w-2*p)/(samples-1),y=h-p-(v/max)*(h-2*p);return `<circle cx="${x}" cy="${y}" r="4.5" fill="#0db39a"/><text x="${x}" y="${h-7}" text-anchor="middle" font-size="12" fill="#567493">${Math.round(horizon*i/(samples-1))} ${L('يوم','d')}</text>`}).join('')}</svg></div></div><div class="v12-outcome-stack"><article class="v12-outcome"><span>${L('الفجوة الحالية','Current gap')}</span><strong>${fmt(impact.beforeGap,1)} ${KHPlain.unit()}</strong><small>${L('قبل التدخل','before action')}</small></article><article class="v12-outcome good"><span>${L('النقص المتوقع بنهاية المدة','Shortfall at period end')}</span><strong>${fmt(impact.afterGap,1)} ${KHPlain.unit()}</strong><small>${L('بعد السيناريو','after scenario')}</small></article><article class="v12-outcome"><span>${L('أولوية القرار','Decision priority')}</span><strong>${priority??'—'} → ${impact.afterPriority??'—'}</strong><small>${L('أثر القرار على الأولوية','priority effect')}</small></article><article class="v12-outcome good"><span>${L('أثر الخدمة المتبقي','Remaining service impact')}</span><strong>${impAfter?`${fmt(impAfter.value,0)} ${esc(impAfter.unit)}`:'—'}</strong><small>${impBefore&&impAfter?L(`من ${fmt(impBefore.value,0)} قبل التدخل`,`from ${fmt(impBefore.value,0)} before action`):L('أدخل بيانات أثر الخدمة','service impact input required')}</small></article></div>`;
}
function renderScenarioKpis(){
  const box=q('#v12-scenario-kpis'),r=row12();if(!box||!r)return;
  const vals=scenarioVals12(),impact=impact12(r,vals),f=funding12(r),svc=serviceImpact12(r,impact.afterGap),priority=safePriority(r),horizon=Number(q('#scenario-horizon')?.value||impact.horizon||180);
  const days=L('يوم','days');
  box.innerHTML=`
  <article class="v12-skpi red"><div class="v12-skpi-icon">◎</div><div><span>${L('أولوية القرار','Decision priority')}</span><strong>${priority??'—'} / 100</strong><small>${priority>=70?L('عالية','High'):priority>=45?L('متوسطة','Medium'):L('منخفضة','Low')}</small></div></article>
  <article class="v12-skpi"><div class="v12-skpi-icon">◉</div><div><span>${L('الفجوة الحالية','Current gap')}</span><strong>${fmt(deficit(r),1)} ${KHPlain.unit()}</strong><small>${esc(occupationLabel(r.ssco))}</small></div></article>
  <article class="v12-skpi"><div class="v12-skpi-icon">▤</div><div><span>${L('حالة تمويل النقص','Shortfall funding')}</span><strong>${f.known?`${fmt(f.funded,1)} ${L('بتمويل متاح','funded')} · ${fmt(f.unfunded,1)} ${L('تحتاج تمويلًا','need funding')}`:'—'}</strong><small>${L('من النقص الحالي، بدوام كامل','Full-time equivalents of the current shortfall')}</small></div></article>
  <article class="v12-skpi teal"><div class="v12-skpi-icon">▥</div><div><span>${L('أثر الخدمة بعد السيناريو','Service impact after scenario')}</span><strong>${svc?`${fmt(svc.value,0)}`:'—'}</strong><small>${svc?esc(svc.unit):L('غير معرف لهذه الخلية','not defined for this cell')}</small></div></article>
  <article class="v12-skpi teal"><div class="v12-skpi-icon">◷</div><div><span>${L('أفق السيناريو','Scenario horizon')}</span><strong>${fmt(horizon)} ${days}</strong><small>${horizon===180?L('6 أشهر تقريبًا','about 6 months'):''}</small></div></article>`;
  const period=q('#v12-period-value');if(period)period.textContent=`${fmt(horizon)} ${days}`;
}
function renderScenarioPremium(){
  ensureScenarioStructure();renderScenarioKpis();renderScenarioViz();
}
function ensureAppPolish(){
  ensureOverviewButton();
  const side=q('.brand-copy span');if(side)side.textContent=L('إنذار مبكر وقرار أذكى','Early warning. Smarter decisions.');
  const scenarioNav=q('.nav-item[data-view="scenario"] .nav-icon');if(scenarioNav)scenarioNav.textContent='⚗';
}

let scheduled=false;
function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;ensureAppPolish();renderScenarioPremium();if(q('#v12-landing')&&document.body.classList.contains('v12-landing-mode'))renderLandingExample()})}
function wrap(name){
  try{
    const fn=window[name];if(typeof fn!=='function'||fn.__v12)return;
    const w=function(...args){const out=fn.apply(this,args);schedule();return out};w.__v12=true;window[name]=w;
  }catch{}
}
['renderAll','renderScenario','showView','renderDashboard'].forEach(wrap);

document.addEventListener('DOMContentLoaded',()=>{
  setTimeout(()=>{
    injectLanding();ensureAppPolish();renderScenarioPremium();
    if(shouldBypassLanding())document.body.classList.remove('v12-landing-mode');else showLanding();
    q('#lang-toggle')?.addEventListener('click',()=>setTimeout(()=>{injectLanding();ensureAppPolish();renderScenarioPremium()},30));
  },0);
});
})();