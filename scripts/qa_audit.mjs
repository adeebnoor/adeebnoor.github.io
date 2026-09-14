// End-to-end UI checks use synthetic data and mocked delivery, never real leads.
import {chromium} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
const base=process.env.AUDIT_BASE_URL||'http://127.0.0.1:8000';
const out='audit-artifacts';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const results=[];const errors=[];
try{
 for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1});
  // External image fallbacks are expected. No analytics hits from this QA visit.
  await context.route('**/functions/v1/portfolio-collect',r=>r.fulfill({status:200,contentType:'application/json',body:'{"ok":true,"accepted":0}'}));
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  for(const path of ['/','/ar/','/contact.html','/ar/contact.html','/writing/','/ar/writing/','/engagements.html','/ar/engagements.html','/inquiries/','/ar/inquiries/']){
   await page.goto(base+path,{waitUntil:'domcontentloaded'});
   await page.evaluate(()=>document.fonts.ready);
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
   assert.equal(overflow,false,`Horizontal overflow ${width} ${path}`);
   const accessibility=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
   results.push({path,width,overflow,accessibility:accessibility.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,nodes:v.nodes.map(n=>({target:n.target,failureSummary:n.failureSummary}))}))});
   await page.screenshot({path:`${out}/${width}-${path.replaceAll('/','_')||'home'}.png`,fullPage:true});
   if(path.includes('contact') || path.includes('inquiries') || path.includes('engagements')){
    const severe=accessibility.violations.filter(v=>['critical','serious'].includes(v.impact));
    assert.equal(severe.length,0,`Accessibility ${path}: ${JSON.stringify(severe.map(x=>({id:x.id,nodes:x.nodes.map(n=>n.target)})))}`);
   }
  }
  if(width===390){await page.goto(base+'/ar/');await page.locator('details.site-mobile summary').click();assert.equal(await page.locator('details.site-mobile').getAttribute('open'),'');const switcher=page.locator('details.site-mobile .site-language');assert.equal(await switcher.getAttribute('href'),'/');}
  await context.close();
 }
 const context=await browser.newContext({viewport:{width:390,height:844}});const page=await context.newPage();
 let posts=[];let delivery=503;
 await context.route('**/functions/v1/portfolio-inquiries',async route=>{const req=route.request();if(req.method()==='OPTIONS')return route.fulfill({status:200,headers:{'Access-Control-Allow-Origin':base,'Access-Control-Allow-Headers':'authorization,apikey,content-type,x-analytics-key','Access-Control-Allow-Methods':'GET,POST,PATCH,DELETE,OPTIONS'}});posts.push(JSON.parse(req.postData()||'{}'));return route.fulfill({status:delivery,contentType:'application/json',headers:{'Access-Control-Allow-Origin':base},body:delivery===200?'{"ok":true}':'{"error":"unavailable"}'});});
 await page.goto(base+'/contact.html?audience=company&engagement=advisory#inquiry-form');
 assert.equal(await page.locator('#inquiry-audience').inputValue(),'company');assert.equal(await page.locator('#inquiry-engagement').inputValue(),'advisory');
 await page.locator('#inquiry-name').fill('Synthetic QA');await page.locator('#inquiry-email').fill('ui-test@example.invalid');await page.locator('#inquiry-timeline').selectOption('quarter');await page.locator('#inquiry-authority').selectOption('team');await page.locator('#inquiry-problem').fill('This is a synthetic request for UI validation, not a real inquiry.');await page.locator('[name=consent]').check();
 await page.locator('[data-inquiry-form] [type=submit]').click();await page.locator('[data-form-status][data-state=error]').waitFor();assert.equal(await page.locator('#inquiry-name').inputValue(),'Synthetic QA');const firstId=posts[0].request_id;
 delivery=200;await page.locator('[data-inquiry-form] [type=submit]').click();await page.locator('[data-form-status][data-state=success]').waitFor();assert.equal(posts[1].request_id,firstId);assert.equal(await page.locator('#inquiry-name').inputValue(),'');
 await page.goto(base+'/ar/writing/');await page.locator('#inquiry-name').fill('اختبار واجهة');await page.locator('#inquiry-email').fill('ui-test@example.invalid');await page.locator('[name=consent]').check();await page.locator('[data-inquiry-form] [type=submit]').click();await page.locator('[data-form-status][data-state=success]').waitFor();assert.equal(posts.at(-1).kind,'updates');assert.equal(posts.at(-1).language,'ar');assert.match(await page.locator('[data-form-status]').textContent(),/ليس اشتراكًا/);
 results.push({forms:'English inquiry: error retention and idempotent retry; Arabic update request; consent and preset selection',passed:true});
 // Owner UI must not render a malicious lead as HTML; this is a mock owner-only response.
 await context.unroute('**/functions/v1/portfolio-inquiries');
 await context.route('**/functions/v1/portfolio-inquiries',r=>r.fulfill({status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':base,'Access-Control-Allow-Headers':'authorization,apikey,content-type,x-analytics-key','Access-Control-Allow-Methods':'GET,POST,PATCH,DELETE,OPTIONS'},body:JSON.stringify({items:[{request_id:'f0771b58-6102-4c7c-981b-2519a87d28ad',kind:'inquiry',name:'<img src=x onerror=alert(1)>',email:'qa@example.invalid',created_at:'2026-09-14T10:00:00Z',status:'new',problem:'<script>alert(1)</script>'}]})}));
 await page.goto(base+'/inquiries/');await page.locator('#inbox-key').fill('A'.repeat(43));await page.locator('#inbox-login button').click();await page.locator('.audit-inbox-card').waitFor();assert.equal(await page.locator('#inbox-list img').count(),0);assert.equal(await page.locator('#inbox-list script').count(),0);await page.locator('#inbox-lock').click();assert.equal(await page.locator('#inbox-list').textContent(),'');assert.equal(await page.locator('#inbox-content').isVisible(),false);
 results.push({inbox:'Mock authenticated response: XSS-safe rendering and explicit locking',passed:true});await context.close();
 assert.equal(errors.length,0,JSON.stringify(errors));
}finally{writeFileSync(out+'/browser-results.json',JSON.stringify({results,errors},null,2));await browser.close();}
console.log(`Browser QA complete: ${results.length} checks/views, no page script errors.`);
