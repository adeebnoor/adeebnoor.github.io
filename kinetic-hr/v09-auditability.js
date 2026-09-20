/* Kinetic HR v0.9 — Auditability, traceability and surveillance sufficiency */
(()=>{
'use strict';

const V09='KH-AUDITABILITY-v0.9';
const CONTRACT_V09='KHDC-v1.0';
const SURV_V09='KH-SURV-v1.0';
const q9=(s,r=document)=>r.querySelector(s);
const qa9=(s,r=document)=>[...r.querySelectorAll(s)];
const ar9=()=>document.documentElement.dir==='rtl';
const L9=(ar,en)=>ar9()?ar:en;
const esc9=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
const nf9=(v,d=1)=>Number.isFinite(Number(v))?new Intl.NumberFormat(ar9()?'ar-SA':'en-US',{maximumFractionDigits:d,minimumFractionDigits:0}).format(Number(v)):'—';
const EXIT_TYPES_V09=new Set(['resignation','termination','retirement','transfer_out']);
const EVENT_TYPES_V09=new Set(['resignation','termination','retirement','transfer_out','hire','transfer_in','demand_increase','demand_decrease','position_created_unfilled','position_closed','long_term_absence','return_from_absence','internal_promotion','role_transformation','coverage_start','coverage_end']);
const NATURE_V09=new Set(['voluntary','involuntary','statutory','internal_mobility']);
const NATURE_EXPECTED={resignation:'voluntary',termination:'involuntary',retirement:'statutory',transfer_out:'internal_mobility'};
function funding9(r){
  const need=requiredFte(r),avail=availableFte(r),gap=Math.max(0,need-avail),raw=Number(r?.funded_fte);
  if(r?.funded_fte==null||String(r.funded_fte).trim()===''||!Number.isFinite(raw))return{known:false,fundedGap:null,unfundedGap:null,status:'unknown'};
  const fundedNeed=Math.max(0,Math.min(need,raw)),fundedGap=Math.max(0,fundedNeed-avail),unfundedGap=Math.max(0,gap-fundedGap);
  return{known:true,fundedGap,unfundedGap,status:gap<=0?'covered':fundedGap>0&&unfundedGap>0?'mixed':unfundedGap>0?'unfunded':'funded'};
}

if(typeof I18N!=='undefined'){
  I18N.ar.common.insufficient='بيانات غير كافية';
  I18N.en.common.insufficient='Insufficient data';
  I18N.ar.cause.termination='إنهاء خدمة';
  I18N.en.cause.termination='termination';
  I18N.ar.home.subhead='اعرف أين يوجد نقص في العمل، وهل يظهر نقص جديد بسرعة أكبر، وما الذي يمكن تغطيته بالميزانية المتاحة. راجع مصدر الأرقام قبل اختيار الإجراء.';
  I18N.en.home.subhead='See where work is understaffed, whether new shortages are appearing faster, and what the available budget can cover. Check the evidence before choosing an action.';
}

function groupRowById(id,rows=SNAPSHOTS){
  return rows.find(r=>String(r.position_group_id||'')===String(id||''))||null;
}

const deltaBase9=typeof defaultEventDelta==='function'?defaultEventDelta:null;
if(deltaBase9) defaultEventDelta=function(type){
  if(type==='termination'||type==='long_term_absence'||type==='internal_promotion')return{capacity:-1,demand:0};
  if(type==='return_from_absence')return{capacity:1,demand:0};
  if(type==='coverage_start')return{capacity:1,demand:0};
  if(type==='coverage_end')return{capacity:-1,demand:0};
  if(type==='role_transformation')return{capacity:0,demand:0};
  return deltaBase9(type);
};

if(typeof eventsForCell==='function') eventsForCell=function(r){
  const pg=String(r?.position_group_id||'');
  if(!pg)return[];
  return HR_EVENTS
    .filter(e=>String(e.position_group_id||'')===pg&&dUTC(e.event_date)&&dUTC(e.event_date)<=getAsOfDate())
    .map(normalizeEvent)
    .sort((a,b)=>String(a.event_date).localeCompare(String(b.event_date))||Number(a.event_sequence||0)-Number(b.event_sequence||0)||String(a.event_id).localeCompare(String(b.event_id)));
};

const validateSnapshotsBase9=typeof validateSnapshots==='function'?validateSnapshots:null;
if(validateSnapshotsBase9) validateSnapshots=function(raw){
  const out=validateSnapshotsBase9(raw);
  const keep=[],seen=new Set(),extraQ=[];
  out.rows.forEach((r,i)=>{
    const id=String(r.source_row||('row-'+(i+1)));
    const pg=String(r.position_group_id||'').trim();
    if(!pg){
      extraQ.push({row:i+1,id,reasons:['missing position_group_id']});
      out.quality.errors.push(`${id}: missing position_group_id`);
      return;
    }
    if(seen.has(pg)){
      extraQ.push({row:i+1,id,reasons:['duplicate position_group_id']});
      out.quality.errors.push(`${id}: duplicate position_group_id ${pg}`);
      return;
    }
    seen.add(pg);
    if(!dUTC(r.event_history_start_date)){
      out.quality.warnings.push(`${id}: missing event_history_start_date; surveillance will be shown as insufficient`);
    }
    keep.push(r);
  });
  out.rows=keep;
  out.quality.quarantine.push(...extraQ);
  out.quality.quarantined=out.quality.quarantine.length;
  out.quality.accepted=keep.length;
  return out;
};

if(typeof validateEvents==='function') validateEvents=function(raw,snapshotRows=SNAPSHOTS){
  const warnings=[],errors=[],quarantine=[],accepted=[],seen=new Set();
  const groups=new Map(snapshotRows.map(r=>[String(r.position_group_id||''),r]));
  const asOf=snapshotRows.length?new Date(Math.max(...snapshotRows.map(r=>dUTC(r.as_of_date)?.getTime()||0))):getAsOfDate();
  for(let i=0;i<raw.length;i++){
    let x={...raw[i]};
    const id=String(x.event_id||`event-${i+1}`),rowErrors=[],rowWarnings=[];
    if(seen.has(id))rowErrors.push('duplicate event_id'); seen.add(id);
    ['event_id','position_id','position_group_id','event_type','event_date','sector','location','ssco','level','category'].forEach(k=>{
      if(x[k]==null||String(x[k]).trim()==='')rowErrors.push(`missing ${k}`);
    });
    if(!EVENT_TYPES_V09.has(String(x.event_type||'')))rowErrors.push('unsupported event_type');
    const dt=dUTC(x.event_date);
    if(!dt)rowErrors.push('invalid event_date'); else if(dt>asOf)rowErrors.push('event_date after snapshot as_of_date');

    const linked=groups.get(String(x.position_group_id||''));
    if(!linked)rowErrors.push('position_group_id does not match a snapshot group');
    if(linked){
      for(const k of ['sector','location','ssco','level','category']){
        if(String(x[k])!==String(linked[k]))rowErrors.push(`${k} conflicts with linked position_group_id`);
      }
      const hs=dUTC(linked.event_history_start_date);
      if(hs&&dt&&dt<hs)rowWarnings.push('event precedes declared event_history_start_date');
    }

    if(x.event_type==='role_transformation'){
      const skillGap=Number(x.skill_gap_fte);
      if(x.skill_gap_fte==null||String(x.skill_gap_fte).trim()==='')rowWarnings.push('role_transformation should include skill_gap_fte');
      else if(!Number.isFinite(skillGap)||skillGap<0)rowErrors.push('invalid skill_gap_fte');
      else x.skill_gap_fte=skillGap;
    }

    if(EXIT_TYPES_V09.has(String(x.event_type||''))){
      const nature=String(x.separation_nature||'').trim();
      const reason=String(x.separation_reason||'').trim();
      if(!nature)rowErrors.push('missing separation_nature for exit event');
      else if(!NATURE_V09.has(nature))rowErrors.push('invalid separation_nature');
      if(!reason)rowErrors.push('missing separation_reason for exit event');
      const expected=NATURE_EXPECTED[x.event_type];
      if(nature&&expected&&nature!==expected)rowErrors.push(`separation_nature must be ${expected} for ${x.event_type}`);
    }

    const d=defaultEventDelta(x.event_type);
    if(x.capacity_delta_fte==null||String(x.capacity_delta_fte).trim()===''){
      x.capacity_delta_fte=d.capacity; rowWarnings.push('capacity_delta_fte inferred from event_type');
    } else x.capacity_delta_fte=Number(x.capacity_delta_fte);
    if(x.demand_delta_fte==null||String(x.demand_delta_fte).trim()===''){
      x.demand_delta_fte=d.demand; rowWarnings.push('demand_delta_fte inferred from event_type');
    } else x.demand_delta_fte=Number(x.demand_delta_fte);
    if(!Number.isFinite(x.capacity_delta_fte))rowErrors.push('invalid capacity_delta_fte');
    if(!Number.isFinite(x.demand_delta_fte))rowErrors.push('invalid demand_delta_fte');

    if(rowErrors.length){
      quarantine.push({row:i+1,id,reasons:rowErrors});
      errors.push(...rowErrors.map(m=>`row ${i+1}: ${m}`));
    }else{
      accepted.push(x);
      warnings.push(...rowWarnings.map(m=>`row ${i+1}: ${m}`));
    }
  }
  return{rows:accepted,quality:{accepted:accepted.length,quarantined:quarantine.length,warnings,errors,quarantine}};
};

function surveillanceEvidence9(r){
  const w=getWindows(r),historyStart=dUTC(r.event_history_start_date),historyEnd=dUTC(r.event_history_end_date);
  const requiredStart=w.baseline[0]?.start||w.current.start;
  const currentStart=historyStart&&historyStart>w.current.start?historyStart:w.current.start;
  const observedEnd=historyEnd&&historyEnd<w.current.end?historyEnd:w.current.end;
  const observedDays=historyStart&&historyEnd?Math.max(0,Math.round((observedEnd-currentStart)/DAY)+1):0;
  const completeBaselines=historyStart?w.baseline.filter(x=>historyStart<=x.start).length:0;
  const fullCurrent=!!historyStart&&!!historyEnd&&historyStart<=w.current.start&&historyEnd>=w.current.end;
  const fullBaseline=!!historyStart&&historyStart<=requiredStart&&completeBaselines===w.baseline.length;
  const currentEvents=eventsForCell(r).filter(e=>{const d=dUTC(e.event_date);return d&&d>=w.current.start&&d<=w.current.end});
  return{historyStart,observedDays,completeBaselines,fullCurrent,fullBaseline,currentEvents,requiredStart};
}

if(typeof surveillanceFor==='function') surveillanceFor=function(r){
  if(eventMode==='gated')return null;
  const w=getWindows(r),policy=KHPilot.policy(r),current=incidenceWindow(r,w.current.start,w.current.end),hist=w.baseline.map(x=>incidenceWindow(r,x.start,x.end));
  const ev=surveillanceEvidence9(r);
  const baseline=hist.length?hist.reduce((a,x)=>a+x.rate,0)/hist.length:0;
  const baselineGap=hist.length?hist.reduce((a,x)=>a+x.newGapFte,0)/hist.length:0;
  const ratio=baseline>0?current.rate/baseline:(current.rate>0?Infinity:null);
  const eligibleSize=requiredFte(r)>=policy.minRequiredFte;
  const qualityComplete=!(DATA_QUALITY.events.quarantined>0)&&!(DATA_QUALITY.snapshot.quarantined>0);
  const dataSufficient=ev.fullCurrent&&ev.fullBaseline&&eligibleSize&&current.denominator>0&&qualityComplete;
  const alert=dataSufficient&&current.newGapFte>0&&(baseline===0?current.newGapFte>=policy.minNewGapFteWhenBaselineZero:(ratio>=policy.alertMultiplier&&current.newGapFte>=Math.max(1,baselineGap)));
  const monitor=dataSufficient&&!alert&&current.rate>baseline&&current.newGapFte>0;
  const status=!dataSufficient?'insufficient':alert?'alert':monitor?'monitor':(current.newGapFte===0&&baselineGap===0?'stable_zero':'normal');
  const exits=ev.currentEvents.filter(e=>EXIT_TYPES_V09.has(e.event_type));
  const separationMix=exits.reduce((a,e)=>{const k=e.separation_nature||'unknown';a[k]=(a[k]||0)+1;return a},{});
  return{
    currentRate:dataSufficient?current.rate:null,baselineRate:dataSufficient?baseline:null,ratio:dataSufficient?ratio:null,alert,monitor,status,dataSufficient,policy,policyRevision:KHPilot.revision(),
    currentNewGapFte:dataSufficient?current.newGapFte:null,baselineNewGapFte:dataSufficient?baselineGap:null,denominator:current.denominator,
    causes:current.causes,histRates:dataSufficient?hist.map(x=>x.rate):[],histGapFte:dataSufficient?hist.map(x=>x.newGapFte):[],
    onsets:current.onsets,window:w.current,
    evidence:{observedDays:ev.observedDays,windowDays:policy.windowDays,baselineWindowsComplete:ev.completeBaselines,baselineWindowsRequired:w.baseline.length,currentEventCount:ev.currentEvents.length,gapCreatingEventCount:current.events.length,historyStart:ev.historyStart?isoDate(ev.historyStart):null},
    separationMix
  };
};

if(typeof signalState==='function') signalState=function(r){
  const s=surveillanceFor(r);
  return!s||!s.dataSufficient?'insufficient':s.alert?'alert':s.monitor?'monitor':'normal';
};

if(typeof velocityScore==='function') velocityScore=function(r){
  const s=surveillanceFor(r);
  if(!s||!s.dataSufficient)return null;
  if(s.currentNewGapFte<=0)return 0;
  if(!Number.isFinite(s.ratio))return Math.min(100,45+15*s.currentNewGapFte);
  if(s.ratio<=1)return Math.round(30*Math.max(0,s.ratio));
  if(s.ratio<1.5)return Math.round(30+40*(s.ratio-1));
  return Math.round(Math.min(100,50+(s.ratio-1.5)/1.5*50));
};

if(typeof periodLabel==='function') periodLabel=function(){
  const {current}=getWindows();
  return `${KHPilot.policy().windowDays}d · ${isoDate(current.start)} → ${isoDate(current.end)}`;
};

function ratioText9(sv){
  if(!sv||!sv.dataSufficient)return'—';
  if(sv.ratio===null)return'—';
  if(!Number.isFinite(sv.ratio))return'∞';
  return nf9(sv.ratio,2)+'×';
}
function stateLabel9(sv){
  if(!sv||!sv.dataSufficient)return L9('معدل النقص الجديد غير متاح — السجل غير كافٍ','Incidence unavailable — insufficient history');
  if(sv.alert)return L9('إنذار','Alert');
  if(sv.monitor)return L9('مراقبة','Monitor');
  if(sv.status==='stable_zero')return L9('رصد مكتمل · لا فجوات جديدة','Complete history · no new gaps');
  return L9('ضمن النطاق','Within range');
}
function priorityWhy9(r,sv){
  const dp=decisionPriority(r);
  if(!sv||!sv.dataSufficient)return L9('أولوية القرار هنا مبنية على الفجوة القائمة والعبء وصعوبة المعالجة؛ لم يُستخدم مكوّن سرعة ظهور نقص جديد لأن سجل الرصد غير مكتمل.','Priority uses the stock gap, burden and resolution difficulty; deterioration velocity is excluded because surveillance history is incomplete.');
  if(sv.status==='stable_zero'&&(dp.score??0)>0)return L9('لا يوجد تسارع جديد؛ الأولوية غير الصفرية مصدرها الفجوة القائمة والعبء التشغيلي، وليست إشارة ترصد جديدة.','There is no new acceleration; the non-zero priority comes from the existing stock gap and operating burden, not a new surveillance signal.');
  return'';
}
function separationText9(sv){
  if(!sv)return'';
  const m=sv.separationMix||{},parts=[];
  if(m.voluntary)parts.push(L9(`طوعي ${m.voluntary}`,`voluntary ${m.voluntary}`));
  if(m.involuntary)parts.push(L9(`غير طوعي ${m.involuntary}`,`involuntary ${m.involuntary}`));
  if(m.statutory)parts.push(L9(`نظامي/تقاعد ${m.statutory}`,`statutory/retirement ${m.statutory}`));
  if(m.internal_mobility)parts.push(L9(`حركة داخلية ${m.internal_mobility}`,`internal mobility ${m.internal_mobility}`));
  return parts.join(' · ');
}

if(typeof renderSignals==='function') renderSignals=function(){
  const states=currentRows().map(r=>({r,sv:surveillanceFor(r),dp:decisionPriority(r)})).map(x=>({...x,state:(!x.sv||!x.sv.dataSufficient)?'insufficient':x.sv.alert?'alert':x.sv.monitor?'monitor':'normal'}));
  const counts={alert:states.filter(x=>x.state==='alert').length,monitor:states.filter(x=>x.state==='monitor').length,normal:states.filter(x=>x.state==='normal').length,insufficient:states.filter(x=>x.state==='insufficient').length};
  const sum=q9('#signals-summary');
  if(sum)sum.innerHTML=[
    ['alert',L9('إنذار','Alert')],['monitor',L9('مراقبة','Monitor')],['normal',L9('مستقر/ضمن النطاق','Stable / within range')],['insufficient',L9('بيانات غير كافية','Insufficient')]
  ].map(([k,l])=>`<span class="summary-chip ${k}"><b>${counts[k]}</b>${l}</span>`).join('');
  const grid=q9('#signals-grid');
  if(!grid)return;
  if(eventMode==='gated'){grid.innerHTML=`<div class="empty-state">${L9('معدل النقص الجديد غير متاح — نقص أحداث. حمّل سجل التغييرات المرتبط بملف الوضع الحالي.','Incidence unavailable — missing events. Import the event log linked to your snapshot.')}</div>`;return}
  const filtered=states.filter(x=>signalFilter==='all'||x.state===signalFilter);
  grid.innerHTML=filtered.map(({r,state,sv,dp})=>{
    const loc=sectorCfg(r.sector).locations.find(x=>x.id===r.location)?.[lang]||'';
    const causes=sv?.causes?.map(([k,v])=>`${causeLabel(k)} ${nf9(v,1)}`).join(' · ')||'—';
    const bars=sv?.dataSufficient?[...sv.histRates,sv.currentRate]:[];
    const m=Math.max(1,...bars);
    const why=priorityWhy9(r,sv),sep=separationText9(sv);
    return `<article class="signal-card ${state}">
      <div class="signal-head"><div><h3>${esc9(occupationLabel(r.ssco))}</h3><small>${esc9(loc)}</small></div><span class="signal-badge ${state}">${stateLabel9(sv)}</span></div>
      <p class="kh-signal-meaning">${esc9(KHPlain.trend(sv))}</p>
      <details class="kh-number-details"><summary>${KHPlain.detailsLabel()}</summary><p>${L9('رمز مجموعة الوظائف','Job group code')}: ${esc9(r.position_group_id)} · ${L9('رمز المهنة','Occupation code')}: ${esc9(r.ssco)}</p>
      <div class="signal-metrics">
        <div class="signal-metric"><span>${L9('المعدل الحالي','Current rate')}</span><strong>${sv?.dataSufficient?nf9(sv.currentRate,2):'—'}</strong><small class="rate-unit">${L9('لكل 100 بدوام كامل خلال شهر','per 100 full-time equivalents / month')}</small></div>
        <div class="signal-metric"><span>${L9('المعدل السابق للمقارنة','Previous comparison rate')}</span><strong>${sv?.dataSufficient?nf9(sv.baselineRate,2):'—'}</strong><small class="rate-unit">${L9('لكل 100 بدوام كامل خلال شهر','per 100 full-time equivalents / month')}</small></div>
        <div class="signal-metric"><span>${L9('التغير','Change')}</span><strong>${ratioText9(sv)}</strong><small class="rate-unit">${sv?.ratio===null&&sv?.dataSufficient?'0/0 · '+L9('لا يُحسب كنسبة','ratio not computed'):''}</small></div>
        <div class="signal-metric"><span>${L9('أولوية القرار','Decision priority')}</span><strong>${dp.score??'—'}</strong><small class="rate-unit">${t('common.'+dp.confidence)}</small></div>
      </div>
      <div class="component-grid">
        <div class="component-card"><span>${L9('سرعة ظهور نقص جديد','Speed of new shortages')}</span><strong>${dp.components.velocity??'—'}</strong></div>
        <div class="component-card"><span>${t('signals.burden')}</span><strong>${dp.components.burden??'—'}</strong></div>
        <div class="component-card"><span>${t('signals.resolvability')}</span><strong>${dp.components.resolvability??'—'}</strong></div>
        ${Number.isFinite(dp.components.teamStrain)?`<div class="component-card v08-strain-component"><span>${L9('ضغط الفريق','Team strain')}</span><strong>${dp.components.teamStrain}</strong><small>${L9('مؤشر تشغيلي، لا تشخيص طبي','operational proxy, not a medical diagnosis')}</small></div>`:''}
      </div>
      <div class="signal-causes"><b>${L9('الأحداث التي زادت الفجوة','Gap-creating events')}:</b> ${esc9(causes)} · <b>${L9('الزيادة','new gap')}:</b> ${sv?.dataSufficient?nf9(sv.currentNewGapFte,1)+' FTE':'—'}</div>
      ${sep?`<div class="v09-separation-mix"><b>${L9('طبيعة الخروج في النافذة الحالية','Exit nature in current window')}:</b> ${esc9(sep)}</div>`:''}
      ${bars.length?`<div class="signal-trend">${bars.map((v,i)=>`<i class="${i===bars.length-1?'current':''}" style="height:${Math.max(6,45*v/m)}px"></i>`).join('')}</div>`:''}
      <div class="v09-sufficiency">
        <span class="${sv?.evidence.observedDays===sv?.evidence.windowDays?'ok':'warn'}">${L9('أيام مرصودة','observed days')}: ${sv?.evidence.observedDays??0}/${sv?.evidence.windowDays??KHPilot.policy(r).windowDays}</span>
        <span class="${sv?.evidence.baselineWindowsComplete===SURVEILLANCE.baselineWindows?'ok':'warn'}">${L9('نوافذ أساس مكتملة','complete baselines')}: ${sv?.evidence.baselineWindowsComplete??0}/${SURVEILLANCE.baselineWindows}</span>
        <span>${L9('التعرّض','exposure')}: ${sv?.dataSufficient?nf9(sv.denominator,1):'—'} ${L9('دوام كامل–شهر','FTE-mo')}</span>
        <span>${L9('أحداث منشئة للفجوة','gap events')}: ${sv?.evidence.gapCreatingEventCount??0}</span>
      </div>
      ${why?`<div class="v09-priority-explainer">${esc9(why)}</div>`:''}
      </details><div class="signal-actions"><button data-detail="${esc9(r.source_row)}">${t('common.details')} →</button><code>${esc9(r.position_group_id)}</code></div>
    </article>`;
  }).join('')||'<div class="empty-state">—</div>';
  if(typeof bindDetailButtons==='function')bindDetailButtons();
};

if(typeof renderPulse==='function') renderPulse=function(){
  const rows=currentRows(),ready=rows.filter(r=>surveillanceFor(r)?.dataSufficient),w=getWindows(),windows=[...w.baseline,w.current];
  const series=windows.map(win=>{
    const num=ready.reduce((a,r)=>a+incidenceWindow(r,win.start,win.end).newGapFte,0);
    const den=ready.reduce((a,r)=>a+requiredFteMonths(r,win.start,win.end),0);
    return den?100*num/den:0;
  });
  const chart=q9('#pulse-chart'),legend=q9('#pulse-legend'),stateEl=q9('#pulse-state');
  if(!chart)return;
  chart.setAttribute('aria-label',L9('اتجاه ظهور نقص جديد','Trend in new shortfalls'));
  if(!ready.length){
    chart.innerHTML=`<div class="empty-state">${L9('نحتاج سجل تغييرات مكتملًا لعرض اتجاه النقص.','A complete history of changes is needed to show the shortfall trend.')}</div>`;
  }else{
    const max=Math.max(1,...series),ww=620,h=165,p=18,pts=series.map((v,i)=>[p+i*(ww-2*p)/(series.length-1),h-p-v/max*(h-2*p)]),path=pts.map((z,i)=>(i?'L':'M')+z[0]+','+z[1]).join(' ');
    chart.innerHTML=`<svg viewBox="0 0 ${ww} ${h}" role="img" aria-label="${L9('اتجاه ظهور نقص جديد','Trend in new shortfalls')}"><path d="${path}" fill="none" stroke="#18c4a3" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>${pts.map((z,i)=>`<circle cx="${z[0]}" cy="${z[1]}" r="5" fill="${i===pts.length-1?'#e45858':'#18c4a3'}"/><text x="${z[0]}" y="${Math.max(12,z[1]-11)}" text-anchor="middle" font-size="9" fill="#64748b">${nf9(series[i],1)}</text>`).join('')}</svg>`;
  }
  const curDen=ready.reduce((a,r)=>a+incidenceWindow(r,w.current.start,w.current.end).denominator,0);
  const curEvents=ready.reduce((a,r)=>a+(surveillanceFor(r)?.evidence.currentEventCount||0),0);
  if(legend)legend.innerHTML=`<span>${L9('الأرقام: نقص جديد لكل 100 بدوام كامل خلال شهر.','Values: new shortfall per 100 full-time equivalents over a month.')}</span><div class="v09-pulse-note">${L9(`كل نقطة تمثل ${KHPilot.policy().windowDays} يومًا. نقارن الفترة الحالية بثلاث فترات سابقة. يشمل الرسم ${ready.length} من ${rows.length} مجموعة وظائف ذات سجل مكتمل.`,`Each point covers ${KHPilot.policy().windowDays} days. We compare the current period with three earlier periods. The chart includes ${ready.length} of ${rows.length} job groups with complete history.`)}</div>`;
  const summary=sectorSummary();
  const st=summary.alerts?'alert':summary.monitors?'monitor':'normal';
  if(stateEl){stateEl.className='state-pill '+st;stateEl.textContent=st==='alert'?L9('إنذار','Alert'):st==='monitor'?L9('مراقبة','Monitor'):L9('مستقر','Stable')}
};

const appendAuditBase9=typeof appendAuditRecord==='function'?appendAuditRecord:null;
if(appendAuditBase9) appendAuditRecord=function(rec){
  let row=null;
  if(rec.position_group_id)row=groupRowById(rec.position_group_id);
  if(!row&&rec.source)row=getRowBySource(rec.source);
  if(!row&&rec.cell)row=getRowByCell(rec.cell);
  let enriched=row?{...rec,position_group_id:row.position_group_id,workforce_cell:cellCode(row)}:{...rec};
  if(enriched.kind==='surveillance_alert'){
    enriched.basis=SURV_V09;
    enriched.key=String(enriched.key||('surveillance|'+Date.now()))+'|'+SURV_V09;
  }
  if(enriched.kind==='alert_case_created'&&enriched.basis==='KH-SURV-v0.5')enriched.basis=SURV_V09;
  return appendAuditBase9(enriched);
};

const auditStateBase9=typeof auditState==='function'?auditState:null;
if(auditStateBase9) auditState=function(){
  const a=auditStateBase9();
  return{...a,contract:CONTRACT_V09,surveillancePolicy:SURV_V09,decisionLayer:V09};
};

const fingerprintBase9=typeof stableStateFingerprint==='function'?stableStateFingerprint:null;
if(fingerprintBase9&&typeof sha256==='function') stableStateFingerprint=function(){
  return 'SHA256-'+sha256(fingerprintBase9()+'|'+CONTRACT_V09+'|'+SURV_V09+'|position_group_id').toUpperCase();
};

function patchPeriod9(){
  const el=q9('#current-period-label');
  if(!el)return;
  el.textContent=periodLabel(); el.classList.add('v09-date-window'); el.setAttribute('dir','ltr');
  const {current}=getWindows();
  el.title=L9(`نافذة الرصد الحالية ${KHPilot.policy().windowDays} يومًا: من ${isoDate(current.start)} إلى ${isoDate(current.end)}. خط الأساس = ثلاث نوافذ سابقة مدة كل منها ${KHPilot.policy().windowDays} يومًا.`,`Current surveillance window: ${KHPilot.policy().windowDays} days, ${isoDate(current.start)} to ${isoDate(current.end)}. Baseline = three preceding ${KHPilot.policy().windowDays}-day windows.`);
}
function patchHero9(){
  const sub=q9('[data-i18n="home.subhead"]'); if(sub)sub.textContent=I18N[lang].home.subhead;
  const r=[...currentRows()].filter(x=>deficit(x)>0).sort((a,b)=>(decisionPriority(b).score??-1)-(decisionPriority(a).score??-1))[0];
  const box=q9('#v07-exec-translation p');
  if(!box||!r)return;
  const sv=surveillanceFor(r),f=funding9(r),dp=decisionPriority(r);
  const loc=sectorCfg(r.sector).locations.find(x=>x.id===r.location)?.[lang]||r.location;
  box.textContent=KHPlain.summary(r,f,KHPlain.pressure(r)); box.classList.add('v09-exec-human');
  const parent=box.closest('#v07-exec-translation');
  if(parent){
    let strip=q9('.v09-evidence-strip',parent); if(!strip){strip=document.createElement('div');strip.className='v09-evidence-strip';parent.appendChild(strip)}
    strip.innerHTML=KHPlain.detail(r,f,KHPlain.pressure(r));
  }
}
function patchMetrics9(){
  const ms=qa9('#executive-metrics .exec-metric'),s=sectorSummary();
  if(ms.length<4)return;
  const set=(i,label,value,small)=>{
    q9('.metric-top span',ms[i]).textContent=label;
    q9('strong',ms[i]).innerHTML=value;
    q9('small',ms[i]).textContent=small;
  };
  set(0,L9('حجم العمل المطلوب','Work capacity needed'),`${nf9(s.needed,1)} <span class="v09-unit">${KHPlain.unit()}</span>`,L9(`${s.rows.length} مجموعة من الوظائف المتشابهة`,`${s.rows.length} groups of comparable roles`));
  set(1,L9('نسبة العمل المغطى','Work covered'),`${nf9(s.coverage*100,1)}%`,L9(`${nf9(s.needed-s.gap,1)} بدوام كامل متاح من ${nf9(s.needed,1)} مطلوب`,`${nf9(s.needed-s.gap,1)} full-time equivalents available of ${nf9(s.needed,1)} needed`));
  set(2,L9('حجم النقص الحالي','Current shortfall'),`${nf9(s.gap,1)} <span class="v09-unit">${KHPlain.unit()}</span>`,L9(`${nf9(s.needed?100*s.gap/s.needed:0,1)}% من القدرة المطلوبة`,`${nf9(s.needed?100*s.gap/s.needed:0,1)}% of required capacity`));
  const ready=currentRows().filter(r=>surveillanceFor(r)?.dataSufficient),w=getWindows(),den=ready.reduce((a,r)=>a+incidenceWindow(r,w.current.start,w.current.end).denominator,0),num=ready.reduce((a,r)=>a+incidenceWindow(r,w.current.start,w.current.end).newGapFte,0),rate=den?100*num/den:null;
  const recent=KHPlain.newShortfall();
  set(3,L9(`نقص جديد خلال ${KHPilot.policy().windowDays} يومًا`,`New shortfall in ${KHPilot.policy().windowDays} days`),recent.value==null?'—':`${KHPlain.n(recent.value)} <span class="v09-unit">${KHPlain.unit()}</span>`,recent.value==null?L9('نحتاج سجل أحداث مكتملًا','A complete event history is needed'):recent.complete?L9('ما ظهر حديثًا؛ وليس صافي تغير النقص','Newly uncovered work; not the net change'):L9(`سجل مكتمل لـ ${recent.ready} من ${recent.total} مجموعة فقط`,`Complete history for ${recent.ready} of ${recent.total} groups only`));

}
function patchQueue9(){
  qa9('#decision-queue .queue-item').forEach(item=>{
    const r=getRowBySource(item.dataset.detail); if(!r)return;
    q9('.v09-queue-note',item)?.remove();
    const sv=surveillanceFor(r),note=document.createElement('small'); note.className='v09-queue-note';
    note.textContent=!sv?.dataSufficient?L9('الرصد غير كافٍ؛ الأولوية لا تستخدم سرعة ظهور نقص جديد','Incomplete history; speed of change is unknown'):sv.status==='stable_zero'?L9('لم يظهر نقص جديد؛ النقص القائم يحتاج مراجعة','No new shortfall; existing shortages still need review'):L9('الرصد التاريخي مكتمل','Complete event history');
    q9('div',item)?.appendChild(note);
  });
}
function patchGapMetrics9(){
  const cards=qa9('#gap-metrics .mini-metric'); if(cards.length<4)return;
  const s=sectorSummary();
  q9('strong',cards[1]).innerHTML=`${nf9(s.gap,1)} <span class="v09-unit">${KHPlain.unit()}</span>`;
  q9('strong',cards[3]).innerHTML=`${nf9(s.totalBurden,1)} <span class="v09-unit">${L9('نقطة أثر على الخدمة','service-impact points')}</span>`;
}
function patchDataHub9(){
  const code=q9('#view-data .contract-panel code'); if(code){code.textContent=CONTRACT_V09;code.classList.add('v09-contract-version')}
  const links=qa9('#view-data .import-footer a');
  if(links[0]){links[0].href='sample_position_snapshot_v09.csv';links[0].textContent=L9('تحميل لقطة القوى العاملة v0.9','Download Snapshot v0.9')}
  if(links[1]){links[1].href='sample_hr_event_log_v09.csv';links[1].textContent=L9('تحميل سجل الأحداث v0.9','Download Event Log v0.9')}
  const view=q9('#view-data'),existing=q9('#v09-data-dictionary'); if(!view||existing?.dataset.language===document.documentElement.lang)return;existing?.remove();
  const panel=document.createElement('details'); panel.id='v09-data-dictionary'; panel.dataset.language=document.documentElement.lang; panel.className='panel v09-dictionary kh-number-details';
  panel.innerHTML=`<summary>${L9('دليل الأعمدة والرموز لفريق التكامل','Column and code guide for your integration team')}</summary>
    <div class="panel-head compact"><div><span class="panel-kicker">${L9('قاموس البيانات المنشور','PUBLISHED DATA DICTIONARY')}</span><h3>${L9('لا يوجد رمز بلا معنى موثق','No code without a documented meaning')}</h3></div><code>${CONTRACT_V09}</code></div>
    <p class="v09-dictionary-intro">${L9('category حقل يعتمد على القطاع؛ أما G/J/L/P فهي بادئات للمستوى وليست فئات. المقارنة عبر القطاعات تستخدم المعنى الدلالي للمستوى، لا الحرف الخام. position_group_id هو مفتاح الربط المباشر بين اللقطة وسجل الأحداث.','category is sector-specific; G/J/L/P are level prefixes, not categories. Cross-sector comparison uses semantic level meaning rather than the raw prefix. position_group_id is the direct link between snapshots and events.')}</p>
    <div class="v09-dict-grid">
      <div class="v09-dict-card"><strong>${L9('قيم category','category codes')}</strong><table class="v09-code-table"><thead><tr><th>${L9('القطاع','Sector')}</th><th>${L9('الرمز','Code')}</th><th>${L9('المعنى','Meaning')}</th></tr></thead><tbody>
        <tr><td>EDU</td><td><code>A / B</code></td><td>${L9('مسار أ / مسار ب','Track A / Track B')}</td></tr>
        <tr><td>HLT</td><td><code>H / C</code></td><td>${L9('مستشفى / مركز','Hospital / Center')}</td></tr>
        <tr><td>MUN</td><td><code>F / O</code></td><td>${L9('ميداني / مكتبي','Field / Office')}</td></tr>
        <tr><td>GOV</td><td><code>C / R</code></td><td>${L9('مركزي / إقليمي','Central / Regional')}</td></tr>
      </tbody></table></div>
      <div class="v09-dict-card"><strong>${L9('بادئات level','level prefixes')}</strong><table class="v09-code-table"><thead><tr><th>${L9('القطاع','Sector')}</th><th>${L9('البادئة','Prefix')}</th><th>${L9('المعنى','Meaning')}</th></tr></thead><tbody>
        <tr><td>EDU</td><td><code>L</code></td><td>${L9('مرحلة تعليمية','Educational stage')}</td></tr>
        <tr><td>HLT</td><td><code>G</code></td><td>${L9('درجة مهنية','Professional grade')}</td></tr>
        <tr><td>MUN</td><td><code>J</code></td><td>${L9('مستوى وظيفي','Job level')}</td></tr>
        <tr><td>GOV</td><td><code>P</code></td><td>${L9('مستوى حكومي/مؤسسي','Government/corporate level')}</td></tr>
      </tbody></table></div>
      <div class="v09-dict-card"><strong>${L9('ربط سجل الأحداث','Event-log linkage')}</strong><small><code>position_group_id</code> ${L9('إلزامي ويطابق اللقطة مباشرة. sector/location/ssco/level/category حقول تحقق زائدة لكشف تغيّر الترميز، وليست مفتاح الربط.','is mandatory and directly references the snapshot. sector/location/ssco/level/category are redundant validation fields used to detect coding drift—not the join key.')}</small></div>
      <div class="v09-dict-card"><strong>${L9('طبيعة الخروج','Separation nature')}</strong><small><code>voluntary</code> ${L9('طوعي','voluntary')} · <code>involuntary</code> ${L9('غير طوعي/إنهاء خدمة','termination')} · <code>statutory</code> ${L9('تقاعد/نظامي','retirement/statutory')} · <code>internal_mobility</code> ${L9('حركة داخلية','internal movement')}.<br>${L9('ويُحفظ separation_reason منفصلًا لأن التعويض أو عبء العمل قابلان للتدخل، بينما الأداء أو فترة التجربة مسار قرار مختلف.','separation_reason is separate because compensation/workload are actionable through different levers than performance/probation.')}</small></div>
    </div>
    <div class="v09-dict-actions"><a href="data_dictionary_v09.md" target="_blank" rel="noreferrer">${L9('فتح قاموس البيانات الكامل','Open full data dictionary')}</a><a href="sample_position_snapshot_v09.csv" download>${L9('لقطة القوى العاملة v0.9','Snapshot v0.9')}</a><a href="sample_hr_event_log_v09.csv" download>${L9('سجل الأحداث v0.9','Event Log v0.9')}</a></div>`;
  view.appendChild(panel);
}
function auditRowFor9(x){
  if(x.position_group_id)return groupRowById(x.position_group_id);
  if(x.source)return getRowBySource(x.source);
  if(x.cell)return getRowByCell(x.cell);
  return null;
}
function patchAudit9(){
  const a=auditState(),body=q9('#audit-body'); if(!body)return;
  const rows=[...a.ledger].reverse(),legacy=[],current=[];
  rows.forEach(x=>{
    const hasCell=x.cell&&x.cell!=='—';
    const row=auditRowFor9(x);
    if((hasCell&&!row&&!x.position_group_id)||(x.kind==='surveillance_alert'&&x.basis&&x.basis!==SURV_V09))legacy.push(x); else current.push({x,row});
  });
  body.innerHTML=current.length?current.map(({x,row})=>{
    const pg=x.position_group_id||row?.position_group_id||'—',cell=x.workforce_cell||x.cell||(row?cellCode(row):'—');
    const when=x.recorded_at?new Date(x.recorded_at).toLocaleString(lang==='ar'?'ar-SA':'en-GB'):'—';
    const date=x.recorded_at?new Date(x.recorded_at):null,day=date&&!Number.isNaN(+date)?[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-'):'';
    const loc=row?sectorCfg(row.sector).locations.find(v=>v.id===row.location):null,occupation=row?sscoByCode(row.ssco):null,context=[occupation?.ar,occupation?.en,loc?.ar,loc?.en,x.kind,auditKindLabel(x.kind,'ar'),auditKindLabel(x.kind,'en'),pg,cell].filter(Boolean).join(' ');
    return `<tr data-audit-kind="${esc9(x.kind||'')}" data-audit-sector="${esc9(row?.sector||'')}" data-audit-date="${day}" data-audit-time="${date&&!Number.isNaN(+date)?+date:0}" data-audit-context="${esc9(context)}"><td>${when}</td><td data-audit-kind="${esc9(x.kind||'')}">${esc9(auditKindLabel(x.kind))}</td><td><span class="v09-pgid">${esc9(pg)}</span><small class="v09-cellcode">${esc9(cell)}</small></td><td>${esc9(auditDetailLabel(x.detail||formatAuditDetail(x)))}</td><td>${esc9(x.basis||'—')}</td><td><span class="v09-source-tag">${esc9(x.source||x.file_name||x.source_row||'—')}</span></td></tr>`;
  }).join(''):'<tr><td colspan="6">—</td></tr>';
  q9('#v09-audit-legacy')?.remove();
  if(legacy.length){
    const table=q9('#view-audit .table-panel');
    const note=document.createElement('details');note.id='v09-audit-legacy';note.className='v09-audit-legacy';
    const codes=[...new Set(legacy.map(x=>x.cell).filter(Boolean))].slice(0,8);
    note.innerHTML=`<summary>${L9(`${legacy.length} سجلًا محليًا قديمًا مستبعدًا من العرض القابل للإعادة`,`${legacy.length} legacy local records excluded from the reproducible view`)}</summary><div>${L9('هذه السجلات أُنشئت بإصدارات أقدم ولا يمكن ربط معرفاتها بالمفتاح الحالي position_group_id بشكل موثوق. لم تُحذف، لكنها لا تُقدَّم كدليل قابل للإعادة.','These records were created by older versions and their identifiers cannot be reliably resolved to the current position_group_id. They are retained locally but are not presented as reproducible evidence.')}</div><code>${esc9(codes.join(' · '))}</code>`;
    table?.insertAdjacentElement('beforebegin',note);
  }
  const fp=q9('#audit-fingerprint');if(fp)fp.textContent=a.fingerprint;
  const contract=q9('#audit-trust-grid .audit-trust:nth-child(4) small');if(contract)contract.textContent=CONTRACT_V09;document.dispatchEvent(new CustomEvent('kinetic:auditrender'));
}
function patchDrawer9(id){
  const r=getRowBySource(id),content=q9('#drawer-content');if(!r||!content)return;
  q9('.v09-drawer-audit',content)?.remove();
  const sv=surveillanceFor(r),sec=document.createElement('div');sec.className='drawer-section v09-drawer-audit';
  sec.innerHTML=`<h4>${L9('مفتاح الربط وكفاية الرصد','Link key & surveillance sufficiency')}</h4><div class="trace-grid"><div class="trace-stat"><span>position_group_id</span><strong>${esc9(r.position_group_id)}</strong></div><div class="trace-stat"><span>workforce_cell</span><strong>${esc9(cellCode(r))}</strong></div><div class="trace-stat"><span>${L9('بداية التاريخ المعلن','declared history start')}</span><strong>${esc9(r.event_history_start_date||'—')}</strong></div><div class="trace-stat"><span>${L9('حالة الرصد','surveillance status')}</span><strong>${esc9(stateLabel9(sv))}</strong></div></div><p class="v09-drawer-note">${L9('الأحداث ترتبط بهذه الخلية عبر position_group_id. الحقول الوصفية الخمسة تُستخدم للتحقق من اتساق الترميز فقط.','Events join to this group through position_group_id. The five descriptive fields are used only to validate coding consistency.')}</p>`;
  content.prepend(sec);
}
const openDrawerBase9=typeof openDrawer==='function'?openDrawer:null;
if(openDrawerBase9) openDrawer=function(id){openDrawerBase9(id);patchDrawer9(id)};

const renderAuditBase9=typeof renderAudit==='function'?renderAudit:null;
if(renderAuditBase9) renderAudit=function(){renderAuditBase9();queueMicrotask(patchAudit9)};
const renderDataHubBase9=typeof renderDataHub==='function'?renderDataHub:null;
if(renderDataHubBase9) renderDataHub=function(){renderDataHubBase9();queueMicrotask(patchDataHub9)};

function ensureSignalFilter9(){
  const f=q9('#signal-filter'),existing=q9('[data-signal="insufficient"]');if(existing)existing.textContent=L9('بيانات غير كافية','Insufficient');if(!f||existing)return;
  const b=document.createElement('button');b.dataset.signal='insufficient';b.dataset.i18n='common.insufficient';b.textContent=L9('بيانات غير كافية','Insufficient');
  f.appendChild(b);
}
function renderV09(){
  patchPeriod9();patchHero9();patchMetrics9();patchQueue9();patchGapMetrics9();patchDataHub9();patchAudit9();
  const engine=q9('#sidebar-engine-state');if(engine)engine.textContent=`${MEASUREMENT_VERSION} · KH-DECISION-v0.7 · ${SURV_V09} · ${CONTRACT_V09}`;
}

ensureSignalFilter9();

const renderAllBase9=typeof renderAll==='function'?renderAll:null;
if(renderAllBase9) renderAll=function(){renderAllBase9();queueMicrotask(renderV09)};

document.addEventListener('DOMContentLoaded',()=>{
  ensureSignalFilter9();
  const b=q9('[data-signal="insufficient"]');
  if(b&&!b.dataset.v09Bound){b.dataset.v09Bound='1';b.onclick=()=>{qa9('[data-signal]').forEach(x=>x.classList.toggle('active',x===b));signalFilter='insufficient';renderSignals()}}
  setTimeout(renderV09,0);
});
})();