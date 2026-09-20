/* P0 acceptance: imported records -> measured alert -> policy -> scenario -> native report. */
module.exports=async({p,check,out,assert,path,width,language})=>{
const fs=require('fs'),{execFileSync}=require('child_process');
const pause=()=>p.waitForTimeout(200),nav=async view=>{await p.evaluate(v=>showView(v),view);await pause()};
await check(`${language}/${width}/P0: four-part cells, complete history and deterministic calculations`,async()=>{
 const result=await p.evaluate(()=>{
  const r=SNAPSHOTS[0],event=HR_EVENTS.find(e=>e.position_group_id===r.position_group_id),base=[...HR_EVENTS],fp=stableStateFingerprint(),sv=surveillanceFor(r),order=JSON.stringify(replayCell(r).records.map(x=>[x.event_id,x.newGapFte]));
  HR_EVENTS.reverse();const again=stableStateFingerprint(),reordered=JSON.stringify(replayCell(r).records.map(x=>[x.event_id,x.newGapFte]));HR_EVENTS=base;
  const duplicate=validateSnapshots([{...r},{...r,source_row:'duplicate',position_group_id:'duplicate',category:r.category==='A'?'B':r.category}]);
  const wrongSign=validateEvents([{...event,event_type:'resignation',separation_nature:'voluntary',separation_reason:'test',capacity_delta_fte:1,demand_delta_fte:0}]);
  const wrongDate=validateEvents([{...event,event_date:'2026-02-30'}]);
  const missingEnd=surveillanceFor({...r,event_history_end_date:''}),shortHistory=surveillanceFor({...r,event_history_start_date:r.as_of_date});
  const score=decisionPriority(r),sum=score.factorContributions.reduce((a,x)=>a+x.points,0);
  const quoted=parseCsv('source_row,financial_cost_source\r\n1,"Line one\nLine two, quoted ""source"""');
  return {cell:cellCode(r),fp:fp===again,replay:order===reordered,rate:sv.currentRate,duplicate:duplicate.rows.length,wrongSign:wrongSign.rows.length,wrongDate:wrongDate.rows.length,missingEnd:missingEnd.currentRate,short:shortHistory.currentRate,sum:Math.round(sum),score:score.score,quoted:quoted[0].financial_cost_source};
 });
 assert.equal(result.cell.split('-').length,4);assert(result.fp&&result.replay);assert(result.rate>0);assert.equal(result.duplicate,0);assert.equal(result.wrongSign,0);assert.equal(result.wrongDate,0);assert.equal(result.missingEnd,null);assert.equal(result.short,null);assert.equal(result.sum,result.score);assert(result.quoted.includes('\n')&&result.quoted.includes('"source"'));
});
await check(`${language}/${width}/P0: sector and cell thresholds reclassify and preserve policy versions`,async()=>{
 await nav('signals');await p.locator('#v18-policy>summary').click();const fp=await p.evaluate(()=>stableStateFingerprint());
 await p.locator('#v18-multiplier').fill('10');await p.locator('#v18-policy-form button[type=submit]').click();await pause();assert.equal(await p.evaluate(()=>surveillanceFor(getRowBySource('demo-001')).alert),false);assert.notEqual(await p.evaluate(()=>stableStateFingerprint()),fp);assert(await p.evaluate(()=>readAuditLedger().some(x=>x.kind==='policy_change')));
 await p.locator('#v18-policy-target').selectOption('demo-001');await p.locator('#v18-multiplier').fill('1.5');await p.locator('#v18-policy-form button[type=submit]').click();await pause();assert.equal(await p.evaluate(()=>surveillanceFor(getRowBySource('demo-001')).alert),true);assert.equal(await p.evaluate(()=>KHPilot.policy(getRowBySource('demo-002')).alertMultiplier),10);
 await p.locator('#v18-policy-target').selectOption('demo-001');await p.locator('#v18-policy-reset').click();await pause();await p.locator('#v18-policy-reset').click();await pause();assert.equal(await p.evaluate(()=>KHPilot.policy().alertMultiplier),1.5);
});
await check(`${language}/${width}/P0: longer windows never turn insufficient demo history into zero`,async()=>{
 for(const days of ['90','180']){await p.locator('#v18-window').selectOption(days);await p.locator('#v18-policy-form button[type=submit]').click();await pause();const state=await p.evaluate(()=>({sv:surveillanceFor(getRowBySource('demo-001')),total:sectorSummary().incidenceRate}));assert.equal(state.sv.currentRate,null);assert.equal(state.total,null);assert.equal(state.sv.evidence.windowDays,Number(days));assert.equal(state.sv.alert,false)}
 await p.locator('#v18-policy-reset').click();await pause();assert.equal(await p.evaluate(()=>surveillanceFor(getRowBySource('demo-001')).alert),true);
});
if(width!==1366)return;
for(const sector of ['EDU','HLT','MUN','GOV'])await check(`${language}/${width}/P0: ${sector} matching imports produce an evidence-based alert`,async()=>{
 await nav('data');await p.locator('#csv-upload').setInputFiles(path.resolve(__dirname,`../pilot-v1/${sector}_position_snapshot.csv`));await pause();assert.equal(await p.evaluate(()=>snapshotMode),'local');assert.equal(await p.evaluate(()=>eventMode),'gated');assert.equal(await p.evaluate(()=>sectorSummary().incidenceRate),null);assert(await p.locator('#v18-source-status').isVisible());
 await p.locator('#event-upload').setInputFiles(path.resolve(__dirname,`../pilot-v1/${sector}_hr_event_log.csv`));await pause();const state=await p.evaluate(()=>({quality:DATA_QUALITY,alerts:sectorSummary().alerts,rows:currentRows().length}));assert(await p.evaluate(()=>/تركيبي|synthetic/.test(KHPilot.sourceLabel())));assert.equal(state.quality.snapshot.quarantined,0);assert.equal(state.quality.events.quarantined,0);assert(state.alerts>0&&state.rows>0);
 await nav('scenario');assert(Number(await p.locator('#v07-cost-hire').inputValue())>0);assert(Number(await p.locator('#v07-approval-hire').inputValue())>=0);
});
await check(`${language}/${width}/P0: bad event upload removes stale alerts and blocks rates`,async()=>{
 await nav('data');await p.locator('#csv-upload').setInputFiles(path.resolve(__dirname,'../pilot-v1/EDU_position_snapshot.csv'));await pause();await p.locator('#event-upload').setInputFiles(path.resolve(__dirname,'../pilot-v1/EDU_hr_event_log.csv'));await pause();assert((await p.evaluate(()=>sectorSummary().alerts))>0);
 await p.locator('#event-upload').setInputFiles(path.resolve(__dirname,'../pilot-v1/invalid_events.csv'));await pause();const qualityText=await p.locator('#quality-details').innerText();assert(language==='ar'?qualityText.includes('حدث المغادرة'):qualityText.includes('exit must'));assert.equal(await p.evaluate(()=>eventMode),'gated');assert.equal(await p.evaluate(()=>sectorSummary().alerts),0);assert.equal(await p.evaluate(()=>sectorSummary().incidenceRate),null);
 await p.locator('#event-upload').setInputFiles(path.resolve(__dirname,'../pilot-v1/EDU_hr_event_log.csv'));await pause();
});
await check(`${language}/${width}/P0: 90 and 180 day windows work with declared complete example history`,async()=>{
 await nav('signals');if(await p.locator('#v18-policy').getAttribute('open')===null)await p.locator('#v18-policy>summary').click();for(const days of ['90','180']){await p.locator('#v18-window').selectOption(days);await p.locator('#v18-policy-form button[type=submit]').click();await pause();const sv=await p.evaluate(()=>surveillanceFor(currentRows()[0]));assert(sv.dataSufficient);assert(Number.isFinite(sv.currentRate));assert.equal(sv.evidence.observedDays,Number(days))}await p.locator('#v18-policy-reset').click();await pause();await p.screenshot({path:path.join(out,`p0-policy-${language}.png`),fullPage:true});
});
await check(`${language}/${width}/P0: native DOCX and PPTX and printable PDF carry the decision evidence`,async()=>{
 await nav('dashboard');await p.locator('#v07-brief-btn').click();await pause();assert(await p.locator('.v11-brief-decision').first().innerText());
 for(const [id,ext,entry] of [['v11-export-word','docx','word/document.xml'],['v11-export-ppt','pptx','ppt/presentation.xml']]){
  const [download]=await Promise.all([p.waitForEvent('download',{timeout:30000}),p.locator('#'+id).click()]);assert(download.suggestedFilename().endsWith('.'+ext));const file=path.join(out,`p0-report-${language}.${ext}`);await download.saveAs(file);assert.equal(fs.readFileSync(file).subarray(0,2).toString(),'PK');
  const valid=execFileSync('python3',['-c','import sys,zipfile,xml.etree.ElementTree as E; z=zipfile.ZipFile(sys.argv[1]); assert z.testzip() is None; E.fromstring(z.read(sys.argv[2])); [E.fromstring(z.read(n)) for n in z.namelist() if n.endswith(".xml")]; content=" ".join(z.read(n).decode() for n in z.namelist() if n.endswith(".xml")); assert "SHA256-" in content and "KH-SURV-v1.0" in content; print("valid")',file,entry],{encoding:'utf8'});assert(/valid/.test(valid));
 }
 await p.evaluate(()=>{window.addEventListener('beforeprint',()=>{window.p0PrintedAllEvidence=[...document.querySelectorAll('#v07-brief-content details')].every(el=>el.open)},{once:true})});
 await p.pdf({path:path.join(out,`p0-report-${language}.pdf`),format:'A4',printBackground:true});assert.equal(fs.readFileSync(path.join(out,`p0-report-${language}.pdf`)).subarray(0,4).toString(),'%PDF');assert(await p.evaluate(()=>window.p0PrintedAllEvidence));await p.emulateMedia({media:'print'});assert.equal(await p.locator('.kh-brief-close-top').evaluate(el=>getComputedStyle(el).display),'none');await p.emulateMedia({media:'screen'});await p.locator('#v07-close-brief').click();
});
if(await p.locator('#v07-brief-overlay').evaluate(e=>e.classList.contains('open')))await p.locator('#v07-close-brief').click();
await nav('data');await p.locator('#reset-demo').click();await pause();
};
