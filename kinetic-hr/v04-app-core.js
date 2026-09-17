const t=k=>k.split('.').reduce((o,p)=>o?.[p],I18N[lang]) ?? k;
function occupationLabel(code){const o=sscoByCode(code);return o?o[lang]:String(code)}
function cellCode(r){return [r.sector,r.location,r.ssco,r.level,r.category].join('-')}
function identity(r){const c=sectorCfg(r.sector),o=sscoByCode(r.ssco);return [o?.[lang]||r.ssco,c?.locations.find(x=>x.id===r.location)?.[lang],c?.levels.find(x=>x.id===r.level)?.[lang],c?.categories.find(x=>x.id===r.category)?.[lang]].filter(Boolean).join(' · ')}
function deficit(r){return Math.max(0,Number(r.needed)-Number(r.filled))}
function surplus(r){return Math.max(0,Number(r.filled)-Number(r.needed))}
function deficitRatio(r){return Number(r.needed)>0?deficit(r)/Number(r.needed):0}
function coverageRatio(r){return Number(r.needed)>0?Math.min(Number(r.filled)/Number(r.needed),1):1}
function burden(r){return Number(r.affectedUnits||0)*(Number(r.avgVacancyWeeks||0)/52)*Number(r.criticality||1)}
function basePriority(r){
 const d=Math.min(deficitRatio(r),1),s=Number(r.scarcity||0)/3,v=Math.min(Number(r.avgVacancyWeeks||0)/52,1),sub=1-Math.min(Number(r.substitutes||0)/2,1),c=Number(r.criticality||0)/3;
 return Math.round(100*(.30*d+.20*s+.15*v+.15*sub+.20*c));
}
function currentRows(){return SNAPSHOTS.filter(r=>r.sector===activeSector)}
function relevantOccupations(sector){return SSCO_CATALOG.filter(o=>o.sector===sector)}
function scoreClass(s){return s>=70?'high':s>=45?'med':'low'}
function gapEvents(){return HR_EVENTS.filter(e=>GAP_EVENT_TYPES.has(e.event_type))}
function eventsForCell(r){const key=cellCode(r);return gapEvents().filter(e=>cellCode(e)===key)}
function surveillanceFor(r){
 if(eventMode==='gated') return null;
 const ev=eventsForCell(r), current=ev.filter(e=>monthOf(e.event_date)===CURRENT_MONTH).length;
 const hist=BASELINE_MONTHS.map(m=>ev.filter(e=>monthOf(e.event_date)===m).length);
 const baseline=hist.length?hist.reduce((a,b)=>a+b,0)/hist.length:0;
 const ratio=baseline>0?current/baseline:(current>0?Infinity:0);
 const alert=current>=2 && (baseline===0?current>=2:ratio>=ALERT_MULTIPLIER);
 const monitor=!alert && current>baseline && current>0;
 const causes=Object.entries(ev.filter(e=>monthOf(e.event_date)===CURRENT_MONTH).reduce((a,e)=>(a[e.event_type]=(a[e.event_type]||0)+1,a),{}));
 return {current,baseline,ratio,alert,monitor,causes,hist};
}
function signalState(r){const s=surveillanceFor(r);return !s?'gated':s.alert?'alert':s.monitor?'monitor':'normal'}
function priority(r){const base=basePriority(r),sv=surveillanceFor(r);if(!sv)return base;return Math.min(100,base+(sv.alert?15:sv.monitor?6:0))}
function sectorSummary(){
 const rows=currentRows(),needed=rows.reduce((a,r)=>a+Number(r.needed),0),filled=rows.reduce((a,r)=>a+Number(r.filled),0),gap=rows.reduce((a,r)=>a+deficit(r),0),surplusTotal=rows.reduce((a,r)=>a+surplus(r),0),svs=rows.map(surveillanceFor).filter(Boolean);
 const incidence=svs.reduce((a,s)=>a+s.current,0),alerts=svs.filter(s=>s.alert).length,monitors=svs.filter(s=>s.monitor).length,high=rows.filter(r=>priority(r)>=70).length,totalBurden=rows.reduce((a,r)=>a+burden(r),0);
 return {rows,needed,filled,gap,surplus:surplusTotal,coverage:needed?filled/needed:1,incidence,alerts,monitors,high,totalBurden};
}
function sectorIncidenceSeries(){
 const months=[...BASELINE_MONTHS,CURRENT_MONTH];
 return months.map(m=>gapEvents().filter(e=>e.sector===activeSector&&monthOf(e.event_date)===m).length);
}
function locationPressure(){
 const cfg=sectorCfg(activeSector);
 return cfg.locations.map(loc=>{
  const rows=currentRows().filter(r=>r.location===loc.id),need=rows.reduce((a,r)=>a+Number(r.needed),0),gap=rows.reduce((a,r)=>a+deficit(r),0),maxPriority=rows.length?Math.max(...rows.map(priority)):0;
  return {id:loc.id,label:loc[lang],need,gap,ratio:need?gap/need:0,maxPriority};
 }).filter(x=>x.need>0).sort((a,b)=>b.maxPriority-a.maxPriority||b.ratio-a.ratio);
}
function causeLabel(k){return t('cause.'+k)===('cause.'+k)?k:t('cause.'+k)}
function getRowBySource(id){return SNAPSHOTS.find(x=>x.source_row===id)}
function getRowByCell(code){return SNAPSHOTS.find(x=>cellCode(x)===code)}

function scenarioImpact(r,vals){
 const added=['hire','transfer','upskill','contract'].reduce((a,k)=>a+Math.max(0,Number(vals[k]||0)),0);
 const newFilled=Math.min(Number(r.needed),Number(r.filled)+added),newRow={...r,filled:newFilled},beforeGap=deficit(r),afterGap=deficit(newRow),beforeBurden=burden(r),burdenFactor=beforeGap>0?afterGap/beforeGap:0,afterBurden=beforeBurden*burdenFactor,beforePriority=priority(r),afterPriority=priority(newRow);
 return {added,newFilled,beforeGap,afterGap,beforeBurden,afterBurden,burdenReduction:Math.max(0,beforeBurden-afterBurden),beforePriority,afterPriority,coverageAfter:Number(r.needed)?newFilled/Number(r.needed):1};
}
let _scenarioMemory=[];
function readScenarioLedger(){try{const v=JSON.parse(localStorage.getItem(SCENARIO_STORAGE_KEY)||'[]');_scenarioMemory=v;return v}catch{return _scenarioMemory}}
function writeScenarioLedger(rows){_scenarioMemory=rows.slice(-50);try{localStorage.setItem(SCENARIO_STORAGE_KEY,JSON.stringify(_scenarioMemory))}catch{}}
function saveScenarioRecord(r,vals){const impact=scenarioImpact(r,vals),rec={id:'SCN-'+Date.now().toString(36).toUpperCase(),created_at:new Date().toISOString(),sector:r.sector,cell:cellCode(r),source_row:r.source_row,ssco:r.ssco,inputs:{...vals},impact,fingerprint:stableStateFingerprint(),formula:PRIORITY_FORMULA_VERSION};const rows=readScenarioLedger();rows.push(rec);writeScenarioLedger(rows);appendAuditRecord({key:'scenario|'+rec.id,kind:'scenario_saved',scenario_id:rec.id,cell:rec.cell,ssco:rec.ssco,detail:`gap ${impact.beforeGap}→${impact.afterGap}`,formula:PRIORITY_FORMULA_VERSION,fingerprint:rec.fingerprint});return rec}

function stableStateFingerprint(){
 const payload=JSON.stringify({ssco:SSCO_META.version,formula:PRIORITY_FORMULA_VERSION,contract:DATA_CONTRACT_VERSION,threshold:ALERT_MULTIPLIER,snapshots:SNAPSHOTS.map(r=>[r.source_row,cellCode(r),r.needed,r.filled]),events:HR_EVENTS.map(e=>[e.event_id,e.event_type,e.event_date,cellCode(e)])});
 let h=2166136261;for(let i=0;i<payload.length;i++){h^=payload.charCodeAt(i);h=Math.imul(h,16777619)}return 'KH-'+(h>>>0).toString(16).padStart(8,'0').toUpperCase();
}
let _auditMemory=[];
function readAuditLedger(){try{const v=JSON.parse(localStorage.getItem(AUDIT_STORAGE_KEY)||'[]');_auditMemory=v;return v}catch{return _auditMemory}}
function writeAuditLedger(rows){_auditMemory=rows.slice(-300);try{localStorage.setItem(AUDIT_STORAGE_KEY,JSON.stringify(_auditMemory))}catch{}}
function appendAuditRecord(rec){const rows=readAuditLedger();if(rec.key&&rows.some(x=>x.key===rec.key))return;rows.push({...rec,recorded_at:new Date().toISOString()});writeAuditLedger(rows)}
function syncAlertAudit(){if(eventMode==='gated')return;SNAPSHOTS.forEach(r=>{const sv=surveillanceFor(r);if(!sv?.alert)return;const ratio=Number.isFinite(sv.ratio)?Number(sv.ratio.toFixed(2)):null;appendAuditRecord({key:['alert',CURRENT_MONTH,cellCode(r),eventMode,stableStateFingerprint()].join('|'),kind:'surveillance_alert',month:CURRENT_MONTH,cell:cellCode(r),ssco:r.ssco,current:sv.current,baseline:Number(sv.baseline.toFixed(2)),ratio,threshold:ALERT_MULTIPLIER,event_mode:eventMode,snapshot_mode:snapshotMode,formula:PRIORITY_FORMULA_VERSION,source_row:r.source_row,fingerprint:stableStateFingerprint()})})}
function recordImportAudit(kind,count,fileName){appendAuditRecord({key:['import',kind,Date.now(),count].join('|'),kind:kind+'_import',count,file_name:fileName||'',snapshot_mode:snapshotMode,event_mode:eventMode,formula:PRIORITY_FORMULA_VERSION,fingerprint:stableStateFingerprint()})}
function auditState(){syncAlertAudit();return {fingerprint:stableStateFingerprint(),ledger:readAuditLedger(),sscoVersion:SSCO_META.version,sscoMode:SSCO_META.catalogMode,formula:PRIORITY_FORMULA_VERSION,contract:DATA_CONTRACT_VERSION,threshold:ALERT_MULTIPLIER,snapshotCount:SNAPSHOTS.length,eventCount:HR_EVENTS.length,snapshotMode,eventMode,snapshotImportedAt,eventImportedAt,scenarioCount:readScenarioLedger().length}}
