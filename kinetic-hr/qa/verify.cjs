/* Exercise actual UI controls using only the shipped synthetic dataset. */
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert');
const {chromium}=require(path.join(process.env.KINETIC_QA_NODE_MODULES,'playwright'));
const root=path.resolve(__dirname,'..'),out=path.join(root,'qa-output');
fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.ttf':'font/ttf','.csv':'text/csv'};
const server=http.createServer((req,res)=>{const p=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));const f=p===root?path.join(root,'index.html'):p;if(!f.startsWith(root+path.sep)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);res.end();return}res.setHeader('Content-Type',mime[path.extname(f)]||'application/octet-stream');fs.createReadStream(f).pipe(res)});
const results=[];let browser;
async function check(name,fn){try{await fn();results.push({name,passed:true});console.log('PASS '+name)}catch(e){results.push({name,passed:false,error:e.message});console.log('FAIL '+name+': '+e.message)}}
(async()=>{await new Promise(r=>server.listen(8077,'127.0.0.1',r));browser=await chromium.launch({headless:true});
for(const width of (process.env.KINETIC_QA_WIDTH?[Number(process.env.KINETIC_QA_WIDTH)]:[1672,1366,390]))for(const language of ['ar','en']){
const ctx=await browser.newContext({viewport:{width,height:width===390?844:941}}),p=await ctx.newPage(),errors=[];p.setDefaultTimeout(8000);p.on('pageerror',e=>errors.push(e.message));p.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text())});p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
await p.goto(`http://127.0.0.1:8077/?lang=${language}`);await p.locator('.v14-landing-shell').waitFor();await p.waitForTimeout(200);
// Check the very first render before navigation or language changes can hide stale state.
await require('./v191.cjs').coldBoot({p,check,assert,width,language});await p.evaluate(()=>document.fonts.ready);
await p.screenshot({path:path.join(out,`landing-${language}-${width}.png`),fullPage:true});
await check(`${language}/${width}: landing has no horizontal overflow`,async()=>assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)));
await check(`${language}/${width}: landing uses the selected reading direction`,async()=>assert.equal(await p.locator('.v14-landing-shell').evaluate(e=>getComputedStyle(e).direction),language==='ar'?'rtl':'ltr'));
await check(`${language}/${width}: local font loads`,async()=>assert(await p.evaluate(()=>document.fonts.check('700 16px Cairo'))));
await p.locator('[data-v14-enter]').last().click();await p.locator('#view-dashboard.active').waitFor();await check(`${language}/${width}: platform entry starts at command center`,async()=>assert(await p.locator('#view-dashboard.active').count()));await p.evaluate(()=>showView('scenario'));await p.locator('#view-scenario.active').waitFor();await p.waitForTimeout(150);
await p.screenshot({path:path.join(out,`scenario-${language}-${width}.png`),fullPage:true});
await check(`${language}/${width}: demo starts with complete costs and approval delays`,async()=>{for(const k of ['hire','transfer','upskill','contract']){assert(Number(await p.locator('#v07-cost-'+k).inputValue())>0);assert(Number(await p.locator('#v07-approval-'+k).inputValue())>0)}assert(Number(await p.locator('#v07-budget').inputValue())>0);assert(await p.locator('#v16-scenario-ready').isVisible())});
await check(`${language}/${width}: workspace has no horizontal overflow`,async()=>assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)));
if(width>1000)await check(`${language}/${width}: settings are right of chart`,async()=>{const a=await p.locator('.scenario-controls').boundingBox(),b=await p.locator('.scenario-result').boundingBox();assert(a.x>b.x+b.width-1)});
await check(`${language}/${width}: intervention changes forecast`,async()=>{const before=await p.locator('.v12-outcome-stack').innerText();await p.locator('#v14-hire').fill('5');await p.waitForTimeout(120);assert.notEqual(await p.locator('.v12-outcome-stack').innerText(),before)});
await check(`${language}/${width}: run and reset work`,async()=>{await p.locator('#v14-run').click();await p.locator('#scenario-reset').click();await p.waitForTimeout(100);for(const k of ['hire','transfer','upskill','contract'])assert.equal(await p.locator('#v14-'+k).inputValue(),'0')});
await check(`${language}/${width}: save validates and persists`,async()=>{await p.locator('#scenario-save').click();assert(/at least|تدخلًا/.test(await p.locator('#toast').innerText()));await p.locator('#v14-hire').fill('1');await p.locator('#v14-advanced>summary').click();const nested=p.locator('.v07-reality-panel');if(await nested.getAttribute('open')===null)await nested.locator('summary').click();for(const [id,value] of [['v07-budget','1000000'],['v07-cost-hire','50000'],['v07-gapday-cost','100']]){await p.locator('#'+id).fill(value);await p.locator('#'+id).press('Tab')}await p.locator('#scenario-save').click();await p.waitForTimeout(100);assert(/saved|حفظ/i.test(await p.locator('#toast').innerText()));assert(await p.locator('#saved-scenarios').innerText())});
await check(`${language}/${width}: transfer-source action reveals the donor selector`,async()=>{await p.locator('#v14-advanced>summary').click();await p.locator('#v15-choose-donor').click();assert(await p.locator('#scenario-donor').isVisible())});
await check(`${language}/${width}: A/B captures both scenarios`,async()=>{await p.locator('#v11-cap-a').click();await p.locator('#v14-hire').fill('3');await p.waitForTimeout(120);await p.locator('#v11-cap-b').click();assert.equal(await p.locator('.v11-compare-slot dl').count(),2)});
await check(`${language}/${width}: compliance dialog closes with Escape`,async()=>{await p.locator('#v13-compliance-btn').click();assert(await p.locator('#v13-modal.open').count());await p.keyboard.press('Escape');assert.equal(await p.locator('#v13-modal.open').count(),0)});
if(width===390)await check(`${language}/${width}: mobile navigation works`,async()=>{await p.locator('#mobile-nav-toggle').click();assert(await p.locator('.sidebar').isVisible());await p.locator('.nav-item[data-view="data"]').click();assert(await p.locator('#view-data.active').count());assert(!await p.locator('.sidebar').isVisible())});
await require('./expert.cjs')({p,check,out,assert,path,width,language});
await require('./v190.cjs')({p,check,out,assert,path,width,language});
await require('./v191.cjs').transitions({p,check,out,assert,path,width,language});
await require('./p0.cjs')({p,check,out,assert,path,width,language});
await check(`${language}/${width}: no browser errors or missing assets`,()=>assert.deepEqual(errors,[]));
await ctx.close();}
})().catch(e=>{results.push({name:'Runner',passed:false,error:e.stack});console.error(e)}).finally(async()=>{fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));if(browser)await browser.close();server.close();process.exitCode=results.some(r=>!r.passed)?1:0});
