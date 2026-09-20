/* v190 regression checks for the HR expert's three blocking findings. */
module.exports=async({p,check,out,assert,path,width,language})=>{
const pause=()=>p.waitForTimeout(200),nav=async view=>{await p.evaluate(v=>showView(v),view);await pause()};
await check(`${language}/${width}/v190: incomplete events share one decision basis across screens and report`,async()=>{
 await p.evaluate(()=>{KHPilot.save('sector',activeSector,{...KHPilot.policy(),windowDays:90});renderAll()});await pause();await nav('dashboard');
 const state=await p.evaluate(()=>{const r=KHAction.top(),e=KHDecision.forRow(r),dp=decisionPriority(r);return{e,priority:dp.score,factors:dp.factorContributions,alerts:sectorSummary().alerts,rate:surveillanceFor(r).currentRate}});
 assert.equal(state.e.basis,'prevalence-only');assert(state.e.coverage>0&&state.e.coverage<100);assert.equal(state.alerts,0);assert.equal(state.rate,null);assert(!state.factors.some(f=>f.factor==='velocity'));
 assert.equal(await p.locator('#v16-next-action [data-decision-basis]').getAttribute('data-decision-basis'),'prevalence-only');assert(!/4[.,]0+×/.test(await p.locator('#v16-next-action').innerText()));
 await nav('signals');assert.equal(await p.locator('#signals-grid [data-decision-basis="incidence-supported"]').count(),0);assert(await p.locator('#signals-grid [data-decision-basis="prevalence-only"]').count()>0);
 await p.evaluate(()=>openDrawer(KHAction.top().source_row));await pause();assert.equal(await p.locator('#v19-drawer-evidence [data-decision-basis]').getAttribute('data-decision-basis'),'prevalence-only');await p.locator('#drawer-close').click();
 await p.locator('#v07-brief-btn').click();await pause();const rows=await p.evaluate(()=>KHReports.content().rows);assert(rows.length);for(const r of rows){assert(r.evidence.some(x=>/تغطية الفترة|time coverage/.test(x)));assert(r.evidence.some(x=>/نقص القدرة الحالي|current capacity shortfall/.test(x)));assert(r.evidence.some(x=>/لقطة القوى|workforce snapshot/.test(x)))}await p.locator('#v07-close-brief').click();
 await p.evaluate(()=>{KHPilot.reset('sector',activeSector);renderAll()});await pause();
});
await check(`${language}/${width}/v190: complete time coverage does not bypass record quality`,async()=>{
 const e=await p.evaluate(()=>{const count=DATA_QUALITY.events.quarantined;try{DATA_QUALITY.events.quarantined=1;return KHDecision.forRow(KHAction.top())}finally{DATA_QUALITY.events.quarantined=count}});assert.equal(e.coverage,100);assert.equal(e.basis,'prevalence-only');assert.equal(e.alert,false);
});
await check(`${language}/${width}/v190: apply proposal respects funding, donor capacity and manual costs`,async()=>{
 await nav('scenario');await p.locator('#scenario-cell').selectOption('demo-001');await pause();
 const before=await p.evaluate(()=>({fp:stableStateFingerprint(),cost:document.querySelector('#v07-cost-hire').value,approval:document.querySelector('#v07-approval-hire').value}));
 await p.locator('#v19-apply').click();await pause();assert.equal(await p.locator('#transfer-range').inputValue(),'5');assert(await p.locator('#scenario-donor').inputValue());
 const after=await p.evaluate(()=>({fp:stableStateFingerprint(),cost:document.querySelector('#v07-cost-hire').value,approval:document.querySelector('#v07-approval-hire').value}));assert.deepEqual(after,before);
 const safe=await p.evaluate(()=>{const r=KHAction.top(),v=scenarioValues(),i=scenarioImpact(r,v),plan=KHAction.plan(r);return{gap:i.afterGap,before:i.beforeGap,units:plan.units,cost:plan.cost,donor:i.donorAfterGap}});assert(safe.gap<safe.before);assert.equal(safe.units,5);assert.equal(safe.cost,100000);assert.equal(safe.donor,0);
 await p.locator('#scenario-cell').selectOption('demo-002');await pause();await p.locator('#v19-apply').click();await pause();assert.equal(await p.locator('#hire-range').inputValue(),'4');assert.equal(await p.locator('#transfer-range').inputValue(),'0');
 if(width===1366||width===390)await p.screenshot({path:path.join(out,`v190-proposal-${language}-${width}.png`),fullPage:true});
});
await check(`${language}/${width}/v190: methodology, service-burden order and persistent data origin`,async()=>{
 await nav('gaps');await p.locator('#v19-gap-sort').selectOption('burden');await pause();const values=await p.locator('#gaps-body tr[data-source]').evaluateAll(es=>es.map(e=>burdenRaw(getRowBySource(e.dataset.source))??-1));assert(values.length>1);assert(values.every((v,i)=>!i||v<=values[i-1]));
 await p.locator('#gap-metrics [data-v19-method]').click();assert(await p.locator('#v19-method-overlay.open').count());assert((await p.locator('#v19-burden-method').innerText()).includes('365'));await p.keyboard.press('Escape');assert.equal(await p.locator('#v19-method-overlay.open').count(),0);
 for(const view of ['dashboard','signals','scenario','gaps','occupations','data','audit']){await nav(view);assert(await p.locator('#v18-source-status').isVisible());assert(/تركيبي|Synthetic/.test(await p.locator('#v18-source-status').innerText()))}
 await nav('gaps');await p.locator('#v19-gap-sort').selectOption('priority');
 await nav('dashboard');const units=[];for(const sector of ['EDU','HLT','MUN']){await p.locator('#sector-select').selectOption(sector);await pause();units.push(await p.locator('#v11-service-impact').innerText())}assert.notEqual(units[0],units[1]);assert.notEqual(units[1],units[2]);await p.locator('#sector-select').selectOption('EDU');await pause();
 if(width===1366||width===390)await p.screenshot({path:path.join(out,`v190-command-${language}-${width}.png`),fullPage:true});
});
};
