/* Kinetic HR v0.8 — HR Executive Reality layer
   Adds executive translation, funded/unfunded actionability, team-strain priority,
   finance-readiness gates, and approval/budget reality without inventing cost data. */
(()=>{
'use strict';

const VERSION='KH-HR-EXPERT-v0.8';
const PRIORITY_VERSION='KH-PRIORITY-v0.8';
const STRAIN_MODEL='KH-TEAM-STRAIN-v0.8';
const q=(s,r=document)=>r.querySelector(s);
const qa=(s,r=document)=>[...r.querySelectorAll(s)];
const isAr=()=>document.documentElement.dir==='rtl';
const L=(ar,en)=>isAr()?ar:en;
const esc8=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=v=>{if(v==null||String(v).trim()==='')return null;const x=Number(v);return Number.isFinite(x)?x:null};
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const fmt8=(v,d=1)=>Number.isFinite(v)?new Intl.NumberFormat(isAr()?'ar-SA':'en-US',{maximumFractionDigits:d,minimumFractionDigits:0}).format(v):'—';
const sar=v=>Number.isFinite(v)?new Intl.NumberFormat(isAr()?'ar-SA':'en-US',{maximumFractionDigits:0}).format(v)+' '+L('ر.س','SAR'):'—';

let fundingFilter='all';

function fundingV8(r){
  const need=requiredFte(r),avail=availableFte(r),gap=Math.max(0,need-avail),raw=n(r.funded_fte);
  if(raw==null)return{known:false,fundedGap:null,unfundedGap:null,status:'unknown',fundedNeed:null};
  const fundedNeed=clamp(raw,0,need);
  const fundedGap=Math.max(0,Math.min(fundedNeed,need)-avail);
  const unfundedGap=Math.max(0,gap-fundedGap);
  const status=gap<=0?'covered':fundedGap>0&&unfundedGap>0?'mixed':unfundedGap>0?'unfunded':'funded';
  return{known:true,fundedGap,unfundedGap,status,fundedNeed};
}

function strainV8(r){
  const u=n(r.utilization_rate),o=n(r.overtime_hours_per_fte_month),s=n(r.sick_leave_rate);
  const present=[u,o,s].filter(Number.isFinite).length;
  if(present<2)return{known:false,score:null,band:'unknown',inputs:{utilization:u,overtime:o,sickLeave:s}};
  let weighted=0,w=0;
  if(Number.isFinite(u)){weighted+=.50*clamp((u-.80)/.20);w+=.50}
  if(Number.isFinite(o)){weighted+=.30*clamp(o/25);w+=.30}
  if(Number.isFinite(s)){weighted+=.20*clamp(s/.08);w+=.20}
  const score=Math.round(100*(w?weighted/w:0));
  return{known:true,score,band:score>=70?'high':score>=45?'medium':'low',inputs:{utilization:u,overtime:o,sickLeave:s}};
}

function aggregateFundingV8(rows=currentRows()){
  let funded=0,unfunded=0,unknown=0;
  rows.forEach(r=>{
    const f=fundingV8(r),g=deficit(r);
    if(!f.known){unknown+=g;return}
    funded+=f.fundedGap;unfunded+=f.unfundedGap;
  });
  return{funded,unfunded,unknown};
}

const priorityBase=(typeof decisionPriority==='function')?decisionPriority:null;
if(priorityBase){
  decisionPriority=function(r){
    const base=priorityBase(r);
    const st=strainV8(r);
    const hasSurveillance=!!surveillanceFor(r);
    const weights=hasSurveillance
      ? {velocity:.30,burden:.35,resolvability:.20,teamStrain:.15}
      : {burden:.50,resolvability:.30,teamStrain:.20};
    const components={...base.components,teamStrain:st.known?st.score:null};
    let total=0,wSum=0;
    Object.entries(weights).forEach(([k,w])=>{
      const v=components[k];
      if(Number.isFinite(v)){total+=v*w;wSum+=w}
    });
    const score=wSum?Math.round(total/wSum):base.score;
    return{
      ...base,
      score,
      components,
      priorityPolicy:PRIORITY_VERSION,
      teamStrainBand:st.band,
      teamStrainKnown:st.known
    };
  };
}

const fingerprintBase=(typeof stableStateFingerprint==='function')?stableStateFingerprint:null;
if(fingerprintBase&&typeof sha256==='function'){
  stableStateFingerprint=function(){
    const base=fingerprintBase();
    const payload=`${base}|${PRIORITY_VERSION}|${STRAIN_MODEL}|weights:30-35-20-15`;
    return 'SHA256-'+sha256(payload).toUpperCase();
  };
}

const auditStateBase=(typeof auditState==='function')?auditState:null;
if(auditStateBase){
  auditState=function(){
    const a=auditStateBase();
    return{...a,priorityPolicy:PRIORITY_VERSION,teamStrainModel:STRAIN_MODEL,decisionLayer:VERSION};
  };
}

const validateSnapshotsBase=(typeof validateSnapshots==='function')?validateSnapshots:null;
if(validateSnapshotsBase){
  validateSnapshots=function(raw){
    const out=validateSnapshotsBase(raw);
    out.rows.forEach((r,idx)=>{
      const id=r.source_row||`row-${idx+1}`;
      const specs=[
        ['funded_fte',0,Infinity],
        ['utilization_rate',0,1.5],
        ['overtime_hours_per_fte_month',0,Infinity],
        ['sick_leave_rate',0,1],
        ['cost_per_uncovered_fte_day',0,Infinity]
      ];
      specs.forEach(([k,min,max])=>{
        if(r[k]==null||String(r[k]).trim()==='')return;
        const v=Number(r[k]);
        if(!Number.isFinite(v)||v<min||v>max){
          out.quality.warnings.push(`${id}: invalid optional ${k}`);
          r[k]=null;
        }else r[k]=v;
      });
      if(n(r.funded_fte)!=null&&n(r.needed_fte)!=null&&n(r.funded_fte)>n(r.needed_fte)){
        out.quality.warnings.push(`${id}: funded_fte exceeds needed_fte; funding is capped at required capacity`);
      }
    });
    return out;
  };
}

const saveScenarioBase=(typeof saveScenarioRecord==='function')?saveScenarioRecord:null;
if(saveScenarioBase){
  saveScenarioRecord=function(r,vals){
    const rec=saveScenarioBase(r,vals);
    try{
      rec.priority_policy=PRIORITY_VERSION;
      rec.hr_expert_layer=VERSION;
      const rows=readScenarioLedger();
      const i=rows.findIndex(x=>x.id===rec.id);
      if(i>=0){
        rows[i].priority_policy=PRIORITY_VERSION;
        rows[i].hr_expert_layer=VERSION;
        rows[i].impact=scenarioImpact(r,vals);
        writeScenarioLedger(rows);
      }
      appendAuditRecord({
        key:'hr_expert_v08|'+rec.id,
        kind:'decision_ready_scenario',
        scenario_id:rec.id,
        cell:cellCode(r),
        detail:`${VERSION}; priority=${PRIORITY_VERSION}`,
        basis:PRIORITY_VERSION,
        source:r.source_row,
        fingerprint:stableStateFingerprint()
      });
    }catch{}
    return rec;
  };
}

function locLabel(r){
  return sectorCfg(r.sector).locations.find(x=>x.id===r.location)?.[isAr()?'ar':'en']||r.location;
}
function highestGapRow(){
  return [...currentRows()].filter(r=>deficit(r)>0)
    .sort((a,b)=>(decisionPriority(b).score??-1)-(decisionPriority(a).score??-1))[0]||null;
}
function incidentPlain(sv){
  if(!sv)return L('سجل الأحداث غير مكتمل، لذلك لا يمكن قياس سرعة نشوء فجوات جديدة.','The dated event history is incomplete, so the speed of new gap creation cannot be measured.');
  const every=sv.currentRate>0?(100/sv.currentRate*30):null;
  return Number.isFinite(every)
    ? L(`بالمعدل الحالي، تنشأ قدرة غير مغطاة تعادل 1 FTE تقريبًا كل ${Math.max(1,Math.round(every))} يومًا لكل 100 FTE مطلوبة.`,
        `At the current rate, roughly 1 uncovered FTE emerges every ${Math.max(1,Math.round(every))} days per 100 required FTE.`)
    : L('لا تظهر قدرة جديدة غير مغطاة في نافذة القياس الحالية.','No newly uncovered capacity is appearing in the current measurement window.');
}
function executiveText(view){
  const r=highestGapRow(),sum=sectorSummary(),af=aggregateFundingV8();
  if(view==='signals'){
    if(!r)return L('لا توجد فجوات تشغيلية نشطة في القطاع المحدد.','No active operating gaps exist in the selected sector.');
    const sv=surveillanceFor(r),st=strainV8(r);
    return L(
      `المعنى التنفيذي: ${occupationLabel(r.ssco)} في ${locLabel(r)} هي أعلى نقطة إنذار حاليًا. ${incidentPlain(sv)} ${st.known?`ضغط الفريق ${st.band==='high'?'مرتفع':st.band==='medium'?'متوسط':'منخفض'} (${st.score}/100)، وقد أصبح جزءًا من أولوية القرار.`:''}`,
      `Executive meaning: ${occupationLabel(r.ssco)} in ${locLabel(r)} is the highest current warning point. ${incidentPlain(sv)} ${st.known?`Team strain is ${st.band} (${st.score}/100) and now contributes to Decision Priority.`:''}`
    );
  }
  if(view==='gaps'){
    return L(
      `المعنى التنفيذي: العجز الحالي ${fmt8(sum.gap,1)} FTE. منه ${fmt8(af.funded,1)} ممول وقابل للتحرك بعد الموافقات، و${fmt8(af.unfunded,1)} غير ممول ويحتاج قرار ميزانية/هيكلة أولًا${af.unknown>0?`، و${fmt8(af.unknown,1)} تمويله غير معروف`:''}.`,
      `Executive meaning: the current deficit is ${fmt8(sum.gap,1)} FTE. ${fmt8(af.funded,1)} is funded and can move to execution after approvals; ${fmt8(af.unfunded,1)} is unfunded and needs a budget/establishment decision first${af.unknown>0?`; ${fmt8(af.unknown,1)} has unknown funding status`:''}.`
    );
  }
  if(view==='scenario'){
    if(!r)return L('لا توجد فجوة نشطة لاختبار سيناريو عليها.','There is no active gap to simulate.');
    const f=fundingV8(r);
    return L(
      `المعنى التنفيذي: لا يكفي أن يخفض السيناريو الفجوة؛ يجب أن يمر أيضًا من ثلاث بوابات: التمويل، زمن الموافقات، والتكلفة. ${f.known&&f.unfundedGap>0?'هذه الخلية تتضمن جزءًا غير ممول؛ لا يبدأ التنفيذ الخارجي قبل قرار التمويل.':''}`,
      `Executive meaning: reducing the gap is not enough; a scenario must also pass three gates: funding, approval time, and cost. ${f.known&&f.unfundedGap>0?'This cell includes an unfunded portion, so external execution cannot start before a funding decision.':''}`
    );
  }
  if(view==='occupations'){
    return L(
      'المعنى التنفيذي: SSCO يعرّف المهنة بصورة موحدة، لكن قرار القوى العاملة يُتخذ على مستوى الخلية: مهنة + موقع + مستوى + فئة تشغيلية.',
      'Executive meaning: SSCO standardizes the occupation, but workforce decisions are made at cell level: occupation + location + level + operating category.'
    );
  }
  if(view==='data'){
    return L(
      'المعنى التنفيذي: هذه الشاشة لا تسأل فقط «هل البيانات صحيحة؟» بل «هل هي كافية لاتخاذ قرار؟». التمويل، ضغط الفريق، والتكلفة حقول قرار مستقلة عن صحة القياس الأساسي.',
      'Executive meaning: this screen asks not only “is the data valid?” but also “is it decision-ready?”. Funding, team strain, and finance inputs are separate from core measurement validity.'
    );
  }
  if(view==='audit'){
    return L(
      `المعنى التنفيذي: كل رقم قرار يجب أن يكون قابلًا للدفاع عنه لاحقًا. أولوية القرار الحالية تستخدم ${PRIORITY_VERSION} وتشمل ضغط الفريق كمكوّن موثق.`,
      `Executive meaning: every decision number must remain defensible later. Current Decision Priority uses ${PRIORITY_VERSION} and includes team strain as an auditable component.`
    );
  }
  return '';
}

function ensureTranslationBox(view){
  const sec=q('#view-'+view);
  if(!sec)return null;
  let box=q('.v08-exec-translation',sec);
  if(!box){
    box=document.createElement('article');
    box.className='v08-exec-translation';
    const header=q('.view-header',sec);
    if(header)header.insertAdjacentElement('afterend',box);
    else sec.insertBefore(box,sec.firstChild);
  }
  return box;
}
function renderTranslations(){
  ['signals','gaps','scenario','occupations','data','audit'].forEach(view=>{
    const box=ensureTranslationBox(view);
    if(!box)return;
    box.innerHTML=`<span>${L('ترجمة تنفيذية','EXECUTIVE TRANSLATION')}</span><p>${esc8(executiveText(view))}</p>`;
  });

  const dash=q('#v07-exec-translation p');
  const r=highestGapRow();
  if(dash&&r){
    const f=fundingV8(r),st=strainV8(r),sv=surveillanceFor(r);
    dash.textContent=L(
      `أعلى نقطة قرار: ${occupationLabel(r.ssco)} في ${locLabel(r)}، بفجوة ${fmt8(deficit(r),1)} FTE. ${incidentPlain(sv)} ${f.known?`الفجوة: ${fmt8(f.fundedGap,1)} ممولة و${fmt8(f.unfundedGap,1)} غير ممولة.`:''} ${st.known?`ضغط الفريق ${st.band==='high'?'مرتفع':st.band==='medium'?'متوسط':'منخفض'} (${st.score}/100) ويشكل 15% من أولوية القرار عند توفر بياناته.`:''}`,
      `Top decision point: ${occupationLabel(r.ssco)} in ${locLabel(r)}, with a ${fmt8(deficit(r),1)} FTE gap. ${incidentPlain(sv)} ${f.known?`Gap split: ${fmt8(f.fundedGap,1)} funded and ${fmt8(f.unfundedGap,1)} unfunded.`:''} ${st.known?`Team strain is ${st.band} (${st.score}/100) and contributes 15% of Decision Priority when available.`:''}`
    );
  }
}

function plainLanguageLabels(){
  const gapsK=q('#view-gaps .section-kicker');
  if(gapsK)gapsK.textContent=L('الفجوة الحالية','CURRENT CAPACITY GAP · PREVALENCE');
  const signalsK=q('#view-signals .section-kicker');
  if(signalsK)signalsK.textContent=L('معدل نشوء فجوة جديدة','NEW GAP RATE · INCIDENCE');

  const metrics=qa('#executive-metrics .exec-metric');
  if(metrics[3]){
    const lab=q('.metric-top span',metrics[3]);
    if(lab)lab.textContent=L('سرعة نشوء فجوات جديدة','New uncovered-capacity rate');
    const small=q('small',metrics[3]);
    if(small&&eventMode!=='gated')small.textContent=L('لكل 100 مكافئ دوام كامل–شهر','per 100 required FTE-months');
  }
  qa('.panel-kicker').forEach(el=>{
    if(el.textContent.trim()==='STOCK / PREVALENCE')el.textContent=L('الوضع الحالي','CURRENT STATE · PREVALENCE');
    if(el.textContent.trim()==='FLOW / INCIDENCE')el.textContent=L('نشوء الفجوات','NEW GAP FLOW · INCIDENCE');
  });
}

function ensureFundingFilter(){
  const toolbar=q('#view-gaps .table-toolbar');
  if(!toolbar)return;
  const labels=[
    ['all',L('كل التمويل','All funding')],
    ['funded',L('ممولة','Funded')],
    ['unfunded',L('غير ممولة','Unfunded')],
    ['mixed',L('مختلطة','Mixed')],
    ['unknown',L('غير معروف','Unknown')]
  ];
  let div=q('#v08-funding-filter');
  if(!div){
    div=document.createElement('div');
    div.id='v08-funding-filter';
    div.className='v08-funding-filter';
    toolbar.appendChild(div);
  }
  div.innerHTML=labels.map(([v,l])=>`<button type="button" data-v08-fund="${v}" class="${v===fundingFilter?'active':''}">${l}</button>`).join('');
  qa('[data-v08-fund]',div).forEach(b=>b.onclick=()=>{
    fundingFilter=b.dataset.v08Fund;
    qa('[data-v08-fund]',div).forEach(x=>x.classList.toggle('active',x===b));
    renderV8Gaps();
  });
}

function fundingActionLabel(f){
  if(!f.known)return L('تحقق من التمويل','Verify funding');
  if(f.status==='unfunded')return L('قرار تمويل أولًا','Funding first');
  if(f.status==='mixed')return L('مساران: تنفيذ + تمويل','Split: execute + fund');
  if(f.status==='funded')return L('جاهزة للتنفيذ المالي','Finance-ready');
  return L('مغطاة','Covered');
}

function renderV8Gaps(){
  ensureFundingFilter();
  qa('#gaps-body tr').forEach(tr=>{
    const btn=q('[data-detail]',tr);
    if(!btn)return;
    const r=getRowBySource(btn.dataset.detail);
    if(!r)return;
    const f=fundingV8(r),st=strainV8(r);
    tr.dataset.v08Funding=f.status;
    tr.hidden=fundingFilter!=='all'&&f.status!==fundingFilter;

    q('.v07-context-badges',tr)?.remove();
    q('.v08-context-badges',tr)?.remove();
    const cell=q('.occupation-cell',tr);
    if(cell){
      const badges=document.createElement('div');
      badges.className='v08-context-badges';
      const fundText=f.known
        ? (deficit(r)>0
            ? `${L('ممولة','Funded')} ${fmt8(f.fundedGap,1)} · ${L('غير ممولة','Unfunded')} ${fmt8(f.unfundedGap,1)}`
            : L('لا توجد فجوة','No active gap'))
        : L('حالة التمويل غير معروفة','Funding unknown');
      badges.innerHTML=`<span class="fund ${f.status}">${fundText}</span>${st.known?`<span class="strain ${st.band}">${L('ضغط الفريق','Team strain')} ${st.score}/100</span>`:''}`;
      cell.appendChild(badges);
    }
    const ps=q('.priority-stack',tr);
    if(ps&&st.known&&!q('.v08-priority-note',ps)){
      ps.insertAdjacentHTML('beforeend',`<small class="v08-priority-note">${L('يشمل ضغط الفريق','includes team strain')}</small>`);
    }
  });
  const visible=qa('#gaps-body tr').filter(tr=>!tr.hidden&&q('[data-detail]',tr)).length;
  const count=q('#gap-row-count');
  if(count)count.textContent=`${visible} ${L('خلايا','cells')}`;
}

function enrichDecisionQueue(){
  qa('#decision-queue .queue-item').forEach(item=>{
    const r=getRowBySource(item.dataset.detail);
    if(!r)return;
    q('.v08-actionability',item)?.remove();
    const f=fundingV8(r);
    const pill=document.createElement('small');
    pill.className=`v08-actionability ${f.status}`;
    pill.textContent=fundingActionLabel(f);
    q('div',item)?.appendChild(pill);
  });
}

function enrichSignals(){
  qa('#signals-grid .signal-card').forEach(card=>{
    const btn=q('[data-detail]',card),grid=q('.component-grid',card);
    if(!btn||!grid)return;
    const r=getRowBySource(btn.dataset.detail),st=r?strainV8(r):null;
    if(!st?.known)return;
    q('.v08-strain-component',grid)?.remove();
    grid.insertAdjacentHTML('beforeend',`<div class="component-card v08-strain-component"><span>${L('ضغط الفريق / خطر الاحتراق','Team strain / burnout risk')}</span><strong>${st.score}</strong><small>${L('مؤشر تشغيلي، ليس تشخيصًا','operational proxy, not diagnosis')}</small></div>`);
  });
}

function selectedScenarioRow(){
  return (typeof selectedScenarioSource!=='undefined'&&selectedScenarioSource)?getRowBySource(selectedScenarioSource):null;
}
function inputNum(id){const el=q('#'+id);return el?n(el.value):null}
function interventionUnits(){
  const out={};
  ['hire','transfer','upskill','contract'].forEach(k=>out[k]=Math.max(0,Number(q('#'+k+'-range')?.value||0)));
  return out;
}
function financeReadiness(){
  const units=interventionUnits();
  const selected=Object.entries(units).filter(([,v])=>v>0).map(([k])=>k);
  const budget=inputNum('v07-budget');
  const gapDay=inputNum('v07-gapday-cost');
  const missingCosts=selected.filter(k=>inputNum('v07-cost-'+k)==null);
  const costTotal=selected.reduce((sum,k)=>sum+units[k]*(inputNum('v07-cost-'+k)||0),0);
  const ready=selected.length>0&&budget!=null&&gapDay!=null&&missingCosts.length===0;
  const over=ready&&costTotal>budget;
  return{units,selected,budget,gapDay,missingCosts,costTotal,ready,over,shortfall:over?costTotal-budget:0};
}
function ensureFinancialGate(){
  const body=q('#v07-reality-panel .v07-reality-body');
  if(!body)return;
  if(!q('#v08-finance-gate',body)){
    const div=document.createElement('div');
    div.id='v08-finance-gate';
    div.className='v08-finance-gate';
    body.appendChild(div);
  }
}
function renderScenarioReality(){
  ensureFinancialGate();
  const gate=q('#v08-finance-gate');
  if(!gate)return;
  const fr=financeReadiness(),r=selectedScenarioRow(),fund=r?fundingV8(r):null;
  const states=[];
  states.push([fr.selected.length>0,L('تدخل محدد','Intervention selected')]);
  states.push([fr.budget!=null,L('ميزانية موثقة','Verified budget')]);
  states.push([fr.missingCosts.length===0&&fr.selected.length>0,L('تكلفة التدخلات','Intervention cost')]);
  states.push([fr.gapDay!=null,L('تكلفة FTE غير المغطى/يوم','Uncovered FTE-day cost')]);
  gate.innerHTML=`<div class="v08-gate-head"><div><span>${L('بوابة الجاهزية المالية للتجربة المؤسسية','PILOT FINANCE-READINESS GATE')}</span><strong>${fr.ready&&!fr.over?L('جاهز للمقارنة المالية','Finance-ready'):fr.over?L('غير قابل للتنفيذ ضمن الميزانية','Not feasible within budget'):L('غير مكتمل للقرار المالي','Not finance-ready')}</strong></div><em class="${fr.ready&&!fr.over?'ok':fr.over?'bad':'warn'}">${fr.ready&&!fr.over?'✓':fr.over?'!':'…'}</em></div><div class="v08-gate-checks">${states.map(([ok,label])=>`<span class="${ok?'ok':'warn'}">${ok?'✓':'○'} ${label}</span>`).join('')}</div>${fr.over?`<p class="v08-budget-shortfall">${L('العجز في ميزانية السيناريو','Scenario budget shortfall')}: <b>${sar(fr.shortfall)}</b>. ${L('الأثر التشغيلي المعروض يظل «إمكانًا» وليس خطة قابلة للتنفيذ حتى تُعالج الفجوة المالية.','The operational result remains a potential outcome, not an executable plan, until the budget gap is resolved.')}</p>`:''}${fund?.known&&fund.unfundedGap>0?`<p>${L(`تنبيه: ${fmt8(fund.unfundedGap,1)} FTE من الفجوة غير ممولة أصلًا؛ يلزم مسار اعتماد مالي/هيكلي قبل التنفيذ.`,`Note: ${fmt8(fund.unfundedGap,1)} FTE of this gap is unfunded; a finance/establishment approval path is required before execution.`)}</p>`:''}`;

  const result=q('#v07-decision-result');
  if(result){
    q('.v08-timeline',result)?.remove();
    q('.v08-budget-reality',result)?.remove();
    const units=fr.units;
    const baseLead={
      hire:Number(INTERVENTION_DEFAULTS?.hire?.leadDays||90),
      transfer:0,
      upskill:Number(INTERVENTION_DEFAULTS?.upskill?.trainingDays||60),
      contract:Number(INTERVENTION_DEFAULTS?.contract?.startDelayDays||14)
    };
    const labels={hire:L('توظيف','Hire'),transfer:L('نقل','Transfer'),upskill:L('تأهيل','Upskill'),contract:L('تعاقد','Contract')};
    const active=Object.keys(units).filter(k=>units[k]>0);
    if(active.length){
      const timeline=document.createElement('div');
      timeline.className='v08-timeline';
      timeline.innerHTML=`<span>${L('الزمن الحقيقي قبل الأثر','REAL TIME TO EFFECT')}</span><div>${active.map(k=>{
        const approval=inputNum('v07-approval-'+k)||0,total=approval+baseLead[k];
        return `<article><small>${labels[k]}</small><strong>${total} ${L('يوم','days')}</strong><em>${L('موافقة','approval')} ${approval} + ${L('تنفيذ','execution')} ${baseLead[k]}</em></article>`;
      }).join('')}</div>`;
      result.appendChild(timeline);
    }
    const reality=document.createElement('div');
    reality.className='v08-budget-reality';
    reality.innerHTML=fr.ready
      ? `<b>${L('واقع الميزانية','Budget reality')}:</b> ${L('تكلفة السيناريو','scenario cost')} ${sar(fr.costTotal)} · ${L('الميزانية','budget')} ${sar(fr.budget)} · <strong class="${fr.over?'bad':'ok'}">${fr.over?L('غير قابل للتنفيذ','not feasible'):L('ضمن الميزانية','within budget')}</strong>`
      : `<b>${L('واقع الميزانية','Budget reality')}:</b> ${L('لن يصدر النظام حكمًا ماليًا قبل إدخال التكلفة والميزانية الموثقتين.','The system will not issue a financial feasibility verdict until verified cost and budget inputs are entered.')}`;
    result.appendChild(reality);

    qa('.v07-decision-grid article').forEach(a=>{
      const s=q('small',a);
      if(s&&/not a burnout diagnosis|لا يشخّص الاحتراق/.test(s.textContent)){
        s.textContent=L('مؤشر ضغط تشغيلي؛ ليس تشخيصًا طبيًا، ويشارك في أولوية القرار وفق KH-PRIORITY-v0.8.','Operational strain proxy; not a medical diagnosis, and it contributes to Decision Priority under KH-PRIORITY-v0.8.');
      }
    });
  }
}
function installScenarioSaveGuard(){
  const btn=q('#scenario-save');
  if(!btn)return;
  btn.textContent=L('حفظ سيناريو جاهز للقرار','Save decision-ready scenario');
  if(btn.dataset.v08Guard==='1')return;
  btn.dataset.v08Guard='1';
  btn.onclick=()=>{
    const r=selectedScenarioRow();
    if(!r)return;
    const fr=financeReadiness();
    if(!fr.selected.length){
      showToast(L('حدد تدخلًا واحدًا على الأقل قبل الحفظ.','Select at least one intervention before saving.'));
      return;
    }
    if(!fr.ready){
      showToast(L('أكمل الميزانية وتكلفة التدخل وتكلفة FTE غير المغطى قبل اعتماد السيناريو.','Complete budget, intervention cost, and uncovered FTE-day cost before saving a decision-ready scenario.'));
      renderScenarioReality();
      return;
    }
    if(fr.over){
      showToast(L(`السيناريو يتجاوز الميزانية بـ ${sar(fr.shortfall)}.`,`Scenario exceeds budget by ${sar(fr.shortfall)}.`));
      renderScenarioReality();
      return;
    }
    saveScenarioRecord(r,scenarioValues());
    renderScenario();
    showToast(L('تم حفظ سيناريو جاهز للقرار مع بوابة مالية مكتملة.','Decision-ready scenario saved with a complete finance gate.'));
  };
}

function ensureDecisionReadinessPanel(){
  const quality=q('#view-data .quality-panel');
  if(!quality||q('#v08-readiness-panel'))return;
  const panel=document.createElement('article');
  panel.id='v08-readiness-panel';
  panel.className='panel v08-readiness-panel';
  quality.insertAdjacentElement('afterend',panel);
}
function pct(a,b){return b?Math.round(100*a/b):0}
function renderDecisionReadinessPanel(){
  ensureDecisionReadinessPanel();
  const panel=q('#v08-readiness-panel');
  if(!panel)return;
  const rows=SNAPSHOTS||[],total=rows.length;
  const funding=rows.filter(r=>n(r.funded_fte)!=null).length;
  const strain=rows.filter(r=>strainV8(r).known).length;
  const finance=rows.filter(r=>n(r.cost_per_uncovered_fte_day)!=null).length;
  const items=[
    [L('التمويل المعتمد','Funded capacity'),funding,total,'funded_fte'],
    [L('ضغط الفريق','Team strain'),strain,total,'utilization + overtime + sick leave (2 of 3)'],
    [L('الأثر المالي','Financial impact'),finance,total,'cost_per_uncovered_fte_day']
  ];
  panel.innerHTML=`<div class="panel-head compact"><div><span class="panel-kicker">${L('جاهزية القرار','DECISION READINESS')}</span><h3>${L('هل البيانات كافية لقرار تنفيذي؟','Is the data sufficient for an executive decision?')}</h3></div><code>${VERSION}</code></div><p>${L('بوابة الجودة الأساسية تتحقق من صلاحية القياس. هذه البوابة منفصلة وتتحقق من توفر بيانات التمويل، ضغط الفريق، والتكلفة اللازمة للقرار.','The core quality gate validates measurement integrity. This separate gate checks whether funding, team-strain, and finance fields are present for actionability.')}</p><div class="v08-readiness-grid">${items.map(([label,count,tot,field])=>`<article><span>${label}</span><strong>${pct(count,tot)}%</strong><small>${count}/${tot} · <code>${field}</code></small></article>`).join('')}</div><div class="v08-contract-note"><b>${L('حقول التجربة المؤسسية المقترحة','Recommended pilot fields')}:</b> funded_fte · utilization_rate · overtime_hours_per_fte_month · sick_leave_rate · cost_per_uncovered_fte_day · financial_cost_source</div>`;
}

function installBriefObserver(){
  const overlay=q('#v07-brief-overlay');
  if(!overlay||overlay.dataset.v08Observed==='1')return;
  overlay.dataset.v08Observed='1';
  let applying=false;
  let observer=null;
  const patch=()=>{
    if(applying)return;
    applying=true;
    qa('.v07-brief-item p',overlay).forEach(p=>{
      const current=p.textContent;
      const next=current
        .replace('كمؤشر سياقي، وليس تشخيصًا للاحتراق الوظيفي ولا جزءًا آليًا من درجة الأولوية.','كمؤشر ضغط تشغيلي؛ ليس تشخيصًا طبيًا، ويشارك في أولوية القرار وفق KH-PRIORITY-v0.8.')
        .replace('as decision context; it is not a burnout diagnosis and does not automatically alter priority.','as a workload-strain proxy; it is not a medical burnout diagnosis and contributes to Decision Priority under KH-PRIORITY-v0.8.');
      if(next!==current)p.textContent=next;
    });
    const footer=q('.v07-brief-sheet footer p',overlay);
    if(footer&&!footer.dataset.v08){
      footer.dataset.v08='1';
      footer.textContent+=' '+L('أولوية القرار الحالية تشمل Team Strain عند توفر بياناته.','Current Decision Priority includes Team Strain when its inputs are available.');
    }
    applying=false;
  };
  observer=new MutationObserver(()=>{
    observer.disconnect();
    patch();
    observer.observe(overlay,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
  });
  observer.observe(overlay,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
}

function renderV8(){
  const engine=q('#sidebar-engine-state');
  if(engine)engine.textContent=`${MEASUREMENT_VERSION} · ${PRIORITY_VERSION} · ${VERSION}`;
  plainLanguageLabels();
  renderTranslations();
  renderV8Gaps();
  enrichDecisionQueue();
  enrichSignals();
  renderScenarioReality();
  renderDecisionReadinessPanel();
  installScenarioSaveGuard();
  installBriefObserver();
}

const renderGapsBase=(typeof renderGaps==='function')?renderGaps:null;
if(renderGapsBase){
  renderGaps=function(){
    renderGapsBase();
    queueMicrotask(renderV8Gaps);
  };
}
const renderScenarioBase=(typeof renderScenario==='function')?renderScenario:null;
if(renderScenarioBase){
  renderScenario=function(){
    renderScenarioBase();
    queueMicrotask(()=>{renderScenarioReality();installScenarioSaveGuard();renderTranslations()});
  };
}
const renderAllBase=(typeof renderAll==='function')?renderAll:null;
if(renderAllBase){
  renderAll=function(){
    renderAllBase();
    queueMicrotask(renderV8);
  };
}

document.addEventListener('DOMContentLoaded',()=>{
  setTimeout(()=>{
    if(snapshotMode==='synthetic'&&typeof refreshDemoQuality==='function')refreshDemoQuality();
    ensureFundingFilter();
    ensureDecisionReadinessPanel();
    renderV8();
  },0);
});
})();