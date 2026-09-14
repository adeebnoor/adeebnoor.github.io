// Explicit synthetic end-to-end checks. Fixed IDs make retries idempotent.
// Cleanup uses owner SQL after confirmation; no real visitor record is touched.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const c=JSON.parse(readFileSync('data/analytics-config.json','utf8'));
const endpoint='https://xcirpzxpcpbxpowjbpiq.supabase.co/functions/v1/portfolio-inquiries';
const headers={Origin:'https://adeebnoor.github.io','Content-Type':'application/json',apikey:c.publicAnonKey,Authorization:'Bearer '+c.publicAnonKey};
const result=[];
async function call(method,body,extra={}){const r=await fetch(endpoint,{method,headers:{...headers,...extra},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(25000)});return {status:r.status,data:await r.json()};}
const preflight=await call('OPTIONS',undefined,{'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'authorization,apikey,content-type'});assert.equal(preflight.status,200);result.push({check:'CORS preflight',status:preflight.status});
for(const method of ['GET','PATCH','DELETE']){const r=await call(method,method==='GET'?undefined:{request_id:'f0771b58-6102-4c7c-981b-2519a87d28ad'});assert.equal(r.status,401);result.push({check:'unauthorized '+method,status:r.status});}
const payload={request_id:'f0771b58-6102-4c7c-981b-2519a87d28ad',kind:'inquiry',language:'en',name:'SITE AUDIT SYNTHETIC TEST',email:'site-audit-20260914@example.invalid',organization:'Automated site audit — remove after verification',audience:'institution',engagement:'advisory',timeline:'quarter',authority:'team',problem:'Synthetic deployment test. Not a genuine inquiry. This exact test row will be deleted after verification.',consent:true,website:''};
const invalid=await call('POST',{...payload,consent:false});assert.equal(invalid.status,400);result.push({check:'missing consent rejected',status:invalid.status});
for(let i=0;i<2;i++){const r=await call('POST',payload);assert.equal(r.status,200,JSON.stringify(r));assert.equal(r.data.ok,true);result.push({check:i?'idempotent retry':'real inquiry stored',...r});}
const updates={request_id:'a9606caa-0ee0-4320-9163-4580b1049961',kind:'updates',language:'ar',name:'اختبار آلي — يُحذف بعد التحقق',email:'site-audit-20260914@example.invalid',consent:true,website:''};const saved=await call('POST',updates);assert.equal(saved.status,200,JSON.stringify(saved));result.push({check:'update request stored pending confirmation',...saved});
const keyHeaders={apikey:c.publicAnonKey,Authorization:'Bearer '+c.publicAnonKey};
const direct=await fetch('https://xcirpzxpcpbxpowjbpiq.supabase.co/rest/v1/portfolio_inquiries?select=request_id',{headers:keyHeaders});assert.ok([401,403].includes(direct.status),'Private table exposed to anon');result.push({check:'direct anonymous table read denied',status:direct.status});
for(const repo of ['Miyar','BioBenchShift','ANTI-DDI','CPIT']){const r=await fetch('https://api.github.com/repos/adeebnoor/'+repo,{headers:{'User-Agent':'AdeebNoorSiteAudit'}});assert.equal(r.status,200,repo+' public repository unavailable');const d=await r.json();assert.equal(d.private,false);result.push({repository:d.full_name,visibility:'public',description:d.description});}
mkdirSync('audit-artifacts',{recursive:true});writeFileSync('audit-artifacts/live-api-results.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
