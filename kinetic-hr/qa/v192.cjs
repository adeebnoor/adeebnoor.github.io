/* User-visible scope, inspectable calculations, sector examples and resilient first paint. */
exports.landing=async({p,check,assert,width,language})=>{
 await check(`${language}/${width}/v192: planning scope is explicit immediately below the hero`,async()=>{
  const scope=p.locator('#v19-planning-scope');assert(await scope.isVisible());
  assert.equal(await scope.evaluate(el=>el.previousElementSibling.id),'v14-concept');
  const copy=await scope.innerText();assert(language==='ar'?/لا نستبدل الخطة السنوية أو تصميم الهيكل التنظيمي والدرجات/.test(copy):/do not replace annual workforce plans, organisational structure or grade design/.test(copy));
  assert.equal(await p.locator('#v21-sector-examples .v21-sector-card').count(),4);
  assert.equal(await p.evaluate(()=>KHBoot.state),'ready');assert(!await p.locator('#kh-startup').isVisible());
 });
};
exports.content=async({browser,check,out,assert,path,width,language})=>{
 if(![1366,390].includes(width))return;
 const context=await browser.newContext({viewport:{width,height:width===390?844:941}}),p=await context.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
 const pause=()=>p.waitForTimeout(200),nav=async view=>{await p.evaluate(v=>showView(v),view);await pause()};
 try{
  await p.goto(`http://127.0.0.1:8077/?lang=${language}`);await p.waitForFunction(()=>KHBoot.state==='ready');
  await check(`${language}/${width}/v192: health, municipal and shared-services examples use their own data and impact units`,async()=>{
   await p.locator('[data-v21-sector="HLT"]').click();await pause();
   const units=[];
   for(const sector of ['HLT','MUN','GOV']){
    if(sector!=='HLT'){await p.locator('#sector-select').selectOption(sector);await pause()}
    const actual=await p.evaluate(()=>{const r=KHAction.top();return{sector:activeSector,rowSector:r.sector,unit:document.documentElement.lang==='ar'?r.service_impact_unit_ar:r.service_impact_unit_en,rows:currentRows().length}});
    assert.equal(actual.sector,sector);assert.equal(actual.rowSector,sector);assert(actual.rows>0);units.push(actual.unit);
    assert((await p.locator('#v11-service-impact').innerText()).includes(actual.unit));
    assert(!/students|طالب/.test(await p.locator('#v21-sector-context').innerText()));
    if(sector==='HLT'){
     await nav('scenario');await p.locator('#v19-apply').click();await pause();
     const impact=await p.evaluate(()=>scenarioImpact(getRowBySource(selectedScenarioSource),scenarioValues()));assert(impact.afterGap<impact.beforeGap);
     await nav('dashboard');await p.screenshot({path:path.join(out,`v192-health-${language}-${width}.png`),fullPage:true});
    }
   }
   assert.equal(new Set(units).size,3);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  });
  await check(`${language}/${width}/v192: methodology exposes the actual inputs, difficulty weights and Case-Mix boundary`,async()=>{
   await p.locator('#sector-select').selectOption('EDU');await pause();await p.locator('#v21-method-button').click();
   assert(await p.locator('#v19-method-overlay.open').isVisible());
   for(const source of ['demo-001','demo-002']){
    await p.locator('#v21-method-cell').selectOption(source);await pause();
    const expected=await p.evaluate(id=>{const r=getRowBySource(id);return{difficulty:resolvabilityScore(r),burden:fmt(burdenRaw(r),2),direct:fmt(deficit(r)*Number(r.service_impact_per_gap_fte),2)}},source);
    assert.equal(Number(await p.locator('#v21-difficulty-score').innerText()),expected.difficulty);
    assert((await p.locator('#v21-burden-inputs .v19-formula').innerText()).includes(expected.burden));
    assert((await p.locator('#v21-direct-method').innerText()).includes(expected.direct));
   }
   const boundary=await p.locator('#v21-casemix-method').innerText();assert(boundary.includes('45%')&&boundary.includes('35%')&&boundary.includes('20%'));assert(boundary.includes('fill_difficulty_weight'));assert(language==='ar'?boundary.includes('غير مفعّل'):boundary.includes('Not active'));
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await p.locator('#v21-casemix-method').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,`v192-method-${language}-${width}.png`)});
   await p.keyboard.press('Escape');assert.equal(await p.locator('#v19-method-overlay.open').count(),0);assert.deepEqual(errors,[]);
  });
 }finally{await context.close()}
};
exports.startup=async({browser,check,out,assert,path,width,language})=>{
 if(![1366,390].includes(width))return;
 await check(`${language}/${width}/v192: delayed assets still produce a meaningful first paint and then a complete workspace`,async()=>{
  const context=await browser.newContext({viewport:{width,height:width===390?844:941}}),p=await context.newPage();let release;
  const held=new Promise(resolve=>{release=resolve});const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.route('**/*',async route=>{if(/\.(js|css)$/.test(new URL(route.request().url()).pathname))await held;if(!p.isClosed())await route.continue()});
  try{
   await p.goto(`http://127.0.0.1:8077/?lang=${language}`,{waitUntil:'commit'});await p.locator('#kh-startup-status').waitFor();await p.waitForTimeout(150);
   assert(await p.locator('#kh-startup').isVisible());assert.equal(await p.evaluate(()=>KHBoot.state),'loading');
   assert(language==='ar'?(await p.locator('#kh-startup-status').innerText()).includes('نجهّز'):(await p.locator('#kh-startup-status').innerText()).includes('Preparing'));
   assert(await p.evaluate(()=>performance.getEntriesByName('first-contentful-paint').length>0),'Content must paint before external assets arrive');
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   // Capture the actual first paint without Playwright waiting for the deliberately held styles/fonts.
   const cdp=await context.newCDPSession(p),capture=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
   require('fs').writeFileSync(path.join(out,`v192-loading-${language}-${width}.png`),Buffer.from(capture.data,'base64'));await cdp.detach();
   release();await p.waitForFunction(()=>KHBoot.state==='ready',null,{timeout:20000});assert(!await p.locator('#kh-startup').isVisible());assert(await p.locator('.v14-landing-shell').isVisible());
   assert(await p.evaluate(()=>[...document.querySelectorAll('link[data-kh-style]')].every(el=>el.media==='all'&&el.dataset.loaded==='1')));assert.deepEqual(errors,[]);
  }finally{release();await context.close()}
 });
 await check(`${language}/${width}/v192: a failed script shows a retry path and recovers after retry`,async()=>{
  const context=await browser.newContext({viewport:{width,height:width===390?844:941}}),p=await context.newPage();
  await p.route('**/v20-measurement-state.js?*',route=>route.abort('failed'));
  try{
   await p.goto(`http://127.0.0.1:8077/?lang=${language}`);await p.waitForFunction(()=>KHBoot.state==='error');assert(await p.locator('#kh-startup-retry').isVisible());
   assert(language==='ar'?(await p.locator('#kh-startup-status').innerText()).includes('تعذّر'):(await p.locator('#kh-startup-status').innerText()).includes('could not load'));
   await p.unroute('**/v20-measurement-state.js?*');await p.locator('#kh-startup-retry').click();await p.waitForFunction(()=>KHBoot.state==='ready',null,{timeout:20000});
   assert.equal(await p.locator('#hero-alerts').innerText(),'1');assert.equal(await p.evaluate(()=>KHMeasurement.forRow(getRowBySource('demo-001')).alert_state),'alert');
  }finally{await context.close()}
 });
};
