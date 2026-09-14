// verify_jwt=true. Public submission uses the project anon JWT; reads and changes
// additionally require the existing private owner key. No user content is logged.
const ORIGIN='https://adeebnoor.github.io';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const KEY=/^[A-Za-z0-9_-]{43,128}$/;
const EMAIL=/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const MAX_BYTES=24000;
function headers(origin: string|null): Record<string,string> {
 const h: Record<string,string>={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Origin','X-Content-Type-Options':'nosniff'};
 if(origin===ORIGIN) Object.assign(h,{'Access-Control-Allow-Origin':ORIGIN,'Access-Control-Allow-Methods':'GET,POST,PATCH,DELETE,OPTIONS','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-analytics-key','Access-Control-Max-Age':'600'});
 return h;
}
function equals(a: string,b: string): boolean {
 if(a.length!==64 || b.length!==64)return false;let d=0;for(let i=0;i<64;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0;
}
const hex=(b:ArrayBuffer)=>Array.from(new Uint8Array(b),v=>v.toString(16).padStart(2,'0')).join('');
async function hmac(secret: string,value: string):Promise<string> {
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 return hex(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(value)));
}
async function boundedJSON(req: Request): Promise<Record<string,unknown>> {
 if(!req.headers.get('content-type')?.toLowerCase().startsWith('application/json'))throw new Error('type');
 if(Number(req.headers.get('content-length')||0)>MAX_BYTES)throw new Error('size');
 const reader=req.body?.getReader();if(!reader)throw new Error('body');
 const parts:Uint8Array[]=[];let size=0;
 try {while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_BYTES){await reader.cancel();throw new Error('size');}parts.push(value);}}
 finally {reader.releaseLock();}
 const buffer=new Uint8Array(size);let pos=0;for(const p of parts){buffer.set(p,pos);pos+=p.byteLength;}
 const data=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(buffer));
 if(!data || Array.isArray(data) || typeof data!=='object')throw new Error('object');return data;
}
export function normalize(data: Record<string,unknown>):Record<string,unknown>|null {
 const clean=(k:string,max:number)=>typeof data[k]==='string' && (data[k] as string).length<=max && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(data[k] as string)?(data[k] as string).trim():null;
 const id=clean('request_id',36),kind=clean('kind',20),lang=clean('language',2),name=clean('name',160),email=clean('email',254);
 if(!id || !UUID.test(id) || !['inquiry','updates'].includes(kind||'') || !['en','ar'].includes(lang||'') || !name || name.length<2 || !email || !EMAIL.test(email) || data.consent!==true)return null;
 const result:Record<string,unknown>={request_id:id,kind,language:lang,name,email:email.toLowerCase(),consent:true};
 if(kind==='updates')return result;
 const options:Record<string,string[]>={audience:['institution','company','researcher','student'],engagement:['advisory','board','speaking','research','venture','other'],timeline:['soon','quarter','later'],authority:['decision_maker','team','individual']};
 for(const [field,values] of Object.entries(options)){const v=clean(field,32);if(!v || !values.includes(v))return null;result[field]=v;}
 const problem=clean('problem',4000),organization=data.organization===undefined?'':clean('organization',160);
 if(!problem || problem.length<20 || organization===null)return null;result.problem=problem;result.organization=organization;return result;
}
export async function handler(req:Request):Promise<Response> {
 const origin=req.headers.get('origin');const reply=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers:headers(origin)});
 if(origin && origin!==ORIGIN)return reply(403,{error:'origin_not_allowed'});
 if(req.method==='OPTIONS')return reply(200,{ok:true});
 if(!['GET','POST','PATCH','DELETE'].includes(req.method))return reply(405,{error:'method_not_allowed'});
 if(new URL(req.url).search)return reply(400,{error:'query_not_allowed'});
 if(req.method==='POST' && origin!==ORIGIN)return reply(403,{error:'origin_required'});
 const endpoint=Deno.env.get('SUPABASE_URL'),secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
 if(!endpoint || !secret)return reply(503,{error:'unavailable'});
 const serviceHeaders={'apikey':secret,'Authorization':'Bearer '+secret,'Content-Type':'application/json'};
 const rest=(path:string,method='GET',body?:unknown)=>fetch(endpoint+'/rest/v1/'+path,{method,headers:serviceHeaders,body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(12000)});
 try {
  if(req.method==='POST'){
   let data:Record<string,unknown>;try{data=await boundedJSON(req);}catch{return reply(400,{error:'invalid_request'});}
   if(typeof data.website==='string' && data.website.trim())return reply(400,{error:'invalid_request'});
   const normalized=normalize(data);if(!normalized)return reply(400,{error:'invalid_request'});
   // Forwarded IP is used only as input to a keyed, hourly fingerprint. Raw IP is never persisted.
   const ip=(req.headers.get('x-forwarded-for')||req.headers.get('x-real-ip')||'unknown').split(',')[0].trim().slice(0,128);
   const stamp=new Date().toISOString();
   const p_ip_bucket='ip:'+await hmac(secret,'portfolio-intake-ip:'+stamp.slice(0,13)+':'+ip);
   const p_email_bucket='email:'+await hmac(secret,'portfolio-intake-email:'+stamp.slice(0,10)+':'+normalized.email);
   const result=await rest('rpc/portfolio_submit_inquiry','POST',{p_payload:normalized,p_ip_bucket,p_email_bucket});
   if(!result.ok)return reply(503,{error:'unavailable'});const saved=await result.json();
   if(saved?.ok!==true)return reply(saved?.error==='rate_limited'?429:saved?.error==='conflict'?409:400,{error:saved?.error||'invalid_request'});
   return reply(200,{ok:true,request_id:normalized.request_id});
  }
  // Verify the high-entropy owner key before cleanup, reads or mutations.
  const key=req.headers.get('x-analytics-key')||'';if(!KEY.test(key))return reply(401,{error:'unauthorized'});
  const config=await rest('portfolio_analytics_settings?singleton=eq.true&select=admin_key_hash&limit=1');
  if(!config.ok)return reply(503,{error:'unavailable'});const settings=await config.json();
  const hash=hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(key)));
  if(!Array.isArray(settings)||settings.length!==1||typeof settings[0].admin_key_hash!=='string'||!equals(hash,settings[0].admin_key_hash))return reply(401,{error:'unauthorized'});
  const cleanup=await rest('rpc/portfolio_inquiry_cleanup','POST',{});if(!cleanup.ok)return reply(503,{error:'unavailable'});
  if(req.method==='GET'){
   const rows=await rest('portfolio_inquiries?select=request_id,created_at,kind,language,name,email,organization,audience,engagement,timeline,authority,problem,status&order=created_at.desc&limit=100');
   if(!rows.ok)return reply(503,{error:'unavailable'});return reply(200,{items:await rows.json()});
  }
  let data:Record<string,unknown>;try{data=await boundedJSON(req);}catch{return reply(400,{error:'invalid_request'});}
  if(typeof data.request_id!=='string'||!UUID.test(data.request_id))return reply(400,{error:'invalid_request'});
  const path='portfolio_inquiries?request_id=eq.'+encodeURIComponent(data.request_id);
  if(req.method==='DELETE'){
   const result=await rest(path,'DELETE');return result.ok?reply(200,{ok:true}):reply(503,{error:'unavailable'});
  }
  if(typeof data.status!=='string'||!['new','pending_confirmation','contacted','closed'].includes(data.status))return reply(400,{error:'invalid_request'});
  const result=await rest(path,'PATCH',{status:data.status,updated_at:new Date().toISOString()});
  return result.ok?reply(200,{ok:true}):reply(503,{error:'unavailable'});
 }catch{return reply(503,{error:'unavailable'});}
}
Deno.serve(handler);
