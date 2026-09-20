/* Shared measurement state. No renderer may independently decide evidence eligibility. */
window.KHMeasurement=(()=>{
 'use strict';
 const calculateSurveillance=surveillanceFor;
 const version='KH-SIGNAL-STATE-v1';
 function forRow(r){
  const raw=calculateSurveillance(r),w=getWindows(r),day=86400000;
  const start=dUTC(r.event_history_start_date),end=dUTC(r.event_history_end_date);
  const first=w.baseline[0].start,last=w.current.end;
  const requiredDays=Math.round((last-first)/day)+1;
  const coveredDays=start&&end?Math.max(0,Math.round((Math.min(+end,+last)-Math.max(+start,+first))/day)+1):null;
  // This is declared temporal coverage, not a claim that all source events were supplied.
  const completeness=coveredDays==null||eventMode==='gated'?null:Math.min(100,Math.floor(coveredDays/requiredDays*1000)/10);
  const quarantined=(DATA_QUALITY.events?.quarantined||0)+(DATA_QUALITY.snapshot?.quarantined||0);
  const sufficient=!!raw?.dataSufficient&&completeness===100&&!quarantined;
  const alertState=!sufficient?'insufficient':raw.alert?'alert':raw.monitor?'monitor':'normal';
  const reasonCode=sufficient?null:eventMode==='gated'?'missing-events':quarantined?'quarantined':completeness!==100?'incomplete-history':'ineligible-data';
  // Preserve the legacy null sentinel for snapshot-only imports. Every other caller
  // receives the same gated rates, flags and evidence state as the decision model.
  const surveillance=!raw?null:{...raw,dataSufficient:sufficient,alert:alertState==='alert',monitor:alertState==='monitor',status:!sufficient?'insufficient':raw.status,
   ...(!sufficient?{currentRate:null,baselineRate:null,ratio:null,currentNewGapFte:null,baselineNewGapFte:null,histRates:[],histGapFte:[],causes:[]}:{}),
   alert_state:alertState,event_log_completeness:completeness,decision_basis:sufficient?'incidence-supported':'prevalence-only'};
  return Object.freeze({version,source_row:r.source_row,alert_state:alertState,event_log_completeness:completeness,required_completeness:100,
   decision_basis:sufficient?'incidence-supported':'prevalence-only',data_sufficient:sufficient,reason_code:reasonCode,
   required_days:requiredDays,covered_days:coveredDays,quarantined_records:quarantined,surveillance});
 }
 function forSector(){
  const states=currentRows().map(r=>({r,measurement:forRow(r)}));
  const counts={alert:0,monitor:0,normal:0,insufficient:0};
  for(const x of states)counts[x.measurement.alert_state]++;
  return{states,counts};
 }
 return Object.freeze({version,forRow,forSector});
})();
// Existing calculations, priority factors and exports use the shared gate too.
surveillanceFor=r=>KHMeasurement.forRow(r).surveillance;
signalState=r=>KHMeasurement.forRow(r).alert_state;
