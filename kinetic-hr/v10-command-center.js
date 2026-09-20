/* Kinetic HR v1.0 — Command Center interaction + bidi normalization */
(()=>{
'use strict';

const q=(s,r=document)=>r.querySelector(s);
const qa=(s,r=document)=>[...r.querySelectorAll(s)];
const isAr=()=>document.documentElement.dir==='rtl';

const DIGITS={'٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9','۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9'};
function westernText(s){
  return String(s??'')
    .replace(/[٠-٩۰-۹]/g,c=>DIGITS[c]||c)
    .replace(/٫/g,'.')
    .replace(/٬/g,',')
    .replace(/٪/g,'%');
}
function westernize(root=document.body){
  if(!root)return;
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  const nodes=[];
  while(walker.nextNode())nodes.push(walker.currentNode);
  nodes.forEach(n=>{
    const p=n.parentElement;
    if(!p||['SCRIPT','STYLE','TEXTAREA'].includes(p.tagName))return;
    const next=westernText(n.nodeValue);
    if(next!==n.nodeValue)n.nodeValue=next;
  });
}

const DEMAND_AR={
  'workload-derived':'مشتق من عبء العمل',
  'workload derived':'مشتق من عبء العمل',
  'service-standard':'معيار خدمة',
  'service standard':'معيار خدمة',
  'strategic-scenario':'سيناريو استراتيجي',
  'strategic scenario':'سيناريو استراتيجي',
  'approved-establishment':'ملاك وظيفي معتمد',
  'approved establishment':'ملاك وظيفي معتمد',
  'budgeted':'معتمد في الميزانية'
};
const DEMAND_EN={
  'مشتق من عبء العمل':'Workload-derived',
  'معيار خدمة':'Service standard',
  'سيناريو استراتيجي':'Strategic scenario',
  'ملاك وظيفي معتمد':'Approved establishment',
  'معتمد في الميزانية':'Budgeted'
};

function replaceDemandText(text){
  let out=String(text||'');
  if(isAr()){
    for(const [k,v] of Object.entries(DEMAND_AR))out=out.replaceAll(k,v);
  }else{
    for(const [k,v] of Object.entries(DEMAND_EN))out=out.replaceAll(k,v);
  }
  return out;
}
function patchDemandBasis(){
  qa('.demand-basis').forEach(el=>{
    const next=replaceDemandText(el.textContent);
    if(next!==el.textContent)el.textContent=next;
    el.classList.add('kh-code-badge');
  });
  qa('#decision-queue .queue-item small').forEach(el=>{
    const next=replaceDemandText(el.textContent);
    if(next!==el.textContent)el.textContent=next;
  });
}

const AR_LABELS={
  'KINETIC PULSE':'نبض القدرة',
  'DECISION QUEUE':'قرارات تتطلب إجراء',
  'CAPACITY HOTSPOTS':'بؤر فجوة القدرة',
  'MEASUREMENT INTEGRITY':'نزاهة القياس',
  'WORKFORCE COMMAND CENTER':'مركز قيادة القوى العاملة',
  'EARLY WARNING':'الإنذار المبكر',
  'PREVALENCE':'نقص القدرة الحالي',
  'CURRENT CAPACITY GAP · PREVALENCE':'نقص القدرة الحالي',
  'NEW GAP RATE · INCIDENCE':'معدل نشوء فجوة جديدة',
  'SCENARIO LAB':'مختبر السيناريو',
  'OCCUPATIONAL BACKBONE':'البنية المهنية',
  'WORKFORCE CELL COMPOSER':'تركيب خلية مهنية',
  'DATA HUB':'مركز البيانات',
  'STOCK / PREVALENCE':'الحالة الحالية',
  'CURRENT STATE · PREVALENCE':'الحالة الحالية',
  'FLOW / INCIDENCE':'نشوء الفجوات',
  'NEW GAP FLOW · INCIDENCE':'نشوء الفجوات',
  'DATA QUALITY GATE':'بوابة جودة البيانات',
  'DATA CONTRACT':'عقد البيانات',
  'INSTITUTIONAL MEMORY':'الذاكرة المؤسسية',
  'PROVENANCE':'المصدر والمنهج',
  'AI BOUNDARY':'حدود الذكاء الاصطناعي',
  'REPRODUCIBLE LEDGER':'السجل القابل للإعادة',
  'BEFORE → AFTER':'قبل ← بعد',
  'PUBLISHED DATA DICTIONARY':'قاموس البيانات المنشور',
  'DECISION READINESS':'جاهزية القرار',
  'EXECUTIVE TRANSLATION · الترجمة التنفيذية':'الترجمة التنفيذية',
  'EXECUTIVE TRANSLATION':'الترجمة التنفيذية'
};
const EN_LABELS=Object.fromEntries(Object.entries(AR_LABELS).map(([en,ar])=>[ar,en]));

function patchLabels(){
  const els=qa('.panel-kicker,.section-kicker,.hero-kicker,#v07-exec-translation .v07-exec-head span');
  els.forEach(el=>{
    const raw=el.textContent.trim();
    const next=isAr()?(AR_LABELS[raw]||raw):(EN_LABELS[raw]||raw);
    if(next!==raw)el.textContent=next;
  });
  const eyebrow=q('.eyebrow');
  if(eyebrow&&isAr())eyebrow.textContent='بنية الإنذار المبكر للقوى العاملة';
  const trust=qa('.trust-strip b');
  if(trust.length>=3){
    trust[0].textContent='SSCO';
    trust[1].textContent=isAr()?'سجل الأحداث':'Event history';
    trust[2].textContent=isAr()?'التدقيق':'Audit trail';
  }
  const briefBtn=q('#v07-brief-btn');
  if(briefBtn)briefBtn.textContent=isAr()?'التقرير التنفيذي':'Executive Brief';
  const inline=q('.v07-inline-brief');
  if(inline)inline.textContent=isAr()?'فتح التقرير التنفيذي':'Open executive brief';
}

function markHierarchy(){
  const ms=qa('#executive-metrics .exec-metric');
  ms.forEach(x=>x.classList.remove('kh-primary-kpi'));
  if(ms[2])ms[2].classList.add('kh-primary-kpi');
  const technical=qa('.exec-metric strong,.signal-metric strong,.rate-unit,.v09-unit,.period-chip b,.queue-score,.priority-number,.hotspot-row>b,.v07-funding-strip b,.v07-brief-summary b,.v07-brief-item small,code');
  technical.forEach(el=>{
    el.classList.add('kh-ltr');
    el.setAttribute('dir','ltr');
  });
}

function patchBriefContent(){
  const overlay=q('#v07-brief-overlay');
  if(!overlay)return;
  westernize(overlay);
  qa('.v07-brief-summary span',overlay).forEach(el=>{
    if(isAr()&&el.textContent.trim()==='Gap incidence')el.textContent='معدل نشوء الفجوة';
  });
  qa('.v07-brief-item small',overlay).forEach(el=>{
    if(!isAr())return;
    let t=el.textContent;
    t=t.replaceAll('Priority','الأولوية')
       .replaceAll('Funding','التمويل')
       .replaceAll('Team pressure','ضغط الفريق')
       .replaceAll('Transferable internal capacity','قدرة داخلية قابلة للنقل');
    if(t!==el.textContent)el.textContent=t;
  });
  const sheet=q('.v07-brief-sheet',overlay);const existingClose=q('.kh-brief-close-top',sheet||overlay);if(existingClose)existingClose.setAttribute('aria-label',isAr()?'إغلاق التقرير':'Close report');
  if(sheet&&!q('.kh-brief-close-top',sheet)){
    const close=document.createElement('button');
    close.type='button';
    close.className='kh-brief-close-top';
    close.setAttribute('aria-label',isAr()?'إغلاق التقرير':'Close report');
    close.textContent='×';
    close.onclick=()=>closeBrief();
    sheet.prepend(close);
  }
  qa('.v07-brief-summary b,.v07-brief-item small,.v07-brief-sheet code',overlay).forEach(el=>{
    el.classList.add('kh-ltr');
    el.setAttribute('dir','ltr');
  });
}

function closeBrief(){
  q('#v07-brief-overlay')?.classList.remove('open');
  document.body.classList.remove('kh-brief-open');
}

function wireBrief(){
  const overlay=q('#v07-brief-overlay');
  if(!overlay)return;
  const buttons=[q('#v07-brief-btn'),q('.v07-inline-brief')].filter(Boolean);
  buttons.forEach(btn=>{
    if(btn.dataset.khBriefWired==='1')return;
    btn.dataset.khBriefWired='1';
    const original=btn.onclick;
    btn.onclick=function(ev){
      const result=original?.call(this,ev);
      requestAnimationFrame(()=>{
        if(overlay.classList.contains('open')){
          document.body.classList.add('kh-brief-open');
          patchBriefContent();
        }
      });
      return result;
    };
  });
  const oldClose=q('#v07-close-brief');
  if(oldClose&&oldClose.dataset.khBriefClose!=='1'){
    oldClose.dataset.khBriefClose='1';
    oldClose.addEventListener('click',()=>document.body.classList.remove('kh-brief-open'));
  }
  if(overlay.dataset.khBackdropClose!=='1'){
    overlay.dataset.khBackdropClose='1';
    overlay.addEventListener('click',e=>{if(e.target===overlay)closeBrief()});
  }
  if(document.documentElement.dataset.khBriefEsc!=='1'){
    document.documentElement.dataset.khBriefEsc='1';
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&overlay.classList.contains('open'))closeBrief()});
  }
}

let queued=false;
function patchAll(){
  queued=false;
  patchLabels();
  patchDemandBasis();
  markHierarchy();
  westernize(document.body);
  wireBrief();
  if(q('#v07-brief-overlay.open')){
    document.body.classList.add('kh-brief-open');
    patchBriefContent();
  }
}
function schedulePatch(){
  if(queued)return;
  queued=true;
  queueMicrotask(patchAll);
}

function wrap(name){
  try{
    const fn=window[name];
    if(typeof fn!=='function'||fn.__khV10)return;
    const wrapped=function(...args){const out=fn.apply(this,args);schedulePatch();return out};
    wrapped.__khV10=true;
    window[name]=wrapped;
  }catch{}
}
['renderAll','renderDashboard','renderDecisionQueue','renderSignals','renderGaps','renderScenario','renderDataHub','renderAudit','showView'].forEach(wrap);

document.addEventListener('DOMContentLoaded',()=>setTimeout(patchAll,0));
})();