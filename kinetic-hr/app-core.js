const t=k=>k.split('.').reduce((o,p)=>o?.[p],I18N[lang])??k;
function occupationLabel(code){const o=sscoByCode(code);return o?o[lang]:String(code)}
function cellCode(r){return[r.sector,r.location,r.ssco,r.level,r.category].join('-')}
function identity(r){const c=sectorCfg(r.sector),o=sscoByCode(r.ssco);return[o?.[lang]||r.ssco,c.locations.find(x=>x.id===r.location)?.[lang],c.levels.find(x=>x.id===r.level)?.[lang],c.categories.find(x=>x.id===r.category)?.[lang]].filter(Boolean).join(' · ')}
function deficit(r){return Math.max(0,Number(r.needed)-Number(r.filled))}
function deficitRatio(r){return Number(r.needed)>0?deficit(r)/Number(r.needed):0}
function burden(r){return Number(r.affectedUnits||0)*(Number(r.avgVacancyWeeks||0)/52)*Number(r.criticality||1)}
function basePriority(r){const d=Math.min(deficitRatio(r),1),s=Number(r.scarcity||0)/3,v=Math.min(Number(r.avgVacancyWeeks||0)/52,1),sub=1-Math.min(Number(r.substitutes||0)/2,1),c=Number(r.criticality||0)/3;return Math.round(100*(.30*d+.20*s+.15*v+.15*sub+.20*c))}
function currentRows(){return SNAPSHOTS.filter(r=>r.sector===activeSector)}
function relevantOccupations(sector){return SSCO_CATALOG.filter(o=>o.sector===sector)}
function scoreClass(s){return s>=70?'high':s>=45?'med':'low'}
function gapEvents(){return HR_EVENTS.filter(e=>GAP_EVENT_TYPES.has(e.event_type))}
function eventsForCell(r){const key=cellCode(r);return gapEvents().filter(e=>cellCode(e)===key)}
function surveillanceFor(r){if(eventMode==='gated')return null;const ev=eventsForCell(r),current=ev.filter(e=>monthOf(e.event_date)===CURRENT_MONTH).length,hist=BASELINE_MONTHS.map(m=>ev.filter(e=>monthOf(e.event_date)===m).length),baseline=hist.reduce((a,b)=>a+b,0)/hist.length,ratio=baseline>0?current/baseline:(current>0?Infinity:0),alert=current>=2&&(baseline===0?current>=2:ratio>=ALERT_MULTIPLIER),monitor=!alert&&current>baseline&&current>0,causes=Object.entries(ev.filter(e=>monthOf(e.event_date)===CURRENT_MONTH).reduce((a,e)=>(a[e.event_type]=(a[e.event_type]||0)+1,a),{}));return{current,baseline,ratio,alert,monitor,causes,hist}}
function priority(r){const base=basePriority(r),sv=surveillanceFor(r);if(!sv)return base;return Math.min(100,base+(sv.alert?15:sv.monitor?6:0))}
