/* Native OOXML exports, lazy-loaded from local vendored libraries. No data leave the browser. */
window.KHReports=(()=>{
 const L=(a,e)=>document.documentElement.lang==='ar'?a:e;
 const pending=new Map();
 function load(src,global){if(window[global])return Promise.resolve(window[global]);if(pending.has(src))return pending.get(src);const task=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=()=>{if(window[global])resolve(window[global]);else{pending.delete(src);s.remove();reject(Error('export library did not initialize'))}};s.onerror=()=>{pending.delete(src);s.remove();reject(Error('export library unavailable'))};document.head.appendChild(s)});pending.set(src,task);return task}
 function content(){
  const box=document.querySelector('#v07-brief-content');
  const labeled=x=>[...x.children].map(c=>c.textContent.trim()).filter(Boolean).join(': ');
  const rows=[...box.querySelectorAll('.v07-brief-item')].map(item=>({title:item.querySelector(':scope>div>strong')?.textContent||'',summary:item.querySelector(':scope>div>p')?.textContent||'',action:[...item.querySelectorAll('.v11-brief-decision>div')].map(labeled),evidence:[...item.querySelectorAll('.kh-number-details dl>div')].map(labeled)}));
  return {title:box.querySelector('h1').textContent,subtitle:box.querySelector('header p').textContent,source:KHPilot.sourceLabel(),summary:[...box.querySelectorAll('.v07-brief-summary>div')].map(labeled),rows,fingerprint:stableStateFingerprint(),policy:KHPilot.revision(),unit:KHPlain.unitHelp()};
 }
 function download(blob,name){const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500)}
 async function exportFile(kind){
  const buttons=[...document.querySelectorAll('#v11-export-word,#v11-export-ppt')];buttons.forEach(x=>x.disabled=true);
  try{
   const data=content(),ar=document.documentElement.lang==='ar',suffix=ar?'AR':'EN';
   if(kind==='doc'){
    const d=await load('vendor/docx-9.6.1.js?v=180','docx');
    const para=(text,heading,pageBreakBefore=false)=>new d.Paragraph({bidirectional:ar,alignment:d.AlignmentType.START,heading,pageBreakBefore,keepNext:!!heading,spacing:{after:140,line:320},children:[new d.TextRun({text,rtl:ar,font:'Arial',size:heading?30:23})]});
    const children=[para(data.title,d.HeadingLevel.TITLE),para(data.subtitle),para(data.source),...data.summary.map(x=>para(x)),para(data.unit)];
    data.rows.forEach((r,i)=>children.push(para(`${i+1}. ${r.title}`,d.HeadingLevel.HEADING_1,i>0),para(r.summary),...r.action.map(x=>para(x)),para(L('تفاصيل الدليل','Evidence details'),d.HeadingLevel.HEADING_2),...r.evidence.map(x=>para(x))));
    children.push(para(MEASUREMENT_VERSION+' · '+data.policy),para(data.fingerprint));
    const file=new d.Document({creator:'Kinetic HR',title:data.title,description:data.source,sections:[{properties:{page:{size:{width:11906,height:16838},margin:{top:900,bottom:900,left:900,right:900}}},children}]});
    download(await d.Packer.toBlob(file),`Kinetic-HR-Decision-${suffix}.docx`);
   }else{
    const P=await load('vendor/pptxgenjs-4.0.1.js?v=180','PptxGenJS'),ppt=new P();ppt.layout='LAYOUT_WIDE';ppt.author='Kinetic HR';ppt.subject=data.source;ppt.title=data.title;ppt.lang=ar?'ar-SA':'en-US';ppt.rtlMode=ar;
    const base=(title,kicker)=>{const s=ppt.addSlide();s.background={color:'F4F8FA'};s.addShape(ppt.ShapeType.rect,{x:0,y:0,w:13.333,h:1.5,fill:{color:'062B3D'},line:{color:'062B3D'}});s.addText(title,{x:.5,y:.42,w:12.3,h:.8,fontFace:'Arial',fontSize:28,bold:true,color:'FFFFFF',align:ar?'right':'left',rtlMode:ar,breakLine:false,fit:'shrink'});s.addText(kicker,{x:.5,y:6.95,w:12.3,h:.25,fontSize:10,color:'527080',align:ar?'right':'left',rtlMode:ar});return s};
    const text=(s,t,x,y,w,h,size=20)=>s.addText(t,{x,y,w,h,fontFace:'Arial',fontSize:size,color:'173E50',align:ar?'right':'left',rtlMode:ar,breakLine:false,margin:.08,fit:'shrink',valign:'top'});
    const first=base(data.title,data.source);text(first,data.subtitle,.6,1.9,12,0.5,20);text(first,data.summary.join('\n'),.6,2.6,12,2.5,24);text(first,data.unit,.6,5.35,12,1,17);
    data.rows.forEach((r,i)=>{const s=base(`${i+1}. ${r.title}`,data.source);text(s,r.summary,.6,1.85,12,1.75,20);text(s,r.action.join('\n\n'),.6,3.8,12,2.6,19);const e=base(L('الدليل: ','Evidence: ')+r.title,data.policy);text(e,r.evidence.join('\n'),.6,1.8,12,4.7,18)});
    const last=base(L('مرجع القرار وحدوده','Decision reference and limits'),data.policy);text(last,data.source+'\n\n'+L('الموافقة والتنفيذ في أنظمة الجهة. يجب مراجعة افتراضات التكلفة والأهلية قبل التنفيذ.','Approval and execution remain in your source systems. Review cost assumptions and eligibility before execution.')+'\n\n'+MEASUREMENT_VERSION,.6,1.9,12,2.6,22);text(last,data.fingerprint,.6,5,12,1.2,15);
    download(await ppt.write({outputType:'blob',compression:true}),`Kinetic-HR-Decision-${suffix}.pptx`);
   }
   showToast(L('تم تجهيز ملف القرار للتنزيل.','Decision file is ready to download.'));
  }catch(error){showToast(L('تعذر إنشاء الملف. أعد المحاولة أو استخدم الطباعة لحفظ PDF.','Could not create the file. Retry or use Print to save a PDF.'));console.error(error)}finally{buttons.forEach(x=>x.disabled=false)}
 }
 return {exportFile,content};
})();
