/* Both homepage languages consume the dashboard's public summary; no private APIs. */
(() => {
  const trust=document.querySelector('.hero-trust-links');
  if(trust)for(const [label,href] of [
    ['ResearchGate','https://www.researchgate.net/profile/Adeeb-Noor-2'],
    ['Scopus','https://www.scopus.com/authid/detail.uri?authorId=57194327281'],
    ['Web of Science','https://www.webofscience.com/wos/author/record/AAS-6623-2021']
  ]){
    if(Array.from(trust.querySelectorAll('a')).some(a=>a.href===href))continue;
    if(trust.childElementCount){const dot=document.createElement('span');dot.textContent='·';dot.setAttribute('aria-hidden','true');trust.appendChild(dot);}
    const a=document.createElement('a');a.href=href;a.textContent=label;a.target='_blank';a.rel='noopener noreferrer';trust.appendChild(a);
  }
  const host=document.getElementById('research-metrics');if(!host)return;
  const ar=document.documentElement.lang==='ar',bi=(a,b)=>ar?a:b;
  const sources={openalex:['OpenAlex','https://openalex.org/A5052495689'],scholar:['Google Scholar','https://scholar.google.com/citations?user=XUQD1WAAAAAJ&hl=en'],scopus:['Scopus / SciVal','https://www.scopus.com/authid/detail.uri?authorId=57194327281'],wos:['Web of Science','https://www.webofscience.com/wos/author/record/AAS-6623-2021']};
  function node(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e;}
  function append(p,...children){children.forEach(c=>p.appendChild(c));return p;}
  function draw(data,key='openalex'){
    const native=key==='openalex',d=native?data:data.authorMetrics?.[key]||{};
    host.replaceChildren();const wrap=node('div','wrap'),head=node('div','pubmetric-head'),buttons=node('div','pubmetric-sources');
    append(head,node('h2','',bi('الأثر البحثي، مع مصدره','Research impact, with its source')));
    for(const [id,[label]]of Object.entries(sources)){const b=node('button','',label);b.type='button';b.setAttribute('aria-pressed',String(id===key));b.addEventListener('click',()=>draw(data,id));buttons.appendChild(b);}head.appendChild(buttons);wrap.appendChild(head);
    const grid=node('div','pubmetric-grid'),fmt=v=>v==null?'—':Number(v).toLocaleString('en-US',{maximumFractionDigits:2});
    const values=[
      [bi('الاستشهادات','Citations'),fmt(d.citations),sources[key][0]],['H-index',fmt(d.hIndex),sources[key][0]],['i10-index',fmt(d.i10Index),sources[key][0]],
      [bi('h للمقالات الحديثة','Recent-article h'),fmt(d.recentH),native?(d.recentWindow||[]).join('–'):bi('بانتظار مصدر مؤرخ','Awaiting a dated source')],
      [bi('متوسط FWCI المحسوب','Mean work-level FWCI'),fmt(native?d.fwciMean:d.fwci),native?`OpenAlex · n=${d.fwciCount}/${d.fwciCohort}`:'Scopus / SciVal'],
      [bi('مقالات المجلات','Journal articles'),fmt(d.journalArticles),native?bi('بعد استبعاد المسحوب','Excludes retracted works'):sources[key][0]],
      [bi('مسودات وبيانات','Preprints & datasets'),fmt(d.preprintsDatasets),sources[key][0]],
      [bi('قيادة التأليف','Author leadership'),data.leadership.total?(100*data.leadership.count/data.leadership.total).toFixed(1)+'%':'—',`${data.leadership.count}/${data.leadership.total} · ${bi('الخطة الأساسية','core pipeline')}`]
    ];
    for(const [label,value,detail]of values)grid.appendChild(append(node('div','pubmetric-cell'),node('span','pubmetric-label',label),node('b','pubmetric-value',value),node('span','pubmetric-detail',detail)));wrap.appendChild(grid);
    const foot=node('div','pubmetric-foot');append(foot,node('p','',native?bi(`OpenAlex · ${data.checkedAt.slice(0,10)}. متوسط FWCI محسوب من قيم المقالات، وليس تصدير SciVal. عدد المقالات يجمع الملفين المرتبطين.`,`OpenAlex · ${data.checkedAt.slice(0,10)}. Mean FWCI is calculated from work-level values, not a SciVal export. Articles combine the linked profiles.`):bi('تظهر أرقام هذا المصدر بعد توفير تصدير مؤرخ؛ لا تُستبدل بأرقام مصدر آخر.','This source needs a dated export; values from another database are not substituted.')));
    const a=node('a','',bi('المنشورات وتفاصيل المؤشرات ↗','Publications & metric details ↗'));a.href='https://adeebnoor.github.io/publications-dashboard/#impact';foot.appendChild(a);wrap.appendChild(foot);host.appendChild(wrap);
  }
  fetch('/publications-dashboard/research-metrics.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw new Error('Unavailable');return r.json();}).then(data=>draw(data)).catch(()=>{
    host.replaceChildren();const wrap=node('div','wrap');const a=node('a','',bi('المنشورات والمؤشرات الأكاديمية ↗','Publications & research metrics ↗'));a.href='https://adeebnoor.github.io/publications-dashboard/';wrap.appendChild(a);host.appendChild(wrap);
  });
})();
