const t=k=>k.split('.').reduce((o,p)=>o?.[p],I18N[lang]) ?? k;
function occupationLabel(code){const o=sscoByCode(code);return o?o[lang]:String(code)}
function cellCode(r){return [r.sector,r.location,r.ssco,r.level,r.category].join('-')}
function identity(r){const c=sectorCfg(r.sector),o=sscoByCode(r.ssco);return [o?.[lang]||r.ssco,c.locations.find(x=>x.id===r.location)?.[lang],c.levels.find(x=>x.id===r.level)?.[lang],c.categories.find(x=>x.id===r.category)?.[lang]].filter(Boolean).join(' · ')}
function deficit(r){return Math.max(0,Number(r.needed)-Number(r.filled))}
function deficitRatio(r){return Number(r.needed)>0?deficit(r)/Number(r.needed):0}
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
 const ev=eventsForCell(r); const current=ev.filter(e=>monthOf(e.event_date)===CURRENT_MONTH).length;
 const hist=BASELINE_MONTHS.map(m=>ev.filter(e=>monthOf(e.event_date)===m).length);
 const baseline=hist.reduce((a,b)=>a+b,0)/hist.length;
 const ratio=baseline>0?current/baseline:(current>0?Infinity:0);
 const alert=current>=2 && (baseline===0?current>=2:ratio>=ALERT_MULTIPLIER);
 const monitor=!alert && current>baseline && current>0;
 const causes=Object.entries(ev.filter(e=>monthOf(e.event_date)===CURRENT_MONTH).reduce((a,e)=>(a[e.event_type]=(a[e.event_type]||0)+1,a),{}));
 return {current,baseline,ratio,alert,monitor,causes,hist};
}
function priority(r){
 const base=basePriority(r),sv=surveillanceFor(r);
 if(!sv) return base;
 const signal=sv.alert?15:sv.monitor?6:0;
 return Math.min(100,base+signal);
}

function stableStateFingerprint(){
 const payload=JSON.stringify({ssco:SSCO_META.version,formula:PRIORITY_FORMULA_VERSION,contract:DATA_CONTRACT_VERSION,threshold:ALERT_MULTIPLIER,snapshots:SNAPSHOTS.map(r=>[r.source_row,cellCode(r),r.needed,r.filled]),events:HR_EVENTS.map(e=>[e.event_id,e.event_type,e.event_date,cellCode(e)])});
 let h=2166136261;for(let i=0;i<payload.length;i++){h^=payload.charCodeAt(i);h=Math.imul(h,16777619)}
 return 'KH-'+(h>>>0).toString(16).padStart(8,'0').toUpperCase();
}
function readAuditLedger(){try{return JSON.parse(localStorage.getItem(AUDIT_STORAGE_KEY)||'[]')}catch{return []}}
function writeAuditLedger(rows){try{localStorage.setItem(AUDIT_STORAGE_KEY,JSON.stringify(rows.slice(-200)))}catch{}}
function appendAuditRecord(rec){const rows=readAuditLedger();if(rows.some(x=>x.key===rec.key))return;rows.push({...rec,recorded_at:new Date().toISOString()});writeAuditLedger(rows)}
function syncAlertAudit(){
 if(eventMode==='gated')return;
 SNAPSHOTS.forEach(r=>{const sv=surveillanceFor(r);if(!sv?.alert)return;const ratio=Number.isFinite(sv.ratio)?Number(sv.ratio.toFixed(2)):null;appendAuditRecord({key:['alert',CURRENT_MONTH,cellCode(r),eventMode,stableStateFingerprint()].join('|'),kind:'surveillance_alert',month:CURRENT_MONTH,cell:cellCode(r),ssco:r.ssco,current:sv.current,baseline:Number(sv.baseline.toFixed(2)),ratio,threshold:ALERT_MULTIPLIER,event_mode:eventMode,snapshot_mode:snapshotMode,formula:PRIORITY_FORMULA_VERSION,source_row:r.source_row,fingerprint:stableStateFingerprint()})})
}
function recordImportAudit(kind,count,fileName){appendAuditRecord({key:['import',kind,Date.now(),count].join('|'),kind:kind+'_import',count,file_name:fileName||'',snapshot_mode:snapshotMode,event_mode:eventMode,formula:PRIORITY_FORMULA_VERSION,fingerprint:stableStateFingerprint()})}
function auditState(){syncAlertAudit();return {fingerprint:stableStateFingerprint(),ledger:readAuditLedger(),sscoVersion:SSCO_META.version,sscoMode:SSCO_META.catalogMode,formula:PRIORITY_FORMULA_VERSION,contract:DATA_CONTRACT_VERSION,threshold:ALERT_MULTIPLIER,snapshotCount:SNAPSHOTS.length,eventCount:HR_EVENTS.length,snapshotMode,eventMode,snapshotImportedAt,eventImportedAt}}
