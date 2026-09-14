// Responsive and accessibility QA. UI submissions below are synthetic and mocked.
import {chromium} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
const base=process.env.AUDIT_BASE_URL||'http://127.0.0.1:8000';
const out='audit-artifacts';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const results=[],errors=[];
const cors={'Access-Control-Allow-Origin':base,'Access-Control-Allow-Headers':'authorization,apikey,content-type,x-analytics-key','Access-Control-Allow-Methods':'GET,POST,PATCH,DELETE,OPTIONS'};
try {
 for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1});
  await context.route('**/functions/v1/portfolio-collect',r=>r.fulfill({status:200,contentType:'application/json',body:'{"ok":true,"accepted":0}'}));
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  for(const path of ['/','/ar/','/contact.html','/ar/contact.html','/writing/','/ar/writing/','/engagements.html','/ar/engagements.html','/inquiries/','/ar/inquiries/']){
   await page.goto(base+path,{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.fonts.ready);
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
   const diagnostics=overflow?await page.evaluate(()=>Array.from(document.querySelectorAll('body *')).filter(el=>{const r=el.getBoundingClientRect();return r.width>1&&(r.left < -1||r.right>innerWidth+1)}).slice(0,20).map(el=>({tag:el.tagName,id:el.id,class:el.className,rect:el.getBoundingClientRect().toJSON()}))):[];
   const accessibility=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
   results.push({path,width,overflow,diagnostics,accessibility:accessibility.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,failureSummary:n.failureSummary}))}))});
   await page.screenshot({path:`${out}/${width}-${path.replaceAll('/','_')}.png`,fullPage:true});
  }
  if(width===390){await page.goto(base+'/ar/');await page.locator('details.site-mobile summary').click();assert.equal(await page.locator('details.site-mobile').getAttribute('open'),'');assert.equal(await page.locator('details.site-mobile .site-language').getAttribute('href'),'/');}
  await context.close();
 }
 // Gather all page diagnostics before failing, so one repair pass can fix every issue.
 const failed=results.filter(r=>r.overflow||r.accessibility.some(v=>['serious','critical'].includes(v.impact)));
 assert.equal(failed.length,0,JSON.stringify(failed));
 const context=await browser.newContext({viewport:{width:390,height:844}});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 let posts=[],delivery=503;
 await context.route('**/functions/v1/portfolio-inquiries',async route=>{
  const req=route.request();if(req.method()==='OPTIONS')return route.fulfill({status:200,headers:cors});
  posts.push(JSON.parse(req.postData()||'{}'));
  return route.fulfill({status:delivery,contentType:'application/json',headers:cors,body:delivery===200?' {"ok":true}':'{"error":"unavailable"}'});
 });
 await page.goto(base+'/contact.html?audience=company&engagement=advisory#inquiry-form');
 assert.equal(await page.locator('#inquiry-audience').inputValue(),'company');assert.equal(await page.locator('#inquiry-engagement').inputValue(),'advisory');
 await page.locator('#inquiry-name').fill('Synthetic QA');await page.locator('#inquiry-email').fill('ui-test@example.invalid');await page.locator('#inquiry-timeline').selectOption('quarter');await page.locator('#inquiry-authority').selectOption('team');await page.locator('#inquiry-problem').fill('Synthetic UI validation request, not a real inquiry.');await page.locator('[name=consent]').check();
 await page.locator('[data-inquiry-form] [type=submit]').click();await page.locator('[data-form-status][data-state=error]').waitFor();assert.equal(await page.locator('#inquiry-name').inputValue(),'Synthetic QA');const firstId=posts[0].request_id;
 delivery=200;await page.locator('[data-inquiry-form] [type=submit]').click();await page.locator('[data-form-status][data-state=success]').waitFor();assert.equal(posts[1].request_id,firstId);assert.equal(await page.locator('#inquiry-name').inputValue(),'');
 await page.goto(base+'/ar/writing/');await page.locator('#inquiry-name').fill('اختبار واجهة');await page.locator('#inquiry-email').fill('ui-test@example.invalid');await page.locator('[name=consent]').check();await page.locator('[data-inquiry-form] [type=submit]').click();await page.locator('[data-form-status][data-state=success]').waitFor();assert.equal(posts.at(-1).kind,'updates');assert.equal(posts.at(-1).language,'ar');assert.match(await page.locator('[data-form-status]').textContent(),/ليس اشتراكًا/);
 results.push({forms:'English error retention and idempotent retry; Arabic pending-update request; consent and audience presets',passed:true});
 await context.unroute('**/functions/v1/portfolio-inquiries');
 await context.route('**/functions/v1/portfolio-inquiries',r=>r.fulfill({status:200,contentType:'application/json',headers:cors,body:JSON.stringify({items:[{request_id:'f0771b58-6102-4c7c-981b-2519a87d28ad',kind:'inquiry',name:'<strong>Literal name</strong>',email:'qa@example.invalid',created_at:'2026-09-14T10:00:00Z',status:'new',problem:'<em>Literal message</em>'}]})}));
 await page.goto(base+'/inquiries/');await page.locator('#inbox-key').fill('A'.repeat(43));await page.locator('#inbox-login button').click();await page.locator('.audit-inbox-card').waitFor();assert.equal(await page.locator('#inbox-list strong, #inbox-list em').count(),0);assert.match(await page.locator('#inbox-list').textContent(),/<strong>Literal name/);await page.locator('#inbox-lock').click();assert.equal(await page.locator('#inbox-list').textContent(),'');assert.equal(await page.locator('#inbox-content').isVisible(),false);
 results.push({inbox:'Mock authenticated response rendered as literal text; explicit locking clears records',passed:true});await context.close();
 assert.equal(errors.length,0,JSON.stringify(errors));
} finally {writeFileSync(out+'/browser-results.json',JSON.stringify({results,errors},null,2));await browser.close();}
console.log(`Browser QA complete: ${results.length} views/checks; no page-script errors.`);
