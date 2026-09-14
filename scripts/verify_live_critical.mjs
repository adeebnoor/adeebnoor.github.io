// Read-only public-site checks: actual ordinary URLs, fresh URLs, JS and mobile.
import {chromium} from 'playwright';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const origin='https://adeebnoor.github.io';
const json=p=>JSON.parse(readFileSync(p,'utf8'));
const navigation=json('data/site-navigation.json');
const identity=json('data/site_identity.json');
const projects=json('data/featured-projects.json');
const articles=json('data/ideas-content.json').articles;
const dates=json('data/essay-dates.json');
const paths=['/','/index.html','/ar/','/ar/index.html','/contact.html','/ar/contact.html','/writing/','/ar/writing/','/ideas/','/ar/ideas/'];
const filename=path=>(path.endsWith('/')?path+'index.html':path).slice(1);
const publicPath=(page,ar)=>(ar?'/ar/':'/')+page.replace(/index\.html$/,'');
mkdirSync('live-critical',{recursive:true});
const evidence={checkedAt:new Date().toISOString(),revision:process.env.GITHUB_SHA,pages:[],errors:[]};
// Allow GitHub Pages to publish this revision before comparing its normal URLs.
let ready=false;
for(let attempt=0;attempt<24;attempt++){
  const matches=await Promise.all(paths.map(async path=>{
    try{const response=await fetch(origin+path+'?release='+process.env.GITHUB_SHA,{headers:{'Cache-Control':'no-cache',DNT:'1'},signal:AbortSignal.timeout(20000)});return response.ok&&(await response.text())===readFileSync(filename(path),'utf8');}catch{return false;}
  }));
  if(matches.every(Boolean)){ready=true;break;}
  console.log('Checking publication of the requested revision:',attempt+1);
  await new Promise(resolve=>setTimeout(resolve,10000));
}
assert.ok(ready,'New source is not yet served by GitHub Pages');
const browser=await chromium.launch();
try{
 for(const mode of ['ordinary','fresh','no-js','mobile']){
  const mobile=mode==='mobile';
  const context=await browser.newContext({viewport:{width:mobile?390:1440,height:1000},javaScriptEnabled:mode!=='no-js',extraHTTPHeaders:{DNT:'1'},serviceWorkers:'block'});
  await context.addInitScript(()=>Object.defineProperty(navigator,'doNotTrack',{value:'1',configurable:true}));
  const page=await context.newPage();page.on('pageerror',error=>evidence.errors.push(error.message));
  for(const path of paths){
   const response=await page.goto(origin+path+(mode==='fresh'?'?audit_check='+process.env.GITHUB_SHA:''),{waitUntil:'domcontentloaded',timeout:30000});
   await page.evaluate(()=>document.fonts.ready);
   const html=await response.text();
   const ar=path.startsWith('/ar/'),lang=ar?'ar':'en';
   const view=await page.evaluate(()=>({
    nav:[...document.querySelectorAll('.site-links a:not(.site-language)')].map(a=>({label:a.textContent.trim(),path:new URL(a.href).pathname})),
    gateway:document.querySelector('#work-and-ideas')?.innerText||null,
    projects:[...document.querySelectorAll('[data-project]')].map(c=>({id:c.dataset.project,name:c.querySelector('h3')?.textContent,visible:!!c.getBoundingClientRect().height,links:[...c.querySelectorAll('.project-actions a')].map(a=>({text:a.textContent.trim(),href:a.getAttribute('href')}))})),
    forms:[...document.querySelectorAll('form[data-inquiry-form]')].map(f=>({kind:f.dataset.kind,fields:[...f.querySelectorAll('input,textarea,select')].map(i=>i.name),visible:!!f.getBoundingClientRect().height})),
    heroAction:document.querySelector('.page-hero .hero-actions .primary')?.getAttribute('href'),
    dates:[...document.querySelectorAll('[data-essay-date]')].map(p=>({slug:p.dataset.essayDate,date:p.querySelector('time')?.dateTime,text:p.innerText,visible:!!p.getBoundingClientRect().height})),
    oldDatingPromise:document.body.innerText.includes('I will date new essays')||document.body.innerText.includes('سأؤرّخ المقالات الجديدة'),
    overflow:document.documentElement.scrollWidth>innerWidth+1
   }));
   const result={path,mode,status:response.status(),sameAsRepository:html===readFileSync(filename(path),'utf8'),sha256:createHash('sha256').update(html).digest('hex'),...view};
   evidence.pages.push(result);
   assert.equal(result.status,200,path);assert.ok(result.sameAsRepository,'Live file differs: '+path+' '+mode);
   assert.deepEqual(view.nav,navigation.map(item=>({label:item.identity_label?identity[item.identity_label][lang]:item[lang],path:publicPath(item.page,ar)})),path+' navigation');
   assert.equal(view.overflow,false,path+' overflow');assert.equal(view.oldDatingPromise,false,path+' obsolete dating promise');
   if(['/','/index.html','/ar/','/ar/index.html'].includes(path)){
    assert.ok(view.gateway,path+' two entry paths');
    assert.deepEqual(view.projects.map(p=>p.id),projects.map(p=>p.id),path+' project grid');
    assert.ok(view.projects.every(p=>p.visible),path+' hidden project');
    for(const item of projects){
     const card=view.projects.find(p=>p.id===item.id);
     if(item.reviewUrl)assert.ok(card.links.some(link=>link.href===item.reviewUrl),path+' MIYAR request link');
     if(item.ideaUrl)assert.ok(card.links.some(link=>link.href===(ar?'/ar':'')+item.ideaUrl),path+' RIDI essay link');
    }
   }
   if(path.endsWith('/contact.html')){
    assert.equal(view.heroAction,'#inquiry-form',path+' primary action');
    assert.equal(view.forms.length,1);assert.equal(view.forms[0].kind,'inquiry');assert.ok(view.forms[0].visible);
    for(const field of ['name','email','audience','engagement','timeline','authority','problem','consent'])assert.ok(view.forms[0].fields.includes(field),path+' '+field);
   }
   if(path.endsWith('/writing/')||path.endsWith('/ideas/')){
    assert.deepEqual(view.dates.map(d=>({slug:d.slug,date:d.date})),articles.map(a=>({slug:a.slug,date:dates[(ar?'ar/':'')+a.path.slice(1)].published})),path+' card dates');
    assert.ok(view.dates.every(d=>d.visible),path+' hidden date');
   }
   if(mode==='ordinary'||mobile){
    const name=mode+'-'+path.replaceAll('/','_');
    if(mobile){await page.locator('.site-mobile summary').click();result.mobileNav=await page.locator('.site-mobile nav a').evaluateAll(links=>links.map(a=>({label:a.textContent.trim(),path:new URL(a.href).pathname})));}
    await page.screenshot({path:'live-critical/'+name+'.png'});
    if(mode==='ordinary'){
     if(view.gateway)await page.locator('#work-and-ideas').screenshot({path:'live-critical/'+name+'-gateway.png'});
     if(view.projects.length)await page.locator('#projects').screenshot({path:'live-critical/'+name+'-projects.png'});
     if(view.forms.length)await page.locator('form[data-inquiry-form]').first().screenshot({path:'live-critical/'+name+'-form.png'});
     if(view.dates.length)await page.locator('.ideas-grid').first().screenshot({path:'live-critical/'+name+'-dates.png'});
    }
   }
  }
  await context.close();
 }
 assert.deepEqual(evidence.errors,[],'Page JavaScript errors');
 evidence.passed=true;
}finally{
 evidence.completedAt=new Date().toISOString();
 writeFileSync('live-critical/evidence.json',JSON.stringify(evidence,null,2));
 console.log(JSON.stringify({passed:evidence.passed||false,revision:evidence.revision,views:evidence.pages.length,errors:evidence.errors}));
 await browser.close();
}
