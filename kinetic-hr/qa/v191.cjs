/* Regression: v190 disagreed at cold boot, before a language change redrew all views. */
async function consistent(p,assert,{state='alert',basis='incidence-supported',alerts=1,coverage=100}={}){
 const actual=await p.evaluate(()=>{
  const r=getRowBySource('demo-001'),m=KHMeasurement.forRow(r),sv=surveillanceFor(r);
  const evidence=['#v16-next-action','#signals-grid .signal-card[data-source="demo-001"]','#v19-apply-proposal'].map(selector=>{
   const el=document.querySelector(selector+' [data-decision-basis]');
   return el?{basis:el.dataset.decisionBasis,state:el.dataset.alertState,coverage:el.dataset.eventLogCompleteness,source:el.dataset.source}:null;
  });
  const card=document.querySelector('#signals-grid .signal-card[data-source="demo-001"]');
  return{m,ratio:sv?.ratio,priority:decisionPriority(r),summary:sectorSummary().alerts,counts:KHMeasurement.forSector().counts,
   radar:Number(document.querySelector('#hero-alerts').textContent),nav:Number(document.querySelector('#nav-alert-count').textContent),
   signalCount:Number(document.querySelector('#signals-summary .alert b').textContent),cardState:card?.dataset.alertState,
   cardRatio:card?.querySelectorAll('.signal-metric strong')[2]?.textContent,
   staleMultiplier:/4[.,]0+×/.test([card?.textContent,document.querySelector('#v16-next-action')?.textContent,document.querySelector('#v19-apply-proposal')?.textContent].join(' ')),evidence};
 });
 assert.equal(actual.m.alert_state,state);assert.equal(actual.m.decision_basis,basis);assert.equal(actual.m.event_log_completeness,coverage);
 for(const key of ['summary','radar','nav','signalCount'])assert.equal(actual[key],alerts,key+' must match the canonical alert count');
 assert.equal(actual.counts.alert,alerts);assert.equal(actual.cardState,state);
 for(const e of actual.evidence){assert(e,'All three decision surfaces must expose evidence');assert.equal(e.source,'demo-001');assert.equal(e.basis,basis);assert.equal(e.state,state);assert.equal(e.coverage,String(coverage))}
 if(basis==='prevalence-only'){
  assert.equal(actual.ratio,null);assert.equal(actual.cardRatio,'—');assert.equal(actual.staleMultiplier,false);
  assert(!actual.priority.factorContributions.some(f=>f.factor==='velocity'));
 }else assert.equal(actual.ratio,4);
 return actual;
}
exports.coldBoot=async({p,check,assert,width,language})=>{
 await check(`${language}/${width}/v191: untouched first render has one consistent Al-Jawf alert`,async()=>{
  const q=await p.evaluate(()=>DATA_QUALITY);assert.equal(q.events.accepted,72);assert.equal(q.events.quarantined,0);
  assert.equal(await p.locator('html').getAttribute('lang'),language);
  const first=await consistent(p,assert);assert.equal(first.priority.score,88);
  await p.waitForTimeout(900);await consistent(p,assert); // Deferred UI enrichments must not change evidence.
 });
};
exports.transitions=async({p,check,out,assert,path,width,language})=>{
 if(width!==1366)return;
 const pause=()=>p.waitForTimeout(250),nav=async view=>{await p.evaluate(v=>showView(v),view);await pause()};
 const csv=rows=>{const headers=[...new Set(rows.flatMap(Object.keys))],q=v=>'"'+String(v??'').replace(/"/g,'""')+'"';return [headers,...rows.map(r=>headers.map(k=>r[k]))].map(row=>row.map(q).join(',')).join('\r\n')};
 const events=await p.evaluate(()=>DEMO_EVENTS.map(e=>({...e}))),snapshots=await p.evaluate(()=>DEMO_SNAPSHOTS.map(r=>({...r})));
 const upload=async(id,name,rows)=>{await p.locator('#'+id).setInputFiles({name,mimeType:'text/csv',buffer:Buffer.from(csv(rows))});await pause()};
 await nav('data');await p.locator('#reset-demo').click();await pause();
 await nav('scenario');await p.locator('#scenario-cell').selectOption('demo-001');await pause();await nav('data');
 await check(`${language}/${width}/v191: one quarantined event gates every screen despite 100% time coverage`,async()=>{
  await upload('event-upload','events-with-quarantine.csv',[...events,{...events[0],event_id:'invalid-v191',event_type:'unsupported-test-event'}]);
  const q=await p.evaluate(()=>DATA_QUALITY.events);assert.equal(q.accepted,72);assert.equal(q.quarantined,1);
  // Assert the hidden screens too, before navigation can redraw them.
  await consistent(p,assert,{state:'insufficient',basis:'prevalence-only',alerts:0});
  for(const view of ['dashboard','signals','scenario']){await nav(view);await consistent(p,assert,{state:'insufficient',basis:'prevalence-only',alerts:0})}
  assert.equal(await p.evaluate(()=>KHMeasurement.forRow(getRowBySource('demo-001')).reason_code),'quarantined');
  await nav('signals');await p.screenshot({path:path.join(out,`v191-quarantined-${language}.png`),fullPage:true});
 });
 await check(`${language}/${width}/v191: replacing the event file restores all alert surfaces together`,async()=>{
  await nav('data');await upload('event-upload','complete-events.csv',events);await consistent(p,assert);
  await nav('dashboard');await p.screenshot({path:path.join(out,`v191-consistent-command-${language}.png`),fullPage:true});
  await nav('signals');await p.screenshot({path:path.join(out,`v191-consistent-signals-${language}.png`),fullPage:true});
 });
 await check(`${language}/${width}/v191: missing final history day blocks the multiplier until snapshot and events are restored`,async()=>{
  const short=snapshots.map(r=>r.source_row==='demo-001'?{...r,event_history_end_date:'2026-09-16'}:r);
  await nav('data');await upload('csv-upload','one-day-missing.csv',short);await upload('event-upload','complete-events.csv',events);
  await consistent(p,assert,{state:'insufficient',basis:'prevalence-only',alerts:0,coverage:99.1});
  assert.equal(await p.evaluate(()=>KHMeasurement.forRow(getRowBySource('demo-001')).reason_code),'incomplete-history');
  await upload('csv-upload','complete-snapshot.csv',snapshots);await upload('event-upload','complete-events.csv',events);await consistent(p,assert);
 });
 await check(`${language}/${width}/v191: monitoring is not counted as an acceleration alert`,async()=>{
  await nav('signals');if(await p.locator('#v18-policy').getAttribute('open')===null)await p.locator('#v18-policy>summary').click();
  await p.locator('#v18-policy-target').selectOption('sector');await p.locator('#v18-multiplier').fill('10');await p.locator('#v18-policy-form button[type=submit]').click();await pause();
  await consistent(p,assert,{state:'monitor',alerts:0});
  assert.equal(await p.evaluate(()=>KHMeasurement.forSector().counts.monitor),1);
  await p.reload();await p.locator('.v14-landing-shell').waitFor();await pause();await consistent(p,assert,{state:'monitor',alerts:0});
  await p.locator('[data-v14-enter]').last().click();await nav('signals');if(await p.locator('#v18-policy').getAttribute('open')===null)await p.locator('#v18-policy>summary').click();
  await p.locator('#v18-policy-reset').click();await pause();await consistent(p,assert);
 });
 await nav('data');await p.locator('#reset-demo').click();await pause();await nav('dashboard');
};
