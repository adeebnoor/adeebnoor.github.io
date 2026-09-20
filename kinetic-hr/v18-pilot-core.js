/* KHDC-v1.0 / KH-SURV-v1.0. Local, deterministic measurement policies. No model calls. */
window.KHPilot = (() => {
  const key='kinetic_hr_policy_v1', defaults={windowDays:30,alertMultiplier:1.5,minNewGapFteWhenBaselineZero:2,minRequiredFte:10};
  const clean=value=>{
    const v={...defaults,...value};
    if(![30,90,180].includes(Number(v.windowDays)))throw Error('windowDays');
    for(const [name,min,max] of [['alertMultiplier',1.01,20],['minNewGapFteWhenBaselineZero',0.1,10000],['minRequiredFte',0,100000]])if(!Number.isFinite(Number(v[name]))||Number(v[name])<min||Number(v[name])>max)throw Error(name);
    return Object.fromEntries(Object.keys(defaults).map(k=>[k,Number(v[k])]));
  };
  let state={sectors:{},cells:{}};
  try{const saved=JSON.parse(localStorage.getItem(key)||'null');if(saved){for(const [s,p] of Object.entries(saved.sectors||{}))if(CONFIG.sectors[s])state.sectors[s]=clean(p);for(const [c,p] of Object.entries(saved.cells||{}))state.cells[c]=clean(p)}}catch{state={sectors:{},cells:{}}}
  const cell=r=>[r.sector,r.location,r.ssco,r.level].join('-');
  function policy(r){const sector=r?.sector||activeSector,base={...defaults,...state.sectors[sector]};const override=r?state.cells[cell(r)]:null;return {...base,...override,windowDays:base.windowDays,baselineWindows:3,version:'KH-SURV-v1.0'}}
  const manifest=()=>JSON.parse(JSON.stringify(state));
  const revision=()=> 'KH-SURV-v1.0-'+sha256(JSON.stringify(canonicalize(state))).slice(0,12);
  function save(scope,target,values){
    const before=manifest(),v=clean(values);
    if(scope==='sector'){if(!CONFIG.sectors[target])throw Error('sector');state.sectors[target]=v}
    else if(scope==='cell'){if(!SNAPSHOTS.some(r=>cell(r)===target))throw Error('cell');state.cells[target]=v}
    else throw Error('scope');
    localStorage.setItem(key,JSON.stringify(state));
    appendAuditRecord({key:'policy|'+revision(),kind:'policy_change',detail:JSON.stringify({scope,target,before,after:manifest()}),basis:revision(),source:'Local policy editor',effective_policy:manifest(),fingerprint:stableStateFingerprint()});
  }
  function reset(scope,target){delete state[scope==='cell'?'cells':'sectors'][target];localStorage.setItem(key,JSON.stringify(state));appendAuditRecord({key:'policy-reset|'+Date.now(),kind:'policy_change',detail:JSON.stringify({scope,target,reset:true}),basis:revision(),source:'Local policy editor',effective_policy:manifest(),fingerprint:stableStateFingerprint()})}
  return {policy,save,reset,manifest,revision,cell,clean,defaults};
})();

// Validation augments the existing gate; rejected input never enters the engine.
(()=>{
  const originalSnapshots=validateSnapshots, originalEvents=validateEvents;
  const iso=value=>/^\d{4}-\d{2}-\d{2}$/.test(String(value||''))&&dUTC(value)?.toISOString().slice(0,10)===value;
  const quarantine=(out,row,id,reasons)=>{out.quality.quarantine.push({row,id,reasons});out.quality.errors.push(...reasons.map(x=>`${id}: ${x}`))};
  const finish=out=>{out.quality.accepted=out.rows.length;out.quality.quarantined=out.quality.quarantine.length;return out};
  validateSnapshots=function(raw){
    const out=originalSnapshots(raw),counts=new Map(),dates=new Set(out.rows.map(r=>r.as_of_date));
    for(const r of out.rows)counts.set(cellCode(r),(counts.get(cellCode(r))||0)+1);
    out.rows=out.rows.filter((r,i)=>{
      const errors=[],cfg=CONFIG.sectors[r.sector];
      if(counts.get(cellCode(r))>1)errors.push('duplicate standard cell: sector/location/ssco/level');
      if(dates.size>1)errors.push('snapshot rows must share one as_of_date');
      if(!iso(r.as_of_date))errors.push('invalid calendar as_of_date');
      if(!cfg?.levels.some(x=>x.id===r.level))errors.push('unknown level for sector');
      if(!cfg?.categories.some(x=>x.id===r.category))errors.push('unknown category for sector');
      for(const name of ['gap_onset_date','event_history_start_date','event_history_end_date'])if(r[name]&&(!iso(r[name])||r[name]>r.as_of_date))errors.push(`invalid ${name}`);
      if(r.event_history_start_date&&r.event_history_end_date&&r.event_history_start_date>r.event_history_end_date)errors.push('history start is after history end');
      if(!r.event_history_end_date)out.quality.warnings.push(`${r.source_row}: missing event_history_end_date; incidence unavailable`);
      for(const name of ['funded_fte','cost_per_uncovered_fte_day',...['hire','transfer','upskill','contract'].flatMap(k=>[k+'_unit_cost_sar',k+'_approval_days']),'scenario_budget_sar']){
        if(r[name]==null||r[name]==='')continue;
        if(!Number.isFinite(Number(r[name]))||Number(r[name])<0)errors.push(`invalid ${name}`);else r[name]=Number(r[name]);
      }
      if(r.funded_fte!=null&&r.funded_fte>r.needed_fte)errors.push('funded_fte exceeds needed_fte');
      if(['cost_per_uncovered_fte_day','hire_unit_cost_sar','transfer_unit_cost_sar','upskill_unit_cost_sar','contract_unit_cost_sar'].some(k=>r[k]!=null&&r[k]!=='')&&!String(r.financial_cost_source||'').trim())errors.push('financial_cost_source required for cost inputs');
      if(errors.length){quarantine(out,i+1,r.source_row,errors);return false}return true;
    });return finish(out);
  };
  validateEvents=function(raw,snapshots=SNAPSHOTS){
    const out=originalEvents(raw,snapshots),byId=new Map(snapshots.map(r=>[r.position_group_id,r])),duplicates=new Set(),seen=new Set();
    for(const r of raw){if(seen.has(r.event_id))duplicates.add(r.event_id);seen.add(r.event_id)}
    out.rows=out.rows.filter((e,i)=>{
      const errors=[],r=byId.get(e.position_group_id),cap=e.capacity_delta_fte,dem=e.demand_delta_fte;
      if(duplicates.has(e.event_id))errors.push('duplicate event_id makes event history incomplete');
      if(!iso(e.event_date))errors.push('invalid calendar event_date');
      if(r&&e.event_date>r.as_of_date)errors.push('event after linked snapshot');
      if(e.event_sequence!=null&&e.event_sequence!==''&&(!Number.isInteger(Number(e.event_sequence))||Number(e.event_sequence)<0))errors.push('invalid event_sequence');
      if(['resignation','termination','retirement','transfer_out','long_term_absence','internal_promotion','coverage_end'].includes(e.event_type)&&(cap>=0||dem!==0))errors.push('exit must reduce capacity only');
      if(['hire','transfer_in','return_from_absence','coverage_start'].includes(e.event_type)&&(cap<=0||dem!==0))errors.push('coverage must increase capacity only');
      if(['demand_increase','position_created_unfilled'].includes(e.event_type)&&(dem<=0||cap!==0))errors.push('demand increase must increase demand only');
      if(['demand_decrease','position_closed'].includes(e.event_type)&&(dem>=0||cap!==0))errors.push('demand decrease must reduce demand only');
      if(e.event_type==='role_transformation'&&(cap!==0||dem!==0))errors.push('role transformation must not change capacity or demand');
      if(errors.length){quarantine(out,i+1,e.event_id,errors);return false}return true;
    });
    // Reject an entire affected group when the accepted sequence implies negative historical capacity/demand.
    const invalid=new Set();
    for(const r of snapshots){const es=out.rows.filter(e=>e.position_group_id===r.position_group_id).sort((a,b)=>a.event_date.localeCompare(b.event_date)||Number(a.event_sequence||0)-Number(b.event_sequence||0)||a.event_id.localeCompare(b.event_id));let need=requiredFte(r)-es.reduce((a,e)=>a+e.demand_delta_fte,0),avail=availableFte(r)-es.reduce((a,e)=>a+e.capacity_delta_fte,0);if(need<0||avail<0)invalid.add(r.position_group_id);for(const e of es){need+=e.demand_delta_fte;avail+=e.capacity_delta_fte;if(need<0||avail<0)invalid.add(r.position_group_id)}}
    out.rows=out.rows.filter((e,i)=>{if(!invalid.has(e.position_group_id))return true;quarantine(out,i+1,e.event_id,['negative reconstructed history']);return false});
    return finish(out);
  };
  const baseFingerprint=stableStateFingerprint;
  stableStateFingerprint=function(){return 'SHA256-'+sha256(baseFingerprint()+'|'+JSON.stringify(canonicalize(KHPilot.manifest()))+'|KHDC-v1.0|KH-MEASURE-v1.0').toUpperCase()};
  const baseAudit=auditState;
  auditState=function(){return {...baseAudit(),measurement:MEASUREMENT_VERSION,contract:'KHDC-v1.0',surveillancePolicy:KHPilot.revision(),effectivePolicy:KHPilot.manifest()}};
  const baseAppend=appendAuditRecord;
  appendAuditRecord=function(x){const row=x.source?getRowBySource(x.source):getRowByCell(x.cell);return baseAppend({...x,policy_revision:KHPilot.revision(),effective_policy:row?KHPilot.policy(row):KHPilot.manifest()})};
})();
